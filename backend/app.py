import os
import hashlib
from datetime import datetime
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, String, Integer, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

# FastAPI App initialization
app = FastAPI(
    title="PulseIndex AI Digital Consent Signature System",
    description="Healthcare-grade digital consent workflow with tamper-evident signature logging.",
    version="1.0.0"
)

# CORS configuration to allow local web apps to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database Setup with robust fallbacks
DATABASE_URL_ENV = os.getenv("DATABASE_URL")
DATABASE_URL_DEV = "postgresql://mathiyazhini@localhost/mediguard_consent"
DATABASE_URL_POSTGRES = "postgresql://postgres@localhost/mediguard_consent"
DATABASE_URL_SQLITE = "sqlite:///./mediguard_consent.db"

engine = None
urls_to_try = []
if DATABASE_URL_ENV:
    urls_to_try.append(DATABASE_URL_ENV)
    
    # Auto-generate IPv4 pooler alternatives for Supabase IPv6 connections
    if "db." in DATABASE_URL_ENV and ".supabase.co" in DATABASE_URL_ENV:
        try:
            parts = DATABASE_URL_ENV.split("@")
            cred_part = parts[0]
            host_part = parts[1]
            project_id = host_part.split(".supabase.co")[0].replace("db.", "")
            db_name = host_part.split("/")[-1]
            cred_parts = cred_part.split("://")
            scheme = cred_parts[0]
            user_pass = cred_parts[1].split(":")
            password = user_pass[1] if len(user_pass) > 1 else ""
            
            pooler_username = f"postgres.{project_id}"
            regions = ["ap-south-1", "ap-southeast-1", "us-east-1", "eu-central-1", "us-west-1", "eu-west-1"]
            for r in regions:
                pooler_host = f"aws-0-{r}.pooler.supabase.com"
                urls_to_try.append(f"{scheme}://{pooler_username}:{password}@{pooler_host}:6543/{db_name}")
                urls_to_try.append(f"{scheme}://{pooler_username}:{password}@{pooler_host}:5432/{db_name}")
        except Exception as parse_err:
            print(f"Failed to auto-generate pooler URLs: {parse_err}")

urls_to_try.extend([DATABASE_URL_DEV, DATABASE_URL_POSTGRES, DATABASE_URL_SQLITE])

for url in urls_to_try:
    try:
        # Use short timeout for postgres, so if it's down it fails quickly
        connect_args = {"connect_timeout": 5} if "postgresql" in url else {}
        test_engine = create_engine(url, connect_args=connect_args)
        with test_engine.connect() as conn:
            engine = test_engine
            # Hide password in logs if database url contains one
            safe_url = url
            try:
                if "@" in url:
                    parts = url.split("@")
                    credentials = parts[0].split("://")
                    scheme = credentials[0]
                    user_pass = credentials[1].split(":")
                    user = user_pass[0]
                    safe_url = f"{scheme}://{user}:****@{parts[1]}"
            except Exception:
                safe_url = "postgresql://postgres:****@db.xjaymfyjmxynidgglkwv.supabase.co:5432/postgres" # fallback mask
            print(f"Successfully connected to database: {safe_url}")
            break
    except Exception as e:
        # Mask password in error message if printed
        err_msg = str(e)
        if DATABASE_URL_ENV and DATABASE_URL_ENV in err_msg:
            err_msg = err_msg.replace(DATABASE_URL_ENV, "DATABASE_URL")
        print(f"Connection failed for database url: {err_msg}")

if engine is None:
    print("Falling back to local SQLite database.")
    engine = create_engine(DATABASE_URL_SQLITE, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# SQLAlchemy Models
class ConsentSignature(Base):
    __tablename__ = 'consent_signatures'

    id = Column(String, primary_key=True, index=True) # Signature ID (e.g. SIG-2026-001)
    consent_id = Column(String, index=True, nullable=False)
    patient_id = Column(String, index=True, nullable=False)
    patient_name = Column(String, nullable=False)
    hospital = Column(String, nullable=False)
    scope = Column(String, nullable=False)
    duration = Column(String, nullable=False)
    timestamp = Column(String, nullable=False)
    signature_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    verification_status = Column(String, default="Integrity Verified")

class ConsentAuditLog(Base):
    __tablename__ = 'consent_audit_logs'

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user = Column(String, nullable=False)
    action = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    consent_id = Column(String, index=True, nullable=False)

# Create tables
Base.metadata.create_all(bind=engine)

# Database Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Pydantic Schemas
class SignRequest(BaseModel):
    patient_id: str
    patient_name: str
    hospital: str
    scope: str
    duration: str
    timestamp: str
    consent_id: Optional[str] = None

class SignResponse(BaseModel):
    id: str
    consent_id: str
    patient_id: str
    patient_name: str
    hospital: str
    scope: str
    duration: str
    timestamp: str
    signature_hash: str
    created_at: datetime
    verification_status: str

class VerifyResponse(BaseModel):
    verified: bool
    status: str
    signature_id: Optional[str] = None
    consent_id: Optional[str] = None
    patient_name: Optional[str] = None
    hospital: Optional[str] = None
    scope: Optional[str] = None
    duration: Optional[str] = None
    timestamp: Optional[str] = None
    signature_hash: Optional[str] = None
    created_at: Optional[datetime] = None

class AuditLogResponse(BaseModel):
    user: str
    action: str
    timestamp: datetime
    consent_id: str

    class Config:
        orm_mode = True

# Helper Functions
def create_canonical_string(patient_id: str, patient_name: str, hospital: str, scope: str, duration: str, timestamp: str) -> str:
    # Build a stable sorted key-value canonical string for tamper protection
    parts = [
        f"duration={duration}",
        f"hospital={hospital}",
        f"patient_id={patient_id}",
        f"patient_name={patient_name}",
        f"scope={scope}",
        f"timestamp={timestamp}"
    ]
    return "|".join(parts)

def generate_sha256_hash(canonical_str: str) -> str:
    return hashlib.sha256(canonical_str.encode('utf-8')).hexdigest()

def generate_signature_id(db: Session) -> str:
    year = datetime.now().year
    count = db.query(ConsentSignature).filter(ConsentSignature.id.like(f"SIG-{year}-%")).count()
    return f"SIG-{year}-{count + 1:03d}"

# API Endpoints

@app.post("/consent/sign", response_model=SignResponse)
def sign_consent(req: SignRequest, db: Session = Depends(get_db)):
    # 1. Generate/verify IDs
    consent_id = req.consent_id or f"CON-{int(datetime.now().timestamp())}"
    signature_id = generate_signature_id(db)

    # 2. Generate SHA-256 signature hash from canonical string
    canonical_str = create_canonical_string(
        patient_id=req.patient_id,
        patient_name=req.patient_name,
        hospital=req.hospital,
        scope=req.scope,
        duration=req.duration,
        timestamp=req.timestamp
    )
    sig_hash = generate_sha256_hash(canonical_str)

    # 3. Create database signature record
    new_signature = ConsentSignature(
        id=signature_id,
        consent_id=consent_id,
        patient_id=req.patient_id,
        patient_name=req.patient_name,
        hospital=req.hospital,
        scope=req.scope,
        duration=req.duration,
        timestamp=req.timestamp,
        signature_hash=sig_hash,
        verification_status="Integrity Verified"
    )
    db.add(new_signature)

    # 4. Create Audit Log entry
    audit_log = ConsentAuditLog(
        user=req.patient_name,
        action="Consent Signed",
        consent_id=consent_id
    )
    db.add(audit_log)
    
    db.commit()
    db.refresh(new_signature)

    return new_signature

@app.get("/consent/verify/{id}", response_model=VerifyResponse)
def verify_consent(id: str, db: Session = Depends(get_db)):
    # Retrieve record by signature_id first, fallback to consent_id
    record = db.query(ConsentSignature).filter(ConsentSignature.id == id).first()
    if not record:
        record = db.query(ConsentSignature).filter(ConsentSignature.consent_id == id).first()
        
    if not record:
        raise HTTPException(status_code=404, detail="Consent signature record not found.")

    # 1. Regenerate canonical string
    canonical_str = create_canonical_string(
        patient_id=record.patient_id,
        patient_name=record.patient_name,
        hospital=record.hospital,
        scope=record.scope,
        duration=record.duration,
        timestamp=record.timestamp
    )

    # 2. Recalculate hash
    recalculated_hash = generate_sha256_hash(canonical_str)

    # 3. Compare hashes to detect tampering
    if recalculated_hash == record.signature_hash:
        # Create success audit log
        audit_log = ConsentAuditLog(
            user=record.patient_name,
            action="Consent Verified",
            consent_id=record.consent_id
        )
        db.add(audit_log)
        db.commit()

        return VerifyResponse(
            verified=True,
            status="Integrity Verified",
            signature_id=record.id,
            consent_id=record.consent_id,
            patient_name=record.patient_name,
            hospital=record.hospital,
            scope=record.scope,
            duration=record.duration,
            timestamp=record.timestamp,
            signature_hash=record.signature_hash,
            created_at=record.created_at
        )
    else:
        # Create failure/tampered audit log
        audit_log = ConsentAuditLog(
            user=record.patient_name,
            action="Consent Verification Failed (Tampered)",
            consent_id=record.consent_id
        )
        db.add(audit_log)
        db.commit()

        return VerifyResponse(
            verified=False,
            status="Tampered"
        )

@app.get("/consent/signatures", response_model=List[SignResponse])
def get_signatures(db: Session = Depends(get_db)):
    return db.query(ConsentSignature).order_by(ConsentSignature.created_at.desc()).all()

@app.get("/consent/audit-logs", response_model=List[AuditLogResponse])
def get_audit_logs(db: Session = Depends(get_db)):
    return db.query(ConsentAuditLog).order_by(ConsentAuditLog.timestamp.desc()).all()

@app.post("/consent/revoke/{consent_id}")
def revoke_consent(consent_id: str, db: Session = Depends(get_db)):
    record = db.query(ConsentSignature).filter(ConsentSignature.consent_id == consent_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Consent record not found.")

    record.verification_status = "Revoked"
    
    audit_log = ConsentAuditLog(
        user=record.patient_name,
        action="Consent Revoked",
        consent_id=consent_id
    )
    db.add(audit_log)
    db.commit()
    
    return {"status": "Consent Revoked", "consent_id": consent_id}

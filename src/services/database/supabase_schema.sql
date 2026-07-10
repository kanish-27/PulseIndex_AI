-- SQL DDL Schema for MediGuard AI Relational DB
-- To be executed in the Supabase SQL Editor

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users
CREATE TABLE IF NOT EXISTS users (
  email VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('patient', 'doctor', 'laboratory')),
  aadhaar_id VARCHAR(50),
  institution VARCHAR(255),
  provider_id VARCHAR(255),
  logo_text VARCHAR(50),
  provider_type VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Patient Profiles
CREATE TABLE IF NOT EXISTS patient_profiles (
  patient_name VARCHAR(255) PRIMARY KEY,
  patient_uid VARCHAR(255) UNIQUE,
  aadhaar_id VARCHAR(50),
  gender VARCHAR(50),
  age INT,
  allergies TEXT,
  conditions TEXT,
  prescriptions TEXT,
  preferred_doctor_name VARCHAR(255),
  preferred_hospital_name VARCHAR(255),
  blood_group VARCHAR(50),
  risk_indicators JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Health Records
CREATE TABLE IF NOT EXISTS health_records (
  id VARCHAR(255) PRIMARY KEY,
  owner VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  size VARCHAR(50) NOT NULL,
  date VARCHAR(50) NOT NULL,
  institution VARCHAR(255),
  clinical_findings TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Medical Documents
CREATE TABLE IF NOT EXISTS medical_documents (
  id VARCHAR(255) PRIMARY KEY,
  patient_id VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  document_name VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_size INT NOT NULL,
  hospital_name VARCHAR(255),
  doctor_name VARCHAR(255),
  upload_date VARCHAR(50) NOT NULL,
  storage_url TEXT NOT NULL,
  thumbnail_url TEXT,
  processing_mode VARCHAR(20) NOT NULL CHECK (processing_mode IN ('STRUCTURED', 'ORIGINAL')),
  status VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Provider Consents
CREATE TABLE IF NOT EXISTS provider_consents (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  logo_text VARCHAR(50),
  type VARCHAR(100),
  permissions JSONB NOT NULL,
  requested_date VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Access Requests
CREATE TABLE IF NOT EXISTS pending_requests (
  id VARCHAR(255) PRIMARY KEY,
  provider_id VARCHAR(255) NOT NULL,
  provider_name VARCHAR(255) NOT NULL,
  logo_text VARCHAR(50) NOT NULL,
  type VARCHAR(100) NOT NULL,
  requested_permission VARCHAR(50) NOT NULL,
  timestamp VARCHAR(50) NOT NULL,
  target_patient_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Audit & Ledger Logs
CREATE TABLE IF NOT EXISTS blockchain_audit_logs (
  id VARCHAR(255) PRIMARY KEY,
  block_index INT NOT NULL,
  timestamp VARCHAR(50) NOT NULL,
  actor VARCHAR(255) NOT NULL,
  institution VARCHAR(255) NOT NULL,
  action VARCHAR(100) NOT NULL,
  details TEXT NOT NULL,
  consent_token VARCHAR(255) NOT NULL,
  hash VARCHAR(255) NOT NULL,
  parent_hash VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Consent Signatures
CREATE TABLE IF NOT EXISTS consent_signatures (
  id VARCHAR(255) PRIMARY KEY,
  request_id VARCHAR(255) NOT NULL,
  provider_name VARCHAR(255) NOT NULL,
  patient_name VARCHAR(255) NOT NULL,
  permission VARCHAR(50) NOT NULL,
  signature_svg TEXT NOT NULL,
  timestamp VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Consent Audit Logs
CREATE TABLE IF NOT EXISTS consent_audit_logs (
  id VARCHAR(255) PRIMARY KEY,
  patient_name VARCHAR(255) NOT NULL,
  action VARCHAR(100) NOT NULL,
  recipient VARCHAR(255) NOT NULL,
  permission VARCHAR(50) NOT NULL,
  timestamp VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Emergency Contacts
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  relation VARCHAR(100) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  verified BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS and define permissive policies for our clinic nodes
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockchain_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read/write access" ON users FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write access" ON patient_profiles FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write access" ON health_records FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write access" ON medical_documents FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write access" ON provider_consents FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write access" ON pending_requests FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write access" ON blockchain_audit_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write access" ON consent_signatures FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write access" ON consent_audit_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write access" ON emergency_contacts FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

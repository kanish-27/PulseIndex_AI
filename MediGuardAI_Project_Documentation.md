# 🏥 MediGuardAI — Complete Project Documentation

---

## 1. Project Overview

**MediGuardAI** (internally named *PulseIndex AI*) is a full-stack, AI-powered **patient health record management system**. It enables patients to securely store, manage, share, and govern access to their medical records — while giving clinicians, hospitals, and laboratories a controlled, consent-based access layer.

The system has a formal **patent filing** (Classification: `G16H 10/60 · G16H 20/13 · G06F 21/62 · G06V 30/14`) under the title:

> *"MediGuard: An Artificial Intelligence-Driven Patient Health Record Management, Prescription Analysis, Consent Governance, and Clinical Safety Monitoring System"*

---

## 2. Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| **React** | 19.2.6 | UI framework |
| **TypeScript** | ~6.0.2 | Type safety |
| **Vite** | 8.0.x | Build tool & dev server (port `5173`) |
| **TailwindCSS** | 3.4.x | Utility-first styling |
| **Lucide React** | 1.21.x | Icon library |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| **Node.js** | (system) | Runtime |
| **HTTP module** | built-in | Custom Express-like server (port `3001`) |
| **Groq AI SDK** | (HTTP) | LLM inference via REST API |
| **MongoDB** | (driver 6.x) | Primary data store |
| **pg** | 8.22.x | PostgreSQL driver (retained, unused) |
| **concurrently** | 10.x | Run Vite + Node simultaneously |

### Cloud Services
| Service | Purpose |
|---|---|
| **Firebase Auth** | User authentication (email/password) |
| **Firebase Storage** | Medical file uploads (images, PDFs) |
| **MongoDB (local)** | All application data — `mongodb://localhost:27017/mediguardai` |

### AI / LLM
| Model | Provider | Use |
|---|---|---|
| `llama-4-scout-17b-16e-instruct` | Groq Cloud | Vision OCR — reads prescriptions/images |
| `llama-3.3-70b-versatile` | Groq Cloud | Text structuring, prescription analysis |

---

## 3. Project Directory Structure

```
MediGuardAI/
├── src/
│   ├── App.tsx                        ← Root router (tab-based SPA)
│   ├── main.tsx                       ← React entry point
│   ├── index.css / App.css            ← Global styles
│   ├── context/
│   │   └── AppContext.tsx             ← Global state (2500+ lines)
│   ├── features/
│   │   ├── auth/       AuthPage.tsx   ← Login & Register UI
│   │   ├── dashboard/  DashboardView  ← Patient/Doctor overview
│   │   ├── vault/      VaultView      ← Medical record management
│   │   ├── consent/    ConsentView    ← Provider access control
│   │   ├── guardian/   GuardianView   ← AI drug safety checker
│   │   ├── emergency/  EmergencyView  ← Break-glass & SOS
│   │   └── audit/      AuditView      ← Blockchain ledger viewer
│   ├── components/
│   │   ├── layout/     Layout.tsx     ← Navigation shell
│   │   └── ui/         Card, Button, Modal
│   ├── services/
│   │   ├── firebase/   authService, firestoreService, storageService
│   │   ├── mongodb/    mongoService.ts ← Primary DB client
│   │   └── supabase/   supabaseService.ts (legacy)
│   └── utils/
│       ├── firebase.ts                ← Firebase config
│       └── indexedDB.ts               ← Offline file storage
├── server.js                          ← Backend (Node HTTP server)
├── setup_mongodb.js                   ← DB collection initializer
├── .env                               ← Environment variables
├── package.json
└── vite.config.ts
```

---

## 4. Database — MongoDB (`mediguardai`)

All application data is stored locally in MongoDB at `mongodb://localhost:27017/`.

### Collections & Schema

#### `users`
| Field | Type | Notes |
|---|---|---|
| `email` | String | **Primary key** (unique index) |
| `name` | String | Display name |
| `password` | String | User-defined password |
| `role` | String | `patient` / `doctor` / `laboratory` |
| `institution` | String | Hospital/lab name (for clinicians) |
| `providerId` | String | Links to `provider_consents` |
| `logoText` | String | Short abbreviation for avatar |
| `providerType` | String | `Hospital` / `Laboratory` / `Pharmacy` / `Insurance` |
| `aadhaarId` | String | National ID (India) |
| `createdAt` | Date | Auto-set on insert |

#### `patient_profiles`
| Field | Type | Notes |
|---|---|---|
| `patient_name` | String | **Primary key** (unique index) |
| `patient_uid` | String | Unique patient ID |
| `aadhaar_id` | String | National ID |
| `gender` | String | `Male` / `Female` |
| `age` | Number | Age in years |
| `allergies` | String | Comma-separated list |
| `conditions` | String | Active medical conditions |
| `prescriptions` | String | Active medications |
| `preferredDoctorName` | String | Assigned doctor |
| `preferredHospitalName` | String | Assigned hospital |
| `riskIndicators` | Object | `{ cardiovascular, metabolic, immunological, overallIndex }` |

#### `health_records`
| Field | Type | Notes |
|---|---|---|
| `id` | String | **Primary key** |
| `owner` | String | Patient name (indexed) |
| `category` | String | `Medical Records` / `Prescriptions` / `Allergies` / `Laboratory Reports` / `Insurance Documents` |
| `name` | String | Record title |
| `size` | String | File size string |
| `date` | String | Date added |
| `institution` | String | Issuing hospital |
| `clinicalFindings` | String | AI-extracted clinical text |
| `hash` | String | Simulated AES-256 hash |
| `encryptionStatus` | String | `AES-256 Encrypted` |
| `blockNumber` | Number | Blockchain ledger reference |

#### `medical_documents`
| Field | Type | Notes |
|---|---|---|
| `id` | String | **Primary key** |
| `patient_id` | String | Owner patient (indexed) |
| `category` | String | 12 document types (Prescription, MRI, CT Scan, ECG, etc.) |
| `document_name` | String | Display name |
| `original_filename` | String | Raw uploaded filename |
| `mime_type` | String | `image/jpeg`, `application/pdf`, etc. |
| `file_size` | Number | Bytes |
| `hospital_name` | String | Issuing hospital |
| `doctor_name` | String | Prescribing doctor |
| `upload_date` | String | ISO date string |
| `storage_url` | String | Firebase Storage URL |
| `thumbnail_url` | String | Preview image URL |
| `processing_mode` | String | `STRUCTURED` (AI-parsed) or `ORIGINAL` (raw file) |
| `status` | String | Processing status |

#### `provider_consents`
| Field | Type | Notes |
|---|---|---|
| `id` | String | **Primary key** |
| `name` | String | Hospital/lab name |
| `logoText` | String | 2-3 letter abbreviation |
| `type` | String | `Hospital` / `Laboratory` / `Pharmacy` / `Insurance` |
| `permissions` | Object | `{ read: bool, write: bool, emergency: bool }` |
| `dataCategories` | Object | `{ labResults, imaging, prescriptions, notes }` |
| `expiry` | String | e.g. `30 Days` |
| `lastAccess` | String | Timestamp of last access |

#### `pending_requests`
| Field | Type | Notes |
|---|---|---|
| `id` | String | **Primary key** |
| `provider_id` | String | Requesting provider (indexed) |
| `provider_name` | String | Display name |
| `logo_text` | String | Abbreviation |
| `type` | String | Provider type |
| `requested_permission` | String | `read` or `write` |
| `timestamp` | String | When request was made |
| `target_patient_name` | String | Target patient (indexed) |

#### `blockchain_audit_logs`
| Field | Type | Notes |
|---|---|---|
| `id` | String | **Primary key** |
| `block_index` | Number | Ordered chain position (indexed) |
| `timestamp` | String | Action time |
| `actor` | String | Who performed action (indexed) |
| `institution` | String | Actor's organization |
| `action` | String | `READ` / `WRITE` / `CONSENT_GRANT` / `CONSENT_REVOKE` / `BREAK_GLASS` / `LEDGER_VERIFIED` |
| `details` | String | Full description |
| `consent_token` | String | Signed token reference |
| `hash` | String | Block hash (hex) |
| `parent_hash` | String | Previous block hash |
| `status` | String | `SUCCESS` / `BLOCKED` / `OVERRIDE` |

#### `consent_signatures`
| Field | Type | Notes |
|---|---|---|
| `id` | String | **Primary key** |
| `consent_id` | String | Linked consent form ID |
| `patient_id` | String | Patient ID |
| `patient_name` | String | Patient display name (indexed) |
| `hospital` | String | Consented hospital |
| `scope` | String | Data access scope |
| `duration` | String | Consent validity period |
| `timestamp` | String | Signing time |
| `signature_hash` | String | Cryptographic hash of signature |
| `verification_status` | String | `VERIFIED` / `REVOKED` |

#### `consent_audit_logs`
| Field | Type | Notes |
|---|---|---|
| `id` | String | **Primary key** |
| `patient_name` | String | Subject patient (indexed) |
| `action` | String | Consent lifecycle action |
| `recipient` | String | Who received consent |
| `permission` | String | `read` / `write` |
| `timestamp` | String | When it happened |

#### `emergency_contacts`
| Field | Type | Notes |
|---|---|---|
| `id` | String | **Primary key** |
| `name` | String | Contact name |
| `relation` | String | e.g. `Spouse`, `Parent` |
| `phone` | String | Phone number |
| `verified` | Boolean | Verification status |

---

## 5. Backend API — `server.js` (Port 3001)

The backend is a raw Node.js HTTP server (no Express). All routes:

### MongoDB CRUD API
```
GET    /api/mongo/:collection          → List all documents
GET    /api/mongo/:collection/:id      → Find one by ID
POST   /api/mongo/:collection          → Upsert (create or update)
DELETE /api/mongo/:collection/:id      → Delete by ID
```
Supports all 10 collections. Natural keys: `email` for users, `patient_name` for profiles, `id` for all others.

### AI / Medical APIs
| Endpoint | Method | Description |
|---|---|---|
| `/api/analyze-prescription` | POST | Drug safety check (Groq LLM + local fallback) |
| `/api/scan-prescription` | POST | Vision OCR + structuring (Groq llama-4-scout) |
| `/api/deploy-schema` | POST | PostgreSQL schema migration (legacy) |
| `/api/find-pooler` | GET | Supabase region scanner (legacy) |

### Static Serving
- Serves the compiled Vite `dist/` as static files
- All non-API `GET` requests fall through to `dist/index.html` (SPA routing)

---

## 6. Feature Modules — Detailed Breakdown

---

### 🔐 Module 1: Authentication — `AuthPage.tsx`

**Two panels:** Login and Register

#### Login
- Accepts **Email + Password**
- Looks up user from local state (`registeredUsers` stored in `localStorage`)
- Authenticates via Firebase Auth (email/password)
- After auth, matches user to role: `patient`, `doctor`, or `laboratory`
- Routes to correct dashboard based on role

#### Register
- Fields: Name, Email, Password, Role selector
- Additional fields for Clinicians: Institution name, Provider ID, Provider Type, Logo Text
- Saves to MongoDB `users` collection via `/api/mongo/users`
- Also creates Firebase Auth account in the background

> **Default test users are pre-seeded** so the app works immediately without registration.

---

### 🏠 Module 2: Dashboard — `DashboardView.tsx`

**Role-aware** — shows different content for patients vs. clinicians.

#### Patient Dashboard
- **Health Risk Indicators** — 4 radial gauge charts:
  - Cardiovascular Index
  - Metabolic Index
  - Immunological Index
  - Overall Health Index
- **Quick Stats**: Total records, providers with access, pending requests
- **Recent Health Records** — last 5 records with category icons
- **Care Team Panel** — edit preferred doctor and hospital
- **Pending Access Requests** — approve or reject incoming requests with digital signature

#### Doctor/Laboratory Dashboard
- **Access Status Panel** — shows read/write permission status
- **Patient Switcher** — drop-down to switch between patients
- **Request Access buttons** — request `read` or `write` permission
- **Patient Record Preview** — if access granted, shows health summary
- **Break-Glass Access** — emergency override button

---

### 🗄️ Module 3: Vault — `VaultView.tsx`

The **medical record file manager** — the core data store of the application.

#### Two storage layers work in parallel:
1. **Health Records** (structured metadata + hash)
2. **Medical Documents** (actual files uploaded to Firebase Storage)

#### Features
- **Upload documents** — supports images (JPG, PNG) and PDFs
  - Choose category from 12 types (Prescription, MRI, CT Scan, X-Ray, etc.)
  - Enter hospital name, doctor name, document title
  - Toggle between `STRUCTURED` mode (AI-parsed) or `ORIGINAL` mode (raw file)
- **AI Processing** (STRUCTURED mode):
  - Image uploaded → sent to `/api/scan-prescription`
  - Groq `llama-4-scout` performs Vision OCR
  - `llama-3.3-70b-versatile` structures the extracted text into JSON
  - Extracted `clinicalFindings` are stored in the record
- **File Gallery** — Grid and list view with thumbnail previews
- **Delete records** — removes from MongoDB, Firebase Storage, and IndexedDB
- **Search and filter** by category, date, institution
- **Encryption indicators** — every record shows AES-256 encryption status and block number
- **Access history** — per-record `RecordAccessEvent` timeline
- **Read/write access gating** — doctors without consent see a locked state

---

### 🤝 Module 4: Consent — `ConsentView.tsx`

**Patient-controlled access management** for healthcare providers.

#### Features
- **Provider list** — all consented hospitals, labs, pharmacies, insurance companies
- **Permission toggles** per provider:
  - `read` — can view records
  - `write` — can add records
  - `emergency` — can access in break-glass scenarios
- **Data category toggles** per provider:
  - Lab Results, Imaging, Prescriptions, Clinical Notes
- **Consent expiry settings** — 7 days, 30 days, 90 days, 1 year, indefinite
- **Pending requests panel** — incoming access requests from providers
- **Digital Consent Signatures** — patients sign consent with a hash-verified signature
  - Signature ID, scope, duration, timestamp, and cryptographic hash stored in MongoDB
- **Consent Audit Log** — timestamped log of every consent grant/revoke action

---

### 💊 Module 5: Guardian — `GuardianView.tsx`

**AI-powered prescription safety engine.**

#### How it works
1. Patient's active prescriptions and allergies are loaded from their profile
2. Doctor types a new drug name + dosage to be prescribed
3. Frontend calls `/api/analyze-prescription`
4. Server calls **Groq `llama-3.3-70b-versatile`** with:
   - Drug being analyzed
   - Patient's current medications
   - Patient's allergies
   - Patient's medical history/treatments
5. LLM returns a structured JSON safety report

#### Safety report fields
| Field | Description |
|---|---|
| `riskScore` | 0–100 danger level |
| `safetyScore` | 100 − riskScore |
| `severity` | `CRITICAL` / `MODERATE` / `SAFE` |
| `issue` | 3–5 word summary |
| `reason` | Detailed clinical rationale |
| `recommendation` | What the doctor should do |
| `alternatives` | Safe alternative medications |
| `regimenAction` | `ADD` / `REPLACE` / `BLOCK` |
| `regimenActionDetails` | Plain-language advice |
| `targetReplacementDrug` | Which drug to replace (if REPLACE) |
| `pathway` | 3–5 step clinical reasoning chain |

#### Checks performed by AI
- **Drug-Allergy conflicts** (e.g. beta-lactams if penicillin allergic)
- **Drug-Drug interactions** (e.g. NSAIDs + blood thinners)
- **Therapeutic duplications** (e.g. Lipitor + Atorvastatin = same drug)

#### Offline fallback
If the Groq API is unavailable, a **local rules engine** in `server.js` handles:
- 20+ drug synonym mappings (Lipitor↔Atorvastatin, Glucophage↔Metformin, etc.)
- 10+ drug-allergy interaction rules
- 8+ drug-drug interaction rules

#### Guardian Check History
Every analysis result is saved to the guardian check log for the session.

---

### 🚨 Module 6: Emergency — `EmergencyView.tsx`

**Break-Glass access protocol and SOS management.**

#### Break-Glass Access
- Doctor fills in their name + medical reason
- Confirms compliance checkbox (HIPAA override acknowledgement)
- System sets `breakGlassActive = true` globally
- Doctor gets **immediate read access** to all patient records
- All records show a red `EMERGENCY OVERRIDE ACTIVE` banner
- Break-glass activation is logged to `blockchain_audit_logs` with `OVERRIDE` status
- Patient can deactivate break-glass at any time

#### Emergency Profile Panel
- Displays patient's **critical info** even under break-glass:
  - Active Allergies
  - Current Medications
  - Medical History / Conditions
- Shows color-coded severity badges

#### Emergency Contacts
- Add/remove proxy contacts (name, relation, phone)
- All contacts stored in `emergency_contacts` collection in MongoDB
- **QR Code** badge for rapid ID scanning at hospitals

#### PDF Export
- Exports a complete **emergency health profile PDF** with all critical data

---

### 📋 Module 7: Audit — `AuditView.tsx`

**Immutable blockchain-style audit trail of all system activity.**

#### Blockchain Ledger
- Every action creates a new `AuditLog` block with:
  - Block index (sequential)
  - Cryptographic hash (64-char hex)
  - Parent hash (links to previous block = chain)
  - Actor, institution, action type, details, timestamp
  - Status: `SUCCESS`, `BLOCKED`, or `OVERRIDE`
- **Verify Ledger** button runs hash chain integrity check across all blocks
- Filter logs by action type: `READ`, `WRITE`, `CONSENT_GRANT`, `CONSENT_REVOKE`, `BREAK_GLASS`, `LEDGER_VERIFIED`
- Search logs by actor, institution, or details

#### Consent Signatures Tab
- Lists all signed consent documents
- Each signature shows: patient, hospital, scope, duration, hash
- **Verify Signature** button performs on-demand verification
- **Revoke Consent** removes active consent and updates status to `REVOKED`

---

## 7. State Management — `AppContext.tsx`

The entire application state is managed through a single **React Context** (`AppContext`). This file is ~2,500 lines and manages:

| State Slice | Description |
|---|---|
| `user` | Logged-in user object (name, email, role, institution, etc.) |
| `registeredUsers[]` | All registered accounts (persisted in `localStorage`) |
| `patientProfiles{}` | Map of patient name → full profile object |
| `activePatientName` | Which patient is currently selected (for doctor view) |
| `records[]` | All `HealthRecord` objects |
| `medicalDocuments[]` | All uploaded `MedicalDocument` objects |
| `providers[]` | All `ProviderConsent` objects |
| `pendingRequests[]` | Incoming access requests from providers |
| `auditLogs[]` | Blockchain audit chain |
| `emergencyContacts[]` | Patient SOS contacts |
| `signatures[]` | Digital consent signatures |
| `consentAuditLogs[]` | Consent lifecycle event log |
| `breakGlassActive` | Whether emergency override is active |
| `rewardTokens` | Research opt-in token count |
| `optInResearch` | Research data sharing toggle |

### Persistence layers
1. **MongoDB** (primary) — all writes go to `/api/mongo/*` backend
2. **localStorage** — `registeredUsers` and session state cached locally
3. **Firebase Storage** — file blobs (images, PDFs)
4. **IndexedDB** — offline file caching in browser

---

## 8. Authentication Flow

```
User submits email + password
        ↓
Check localStorage registeredUsers for matching email
        ↓
Validate password match
        ↓
Call Firebase Auth signInWithEmailAndPassword()
        ↓
Firebase Auth returns user token
        ↓
Set user object in AppContext with role + institution
        ↓
App renders role-appropriate dashboard
```

- **Patient** → sees their own data, full control
- **Doctor** → sees patients who granted them access, or uses break-glass
- **Laboratory** → same as doctor, limited to lab-category data

---

## 9. AI Pipeline — Prescription Scanning

```
User selects image → toggles STRUCTURED mode
        ↓
Browser reads File object → converts to base64
        ↓
POST /api/scan-prescription { image: base64, mimeType }
        ↓
Server calls Groq llama-4-scout (Vision OCR)
Returns raw extracted text from handwritten/printed prescription
        ↓
Server calls Groq llama-3.3-70b-versatile (Data Structuring)
Returns structured JSON:
{
  patientName, patientAge, doctorName, hospitalName,
  diagnosis, date, medicines: [{ name, dosage, frequency, duration }],
  followUpDate, labTests, clinicalNotes
}
        ↓
Medicine Information Module generates patient-friendly guides
in English + Tamil for each medicine
        ↓
Returns complete structured document to frontend
        ↓
Saved as MedicalDocument in MongoDB + Firebase Storage
```

---

## 10. Running the Application

### Prerequisites
- Node.js installed
- MongoDB running locally (`mongod`)
- MongoDB Compass (optional GUI)

### Setup
```bash
# Install dependencies
npm install

# Setup MongoDB database (creates all 10 collections)
node setup_mongodb.js

# Start the application (Vite dev + Node backend)
npm run dev
```

### URLs
| Service | URL |
|---|---|
| Frontend (Vite) | http://localhost:5173/ |
| Backend API | http://localhost:3001/ |
| MongoDB | mongodb://localhost:27017/mediguardai |

### Environment Variables (`.env`)
```env
GROQ_API_KEY=...                         # Groq AI API key
VITE_FIREBASE_API_KEY=...               # Firebase project config
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_SUPABASE_URL=...                   # Legacy (not used for data)
VITE_SUPABASE_ANON_KEY=...             # Legacy (not used for data)
```

---

## 11. User Roles Summary

| Role | Dashboard | Vault | Consent | Guardian | Emergency | Audit |
|---|---|---|---|---|---|---|
| **Patient** | Full own data | Full upload/delete | Manage all consents | View safety checks | Manage contacts | View all logs |
| **Doctor** | Patient switcher | Read/write if consented | View own status | Run drug checks | Break-glass access | View logs |
| **Laboratory** | Patient switcher | Read/write if consented | View own status | ✗ | View only | View logs |

---

## 12. Patent Classification Summary

| IPC Code | Domain |
|---|---|
| `G16H 10/60` | Healthcare informatics — health record management |
| `G16H 20/13` | Healthcare informatics — medication management |
| `G06F 21/62` | Computer security — protecting personal data |
| `G06V 30/14` | Image recognition — document analysis (OCR) |

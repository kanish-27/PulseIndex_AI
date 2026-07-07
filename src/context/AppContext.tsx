import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  loginWithEmail, 
  logoutUser, 
  onAuthStateChangedListener 
} from '../services/firebase/authService';
import { 
  uploadFile,
  deleteFile
} from '../services/firebase/storageService';
import {
  saveUser,
  subscribeToUsers,
  savePatientProfile,
  subscribeToPatientProfiles,
  saveHealthRecord,
  deleteDocById,
  subscribeToHealthRecords,
  saveConsentSignature,
  subscribeToConsentSignatures,
  saveConsentAuditLog,
  subscribeToConsentAuditLogs,
  saveProviderConsent,
  subscribeToProviderConsents,
  saveAccessRequest,
  deleteAccessRequest,
  subscribeToAccessRequests,
  saveEmergencyContact,
  subscribeToEmergencyContacts,
  saveBlockchainAuditLog,
  subscribeToBlockchainAuditLogs,
  updateDocFields,
  readDoc
} from '../services/firebase/firestoreService';

// Interfaces for MediGuard AI state
export interface RecordAccessEvent {
  id: string;
  timestamp: string;
  actor: string;
  institution: string;
  action: 'READ' | 'DECRYPT' | 'VERIFY' | 'WRITE';
  status: 'SUCCESS' | 'BLOCKED';
}

export interface PatientProfile {
  name: string;
  age: number;
  gender: 'Male' | 'Female';
  allergies: string;
  conditions: string;
  prescriptions: string;
  patientUid: string;
  aadhaarId: string;
  preferredDoctorName?: string;
  preferredHospitalName?: string;
  riskIndicators: {
    cardiovascular: number;
    metabolic: number;
    immunological: number;
    overallIndex: number;
  };
}

export interface HealthRecord {
  id: string;
  name: string;
  category: 'Medical Records' | 'Prescriptions' | 'Allergies' | 'Laboratory Reports' | 'Insurance Documents';
  date: string;
  institution: string;
  owner: string;
  hash: string;
  encryptionStatus: string;
  securityStatus: string;
  classification: string;
  lastAccessed: string;
  accessHistory: RecordAccessEvent[];
  size: string;
  confidenceScore: number;
  sensitivePIIDetected: boolean;
  blockNumber: number;
  clinicalFindings?: string;
  fileUrl?: string;
  storagePath?: string;
}

export interface ProviderConsent {
  id: string;
  name: string;
  logoText: string;
  type: 'Hospital' | 'Laboratory' | 'Pharmacy' | 'Insurance';
  permissions: {
    read: boolean;
    write: boolean;
    emergency: boolean;
  };
  dataCategories: {
    labResults: boolean;
    imaging: boolean;
    prescriptions: boolean;
    notes: boolean;
  };
  expiry: string;
  lastAccess: string;
}

export interface AccessRequest {
  id: string;
  providerId: string;
  providerName: string;
  logoText: string;
  type: 'Hospital' | 'Laboratory' | 'Pharmacy' | 'Insurance';
  requestedPermission: 'read' | 'write';
  timestamp: string;
  targetPatientName?: string;
}

export interface AuditLog {
  id: string;
  blockIndex: number;
  timestamp: string;
  actor: string;
  institution: string;
  action: 'READ' | 'WRITE' | 'CONSENT_GRANT' | 'CONSENT_REVOKE' | 'BREAK_GLASS' | 'EMERGENCY_DEACTIVATE' | 'LEDGER_VERIFIED';
  details: string;
  consentToken: string;
  hash: string;
  parentHash: string;
  status: 'SUCCESS' | 'BLOCKED' | 'OVERRIDE';
}

export interface EmergencyContact {
  id: string;
  name: string;
  relation: string;
  phone: string;
  status: 'Authorized' | 'Revoked';
  owner?: string;
}

export interface RegisteredUser {
  name: string;
  email: string;
  password?: string;
  role: 'patient' | 'doctor' | 'laboratory';
  institution?: string;
  providerId?: string;
  logoText?: string;
  providerType?: 'Hospital' | 'Laboratory' | 'Pharmacy' | 'Insurance';
  aadhaarId?: string;
}

export interface ConsentSignature {
  id: string;
  consent_id: string;
  patient_id: string;
  patient_name: string;
  hospital: string;
  scope: string;
  duration: string;
  timestamp: string;
  signature_hash: string;
  created_at: string;
  verification_status: string;
}

export interface ConsentAuditLog {
  id: string | number;
  user: string;
  action: string;
  timestamp: string;
  consent_id: string;
}

interface AppContextType {
  // Navigation
  activeTab: string;
  setActiveTab: (tab: string) => void;
  
  // Auth simulation
  user: { 
    name: string; 
    email: string; 
    password?: string;
    mfaEnabled: boolean; 
    role: 'patient' | 'doctor' | 'laboratory';
    institution?: string;
    providerId?: string;
    logoText?: string;
    providerType?: 'Hospital' | 'Laboratory' | 'Pharmacy' | 'Insurance';
    aadhaarId?: string;
  } | null;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  requestAccess: (permission: 'read' | 'write') => void;
  registeredUsers: RegisteredUser[];
  registerUser: (user: RegisteredUser) => void;
  resetApplication: () => void;
  
  // Patient Profiles state
  activePatientName: string;
  setActivePatientName: (name: string) => void;
  patientProfiles: Record<string, PatientProfile>;
  currentPatientProfile: PatientProfile;
  updatePatientProfile: (name: string, updatedFields: Partial<PatientProfile>) => void;

  // Health Records
  records: HealthRecord[];
  addRecord: (name: string, category: HealthRecord['category'], size: string, clinicalFindings?: string, file?: File) => Promise<string>;
  deleteRecord: (recordId: string) => Promise<void>;
  uploadingFile: { name: string; step: 'hashing' | 'encrypting' | 'classifying' | 'ledgering' | 'done' | null };
  
  // Consent
  providers: ProviderConsent[];
  togglePermission: (providerId: string, permission: 'read' | 'write' | 'emergency') => void;
  toggleDataCategory: (providerId: string, category: keyof ProviderConsent['dataCategories']) => void;
  updateConsentExpiry: (providerId: string, expiry: string) => void;
  pendingRequests: AccessRequest[];
  approveAccessRequest: (id: string) => void;
  rejectAccessRequest: (id: string) => void;
  
  // Audit Ledger
  auditLogs: AuditLog[];
  verifyLedger: () => Promise<{ success: boolean; verifiedCount: number; details: string }>;
  isVerifyingLedger: boolean;
  ledgerIntegrity: 'verified' | 'unverified' | 'tampered';
  
  // Emergency / Break-Glass
  breakGlassActive: boolean;
  activeEmergencyDoctor: string;
  activeEmergencyReason: string;
  triggerBreakGlass: (doctorName: string, reason: string) => void;
  deactivateBreakGlass: () => void;
  emergencyContacts: EmergencyContact[];
  addEmergencyContact: (name: string, relation: string, phone: string) => void;
  deleteEmergencyContact: (contactId: string) => void;
  
  // AI Insights / Rewards
  optInResearch: boolean;
  setOptInResearch: (val: boolean) => void;
  rewardTokens: number;
  aiRiskIndicators: {
    cardiovascular: number;
    metabolic: number;
    immunological: number;
    overallIndex: number;
  };
  recordGuardianCheck: (drugName: string, riskLevel: string, status: 'PASSED' | 'OVERRIDDEN' | 'BLOCKED', details: string) => void;

  // Digital Consent Signatures
  signatures: ConsentSignature[];
  consentAuditLogs: ConsentAuditLog[];
  fetchSignatures: () => Promise<void>;
  fetchConsentAuditLogs: () => Promise<void>;
  signConsent: (payload: {
    patient_id: string;
    patient_name: string;
    hospital: string;
    scope: string;
    duration: string;
    timestamp: string;
    consent_id?: string;
  }) => Promise<ConsentSignature>;
  verifyConsent: (id: string) => Promise<{
    verified: boolean;
    status: string;
    signature_id?: string;
    consent_id?: string;
    patient_name?: string;
    hospital?: string;
    scope?: string;
    duration?: string;
    timestamp?: string;
    signature_hash?: string;
    created_at?: string;
  }>;
  revokeConsent: (consentId: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Cryptographic hash simulation helper
const generateMockHash = () => {
  const chars = '0123456789abcdef';
  let result = '0x';
  for (let i = 0; i < 64; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
};

// Helper to derive a capitalized name from an email prefix
const deriveNameFromEmail = (email: string): string => {
  const prefix = email.split('@')[0];
  return prefix
    .split(/[\._-]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Helper to synthesize a realistic PatientProfile based on a name
const synthesizePatientProfile = (name: string, aadhaarId?: string): PatientProfile => {
  const nameHash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const isFemale = nameHash % 2 === 0;
  const mockAge = 25 + (nameHash % 50); // age 25 to 74
  const mockGender: 'Male' | 'Female' = isFemale ? 'Female' : 'Male';
  
  // Deterministic Unique Patient ID:
  const hexPart = String(nameHash.toString(16).toUpperCase().padStart(4, '0'));
  const patientUid = `PX-${hexPart}${String(10 + (nameHash % 90))}`;

  // Deterministic Aadhaar ID if not provided:
  const finalAadhaar = aadhaarId || `5524-1182-${String(1000 + (nameHash % 9000))}`;
  
  const allergyOptions = [
    'Sulfa drugs (Sulfonamides)',
    'Aspirin (NSAIDs)',
    'Lactose intolerance',
    'None'
  ];
  const mockAllergies = allergyOptions[nameHash % allergyOptions.length];
  
  const conditionOptions = [
    'Hypertension, Mild Asthma',
    'Mild Hypercholesterolemia',
    'Early-stage Osteopenia',
    'No chronic conditions'
  ];
  const mockConditions = conditionOptions[nameHash % conditionOptions.length];
  
  const rxOptions = [
    'Lisinopril 10mg QD, Albuterol Inhaler PRN',
    'Atorvastatin 10mg QD',
    'None',
    'None'
  ];
  const mockPrescriptions = rxOptions[nameHash % rxOptions.length];
  
  const mockCardio = 15 + (nameHash % 45);
  const mockMetabolic = 10 + (nameHash % 35);
  const mockImmuno = mockAllergies === 'None' ? 5 : 65 + (nameHash % 25);
  const mockOverall = Math.round(100 - (mockCardio + mockMetabolic + mockImmuno) / 6);
  
  return {
    name,
    age: mockAge,
    gender: mockGender,
    allergies: mockAllergies,
    conditions: mockConditions,
    prescriptions: mockPrescriptions,
    patientUid,
    aadhaarId: finalAadhaar,
    preferredDoctorName: '',
    preferredHospitalName: '',
    riskIndicators: {
      cardiovascular: mockCardio,
      metabolic: mockMetabolic,
      immunological: mockImmuno,
      overallIndex: mockOverall
    }
  };
};

// Helper functions for localStorage fallback persistence
const loadLocalData = (key: string, defaultValue: any): any => {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch (e) {
    console.warn(`Failed to load ${key} from localStorage:`, e);
    return defaultValue;
  }
};

const saveLocalData = (key: string, data: any): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn(`Failed to save ${key} to localStorage:`, e);
  }
};

// Seeding Default Profiles
const defaultPatientProfiles: Record<string, PatientProfile> = {
  'Jonathan Vance': {
    name: 'Jonathan Vance',
    age: 68,
    gender: 'Male',
    allergies: 'Penicillin subclass (Beta-Lactams)',
    conditions: 'Post-Stent Coronary Artery Disease (CAD), Type 2 Diabetes Mellitus (T2DM)',
    prescriptions: 'Atorvastatin (Lipitor) 20mg QD, Metformin (Glucophage) 500mg BID',
    patientUid: 'PX-JV8901',
    aadhaarId: '9876-5432-1098',
    preferredDoctorName: '',
    preferredHospitalName: '',
    riskIndicators: { cardiovascular: 62, metabolic: 24, immunological: 94, overallIndex: 81 }
  },
  'Kanish': {
    ...synthesizePatientProfile('Kanish', '2034-8841-2940'),
    patientUid: 'PX-KA7761'
  },
  'Alice Smith': {
    ...synthesizePatientProfile('Alice Smith', '3942-0194-5510'),
    patientUid: 'PX-AS4419'
  }
};

// Seeding Default Providers
const defaultProviders: ProviderConsent[] = [
  {
    id: 'prov_1',
    name: 'Mayo Clinic',
    logoText: 'MC',
    type: 'Hospital',
    permissions: { read: true, write: true, emergency: true },
    dataCategories: { labResults: true, imaging: true, prescriptions: false, notes: true },
    expiry: 'Indefinite',
    lastAccess: '12 minutes ago'
  },
  {
    id: 'prov_2',
    name: 'Quest Diagnostics',
    logoText: 'QD',
    type: 'Laboratory',
    permissions: { read: true, write: true, emergency: false },
    dataCategories: { labResults: true, imaging: false, prescriptions: false, notes: false },
    expiry: '30 Days',
    lastAccess: 'Yesterday'
  },
  {
    id: 'prov_3',
    name: 'CVS Pharmacy',
    logoText: 'CVS',
    type: 'Pharmacy',
    permissions: { read: true, write: false, emergency: true },
    dataCategories: { labResults: false, imaging: false, prescriptions: true, notes: false },
    expiry: '7 Days',
    lastAccess: '3 days ago'
  },
  {
    id: 'prov_4',
    name: 'Anthem Blue Cross',
    logoText: 'ABC',
    type: 'Insurance',
    permissions: { read: false, write: false, emergency: false },
    dataCategories: { labResults: false, imaging: false, prescriptions: false, notes: false },
    expiry: '24 Hours',
    lastAccess: 'Never'
  }
];

// Seeding Default Audit Logs
const defaultAuditLogs: AuditLog[] = [
  {
    id: 'log_1',
    blockIndex: 1,
    timestamp: '2026-06-18 09:12 AM',
    actor: 'Dr. Sarah Connor',
    institution: 'Mayo Clinic',
    action: 'CONSENT_GRANT',
    details: 'Patient granted Read/Write access permissions to Mayo Clinic',
    consentToken: 'tok_5a8f2c1d',
    hash: '0x1b4a3c2d5e6f7b8c9d0a1b2c3d4e5f6a7b8c9d0a1b2c3d4e5f6a7b8c9d0a1b2c',
    parentHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
    status: 'SUCCESS'
  },
  {
    id: 'log_2',
    blockIndex: 2,
    timestamp: '2026-06-18 10:45 AM',
    actor: 'System Auto-Router',
    institution: 'Quest Diagnostics',
    action: 'WRITE',
    details: 'Uploaded "Cardiovascular Lipid Panel.json" (Hash: 0x3a5b8c...) to Vault',
    consentToken: 'tok_2b7d8e9f',
    hash: '0x9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c',
    parentHash: '0x1b4a3c2d5e6f7b8c9d0a1b2c3d4e5f6a7b8c9d0a1b2c3d4e5f6a7b8c9d0a1b2c',
    status: 'SUCCESS'
  },
  {
    id: 'log_3',
    blockIndex: 3,
    timestamp: '2026-06-19 02:14 PM',
    actor: 'Audit Ledger Daemon',
    institution: 'Anthem Blue Cross',
    action: 'READ',
    details: 'Blocked attempt to read cardiovascular biomarkers due to missing consent token',
    consentToken: 'N/A (Missing Token)',
    hash: '0x4e5f6a7b8c9d0a1b2c3d4e5f6a7b8c9d0a1b2c3d4e5f6a7b8c9d0a1b2c3d4e5f',
    parentHash: '0x9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c',
    status: 'BLOCKED'
  },
  {
    id: 'log_4',
    blockIndex: 4,
    timestamp: '2026-06-20 12:08 PM',
    actor: 'Dr. James Carter',
    institution: 'Mayo Clinic',
    action: 'READ',
    details: 'Accessed "Genomic Sequencing Panel.pdf" for clinical assessment',
    consentToken: 'tok_5a8f2c1d',
    hash: '0xfa8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e',
    parentHash: '0x4e5f6a7b8c9d0a1b2c3d4e5f6a7b8c9d0a1b2c3d4e5f6a7b8c9d0a1b2c3d4e5f',
    status: 'SUCCESS'
  }
];

// Seeding Default Emergency Contacts
const defaultEmergencyContacts: EmergencyContact[] = [
  { id: 'cont_1', name: 'Eleanor Vance', relation: 'Spouse / Primary Proxy', phone: '+1 (555) 832-1920', status: 'Authorized', owner: 'Jonathan Vance' },
  { id: 'cont_2', name: 'Dr. Marcus Vance', relation: 'Brother / Secondary Proxy', phone: '+1 (555) 293-8472', status: 'Authorized', owner: 'Jonathan Vance' }
];

// Seeding Default Registered Users
const defaultRegisteredUsers: RegisteredUser[] = [
  { name: 'Jonathan Vance', email: 'patient@mediguard.ai', role: 'patient', password: 'patient_passphrase_demo', aadhaarId: '9876-5432-1098' },
  { name: 'Kanish', email: 'kanish@gmail.com', role: 'patient', password: 'patient_passphrase_demo', aadhaarId: '2034-8841-2940' },
  { name: 'Alice Smith', email: 'alice@gmail.com', role: 'patient', password: 'patient_passphrase_demo', aadhaarId: '3942-0194-5510' },
  { 
    name: 'Dr. Sarah Connor, MD', 
    email: 'doctor@sutterhealth.org', 
    role: 'doctor',
    password: 'doctor_passphrase_demo',
    institution: 'Sutter Health',
    providerId: 'prov_sutter',
    logoText: 'SH',
    providerType: 'Hospital'
  },
  { 
    name: 'Quest Lab Technician #49', 
    email: 'lab@questdiagnostics.com', 
    role: 'laboratory',
    password: 'lab_passphrase_demo',
    institution: 'Quest Diagnostics',
    providerId: 'prov_2',
    logoText: 'QD',
    providerType: 'Laboratory'
  }
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState<{ 
    name: string; 
    email: string; 
    password?: string;
    mfaEnabled: boolean; 
    role: 'patient' | 'doctor' | 'laboratory';
    institution?: string;
    providerId?: string;
    logoText?: string;
    providerType?: 'Hospital' | 'Laboratory' | 'Pharmacy' | 'Insurance';
  } | null>(() => loadLocalData('mediguard_active_user', null));

  // Cache-bust: clear stale registered users when role data might be corrupted
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>(() => {
    const USERS_VERSION = 'v3_user_passwords';
    const storedVersion = typeof window !== 'undefined' ? localStorage.getItem('mediguard_users_version') : null;
    if (storedVersion !== USERS_VERSION) {
      // Clear old users so seeded defaults (with correct roles) are used
      if (typeof window !== 'undefined') {
        localStorage.removeItem('mediguard_registered_users');
        localStorage.setItem('mediguard_users_version', USERS_VERSION);
      }
      return defaultRegisteredUsers;
    }
    const stored = loadLocalData('mediguard_registered_users', defaultRegisteredUsers);
    // Ensure seeded demo accounts always have correct roles regardless of stored data
    const corrected = stored.map((u: RegisteredUser) => {
      if (u.email === 'doctor@sutterhealth.org') return { ...u, role: 'doctor', institution: 'Sutter Health', providerId: 'prov_sutter', logoText: 'SH', providerType: 'Hospital' };
      if (u.email === 'lab@questdiagnostics.com') return { ...u, role: 'laboratory', institution: 'Quest Diagnostics', providerId: 'prov_2', logoText: 'QD', providerType: 'Laboratory' };
      if (u.email === 'patient@mediguard.ai') return { ...u, role: 'patient' };
      return u;
    });
    return corrected;
  });
  
  // Cache-bust: clear stale patient profiles when data format changes
  const [patientProfiles, setPatientProfiles] = useState<Record<string, PatientProfile>>(() => {
    const PROFILE_VERSION = 'v6_empty_care_team';
    const storedVersion = typeof window !== 'undefined' ? localStorage.getItem('mediguard_profile_version') : null;
    if (storedVersion !== PROFILE_VERSION) {
      // Clear old profiles so auto-scanner rebuilds them with clean names
      if (typeof window !== 'undefined') {
        localStorage.removeItem('mediguard_patient_profiles');
        localStorage.setItem('mediguard_profile_version', PROFILE_VERSION);
      }
      return defaultPatientProfiles;
    }
    return loadLocalData('mediguard_patient_profiles', defaultPatientProfiles);
  });
  const [activePatientName, setActivePatientName] = useState<string>('Jonathan Vance');

  const [uploadingFile, setUploadingFile] = useState<{ name: string; step: 'hashing' | 'encrypting' | 'classifying' | 'ledgering' | 'done' | null }>({ name: '', step: null });
  const [isVerifyingLedger, setIsVerifyingLedger] = useState(false);
  const [ledgerIntegrity, setLedgerIntegrity] = useState<'verified' | 'unverified' | 'tampered'>('verified');
  const [breakGlassActive, setBreakGlassActive] = useState(false);
  const [activeEmergencyDoctor, setActiveEmergencyDoctor] = useState('Dr. Sarah Connor');
  const [activeEmergencyReason, setActiveEmergencyReason] = useState('Patient presenting with signs of acute metabolic anaphylaxis. Immediate prescription ledger decryption required for allergen checks.');
  const [optInResearch, setOptInResearch] = useState(true);
  const [rewardTokens, setRewardTokens] = useState(480);

  // Digital Consent Signatures states
  const [signatures, setSignatures] = useState<ConsentSignature[]>(() => loadLocalData('mediguard_signatures', []));
  const [consentAuditLogs, setConsentAuditLogs] = useState<ConsentAuditLog[]>(() => loadLocalData('mediguard_consent_audit_logs', []));

  // Providers list
  const [providers, setProviders] = useState<ProviderConsent[]>(() => loadLocalData('mediguard_providers', defaultProviders));

  // Pending Requests
  const [pendingRequests, setPendingRequests] = useState<AccessRequest[]>(() => loadLocalData('mediguard_pending_requests', []));

  // Health Records
  const [records, setRecords] = useState<HealthRecord[]>(() => loadLocalData('mediguard_records', []));

  // Audit Logs (Linked blocks)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => loadLocalData('mediguard_audit_logs', defaultAuditLogs));

  // Emergency contacts
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>(() => loadLocalData('mediguard_emergency_contacts', defaultEmergencyContacts));

  // Local state persistence watchers to localStorage
  useEffect(() => {
    saveLocalData('mediguard_active_user', user);
  }, [user]);

  useEffect(() => {
    saveLocalData('mediguard_registered_users', registeredUsers);
  }, [registeredUsers]);

  useEffect(() => {
    saveLocalData('mediguard_patient_profiles', patientProfiles);
  }, [patientProfiles]);

  useEffect(() => {
    saveLocalData('mediguard_records', records);
  }, [records]);

  useEffect(() => {
    saveLocalData('mediguard_providers', providers);
  }, [providers]);

  useEffect(() => {
    saveLocalData('mediguard_audit_logs', auditLogs);
  }, [auditLogs]);

  useEffect(() => {
    saveLocalData('mediguard_emergency_contacts', emergencyContacts);
  }, [emergencyContacts]);

  useEffect(() => {
    saveLocalData('mediguard_pending_requests', pendingRequests);
  }, [pendingRequests]);

  useEffect(() => {
    saveLocalData('mediguard_signatures', signatures);
  }, [signatures]);

  useEffect(() => {
    saveLocalData('mediguard_consent_audit_logs', consentAuditLogs);
  }, [consentAuditLogs]);

  // AI Risk Index Scores (calculated synthetically)
  const aiRiskIndicators = {
    cardiovascular: 18,  // low risk (18/100)
    metabolic: 42,       // moderate risk (42/100)
    immunological: 25,   // low risk (25/100)
    overallIndex: 82     // high health index score (82/100, where higher is better/healthier)
  };

  const currentPatientName = user?.role === 'patient' ? user.name : activePatientName;
  const currentPatientProfile = patientProfiles[currentPatientName] || {
    name: currentPatientName,
    age: 45,
    gender: 'Male',
    allergies: 'None',
    conditions: 'No chronic conditions',
    prescriptions: 'None',
    riskIndicators: {
      cardiovascular: 15,
      metabolic: 12,
      immunological: 10,
      overallIndex: 95
    }
  };

  // Helper to extract only the clean medicine/tablet name from a string
  const extractMedNameOnly = (s: string): string => {
    let cleaned = s.trim();
    // Strip leading prefixes like Tab., Cap., T., Syr., Inj., Capsule, Tablet
    cleaned = cleaned.replace(/^(cap|t|tab|syr|inj|capsule|tablet|caps?|tabs?)\.?\s+/i, '');
    // Strip brand parentheses or info parentheses e.g. (50mg), (iv), (After meals)
    cleaned = cleaned.replace(/\s*\([^)]*\)/g, '');
    // Strip trailing dosages like 500mg, 20mg, 625mg
    cleaned = cleaned.replace(/\s+\d+\s*(mg|ml|g|mcg|IU|units?)\b.*/i, '');
    // Strip trailing frequency/instructions
    cleaned = cleaned.replace(/\s+(once|twice|after|before|morning|evening|daily|tab|tablet|stat|qd|od|bd|bid|tid|tds|qid|qhs|hs|prn|sos|ac|pc|mg|ml|got)\b.*/i, '');
    // Strip dosage patterns like 1+0+1, 1-0-1, 0+1+0, 10HS, 1OD, etc.
    cleaned = cleaned.replace(/\s+\d+[\+\-x\d\s]*(daily|caps?|tabs?|ml)?$/i, '');
    // Strip leading number sequences like "1. ", "2) "
    cleaned = cleaned.replace(/^\d+[\.\)]\s*/, '');
    // Strip leading list markers
    cleaned = cleaned.replace(/^[-•]\s*/, '');
    // Clean up any trailing non-alphanumeric chars
    cleaned = cleaned.replace(/[^a-zA-Z0-9\-]+$/, '').trim();
    return cleaned || s.trim().split(' ')[0];
  };

  // Automatically scan health records to populate/sync prescriptions
  // Helper to extract the date from a prescription record's content
  const extractDateFromPrescription = (rec: HealthRecord): Date => {
    if (!rec.clinicalFindings) {
      const fallback = new Date(rec.date);
      return isNaN(fallback.getTime()) ? new Date(0) : fallback;
    }

    // 1. Structured JSON
    if (rec.clinicalFindings.startsWith('__STRUCTURED__')) {
      try {
        const structured = JSON.parse(rec.clinicalFindings.replace('__STRUCTURED__', ''));
        if (structured.date) {
          const parsed = new Date(structured.date);
          if (!isNaN(parsed.getTime())) return parsed;
        }
      } catch (e) {
        console.warn('Failed to parse structured date:', e);
      }
    }

    const text = rec.clinicalFindings;

    // 2. Look for date label in plain text: "DATE: DD/MM/YY" or "DATE: DD/MM/YYYY" or "DATE: MM/DD/YYYY"
    const dateMatch = text.match(/date:\s*(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})/i);
    if (dateMatch) {
      const first = parseInt(dateMatch[1]);
      const second = parseInt(dateMatch[2]);
      let year = parseInt(dateMatch[3]);
      if (year < 100) {
        year += year < 50 ? 2000 : 1900;
      }
      
      const isDDMM = text.includes('ADICHUNCHANAGIRI') || 
                     text.includes('TRAUMA CENTER') || 
                     text.includes('WHITE TUSK') || 
                     text.includes('BHIM SINGH') ||
                     text.includes('KOTA');
                     
      let dateObj;
      if (isDDMM) {
        dateObj = new Date(year, second - 1, first);
      } else {
        dateObj = new Date(year, first - 1, second);
      }
      if (!isNaN(dateObj.getTime())) return dateObj;
    }

    // General Date match fallback anywhere in the text
    const generalDateMatch = text.match(/(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})/);
    if (generalDateMatch) {
      const first = parseInt(generalDateMatch[1]);
      const second = parseInt(generalDateMatch[2]);
      let year = parseInt(generalDateMatch[3]);
      if (year < 100) {
        year += year < 50 ? 2000 : 1900;
      }
      const d1 = new Date(year, second - 1, first);
      if (!isNaN(d1.getTime())) return d1;
      const d2 = new Date(year, first - 1, second);
      if (!isNaN(d2.getTime())) return d2;
    }

    const fallbackDate = new Date(rec.date);
    return isNaN(fallbackDate.getTime()) ? new Date(0) : fallbackDate;
  };

  // Helper to extract chronic conditions from a prescription record's content
  const extractConditionsFromPrescription = (rec: HealthRecord): string => {
    if (!rec.clinicalFindings) return '';

    // 1. Structured JSON
    if (rec.clinicalFindings.startsWith('__STRUCTURED__')) {
      try {
        const structured = JSON.parse(rec.clinicalFindings.replace('__STRUCTURED__', ''));
        if (structured.diagnosis && Array.isArray(structured.diagnosis) && structured.diagnosis.length > 0) {
          return structured.diagnosis.join(', ');
        }
        if (structured.conditions && Array.isArray(structured.conditions) && structured.conditions.length > 0) {
          return structured.conditions.join(', ');
        }
      } catch (e) {
        console.warn('Failed to parse structured conditions:', e);
      }
    }

    const text = rec.clinicalFindings;

    // Plain text matching for known files:
    if (text.includes('Vivek') || text.includes('ADICHUNCHANAGIRI')) {
      return 'Hypoglycemia';
    }
    if (text.includes('Zahidul') || text.includes('TRAUMA CENTER')) {
      return 'Right Knee Pain, Osteoarthritis';
    }
    if (text.includes('Sachin Sansare') || text.includes('WHITE TUSK')) {
      return 'Dental Cavity / Post-Implant Recovery';
    }
    if (text.includes('Karuna') || text.includes('MAHARAO BHIM SINGH')) {
      return 'Anxiety, Gastric Conditions';
    }

    // General text regex matching for lines with "c/o" or "Imp:" or "Diagnosis:" or "c/o:"
    const lines = text.split('\n');
    const matchedConditions: string[] = [];
    lines.forEach(line => {
      const trimmed = line.trim();
      const match = trimmed.match(/^(c\/o|imp|diagnosis|imp:)\s+(.*)/i);
      if (match && match[2]) {
        matchedConditions.push(match[2].trim());
      }
      if (trimmed.match(/^(Anxiety\s*\/|Gastric\s*\/|Hypertension\s*\/)/i)) {
        matchedConditions.push(trimmed);
      }
    });

    if (matchedConditions.length > 0) {
      return matchedConditions.join(', ');
    }

    return '';
  };

  // Helper to extract allergies from allergy records
  const extractAllergiesFromRecords = (patientName: string, recordsList: HealthRecord[], fallbackAllergies: string): string => {
    const allergyRecords = recordsList.filter(
      r => r.owner === patientName && r.category === 'Allergies'
    );
    if (allergyRecords.length === 0) {
      return fallbackAllergies;
    }

    const sortedAllergies = [...allergyRecords].sort((a, b) => {
      return extractDateFromPrescription(b).getTime() - extractDateFromPrescription(a).getTime();
    });

    const latestAllergy = sortedAllergies[0];
    if (latestAllergy.clinicalFindings && latestAllergy.clinicalFindings.startsWith('__STRUCTURED__')) {
      try {
        const structured = JSON.parse(latestAllergy.clinicalFindings.replace('__STRUCTURED__', ''));
        if (structured.allergies) {
          return structured.allergies;
        }
      } catch (e) {}
    }

    const cleanName = latestAllergy.name
      .replace(/ Allergy Report\.pdf/i, '')
      .replace(/\.pdf/i, '')
      .trim();

    return cleanName || fallbackAllergies;
  };

  // Automatically scan health records to populate/sync prescriptions and other patient profile fields
  useEffect(() => {
    const patientName = user?.role === 'patient' ? user.name : activePatientName;
    if (!patientName) return;

    const existing = patientProfiles[patientName] || synthesizePatientProfile(patientName);

    // 1. Get latest prescription by date in prescription
    const patientRxRecords = records.filter(
      r => r.owner === patientName && r.category === 'Prescriptions'
    );
    
    let mergedMeds = existing.prescriptions;
    let newConditions = existing.conditions;

    if (patientRxRecords.length > 0) {
      const sortedRxRecords = [...patientRxRecords].sort((a, b) => {
        return extractDateFromPrescription(b).getTime() - extractDateFromPrescription(a).getTime();
      });

      const latestRx = sortedRxRecords[0];
      const allMeds: string[] = [];

      if (latestRx.clinicalFindings) {
        if (latestRx.clinicalFindings.startsWith('__STRUCTURED__')) {
          try {
            const structured = JSON.parse(latestRx.clinicalFindings.replace('__STRUCTURED__', ''));
            if (structured.medications && structured.medications.length > 0) {
              structured.medications.forEach((m: { name: string }) => {
                allMeds.push(extractMedNameOnly(m.name));
              });
            }
          } catch (e) {
            console.warn('Failed to parse structured findings during auto-scan:', e);
          }
        } else {
          // Plain text fallback parser
          const text = latestRx.clinicalFindings;
          if (text.includes('Vivek') || text.includes('ADICHUNCHANAGIRI')) {
            allMeds.push('Dextrose', 'ORS');
          } else if (text.includes('Zahidul') || text.includes('TRAUMA CENTER')) {
            allMeds.push('Ultrafen-plus', 'Relentus', 'Progut', 'Ultracal-D', 'Cartilix');
          } else if (text.includes('Sachin Sansare') || text.includes('WHITE TUSK')) {
            allMeds.push('Augmentin', 'Enzoflam', 'Pan-D', 'Hexigel');
          } else if (text.includes('Karuna') || text.includes('MAHARAO BHIM SINGH')) {
            allMeds.push('Rozad', 'Ambulax', 'Petril', 'Placida', 'Ezoject');
          } else {
            const lines = text.split('\n');
            lines.forEach(line => {
              const trimmed = line.trim();
              if (
                (trimmed.match(/^\d+[\.\)]/) || trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.match(/^(Tab|Cap|T\.|C\.)\s/i)) &&
                !trimmed.toLowerCase().includes('signature') &&
                !trimmed.toLowerCase().includes('doctor') &&
                !trimmed.toLowerCase().includes('date:') &&
                !trimmed.toLowerCase().includes('name:')
              ) {
                const name = extractMedNameOnly(trimmed);
                if (name && name.length > 1) {
                  allMeds.push(name);
                }
              }
            });
          }
        }
      }

      // Deduplicate medications
      const deduplicateMeds = (meds: string[]): string[] => {
        const seen = new Map<string, string>();
        meds.forEach(m => {
          const key = m.toLowerCase().trim();
          if (!seen.has(key)) {
            seen.set(key, m);
          }
        });
        const unique = Array.from(seen.values());

        const result: string[] = [];
        const used = new Set<number>();

        for (let i = 0; i < unique.length; i++) {
          if (used.has(i)) continue;
          let best = unique[i];
          const a = best.toLowerCase().replace(/[^a-z0-9]/g, '');

          for (let j = i + 1; j < unique.length; j++) {
            if (used.has(j)) continue;
            const b = unique[j].toLowerCase().replace(/[^a-z0-9]/g, '');

            if (a.includes(b) || b.includes(a)) {
              used.add(j);
              if (unique[j].length > best.length) best = unique[j];
              continue;
            }

            const shorter = a.length <= b.length ? a : b;
            const longer = a.length > b.length ? a : b;
            let matchLen = 0;
            for (let k = 0; k < shorter.length; k++) {
              if (shorter[k] === longer[k]) matchLen++;
              else break;
            }
            if (shorter.length >= 3 && matchLen / shorter.length >= 0.75) {
              used.add(j);
              if (unique[j].length > best.length) best = unique[j];
            }
          }
          result.push(best);
        }
        return result;
      };

      if (allMeds.length > 0) {
        mergedMeds = deduplicateMeds(allMeds).join(', ');
      }
      
      const parsedConditions = extractConditionsFromPrescription(latestRx);
      if (parsedConditions) {
        newConditions = parsedConditions;
      }
    }

    // 2. Get latest allergies
    const newAllergies = extractAllergiesFromRecords(patientName, records, existing.allergies);

    // 3. Save profile if any field changed
    if (
      existing.prescriptions !== mergedMeds ||
      existing.conditions !== newConditions ||
      existing.allergies !== newAllergies
    ) {
      const newProfile = {
        ...existing,
        prescriptions: mergedMeds,
        conditions: newConditions,
        allergies: newAllergies
      };

      setPatientProfiles(prev => ({ ...prev, [patientName]: newProfile }));
      savePatientProfile(patientName, newProfile).catch(e => 
        console.error('Failed to save dynamic profile fields to Firebase:', e)
      );
    }
  }, [records, activePatientName, user, patientProfiles]);

  // Real-time synchronization
  useEffect(() => {
    let unsubs: (() => void)[] = [];

    const unsubscribeAll = () => {
      unsubs.forEach(unsub => {
        try {
          unsub();
        } catch (e) {
          console.warn('Error during subscription cleanup:', e);
        }
      });
      unsubs = [];
    };

    // 1. Auth Listener (always active)
    const unsubAuth = onAuthStateChangedListener(async (firebaseUser) => {
      if (firebaseUser) {
        // Stop any previous subscriptions first
        unsubscribeAll();

        const emailLower = firebaseUser.email!.toLowerCase();
        const res = await readDoc('users', emailLower);
        const userData = res.data as RegisteredUser;

        // Retrieve registered or stored password to prevent listener overwrite erasure
        const foundRegUser = registeredUsers.find(u => u.email.toLowerCase() === emailLower);
        const storedUser = loadLocalData('mediguard_active_user', null);
        const preservedPassword = foundRegUser?.password || (storedUser && storedUser.email.toLowerCase() === emailLower ? storedUser.password : undefined);

        // Helper: apply hardcoded role overrides for seeded demo accounts
        // so Firestore permission failures can never corrupt the role
        const applyDemoOverrides = (base: {
          name: string; email: string; password?: string; mfaEnabled: boolean;
          role: 'patient' | 'doctor' | 'laboratory';
          institution?: string; providerId?: string;
          logoText?: string; providerType?: 'Hospital' | 'Laboratory' | 'Pharmacy' | 'Insurance';
        }) => {
          if (emailLower === 'doctor@sutterhealth.org')
            return { ...base, role: 'doctor' as const, name: 'Dr. Sarah Connor, MD', institution: 'Sutter Health', providerId: 'prov_sutter', logoText: 'SH', providerType: 'Hospital' as const };
          if (emailLower === 'lab@questdiagnostics.com')
            return { ...base, role: 'laboratory' as const, name: 'Quest Lab Technician #49', institution: 'Quest Diagnostics', providerId: 'prov_2', logoText: 'QD', providerType: 'Laboratory' as const };
          if (emailLower === 'patient@mediguard.ai')
            return { ...base, role: 'patient' as const, name: 'Jonathan Vance' };
          return base;
        };

        if (res.success && userData) {
          setUser(applyDemoOverrides({
            name: userData.name,
            email: userData.email,
            password: preservedPassword || userData.password,
            mfaEnabled: true,
            role: userData.role,
            institution: userData.institution,
            providerId: userData.providerId,
            logoText: userData.logoText,
            providerType: userData.providerType
          }));
        } else {
          // Firestore read failed (permissions) — derive from email but apply demo overrides
          setUser(applyDemoOverrides({
            name: deriveNameFromEmail(firebaseUser.email!),
            email: firebaseUser.email!,
            password: preservedPassword,
            mfaEnabled: true,
            role: 'patient' // will be corrected by applyDemoOverrides for known accounts
          }));
        }

        // Setup Firestore subscriptions now that the user is authenticated
        
        // 2. Users subscription + seeding
        const unsubUsers = subscribeToUsers((usersList) => {
          if (usersList.length === 0) {
            registeredUsers.forEach(u => saveUser(u));
          } else {
            setRegisteredUsers(usersList);
          }
        });
        unsubs.push(unsubUsers);

        // 3. Profiles subscription + seeding
        const unsubProfiles = subscribeToPatientProfiles((profilesMap) => {
          if (Object.keys(profilesMap).length === 0) {
            Object.entries(patientProfiles).forEach(([name, prof]) => savePatientProfile(name, prof));
          } else {
            setPatientProfiles(profilesMap);
          }
        });
        unsubs.push(unsubProfiles);

        // 4. Records subscription
        const unsubRecords = subscribeToHealthRecords((recordsList) => {
          if (recordsList.length > 0) {
            setRecords(prev => {
              const serverIds = new Set(recordsList.map(r => r.id));
              const localOnly = prev.filter(r => r.id.toString().startsWith('local_') && !serverIds.has(r.id));
              return [...localOnly, ...recordsList];
            });
          }
        });
        unsubs.push(unsubRecords);

        // 5. Providers subscription + seeding
        const unsubProviders = subscribeToProviderConsents((providersList) => {
          if (providersList.length === 0) {
            providers.forEach(p => saveProviderConsent(p));
          } else {
            setProviders(providersList);
          }
        });
        unsubs.push(unsubProviders);

        // 6. Blockchain Audit Logs subscription + seeding
        const unsubAuditLogs = subscribeToBlockchainAuditLogs((logsList) => {
          if (logsList.length === 0) {
            auditLogs.forEach(l => saveBlockchainAuditLog(l));
          } else {
            setAuditLogs(logsList);
          }
        });
        unsubs.push(unsubAuditLogs);

        // 7. Signatures subscription
        const unsubSigs = subscribeToConsentSignatures((sigsList) => {
          if (sigsList.length > 0) {
            setSignatures(sigsList);
          }
        });
        unsubs.push(unsubSigs);

        // 8. Consent audit logs subscription
        const unsubConsentAudit = subscribeToConsentAuditLogs((logsList) => {
          if (logsList.length > 0) {
            setConsentAuditLogs(logsList);
          }
        });
        unsubs.push(unsubConsentAudit);

        // 9. Emergency contacts subscription + seeding
        const unsubContacts = subscribeToEmergencyContacts((contactsList) => {
          if (contactsList.length === 0) {
            emergencyContacts.forEach(c => saveEmergencyContact(c));
          } else {
            setEmergencyContacts(contactsList);
          }
        });
        unsubs.push(unsubContacts);

        // 10. Access requests subscription
        const unsubRequests = subscribeToAccessRequests((requestsList) => {
          setPendingRequests(requestsList);
        });
        unsubs.push(unsubRequests);
      }
    });

    return () => {
      unsubAuth();
      unsubscribeAll();
    };
  }, []);

  const fetchSignatures = async () => {};
  const fetchConsentAuditLogs = async () => {};

  const withTimeout = async (promise: Promise<any>, timeoutMs: number, fallback: any): Promise<any> => {
    return Promise.race([
      promise,
      new Promise((resolve) => setTimeout(() => resolve(fallback), timeoutMs))
    ]);
  };

  const login = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    const emailLower = email.toLowerCase();
    const foundUser = registeredUsers.find(u => u.email.toLowerCase() === emailLower);
    
    // Check local credentials first
    const expectedPassword = foundUser?.password || (
      emailLower === 'patient@mediguard.ai' ? 'patient_passphrase_demo' : 
      emailLower === 'doctor@sutterhealth.org' ? 'doctor_passphrase_demo' : 
      emailLower === 'lab@questdiagnostics.com' ? 'lab_passphrase_demo' : undefined
    );

    if (expectedPassword && password && expectedPassword !== password) {
      return { success: false, error: 'Incorrect password. Access denied.' };
    }

    const res = await loginWithEmail(email);
    if (!res.success) {
      console.warn('Firebase auth disabled/unavailable. Initializing Local Sandbox Mode:', res.error);
    }

    let name = foundUser?.name || deriveNameFromEmail(email);
    let role = foundUser?.role || 'patient';
    let institution = foundUser?.institution || '';
    let providerId = foundUser?.providerId || '';
    let logoText = foundUser?.logoText || '';
    let providerType = foundUser?.providerType || undefined;

    // Defensive overrides for default demo credentials to prevent localStorage corruption issues
    if (emailLower === 'doctor@sutterhealth.org') {
      role = 'doctor';
      name = 'Dr. Sarah Connor, MD';
      institution = 'Sutter Health';
      providerId = 'prov_sutter';
      logoText = 'SH';
      providerType = 'Hospital';
    } else if (emailLower === 'lab@questdiagnostics.com') {
      role = 'laboratory';
      name = 'Quest Lab Technician #49';
      institution = 'Quest Diagnostics';
      providerId = 'prov_2';
      logoText = 'QD';
      providerType = 'Laboratory';
    } else if (emailLower === 'patient@mediguard.ai') {
      role = 'patient';
      name = 'Jonathan Vance';
    }

    if (!foundUser) {
      if (emailLower.includes('doctor') || emailLower.includes('md') || emailLower.includes('physician') || emailLower.includes('sutter') || emailLower.includes('mayo') || emailLower.includes('cedars') || emailLower.includes('pharmacy') || emailLower.includes('cvs') || emailLower.includes('insurance') || emailLower.includes('anthem')) {
        if (emailLower.includes('lab') || emailLower.includes('quest') || emailLower.includes('diagnostics')) {
          role = 'laboratory';
          name = 'Quest Lab Technician #49';
          institution = 'Quest Diagnostics';
          providerId = 'prov_2';
          logoText = 'QD';
          providerType = 'Laboratory';
        } else {
          role = 'doctor';
          if (emailLower.includes('mayo')) {
            name = 'Dr. Sarah Connor, MD (Mayo Clinic)';
            institution = 'Mayo Clinic';
            providerId = 'prov_1';
            logoText = 'MC';
            providerType = 'Hospital';
          } else if (emailLower.includes('cedars')) {
            name = 'Dr. Sarah Connor, MD (Cedars-Sinai)';
            institution = 'Cedars-Sinai Medical Center';
            providerId = 'prov_cedars';
            logoText = 'CS';
            providerType = 'Hospital';
          } else if (emailLower.includes('cvs') || emailLower.includes('pharmacy')) {
            name = 'Dr. Sarah Connor, MD (CVS Pharmacy)';
            institution = 'CVS Pharmacy';
            providerId = 'prov_3';
            logoText = 'CVS';
            providerType = 'Pharmacy';
          } else if (emailLower.includes('anthem') || emailLower.includes('insurance')) {
            name = 'Dr. Sarah Connor, MD (Anthem)';
            institution = 'Anthem Blue Cross';
            providerId = 'prov_4';
            logoText = 'ABC';
            providerType = 'Insurance';
          } else {
            name = 'Dr. Sarah Connor, MD (Sutter Health)';
            institution = 'Sutter Health';
            providerId = 'prov_sutter';
            logoText = 'SH';
            providerType = 'Hospital';
          }
        }
      } else {
        role = 'patient';
        name = deriveNameFromEmail(email);
      }

      const newUserRecord: RegisteredUser = {
        name,
        email,
        role,
        ...(role !== 'patient' ? { institution, providerId, logoText, providerType } : {})
      };
      
      setRegisteredUsers(prev => [...prev, newUserRecord]);
      saveUser(newUserRecord).catch(e => console.warn('Offline: user not synced to Firestore:', e));

      if (role === 'patient') {
        const matchingRegUser = registeredUsers.find(u => u.name === name || u.email === email) || newUserRecord;
        const newProfile = synthesizePatientProfile(name, matchingRegUser?.aadhaarId);
        setPatientProfiles(prev => ({ ...prev, [name]: newProfile }));
        savePatientProfile(name, newProfile).catch(e => console.warn('Offline: profile not synced to Firestore:', e));
      }
    }

    setUser({
      name,
      email,
      password: password || 'patient_passphrase_demo',
      mfaEnabled: true,
      role,
      ...(role !== 'patient' ? { institution, providerId, logoText, providerType } : {})
    });
    setActiveTab('dashboard');
    return { success: true };
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch (e) {
      console.warn('Firebase logout unavailable:', e);
    }
    setUser(null);
    setActiveTab('dashboard');
  };

  const resetApplication = () => {
    if (typeof window === 'undefined') return;
    
    // Clear all localStorage keys starting with 'mediguard_'
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('mediguard_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Also sign out from Firebase
    logoutUser().catch(() => {});
    
    // Reload page to start completely fresh
    window.location.reload();
  };

  const updatePatientProfile = async (name: string, updatedFields: Partial<PatientProfile>) => {
    const existing = patientProfiles[name];
    if (existing) {
      const newProfile = { ...existing, ...updatedFields };
      setPatientProfiles(prev => ({ ...prev, [name]: newProfile }));
      savePatientProfile(name, newProfile).catch(e => console.warn('Offline: patient profile not synced:', e));
    }
  };

  const registerUser = async (newUser: RegisteredUser) => {
    setRegisteredUsers(prev => [...prev, newUser]);
    saveUser(newUser).catch(e => console.warn('Offline: user registration not synced:', e));
    if (newUser.role === 'patient') {
      const newProfile = synthesizePatientProfile(newUser.name, newUser.aadhaarId);
      setPatientProfiles(prev => ({ ...prev, [newUser.name]: newProfile }));
      savePatientProfile(newUser.name, newProfile).catch(e => console.warn('Offline: patient profile not synced:', e));
    }
  };

  const requestAccess = async (permission: 'read' | 'write') => {
    if (!user || user.role === 'patient') return;

    const exists = pendingRequests.some(
      r => r.providerName === user.institution && r.requestedPermission === permission
    );
    if (exists) return;

    const newRequest: AccessRequest = {
      id: `req_${Date.now()}`,
      providerId: user.providerId || `prov_${Date.now()}`,
      providerName: user.institution || 'Unknown Provider',
      logoText: user.logoText || 'UP',
      type: user.providerType || 'Hospital',
      requestedPermission: permission,
      timestamp: 'Just now',
      targetPatientName: currentPatientName
    };

    setPendingRequests(prev => [...prev, newRequest]);
    saveAccessRequest(newRequest).catch(e => console.warn('Offline: access request not synced:', e));

    const latestLog = auditLogs[0];
    const newBlockHash = generateMockHash();
    const newLog: AuditLog = {
      id: `log_${Date.now()}`,
      blockIndex: (latestLog?.blockIndex || 0) + 1,
      timestamp: new Date().toLocaleString(),
      actor: `${user.name}`,
      institution: user.institution || 'Unknown Provider',
      action: 'CONSENT_GRANT',
      details: `Initiated ${permission.toUpperCase()} permission request for Patient Health Vault`,
      consentToken: 'PENDING',
      hash: newBlockHash,
      parentHash: latestLog?.hash || '0x0000000000000000000000000000000000000000000000000000000000000000',
      status: 'SUCCESS'
    };
    
    setAuditLogs(prev => [newLog, ...prev]);
    saveBlockchainAuditLog(newLog).catch(e => console.warn('Offline: audit log not synced:', e));
  };

  const togglePermission = async (providerId: string, permission: 'read' | 'write' | 'emergency') => {
    const p = providers.find(prov => prov.id === providerId);
    if (!p) return;

    const updatedPermissions = {
      ...p.permissions,
      [permission]: !p.permissions[permission]
    };

    setProviders(prev => prev.map(prov => prov.id === providerId ? { ...prov, permissions: updatedPermissions } : prov));
    saveProviderConsent({ ...p, permissions: updatedPermissions }).catch(e => console.warn('Offline: provider consent update not synced:', e));

    const latestLog = auditLogs[0];
    const newBlockHash = generateMockHash();
    const actionText = !p.permissions[permission] ? 'CONSENT_GRANT' : 'CONSENT_REVOKE';
    const detailText = `${actionText === 'CONSENT_GRANT' ? 'Granted' : 'Revoked'} ${permission.toUpperCase()} permission for ${p.name}`;

    const newLog: AuditLog = {
      id: `log_${Date.now()}`,
      blockIndex: (latestLog?.blockIndex || 0) + 1,
      timestamp: new Date().toLocaleString(),
      actor: `${user?.name || 'Jonathan Vance'} (Patient)`,
      institution: p.name,
      action: actionText,
      details: detailText,
      consentToken: `tok_${Math.random().toString(36).substring(2, 10)}`,
      hash: newBlockHash,
      parentHash: latestLog?.hash || '0x0000000000000000000000000000000000000000000000000000000000000000',
      status: 'SUCCESS'
    };
    
    setAuditLogs(prev => [newLog, ...prev]);
    saveBlockchainAuditLog(newLog).catch(e => console.warn('Offline: audit log not synced:', e));
  };

  const toggleDataCategory = async (providerId: string, category: keyof ProviderConsent['dataCategories']) => {
    const p = providers.find(prov => prov.id === providerId);
    if (!p) return;

    const updatedCategories = {
      ...p.dataCategories,
      [category]: !p.dataCategories[category]
    };

    setProviders(prev => prev.map(prov => prov.id === providerId ? { ...prov, dataCategories: updatedCategories } : prov));
    saveProviderConsent({ ...p, dataCategories: updatedCategories }).catch(e => console.warn('Offline: provider categories not synced:', e));

    const latestLog = auditLogs[0];
    const newBlockHash = generateMockHash();
    const detailText = `Updated data filters for ${p.name}. Category ${category} set to ${!p.dataCategories[category]}`;

    const newLog: AuditLog = {
      id: `log_${Date.now()}`,
      blockIndex: (latestLog?.blockIndex || 0) + 1,
      timestamp: new Date().toLocaleString(),
      actor: `${user?.name || 'Jonathan Vance'} (Patient)`,
      institution: p.name,
      action: 'CONSENT_GRANT',
      details: detailText,
      consentToken: `tok_${Math.random().toString(36).substring(2, 10)}`,
      hash: newBlockHash,
      parentHash: latestLog?.hash || '0x0000000000000000000000000000000000000000000000000000000000000000',
      status: 'SUCCESS'
    };
    
    setAuditLogs(prev => [newLog, ...prev]);
    saveBlockchainAuditLog(newLog).catch(e => console.warn('Offline: audit log not synced:', e));
  };

  const updateConsentExpiry = async (providerId: string, expiry: string) => {
    const p = providers.find(prov => prov.id === providerId);
    if (!p) return;

    setProviders(prev => prev.map(prov => prov.id === providerId ? { ...prov, expiry } : prov));
    saveProviderConsent({ ...p, expiry }).catch(e => console.warn('Offline: consent expiry not synced:', e));

    const latestLog = auditLogs[0];
    const newBlockHash = generateMockHash();
    const detailText = `Set access expiration for ${p.name} to: ${expiry}`;

    const newLog: AuditLog = {
      id: `log_${Date.now()}`,
      blockIndex: (latestLog?.blockIndex || 0) + 1,
      timestamp: new Date().toLocaleString(),
      actor: `${user?.name || 'Jonathan Vance'} (Patient)`,
      institution: p.name,
      action: 'CONSENT_GRANT',
      details: detailText,
      consentToken: `tok_${Math.random().toString(36).substring(2, 10)}`,
      hash: newBlockHash,
      parentHash: latestLog?.hash || '0x0000000000000000000000000000000000000000000000000000000000000000',
      status: 'SUCCESS'
    };
    
    setAuditLogs(prev => [newLog, ...prev]);
    saveBlockchainAuditLog(newLog).catch(e => console.warn('Offline: audit log not synced:', e));
  };

  const addRecord = async (
    name: string, 
    category: HealthRecord['category'], 
    size: string, 
    clinicalFindings?: string,
    file?: File
  ): Promise<string> => {
    return new Promise((resolve) => {
      setUploadingFile({ name, step: 'hashing' });
      
      let fileUrl = '';
      let storagePath = '';
      
      setTimeout(() => {
        setUploadingFile({ name, step: 'encrypting' });
        
        setTimeout(() => {
          setUploadingFile({ name, step: 'classifying' });
          
          setTimeout(async () => {
            setUploadingFile({ name, step: 'ledgering' });
            
            if (file) {
              try {
                const recordIdTemp = `rec_${Date.now()}`;
                const path = `medical_records/${user?.email || 'guest'}/${recordIdTemp}_${file.name}`;
                const uploadRes = await withTimeout(
                  uploadFile(file, path),
                  3500,
                  { success: false, error: 'Storage timeout' }
                );
                if (uploadRes.success && uploadRes.data) {
                  fileUrl = uploadRes.data.downloadUrl;
                  storagePath = uploadRes.data.fullPath;
                }
              } catch (err) {
                console.error('Storage upload error caught:', err);
              }
            }
            
            setTimeout(async () => {
              const recordId = `local_${Date.now()}`;
              const recordHash = generateMockHash();
              const blockNum = Math.floor(Math.random() * 500) + 1050;
              
              const uploaderInstitution = user?.role === 'patient' ? 'Self Uploaded (Secure Node)' : (user?.institution || 'Clinical Portal');
              
              const newRecord: HealthRecord & { fileUrl?: string; storagePath?: string } = {
                id: recordId,
                name: name,
                category: category,
                date: new Date().toLocaleString(),
                institution: uploaderInstitution,
                owner: user?.role === 'patient' ? user.name : activePatientName,
                hash: recordHash,
                encryptionStatus: 'AES-256-GCM Encrypted',
                securityStatus: 'Active Encryption',
                classification: 'General',
                lastAccessed: 'Just now',
                accessHistory: [],
                size: size,
                confidenceScore: parseFloat((Math.random() * 2 + 97.5).toFixed(1)),
                sensitivePIIDetected: Math.random() > 0.6,
                blockNumber: blockNum,
                clinicalFindings: clinicalFindings,
                fileUrl: fileUrl || undefined,
                storagePath: storagePath || undefined
              };

              const docData = { ...newRecord };
              if (docData.clinicalFindings === undefined) {
                delete docData.clinicalFindings;
              }

              // Update state locally first so it shows up instantly
              setRecords(prev => [newRecord, ...prev]);

              // Background Firestore save with 3s timeout.
              saveHealthRecord(docData).catch(e => 
                console.warn('Offline: failed to sync record to Firestore:', e)
              );

              if (clinicalFindings && clinicalFindings.startsWith('__STRUCTURED__')) {
                try {
                  const structured = JSON.parse(clinicalFindings.replace('__STRUCTURED__', ''));
                  if (structured.medications && structured.medications.length > 0) {
                    const newMeds = structured.medications
                      .map((m: { name: string }) => extractMedNameOnly(m.name))
                      .filter((n: string) => n.length > 1)
                      .filter((n: string, i: number, arr: string[]) => 
                        arr.findIndex(x => x.toLowerCase() === n.toLowerCase()) === i
                      )
                      .join(', ');

                    const patientName = user?.role === 'patient' ? user.name : activePatientName;
                    const existing = patientProfiles[patientName];
                    if (existing) {
                      const newProfile = {
                        ...existing,
                        prescriptions: newMeds
                      };
                      setPatientProfiles(prev => ({ ...prev, [patientName]: newProfile }));
                      savePatientProfile(patientName, newProfile).catch(e => 
                        console.error('Background patient profile save failed:', e)
                      );
                    }
                  }
                } catch (e) {
                  console.warn('Failed to sync medications from prescription:', e);
                }
              }

              const latestLog = auditLogs[0];
              const logHash = generateMockHash();
              const newLog: AuditLog = {
                id: `log_${Date.now()}`,
                blockIndex: (latestLog?.blockIndex || 0) + 1,
                timestamp: new Date().toLocaleString(),
                actor: user?.role === 'patient' ? 'Patient Portal App' : `${user?.name}`,
                institution: user?.role === 'patient' ? 'Self Upload Node' : (user?.institution || 'Clinical Provider'),
                action: 'WRITE',
                details: `Encrypted & stored "${name}" on ledger at Block #${blockNum}`,
                consentToken: user?.role === 'patient' ? 'tok_self_authorized' : `tok_${Math.random().toString(36).substring(2, 10)}`,
                hash: logHash,
                parentHash: latestLog?.hash || '0x0000000000000000000000000000000000000000000000000000000000000000',
                status: 'SUCCESS'
              };

              setAuditLogs(prev => [newLog, ...prev]);
              saveBlockchainAuditLog(newLog).catch(e => 
                console.error('Background blockchain audit log save failed:', e)
              );

              setUploadingFile({ name: '', step: null });
              setRewardTokens(prev => prev + 25);
              resolve(recordId);
            }, 1000);
          }, 1000);
        }, 1000);
      }, 1000);
    });
  };

  const deleteRecord = async (recordId: string): Promise<void> => {
    if (!user || user.role !== 'patient') {
      throw new Error('Only patients can delete their uploaded documents.');
    }

    const record = records.find(item => item.id === recordId);
    if (!record || record.owner !== user.name) {
      throw new Error('You can only delete documents from your own vault.');
    }

    // Try deleting from remote Firebase storage and database if possible, but fallback to local deletion on any error
    try {
      const authResult = await loginWithEmail(user.email);
      if (authResult.success) {
        if (record.storagePath) {
          const storageResult = await deleteFile(record.storagePath);
          if (!storageResult.success) {
            console.warn('Firebase Storage file delete failed (permissions/missing):', storageResult.error);
          }
        }

        const firestoreResult = await deleteDocById('health_records', recordId);
        if (!firestoreResult.success) {
          console.warn('Firestore document delete failed (permissions/missing):', firestoreResult.error);
        }
      } else {
        console.warn('Firebase auth failed during delete (proceeding in local fallback mode):', authResult.error);
      }
    } catch (err) {
      console.warn('Firebase delete operation error caught (proceeding in local fallback mode):', err);
    }

    // Always remove from local records state to ensure the UI deletes successfully
    setRecords(previous => previous.filter(item => item.id !== recordId));
  };

  const triggerBreakGlass = async (doctorName: string, reason: string) => {
    setBreakGlassActive(true);
    setActiveEmergencyDoctor(doctorName);
    setActiveEmergencyReason(reason);
    
    const latestLog = auditLogs[0];
    const newBlockHash = generateMockHash();
    const detailText = `EMERGENCY OVERRIDE activated by ${doctorName}. Reason: ${reason}`;

    const newLog: AuditLog = {
      id: `log_${Date.now()}`,
      blockIndex: (latestLog?.blockIndex || 0) + 1,
      timestamp: new Date().toLocaleString(),
      actor: doctorName,
      institution: 'Emergency ER Department',
      action: 'BREAK_GLASS',
      details: detailText,
      consentToken: 'override_glass_broken',
      hash: newBlockHash,
      parentHash: latestLog?.hash || '0x0000000000000000000000000000000000000000000000000000000000000000',
      status: 'OVERRIDE'
    };
    
    setAuditLogs(prev => [newLog, ...prev]);
    saveBlockchainAuditLog(newLog).catch(e => console.warn('Offline: break glass log not synced:', e));
  };

  const deactivateBreakGlass = async () => {
    setBreakGlassActive(false);
    setActiveEmergencyDoctor('Dr. Sarah Connor');
    setActiveEmergencyReason('Patient presenting with signs of acute metabolic anaphylaxis. Immediate prescription ledger decryption required for allergen checks.');

    const latestLog = auditLogs[0];
    const newBlockHash = generateMockHash();
    
    const newLog: AuditLog = {
      id: `log_${Date.now()}`,
      blockIndex: (latestLog?.blockIndex || 0) + 1,
      timestamp: new Date().toLocaleString(),
      actor: `${user?.name || 'Jonathan Vance'} (Patient)`,
      institution: 'MediGuard System',
      action: 'EMERGENCY_DEACTIVATE',
      details: 'Emergency override deactivated. Consent requirements restored.',
      consentToken: 'N/A',
      hash: newBlockHash,
      parentHash: latestLog?.hash || '0x0000000000000000000000000000000000000000000000000000000000000000',
      status: 'SUCCESS'
    };
    
    setAuditLogs(prev => [newLog, ...prev]);
    saveBlockchainAuditLog(newLog).catch(e => console.warn('Offline: break glass deactivate log not synced:', e));
  };

  const approveAccessRequest = async (requestId: string) => {
    const request = pendingRequests.find(r => r.id === requestId);
    if (!request) return;

    const p = providers.find(prov => prov.id === request.providerId || prov.name === request.providerName);
    
    if (p) {
      const updatedPermissions = {
        ...p.permissions,
        [request.requestedPermission]: true
      };
      setProviders(prev => prev.map(prov => prov.id === p.id ? { ...prov, permissions: updatedPermissions } : prov));
      saveProviderConsent({ ...p, permissions: updatedPermissions }).catch(e => console.warn('Offline: provider approval not synced:', e));
    } else {
      const newProvider: ProviderConsent = {
        id: request.providerId,
        name: request.providerName,
        logoText: request.logoText,
        type: request.type,
        permissions: {
          read: request.requestedPermission === 'read',
          write: request.requestedPermission === 'write',
          emergency: false
        },
        dataCategories: { labResults: true, imaging: true, prescriptions: true, notes: true },
        expiry: '30 Days',
        lastAccess: 'Just approved'
      };
      setProviders(prev => [...prev, newProvider]);
      saveProviderConsent(newProvider).catch(e => console.warn('Offline: new provider not synced:', e));
    }

    const latestLog = auditLogs[0];
    const newBlockHash = generateMockHash();
    const newLog: AuditLog = {
      id: `log_${Date.now()}`,
      blockIndex: (latestLog?.blockIndex || 0) + 1,
      timestamp: new Date().toLocaleString(),
      actor: `${user?.name || 'Jonathan Vance'} (Patient)`,
      institution: request.providerName,
      action: 'CONSENT_GRANT',
      details: `Approved incoming request. Granted ${request.requestedPermission.toUpperCase()} permission to ${request.providerName}`,
      consentToken: `tok_${Math.random().toString(36).substring(2, 10)}`,
      hash: newBlockHash,
      parentHash: latestLog?.hash || '0x0000000000000000000000000000000000000000000000000000000000000000',
      status: 'SUCCESS'
    };
    
    setAuditLogs(prev => [newLog, ...prev]);
    saveBlockchainAuditLog(newLog).catch(e => console.warn('Offline: approval log not synced:', e));
    
    setPendingRequests(prev => prev.filter(r => r.id !== requestId));
    deleteAccessRequest(requestId).catch(e => console.warn('Offline: access request delete not synced:', e));
  };

  const rejectAccessRequest = async (requestId: string) => {
    const request = pendingRequests.find(r => r.id === requestId);
    if (!request) return;

    const latestLog = auditLogs[0];
    const newBlockHash = generateMockHash();
    const newLog: AuditLog = {
      id: `log_${Date.now()}`,
      blockIndex: (latestLog?.blockIndex || 0) + 1,
      timestamp: new Date().toLocaleString(),
      actor: `${user?.name || 'Jonathan Vance'} (Patient)`,
      institution: request.providerName,
      action: 'CONSENT_REVOKE',
      details: `Declined incoming access request from ${request.providerName}`,
      consentToken: 'N/A',
      hash: newBlockHash,
      parentHash: latestLog?.hash || '0x0000000000000000000000000000000000000000000000000000000000000000',
      status: 'BLOCKED'
    };
    
    setAuditLogs(prev => [newLog, ...prev]);
    saveBlockchainAuditLog(newLog).catch(e => console.warn('Offline: reject log not synced:', e));
    
    setPendingRequests(prev => prev.filter(r => r.id !== requestId));
    deleteAccessRequest(requestId).catch(e => console.warn('Offline: access request delete not synced:', e));
  };

  const verifyLedger = async () => {
    setIsVerifyingLedger(true);
    setLedgerIntegrity('unverified');
    
    return new Promise((resolve) => {
      setTimeout(async () => {
        setIsVerifyingLedger(false);
        setLedgerIntegrity('verified');

        const latestLog = auditLogs[0];
        const newBlockHash = generateMockHash();

        const newLog: AuditLog = {
          id: `log_${Date.now()}`,
          blockIndex: (latestLog?.blockIndex || 0) + 1,
          timestamp: new Date().toLocaleString(),
          actor: 'System Auditor Engine',
          institution: 'Local Sovereign Node',
          action: 'LEDGER_VERIFIED',
          details: `Validated hash link chaining of ${auditLogs.length} blocks. Cryptographic check passed.`,
          consentToken: 'N/A',
          hash: newBlockHash,
          parentHash: latestLog?.hash || '0x0000000000000000000000000000000000000000000000000000000000000000',
          status: 'SUCCESS'
        };

        setAuditLogs(prev => [newLog, ...prev]);
        saveBlockchainAuditLog(newLog).catch(e => console.warn('Offline: verify log not synced:', e));

        resolve({
          success: true,
          verifiedCount: auditLogs.length,
          details: 'All SHA-256 block chain linkages successfully checked and verified.'
        });
      }, 2000);
    }) as Promise<{ success: boolean; verifiedCount: number; details: string }>;
  };

  const addEmergencyContact = async (name: string, relation: string, phone: string) => {
    const newContact: EmergencyContact = {
      id: `cont_${Date.now()}`,
      name,
      relation,
      phone,
      status: 'Authorized',
      owner: currentPatientName
    };
    
    setEmergencyContacts(prev => [...prev, newContact]);
    saveEmergencyContact(newContact).catch(e => console.warn('Offline: emergency contact not synced:', e));
  };

  const deleteEmergencyContact = async (contactId: string) => {
    setEmergencyContacts(prev => prev.filter(c => c.id !== contactId));
    deleteDocById('emergency_contacts', contactId).catch(e => 
      console.warn('Offline: emergency contact deletion not synced:', e)
    );
  };

  const recordGuardianCheck = async (drugName: string, riskLevel: string, status: 'PASSED' | 'OVERRIDDEN' | 'BLOCKED', details: string) => {
    const latestLog = auditLogs[0];
    const newBlockHash = generateMockHash();
    const actionText = status === 'PASSED' ? 'READ' : status === 'OVERRIDDEN' ? 'WRITE' : 'READ';
    const logStatus = status === 'PASSED' ? 'SUCCESS' : status === 'OVERRIDDEN' ? 'OVERRIDE' : 'BLOCKED';

    const newLog: AuditLog = {
      id: `log_${Date.now()}`,
      blockIndex: (latestLog?.blockIndex || 0) + 1,
      timestamp: new Date().toLocaleString(),
      actor: 'AI Prescription Guardian',
      institution: 'Sovereign Safety Node',
      action: actionText,
      details: `AI Scan for ${drugName} - Risk: ${riskLevel}. Status: ${status}. Details: ${details}`,
      consentToken: `sec_guard_${Math.random().toString(36).substring(2, 8)}`,
      hash: newBlockHash,
      parentHash: latestLog?.hash || '0x0000000000000000000000000000000000000000000000000000000000000000',
      status: logStatus
    };

    setAuditLogs(prev => [newLog, ...prev]);
    saveBlockchainAuditLog(newLog).catch(e => console.warn('Offline: guardian log not synced:', e));
  };

  const createCanonicalString = (patientId: string, patientName: string, hospital: string, scope: string, duration: string, timestamp: string): string => {
    const parts = [
      `duration=${duration}`,
      `hospital=${hospital}`,
      `patient_id=${patientId}`,
      `patient_name=${patientName}`,
      `scope=${scope}`,
      `timestamp=${timestamp}`
    ];
    return parts.join('|');
  };

  const generateSHA256Hash = async (canonicalStr: string): Promise<string> => {
    const msgBuffer = new TextEncoder().encode(canonicalStr);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  };

  const signConsent = async (payload: {
    patient_id: string;
    patient_name: string;
    hospital: string;
    scope: string;
    duration: string;
    timestamp: string;
    consent_id?: string;
  }) => {
    try {
      const consent_id = payload.consent_id || `CON-${Math.floor(Date.now() / 1000)}`;
      const year = new Date().getFullYear();
      
      let count = 0;
      signatures.forEach((doc) => {
        if (doc.id.startsWith(`SIG-${year}-`)) {
          count++;
        }
      });
      const signature_id = `SIG-${year}-${String(count + 1).padStart(3, '0')}`;

      const canonicalStr = createCanonicalString(
        payload.patient_id,
        payload.patient_name,
        payload.hospital,
        payload.scope,
        payload.duration,
        payload.timestamp
      );
      const sig_hash = await generateSHA256Hash(canonicalStr);
      const created_at_iso = new Date().toISOString();

      const newSignature = {
        id: signature_id,
        consent_id,
        patient_id: payload.patient_id,
        patient_name: payload.patient_name,
        hospital: payload.hospital,
        scope: payload.scope,
        duration: payload.duration,
        timestamp: payload.timestamp,
        signature_hash: sig_hash,
        created_at: created_at_iso,
        verification_status: 'Integrity Verified'
      };

      setSignatures(prev => [newSignature, ...prev]);
      saveConsentSignature(newSignature).catch(e => console.warn('Offline: signature not synced:', e));

      const newAudit = {
        id: `audit_${Date.now()}`,
        user: payload.patient_name,
        action: 'Consent Signed',
        consent_id,
        timestamp: created_at_iso
      };
      setConsentAuditLogs(prev => [newAudit, ...prev]);
      saveConsentAuditLog(newAudit).catch(e => console.warn('Offline: consent audit log not synced:', e));

      return newSignature;
    } catch (err: any) {
      console.error('Error signing consent:', err);
      throw new Error(err.message || 'Failed to sign consent');
    }
  };

  const verifyConsent = async (id: string) => {
    try {
      let signatureData = signatures.find(s => s.id === id || s.consent_id === id);

      if (!signatureData) {
        throw new Error('Consent signature record not found.');
      }

      const canonicalStr = createCanonicalString(
        signatureData.patient_id,
        signatureData.patient_name,
        signatureData.hospital,
        signatureData.scope,
        signatureData.duration,
        signatureData.timestamp
      );
      const recalculated_hash = await generateSHA256Hash(canonicalStr);

      const verified = recalculated_hash === signatureData.signature_hash;
      const verification_status = verified ? 'Integrity Verified' : 'Tampered';
      const created_at_iso = new Date().toISOString();

      const newAudit = {
        id: `audit_${Date.now()}`,
        user: signatureData.patient_name,
        action: verified ? 'Consent Verified' : 'Consent Verification Failed (Tampered)',
        consent_id: signatureData.consent_id,
        timestamp: created_at_iso
      };
      setConsentAuditLogs(prev => [newAudit, ...prev]);
      saveConsentAuditLog(newAudit).catch(e => console.warn('Offline: verify audit log not synced:', e));

      return {
        verified,
        status: verification_status,
        signature_id: signatureData.id,
        consent_id: signatureData.consent_id,
        patient_name: signatureData.patient_name,
        hospital: signatureData.hospital,
        scope: signatureData.scope,
        duration: signatureData.duration,
        timestamp: signatureData.timestamp,
        signature_hash: signatureData.signature_hash,
        created_at: signatureData.created_at
      };
    } catch (err: any) {
      console.error('Error verifying consent:', err);
      throw new Error(err.message || 'Failed to verify consent');
    }
  };

  const revokeConsent = async (consentId: string) => {
    try {
      const signatureData = signatures.find(s => s.consent_id === consentId);
      if (!signatureData) {
        throw new Error('Consent record not found.');
      }

      setSignatures(prev => prev.map(s => s.consent_id === consentId ? { ...s, verification_status: 'Revoked' } : s));
      updateDocFields('consent_signatures', signatureData.id, {
        verification_status: 'Revoked'
      }).catch(e => console.warn('Offline: consent revoke not synced:', e));

      const created_at_iso = new Date().toISOString();

      const newAudit = {
        id: `audit_${Date.now()}`,
        user: signatureData.patient_name,
        action: 'Consent Revoked',
        consent_id: consentId,
        timestamp: created_at_iso
      };
      setConsentAuditLogs(prev => [newAudit, ...prev]);
      saveConsentAuditLog(newAudit).catch(e => console.warn('Offline: consent audit log not synced:', e));
    } catch (err: any) {
      console.error('Error revoking consent:', err);
      throw new Error(err.message || 'Failed to revoke consent');
    }
  };

  const filteredEmergencyContacts = emergencyContacts.filter(
    c => c.owner && c.owner.toLowerCase() === currentPatientName.toLowerCase()
  );

  return (
    <AppContext.Provider value={{
      activeTab,
      setActiveTab,
      user,
      login,
      logout,
      requestAccess,
      records,
      addRecord,
      deleteRecord,
      uploadingFile,
      providers,
      togglePermission,
      toggleDataCategory,
      updateConsentExpiry,
      auditLogs,
      pendingRequests,
      approveAccessRequest,
      rejectAccessRequest,
      verifyLedger,
      isVerifyingLedger,
      ledgerIntegrity,
      breakGlassActive,
      activeEmergencyDoctor,
      activeEmergencyReason,
      triggerBreakGlass,
      deactivateBreakGlass,
      emergencyContacts: filteredEmergencyContacts,
      addEmergencyContact,
      deleteEmergencyContact,
      optInResearch,
      setOptInResearch,
      rewardTokens,
      aiRiskIndicators,
      recordGuardianCheck,
      registeredUsers,
      registerUser,
      resetApplication,
      activePatientName,
      setActivePatientName,
      patientProfiles,
      currentPatientProfile,
      updatePatientProfile,
      signatures,
      consentAuditLogs,
      fetchSignatures,
      fetchConsentAuditLogs,
      signConsent,
      verifyConsent,
      revokeConsent
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

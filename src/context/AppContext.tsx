import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../utils/firebase';
import { collection, getDocs, addDoc, doc, getDoc, updateDoc, query, orderBy, setDoc } from 'firebase/firestore';

// Interfaces for MediGuard AI state
// Interfaces for MediGuard AI state
export interface RecordAccessEvent {
  id: string;
  timestamp: string;
  actor: string;
  institution: string;
  action: 'READ' | 'DECRYPT' | 'VERIFY' | 'WRITE';
  status: 'SUCCESS' | 'BLOCKED';
}

export interface HealthRecord {
  id: string;
  name: string;
  category: 'Medical Records' | 'Prescriptions' | 'Allergies' | 'Laboratory Reports' | 'Insurance Documents';
  date: string;
  institution: string;
  owner: string;
  hash: string;
  encryptionStatus: 'AES-256-GCM Encrypted' | 'Decrypting...' | 'Decrypted';
  securityStatus: 'ZKP Verified' | 'Ledger Locked' | 'Active Encryption';
  classification: 'Genomic' | 'Highly Sensitive' | 'Restricted' | 'General';
  lastAccessed: string;
  accessHistory: RecordAccessEvent[];
  size: string;
  confidenceScore: number; // AI confidence score for classification, e.g. 98.5
  sensitivePIIDetected: boolean;
  blockNumber: number;
  clinicalFindings?: string;
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
  expiry: string; // '24 Hours' | '7 Days' | '30 Days' | 'Indefinite'
  lastAccess: string;
}

export interface AccessRequest {
  id: string;
  providerId: string;
  providerName: string;
  logoText: string;
  type: 'Hospital' | 'Laboratory' | 'Pharmacy' | 'Insurance';
  requestedPermission: 'read' | 'write' | 'emergency';
  timestamp: string;
}

export interface AuditLog {
  id: string;
  blockIndex: number;
  timestamp: string;
  actor: string;
  institution: string;
  action: 'READ' | 'WRITE' | 'CONSENT_GRANT' | 'CONSENT_REVOKE' | 'BREAK_GLASS' | 'LEDGER_VERIFIED' | 'EMERGENCY_DEACTIVATE';
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
  status: 'Authorized' | 'Verification Pending';
}

export interface RegisteredUser {
  name: string;
  email: string;
  role: 'patient' | 'doctor' | 'laboratory';
  institution?: string;
  providerId?: string;
  logoText?: string;
  providerType?: 'Hospital' | 'Laboratory' | 'Pharmacy' | 'Insurance';
}

export interface PatientProfile {
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  allergies: string;
  conditions: string;
  prescriptions: string;
  riskIndicators: {
    cardiovascular: number;
    metabolic: number;
    immunological: number;
    overallIndex: number;
  };
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
  id: number;
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
    mfaEnabled: boolean; 
    role: 'patient' | 'doctor' | 'laboratory';
    institution?: string;
    providerId?: string;
    logoText?: string;
    providerType?: 'Hospital' | 'Laboratory' | 'Pharmacy' | 'Insurance';
  } | null;
  login: (email: string) => void;
  logout: () => void;
  requestAccess: (permission: 'read' | 'write') => void;
  registeredUsers: RegisteredUser[];
  registerUser: (user: RegisteredUser) => void;
  
  // Patient Profiles state
  activePatientName: string;
  setActivePatientName: (name: string) => void;
  patientProfiles: Record<string, PatientProfile>;
  currentPatientProfile: PatientProfile;
  updatePatientProfile: (name: string, updatedFields: Partial<PatientProfile>) => void;

  // Health Records
  records: HealthRecord[];
  addRecord: (name: string, category: HealthRecord['category'], size: string, clinicalFindings?: string) => Promise<string>;
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
const synthesizePatientProfile = (name: string): PatientProfile => {
  const nameHash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const isFemale = nameHash % 2 === 0;
  const mockAge = 25 + (nameHash % 50); // age 25 to 74
  const mockGender: 'Male' | 'Female' = isFemale ? 'Female' : 'Male';
  
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
    riskIndicators: {
      cardiovascular: mockCardio,
      metabolic: mockMetabolic,
      immunological: mockImmuno,
      overallIndex: mockOverall
    }
  };
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState<{ 
    name: string; 
    email: string; 
    mfaEnabled: boolean; 
    role: 'patient' | 'doctor' | 'laboratory';
    institution?: string;
    providerId?: string;
    logoText?: string;
    providerType?: 'Hospital' | 'Laboratory' | 'Pharmacy' | 'Insurance';
  } | null>(null);

  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>([
    {
      name: 'Jonathan Vance',
      email: 'patient@mediguard.ai',
      role: 'patient'
    },
    {
      name: 'Kanish',
      email: 'kanish@gmail.com',
      role: 'patient'
    },
    {
      name: 'Alice Smith',
      email: 'alice@gmail.com',
      role: 'patient'
    },
    {
      name: 'Dr. Sarah Connor, MD',
      email: 'doctor@sutterhealth.org',
      role: 'doctor',
      institution: 'Sutter Health',
      providerId: 'prov_sutter',
      logoText: 'SH',
      providerType: 'Hospital'
    },
    {
      name: 'Quest Lab Technician #49',
      email: 'lab@questdiagnostics.com',
      role: 'laboratory',
      institution: 'Quest Diagnostics',
      providerId: 'prov_2',
      logoText: 'QD',
      providerType: 'Laboratory'
    }
  ]);

  const [patientProfiles, setPatientProfiles] = useState<Record<string, PatientProfile>>({
    'Jonathan Vance': {
      name: 'Jonathan Vance',
      age: 68,
      gender: 'Male',
      allergies: 'Penicillin subclass (Beta-Lactams)',
      conditions: 'Post-Stent Coronary Artery Disease (CAD), Type 2 Diabetes Mellitus (T2DM)',
      prescriptions: 'Atorvastatin (Lipitor) 20mg QD, Metformin (Glucophage) 500mg BID',
      riskIndicators: {
        cardiovascular: 62,
        metabolic: 24,
        immunological: 94,
        overallIndex: 81
      }
    },
    'Kanish': synthesizePatientProfile('Kanish'),
    'Alice Smith': synthesizePatientProfile('Alice Smith')
  });

  const [activePatientName, setActivePatientName] = useState<string>('Jonathan Vance');

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

  const updatePatientProfile = (name: string, updatedFields: Partial<PatientProfile>) => {
    setPatientProfiles(prev => {
      const existing = prev[name] || {
        name,
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
      const newProfile = {
        ...existing,
        ...updatedFields
      };

      // Save to Firestore asynchronously
      setDoc(doc(db, 'patient_profiles', name), newProfile)
        .catch(err => console.error('Error saving patient profile to Firestore:', err));

      return {
        ...prev,
        [name]: newProfile
      };
    });
  };

  const registerUser = (newUser: RegisteredUser) => {
    setRegisteredUsers(prev => [...prev, newUser]);
    
    if (newUser.role === 'patient') {
      const newProfile = synthesizePatientProfile(newUser.name);
      setPatientProfiles(prev => {
        const newProfiles = {
          ...prev,
          [newUser.name]: newProfile
        };
        // Save to Firestore
        setDoc(doc(db, 'patient_profiles', newUser.name), newProfile)
          .catch(err => console.error('Error saving patient profile in registerUser:', err));
        return newProfiles;
      });
    }
  };
  const [uploadingFile, setUploadingFile] = useState<{ name: string; step: 'hashing' | 'encrypting' | 'classifying' | 'ledgering' | 'done' | null }>({ name: '', step: null });
  const [isVerifyingLedger, setIsVerifyingLedger] = useState(false);
  const [ledgerIntegrity, setLedgerIntegrity] = useState<'verified' | 'unverified' | 'tampered'>('verified');
  const [breakGlassActive, setBreakGlassActive] = useState(false);
  const [activeEmergencyDoctor, setActiveEmergencyDoctor] = useState('Dr. Sarah Connor');
  const [activeEmergencyReason, setActiveEmergencyReason] = useState('Patient presenting with signs of acute metabolic anaphylaxis. Immediate prescription ledger decryption required for allergen checks.');
  const [optInResearch, setOptInResearch] = useState(true);
  const [rewardTokens, setRewardTokens] = useState(480);

  // Digital Consent Signatures states
  const [signatures, setSignatures] = useState<ConsentSignature[]>([]);
  const [consentAuditLogs, setConsentAuditLogs] = useState<ConsentAuditLog[]>([]);

  const [pendingRequests, setPendingRequests] = useState<AccessRequest[]>([
    {
      id: 'req_1',
      providerId: 'prov_cedars',
      providerName: 'Cedars-Sinai Medical Center',
      logoText: 'CS',
      type: 'Hospital',
      requestedPermission: 'read',
      timestamp: '10 minutes ago'
    },
    {
      id: 'req_2',
      providerId: 'prov_sutter',
      providerName: 'Sutter Health',
      logoText: 'SH',
      type: 'Hospital',
      requestedPermission: 'write',
      timestamp: '2 hours ago'
    }
  ]);

  // Initial Health Records
  const [records, setRecords] = useState<HealthRecord[]>([]);


  // Initial Consent Status
  const [providers, setProviders] = useState<ProviderConsent[]>([
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
  ]);

  // Initial Audit Logs (Linked blocks)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    // Generate initial audit log chain representing recent history
    const genesisHash = '0x0000000000000000000000000000000000000000000000000000000000000000';
    
    const block1Hash = '0x1b4a3c2d5e6f7b8c9d0a1b2c3d4e5f6a7b8c9d0a1b2c3d4e5f6a7b8c9d0a1b2c';
    const block2Hash = '0x9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c';
    const block3Hash = '0x4e5f6a7b8c9d0a1b2c3d4e5f6a7b8c9d0a1b2c3d4e5f6a7b8c9d0a1b2c3d4e5f';
    const block4Hash = '0xfa8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e';

    const logs: AuditLog[] = [
      {
        id: 'log_1',
        blockIndex: 1,
        timestamp: '2026-06-18 09:12 AM',
        actor: 'Dr. Sarah Connor',
        institution: 'Mayo Clinic',
        action: 'CONSENT_GRANT',
        details: 'Patient granted Read/Write access permissions to Mayo Clinic',
        consentToken: 'tok_5a8f2c1d',
        hash: block1Hash,
        parentHash: genesisHash,
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
        hash: block2Hash,
        parentHash: block1Hash,
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
        hash: block3Hash,
        parentHash: block2Hash,
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
        hash: block4Hash,
        parentHash: block3Hash,
        status: 'SUCCESS'
      }
    ];

    setAuditLogs(logs.reverse()); // Show latest first
  }, []);

  // Fetch initial signatures and logs on mount
  useEffect(() => {
    fetchSignatures();
    fetchConsentAuditLogs();
    fetchHealthRecords();
    fetchBlockchainAuditLogs();
    fetchPatientProfiles();
  }, []);

  const fetchSignatures = async () => {
    try {
      const q = query(collection(db, 'consent_signatures'), orderBy('created_at', 'desc'));
      const querySnapshot = await getDocs(q);
      const data: ConsentSignature[] = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as ConsentSignature);
      });
      setSignatures(data);
    } catch (err) {
      console.error('Error fetching signatures:', err);
    }
  };

  const fetchConsentAuditLogs = async () => {
    try {
      const q = query(collection(db, 'consent_audit_logs'), orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
      const data: ConsentAuditLog[] = [];
      querySnapshot.forEach((docSnap) => {
        const rawData = docSnap.data();
        data.push({
          id: docSnap.id as any, // Cast document ID as id
          user: rawData.user,
          action: rawData.action,
          timestamp: rawData.timestamp,
          consent_id: rawData.consent_id
        } as ConsentAuditLog);
      });
      setConsentAuditLogs(data);
    } catch (err) {
      console.error('Error fetching consent audit logs:', err);
    }
  };

  const fetchHealthRecords = async () => {
    try {
      const q = query(collection(db, 'health_records'), orderBy('date', 'desc'));
      const querySnapshot = await getDocs(q);
      const data: HealthRecord[] = [];
      querySnapshot.forEach((docSnap) => {
        data.push({ id: docSnap.id, ...docSnap.data() } as HealthRecord);
      });
      setRecords(data);
    } catch (err) {
      console.error('Error fetching health records:', err);
    }
  };

  const fetchBlockchainAuditLogs = async () => {
    try {
      const q = query(collection(db, 'blockchain_audit_logs'), orderBy('blockIndex', 'desc'));
      const querySnapshot = await getDocs(q);
      const data: AuditLog[] = [];
      querySnapshot.forEach((docSnap) => {
        data.push({ id: docSnap.id, ...docSnap.data() } as AuditLog);
      });
      if (data.length > 0) {
        setAuditLogs(data);
      }
    } catch (err) {
      console.error('Error fetching blockchain audit logs:', err);
    }
  };

  const fetchPatientProfiles = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'patient_profiles'));
      const data: Record<string, PatientProfile> = {};
      querySnapshot.forEach((docSnap) => {
        data[docSnap.id] = docSnap.data() as PatientProfile;
      });
      if (Object.keys(data).length > 0) {
        setPatientProfiles(prev => ({
          ...prev,
          ...data
        }));
      }
    } catch (err) {
      console.error('Error fetching patient profiles:', err);
    }
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
      
      // Calculate year-based signature count to generate ID: SIG-2026-XXX
      const year = new Date().getFullYear();
      const q = query(collection(db, 'consent_signatures'));
      const querySnapshot = await getDocs(q);
      let count = 0;
      querySnapshot.forEach((doc) => {
        if (doc.id.startsWith(`SIG-${year}-`)) {
          count++;
        }
      });
      const signature_id = `SIG-${year}-${String(count + 1).padStart(3, '0')}`;

      // Calculate SHA-256 hash client-side
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

      // Store in Firebase Firestore
      await setDoc(doc(db, 'consent_signatures', signature_id), newSignature);

      // Create Audit Log entry
      await addDoc(collection(db, 'consent_audit_logs'), {
        user: payload.patient_name,
        action: 'Consent Signed',
        consent_id,
        timestamp: created_at_iso
      });

      await fetchSignatures();
      await fetchConsentAuditLogs();

      return { id: signature_id, ...newSignature };
    } catch (err: any) {
      console.error('Error signing consent:', err);
      throw new Error(err.message || 'Failed to sign consent');
    }
  };

  const verifyConsent = async (id: string) => {
    try {
      // Find signature by document ID first, then fallback to searching by consent_id
      let signatureDoc = await getDoc(doc(db, 'consent_signatures', id));
      let signatureData = signatureDoc.exists() ? signatureDoc.data() : null;
      let signatureId = id;

      if (!signatureData) {
        // Fallback search by consent_id
        const q = query(collection(db, 'consent_signatures'));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((docSnap) => {
          if (docSnap.data().consent_id === id) {
            signatureData = docSnap.data();
            signatureId = docSnap.id;
          }
        });
      }

      if (!signatureData) {
        throw new Error('Consent signature record not found.');
      }

      // Re-calculate hash
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

      // Log verification audit event
      await addDoc(collection(db, 'consent_audit_logs'), {
        user: signatureData.patient_name,
        action: verified ? 'Consent Verified' : 'Consent Verification Failed (Tampered)',
        consent_id: signatureData.consent_id,
        timestamp: created_at_iso
      });

      await fetchConsentAuditLogs();

      return {
        verified,
        status: verification_status,
        signature_id: signatureId,
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
      // Find document ID by consent_id
      const q = query(collection(db, 'consent_signatures'));
      const querySnapshot = await getDocs(q);
      let signatureId = null;
      let signatureData: any = null;
      
      querySnapshot.forEach((docSnap) => {
        if (docSnap.data().consent_id === consentId) {
          signatureId = docSnap.id;
          signatureData = docSnap.data();
        }
      });

      if (!signatureId || !signatureData) {
        throw new Error('Consent record not found.');
      }

      // Update status in Firestore
      await updateDoc(doc(db, 'consent_signatures', signatureId), {
        verification_status: 'Revoked'
      });

      const created_at_iso = new Date().toISOString();

      // Create Revoke Audit Log
      await addDoc(collection(db, 'consent_audit_logs'), {
        user: signatureData.patient_name,
        action: 'Consent Revoked',
        consent_id: consentId,
        timestamp: created_at_iso
      });

      await fetchSignatures();
      await fetchConsentAuditLogs();
    } catch (err: any) {
      console.error('Error revoking consent:', err);
      throw new Error(err.message || 'Failed to revoke consent');
    }
  };

  // Emergency Contacts
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([
    {
      id: 'cont_1',
      name: 'Eleanor Vance',
      relation: 'Spouse / Primary Proxy',
      phone: '+1 (555) 832-1920',
      status: 'Authorized'
    },
    {
      id: 'cont_2',
      name: 'Dr. Marcus Vance',
      relation: 'Brother / Secondary Proxy',
      phone: '+1 (555) 293-8472',
      status: 'Authorized'
    }
  ]);

  // AI Risk Index Scores (calculated synthetically)
  const aiRiskIndicators = {
    cardiovascular: 18,  // low risk (18/100)
    metabolic: 42,       // moderate risk (42/100)
    immunological: 25,   // low risk (25/100)
    overallIndex: 82     // high health index score (82/100, where higher is better/healthier)
  };

  // Logins Simulation
  const login = (email: string) => {
    const emailLower = email.toLowerCase();
    
    const foundUser = registeredUsers.find(u => u.email.toLowerCase() === emailLower);
    if (foundUser) {
      setUser({
        name: foundUser.name,
        email: foundUser.email,
        mfaEnabled: true,
        role: foundUser.role,
        institution: foundUser.institution,
        providerId: foundUser.providerId,
        logoText: foundUser.logoText,
        providerType: foundUser.providerType
      });
      setActiveTab('dashboard');
      return;
    }

    let name = 'Jonathan Vance';
    let role: 'patient' | 'doctor' | 'laboratory' = 'patient';
    let institution = '';
    let providerId = '';
    let logoText = '';
    let providerType: 'Hospital' | 'Laboratory' | 'Pharmacy' | 'Insurance' | undefined = undefined;

    if (emailLower.includes('doctor') || emailLower.includes('md') || emailLower.includes('physician') || emailLower.includes('sutter') || emailLower.includes('mayo') || emailLower.includes('cedars') || emailLower.includes('pharmacy') || emailLower.includes('cvs') || emailLower.includes('insurance') || emailLower.includes('anthem')) {
      if (emailLower.includes('lab') || emailLower.includes('quest') || emailLower.includes('diagnostics')) {
        // Fall through to laboratory below
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
          // Default to Sutter Health
          name = 'Dr. Sarah Connor, MD (Sutter Health)';
          institution = 'Sutter Health';
          providerId = 'prov_sutter';
          logoText = 'SH';
          providerType = 'Hospital';
        }
      }
    }
    
    // Explicit check for laboratory
    if (role === 'patient' && (emailLower.includes('lab') || emailLower.includes('quest') || emailLower.includes('diagnostics'))) {
      role = 'laboratory';
      name = 'Quest Lab Technician #49';
      institution = 'Quest Diagnostics';
      providerId = 'prov_2';
      logoText = 'QD';
      providerType = 'Laboratory';
    }

    if (role === 'patient') {
      name = deriveNameFromEmail(email);
      // Auto-register the patient profile so it is in patientProfiles
      const newProfile = synthesizePatientProfile(name);
      setPatientProfiles(prev => {
        if (!prev[name]) {
          return { ...prev, [name]: newProfile };
        }
        return prev;
      });
      // Also register them in registeredUsers so they are recognized next time
      const newUserRecord: RegisteredUser = {
        name,
        email,
        role: 'patient'
      };
      setRegisteredUsers(prev => {
        if (!prev.some(u => u.email.toLowerCase() === emailLower)) {
          return [...prev, newUserRecord];
        }
        return prev;
      });
    }

    setUser({
      name,
      email: email,
      mfaEnabled: true,
      role,
      ...(role !== 'patient' ? { institution, providerId, logoText, providerType } : {})
    });
    setActiveTab('dashboard');
  };

  const logout = () => {
    setUser(null);
    setActiveTab('dashboard');
  };

  const requestAccess = (permission: 'read' | 'write') => {
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
      timestamp: 'Just now'
    };

    setPendingRequests(prev => [...prev, newRequest]);

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
  };

  // Toggle Permissions
  const togglePermission = (providerId: string, permission: 'read' | 'write' | 'emergency') => {
    setProviders(prev => prev.map(p => {
      if (p.id === providerId) {
        const updatedPermissions = {
          ...p.permissions,
          [permission]: !p.permissions[permission]
        };

        // Write a block audit log
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

        setAuditLogs(prevLogs => [newLog, ...prevLogs]);

        return {
          ...p,
          permissions: updatedPermissions
        };
      }
      return p;
    }));
  };

  // Toggle Data Category Permissions
  const toggleDataCategory = (providerId: string, category: keyof ProviderConsent['dataCategories']) => {
    setProviders(prev => prev.map(p => {
      if (p.id === providerId) {
        const updatedCategories = {
          ...p.dataCategories,
          [category]: !p.dataCategories[category]
        };

        // Add audit log
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

        setAuditLogs(prevLogs => [newLog, ...prevLogs]);

        return {
          ...p,
          dataCategories: updatedCategories
        };
      }
      return p;
    }));
  };

  // Update Expiry Limit
  const updateConsentExpiry = (providerId: string, expiry: string) => {
    setProviders(prev => prev.map(p => {
      if (p.id === providerId) {
        // Add audit log
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

        setAuditLogs(prevLogs => [newLog, ...prevLogs]);

        return {
          ...p,
          expiry: expiry
        };
      }
      return p;
    }));
  };

  const addRecord = async (name: string, category: HealthRecord['category'], size: string, clinicalFindings?: string): Promise<string> => {
    return new Promise<string>((resolve) => {
      // 1. Initial State: hashing
      setUploadingFile({ name, step: 'hashing' });
      
      setTimeout(() => {
        // 2. Encrypting step
        setUploadingFile({ name, step: 'encrypting' });
        
        setTimeout(() => {
          // 3. AI classification step
          setUploadingFile({ name, step: 'classifying' });
          
          setTimeout(() => {
            // 4. Ledger verification block writing step
            setUploadingFile({ name, step: 'ledgering' });
            
            setTimeout(() => {
              // 5. Finalize state and append to records
              const recordId = `rec_${Date.now()}`;
              const recordHash = generateMockHash();
              const blockNum = Math.floor(Math.random() * 500) + 1050;
              
              const uploaderInstitution = user?.role === 'patient' ? 'Self Uploaded (Secure Node)' : (user?.institution || 'Clinical Portal');
              
              const newRecord: HealthRecord = {
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
                clinicalFindings: clinicalFindings
              };

              // Sanitize undefined fields for Firestore (e.g. clinicalFindings)
              const docData = { ...newRecord };
              if (docData.clinicalFindings === undefined) {
                delete docData.clinicalFindings;
              }

              // Store health record in Firestore asynchronously
              setDoc(doc(db, 'health_records', recordId), docData)
                .catch(err => console.error('Error saving health record to Firestore:', err));

              setRecords(prev => [newRecord, ...prev]);

              // AUTO-SYNC: If uploaded file has structured medication data, REPLACE patient's active medications
              if (clinicalFindings && clinicalFindings.startsWith('__STRUCTURED__')) {
                try {
                  const structured = JSON.parse(clinicalFindings.replace('__STRUCTURED__', ''));
                  if (structured.medications && structured.medications.length > 0) {
                    // Build a readable medication list from the structured data
                    const newMeds = structured.medications
                      .map((m: { name: string; dose: string; frequency: string }) => {
                        const parts = [m.name];
                        if (m.dose) parts.push(m.dose);
                        if (m.frequency) parts.push(m.frequency);
                        return parts.join(' ');
                      })
                      .join(', ');

                    const patientName = user?.role === 'patient' ? user.name : activePatientName;

                    // REPLACE: real prescription always overwrites synthetic mock data
                    setPatientProfiles(prev => {
                      const existing = prev[patientName];
                      if (!existing) return prev;
                      const newProfile = {
                        ...existing,
                        prescriptions: newMeds
                      };
                      
                      // Save updated profile to Firestore
                      setDoc(doc(db, 'patient_profiles', patientName), newProfile)
                        .catch(err => console.error('Error saving synced patient profile to Firestore:', err));

                      return {
                        ...prev,
                        [patientName]: newProfile
                      };
                    });
                  }
                } catch (e) {
                  // Structured parse failed — skip medication sync
                  console.warn('Failed to sync medications from prescription:', e);
                }
              }

              // Write to ledger
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

              // Store log in Firestore asynchronously
              setDoc(doc(db, 'blockchain_audit_logs', newLog.id), newLog)
                .catch(err => console.error('Error saving blockchain audit log to Firestore:', err));

              setAuditLogs(prev => [newLog, ...prev]);
              setUploadingFile({ name: '', step: null });
              
              // Add reward tokens
              setRewardTokens(prev => prev + 25);
              resolve(recordId);
            }, 1000);
          }, 1000);
        }, 1000);
      }, 1000);
    });
  };

  // Break-Glass simulation
  const triggerBreakGlass = (doctorName: string, reason: string) => {
    setBreakGlassActive(true);
    setActiveEmergencyDoctor(doctorName);
    setActiveEmergencyReason(reason);
    
    // Add audit log
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

    // Store in Firestore asynchronously
    setDoc(doc(db, 'blockchain_audit_logs', newLog.id), newLog)
      .catch(err => console.error('Error saving break-glass log to Firestore:', err));

    setAuditLogs(prev => [newLog, ...prev]);
  };

  const deactivateBreakGlass = () => {
    setBreakGlassActive(false);
    setActiveEmergencyDoctor('Dr. Sarah Connor');
    setActiveEmergencyReason('Patient presenting with signs of acute metabolic anaphylaxis. Immediate prescription ledger decryption required for allergen checks.');

    // Add audit log
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

    // Store in Firestore asynchronously
    setDoc(doc(db, 'blockchain_audit_logs', newLog.id), newLog)
      .catch(err => console.error('Error saving deactivate break-glass log to Firestore:', err));

    setAuditLogs(prev => [newLog, ...prev]);
  };

  const approveAccessRequest = (requestId: string) => {
    const request = pendingRequests.find(r => r.id === requestId);
    if (!request) return;

    // Check if provider already exists in providers list
    const providerExists = providers.some(p => p.id === request.providerId || p.name === request.providerName);
    
    if (providerExists) {
      // Toggle permission
      setProviders(prev => prev.map(p => {
        if (p.id === request.providerId || p.name === request.providerName) {
          return {
            ...p,
            permissions: {
              ...p.permissions,
              [request.requestedPermission]: true
            }
          };
        }
        return p;
      }));
    } else {
      // Add new provider
      const newProvider: ProviderConsent = {
        id: request.providerId,
        name: request.providerName,
        logoText: request.logoText,
        type: request.type,
        permissions: {
          read: request.requestedPermission === 'read',
          write: request.requestedPermission === 'write',
          emergency: request.requestedPermission === 'emergency'
        },
        dataCategories: {
          labResults: true,
          imaging: true,
          prescriptions: true,
          notes: true
        },
        expiry: '30 Days',
        lastAccess: 'Just approved'
      };
      setProviders(prev => [...prev, newProvider]);
    }

    // Write to audit ledger
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

    // Remove from pending
    setPendingRequests(prev => prev.filter(r => r.id !== requestId));
  };

  const rejectAccessRequest = (requestId: string) => {
    const request = pendingRequests.find(r => r.id === requestId);
    if (!request) return;

    // Write to audit ledger as BLOCKED
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

    // Remove from pending
    setPendingRequests(prev => prev.filter(r => r.id !== requestId));
  };

  // Verification simulation of the ledger block chaining
  const verifyLedger = async () => {
    setIsVerifyingLedger(true);
    setLedgerIntegrity('unverified');
    
    return new Promise<{ success: boolean; verifiedCount: number; details: string }>((resolve) => {
      setTimeout(() => {
        setIsVerifyingLedger(false);
        setLedgerIntegrity('verified');

        // Add verification entry to logs
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

        resolve({
          success: true,
          verifiedCount: auditLogs.length,
          details: 'All SHA-256 block chain linkages successfully checked and verified.'
        });
      }, 2000);
    });
  };

  // Add Emergency Contact
  const addEmergencyContact = (name: string, relation: string, phone: string) => {
    const newContact: EmergencyContact = {
      id: `cont_${Date.now()}`,
      name,
      relation,
      phone,
      status: 'Authorized'
    };
    setEmergencyContacts(prev => [...prev, newContact]);
  };

  const recordGuardianCheck = (drugName: string, riskLevel: string, status: 'PASSED' | 'OVERRIDDEN' | 'BLOCKED', details: string) => {
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
  };

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
      uploadingFile,
      providers,
      togglePermission,
      toggleDataCategory,
      updateConsentExpiry,
      pendingRequests,
      approveAccessRequest,
      rejectAccessRequest,
      auditLogs,
      verifyLedger,
      isVerifyingLedger,
      ledgerIntegrity,
      breakGlassActive,
      activeEmergencyDoctor,
      activeEmergencyReason,
      triggerBreakGlass,
      deactivateBreakGlass,
      emergencyContacts,
      addEmergencyContact,
      optInResearch,
      setOptInResearch,
      rewardTokens,
      aiRiskIndicators,
      recordGuardianCheck,
      registeredUsers,
      registerUser,
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

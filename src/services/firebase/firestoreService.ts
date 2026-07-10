import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  onSnapshot, 
  orderBy
} from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import type { ServiceResponse } from './authService';
import type { 
  HealthRecord, 
  ProviderConsent, 
  AccessRequest, 
  AuditLog, 
  EmergencyContact, 
  RegisteredUser, 
  PatientProfile, 
  ConsentSignature, 
  ConsentAuditLog,
  MedicalDocument
} from '../../context/AppContext';

// Generic CRUD helper operations

/**
 * Creates or overwrites a document with a specific ID.
 */
export const createDocWithId = async <T extends object>(
  colName: string, 
  docId: string, 
  data: T
): Promise<ServiceResponse<T & { id: string }>> => {
  try {
    if (!colName || !docId) {
      return { success: false, error: 'Collection name and document ID are required.' };
    }
    const docRef = doc(db, colName, docId);
    const enrichedData = {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await setDoc(docRef, enrichedData);
    return { success: true, data: { id: docId, ...data } };
  } catch (err: any) {
    console.error(`Firestore error in createDocWithId (${colName}/${docId}):`, err);
    return { success: false, error: err.message || 'Failed to write document.' };
  }
};

/**
 * Creates a new document with an auto-generated ID.
 */
export const createDocAutoId = async <T extends object>(
  colName: string, 
  data: T
): Promise<ServiceResponse<T & { id: string }>> => {
  try {
    if (!colName) {
      return { success: false, error: 'Collection name is required.' };
    }
    const colRef = collection(db, colName);
    const enrichedData = {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const docRef = await addDoc(colRef, enrichedData);
    return { success: true, data: { id: docRef.id, ...data } };
  } catch (err: any) {
    console.error(`Firestore error in createDocAutoId (${colName}):`, err);
    return { success: false, error: err.message || 'Failed to create document.' };
  }
};

/**
 * Reads a single document by ID.
 */
export const readDoc = async <T>(
  colName: string, 
  docId: string
): Promise<ServiceResponse<T | null>> => {
  try {
    if (!colName || !docId) {
      return { success: false, error: 'Collection name and document ID are required.' };
    }
    const docRef = doc(db, colName, docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { success: true, data: docSnap.data() as T };
    }
    return { success: true, data: null };
  } catch (err: any) {
    console.error(`Firestore error in readDoc (${colName}/${docId}):`, err);
    return { success: false, error: err.message || 'Failed to read document.' };
  }
};

/**
 * Updates an existing document (partial update).
 */
export const updateDocFields = async <T extends object>(
  colName: string, 
  docId: string, 
  updatedData: Partial<T>
): Promise<ServiceResponse<void>> => {
  try {
    if (!colName || !docId) {
      return { success: false, error: 'Collection name and document ID are required.' };
    }
    const docRef = doc(db, colName, docId);
    const enrichedData = {
      ...updatedData,
      updatedAt: new Date().toISOString()
    };
    await updateDoc(docRef, enrichedData);
    return { success: true };
  } catch (err: any) {
    console.error(`Firestore error in updateDocFields (${colName}/${docId}):`, err);
    return { success: false, error: err.message || 'Failed to update document.' };
  }
};

/**
 * Deletes a document by ID.
 */
export const deleteDocById = async (
  colName: string, 
  docId: string
): Promise<ServiceResponse<void>> => {
  try {
    if (!colName || !docId) {
      return { success: false, error: 'Collection name and document ID are required.' };
    }
    const docRef = doc(db, colName, docId);
    await deleteDoc(docRef);
    return { success: true };
  } catch (err: any) {
    console.error(`Firestore error in deleteDocById (${colName}/${docId}):`, err);
    return { success: false, error: err.message || 'Failed to delete document.' };
  }
};

/**
 * Subscribes to collection updates in real-time.
 */
export const subscribeToCollection = <T extends { id: string | number }>(
  colName: string,
  orderByField: string,
  orderDir: 'asc' | 'desc',
  callback: (items: T[]) => void
): Unsubscribe => {
  const colRef = collection(db, colName);
  const q = query(colRef, orderBy(orderByField, orderDir));
  
  return onSnapshot(q, (snapshot) => {
    const items: T[] = [];
    snapshot.forEach((docSnap) => {
      items.push({ id: docSnap.id, ...docSnap.data() } as T);
    });
    callback(items);
  }, (err) => {
    console.error(`Firestore subscription error on collection ${colName}:`, err);
  });
};

// Collection-specific CRUD operations

// 1. Registered Users
export const saveUser = async (user: RegisteredUser): Promise<ServiceResponse<void>> => {
  if (!user.email) return { success: false, error: 'User email is required.' };
  const docId = user.email.toLowerCase();
  const res = await createDocWithId('users', docId, user);
  return { success: res.success, error: res.error };
};

export const subscribeToUsers = (callback: (users: RegisteredUser[]) => void): Unsubscribe => {
  return subscribeToCollection<RegisteredUser & { id: string }>(
    'users', 
    'createdAt', 
    'asc', 
    (items) => callback(items.map(({ id, ...rest }) => rest as RegisteredUser))
  );
};

// 2. Patient Profiles
export const savePatientProfile = async (name: string, profile: PatientProfile): Promise<ServiceResponse<void>> => {
  if (!name) return { success: false, error: 'Patient name is required.' };
  const res = await createDocWithId('patient_profiles', name, profile);
  return { success: res.success, error: res.error };
};

export const subscribeToPatientProfiles = (callback: (profiles: Record<string, PatientProfile>) => void): Unsubscribe => {
  const colRef = collection(db, 'patient_profiles');
  return onSnapshot(colRef, (snapshot) => {
    const profiles: Record<string, PatientProfile> = {};
    snapshot.forEach((docSnap) => {
      profiles[docSnap.id] = docSnap.data() as PatientProfile;
    });
    callback(profiles);
  }, (err) => {
    console.error('Firestore subscription error on patient_profiles:', err);
  });
};

// 3. Health Records
export const saveHealthRecord = async (record: HealthRecord): Promise<ServiceResponse<void>> => {
  if (!record.id) return { success: false, error: 'Record ID is required.' };
  const res = await createDocWithId('health_records', record.id, record);
  return { success: res.success, error: res.error };
};

export const subscribeToHealthRecords = (callback: (records: HealthRecord[]) => void): Unsubscribe => {
  return subscribeToCollection<HealthRecord>('health_records', 'date', 'desc', callback);
};

// 4. Consent Signatures
export const saveConsentSignature = async (sig: ConsentSignature & { id: string }): Promise<ServiceResponse<void>> => {
  if (!sig.id) return { success: false, error: 'Signature ID is required.' };
  const { id, ...data } = sig;
  const res = await createDocWithId('consent_signatures', id, data);
  return { success: res.success, error: res.error };
};

export const subscribeToConsentSignatures = (callback: (sigs: ConsentSignature[]) => void): Unsubscribe => {
  return subscribeToCollection<ConsentSignature>('consent_signatures', 'created_at', 'desc', callback);
};

// 5. Consent Audit Logs
export const saveConsentAuditLog = async (log: Omit<ConsentAuditLog, 'id'>): Promise<ServiceResponse<void>> => {
  const res = await createDocAutoId('consent_audit_logs', log);
  return { success: res.success, error: res.error };
};

export const subscribeToConsentAuditLogs = (callback: (logs: ConsentAuditLog[]) => void): Unsubscribe => {
  return subscribeToCollection<ConsentAuditLog>('consent_audit_logs', 'timestamp', 'desc', callback);
};

// 6. Provider Consents
export const saveProviderConsent = async (provider: ProviderConsent): Promise<ServiceResponse<void>> => {
  if (!provider.id) return { success: false, error: 'Provider ID is required.' };
  const res = await createDocWithId('provider_consents', provider.id, provider);
  return { success: res.success, error: res.error };
};

export const subscribeToProviderConsents = (callback: (providers: ProviderConsent[]) => void): Unsubscribe => {
  const colRef = collection(db, 'provider_consents');
  return onSnapshot(colRef, (snapshot) => {
    const list: ProviderConsent[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as ProviderConsent);
    });
    callback(list);
  }, (err) => {
    console.error('Firestore subscription error on provider_consents:', err);
  });
};

// 7. Access Requests
export const saveAccessRequest = async (request: AccessRequest): Promise<ServiceResponse<void>> => {
  if (!request.id) return { success: false, error: 'Request ID is required.' };
  const res = await createDocWithId('pending_requests', request.id, request);
  return { success: res.success, error: res.error };
};

export const deleteAccessRequest = async (id: string): Promise<ServiceResponse<void>> => {
  return deleteDocById('pending_requests', id);
};

export const subscribeToAccessRequests = (callback: (requests: AccessRequest[]) => void): Unsubscribe => {
  const colRef = collection(db, 'pending_requests');
  return onSnapshot(colRef, (snapshot) => {
    const list: AccessRequest[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as AccessRequest);
    });
    callback(list);
  }, (err) => {
    console.error('Firestore subscription error on pending_requests:', err);
  });
};

// 8. Emergency Contacts
export const saveEmergencyContact = async (contact: EmergencyContact): Promise<ServiceResponse<void>> => {
  if (!contact.id) return { success: false, error: 'Contact ID is required.' };
  const res = await createDocWithId('emergency_contacts', contact.id, contact);
  return { success: res.success, error: res.error };
};

export const subscribeToEmergencyContacts = (callback: (contacts: EmergencyContact[]) => void): Unsubscribe => {
  const colRef = collection(db, 'emergency_contacts');
  return onSnapshot(colRef, (snapshot) => {
    const list: EmergencyContact[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as EmergencyContact);
    });
    callback(list);
  }, (err) => {
    console.error('Firestore subscription error on emergency_contacts:', err);
  });
};

// 9. Blockchain Audit Logs
export const saveBlockchainAuditLog = async (log: AuditLog): Promise<ServiceResponse<void>> => {
  if (!log.id) return { success: false, error: 'Log ID is required.' };
  const res = await createDocWithId('blockchain_audit_logs', log.id, log);
  return { success: res.success, error: res.error };
};

export const subscribeToBlockchainAuditLogs = (callback: (logs: AuditLog[]) => void): Unsubscribe => {
  return subscribeToCollection<AuditLog>('blockchain_audit_logs', 'blockIndex', 'desc', callback);
};

export const saveMedicalDocument = async (docData: MedicalDocument): Promise<ServiceResponse<void>> => {
  if (!docData.id) return { success: false, error: 'Document ID is required.' };
  const res = await createDocWithId('medical_documents', docData.id, docData);
  return { success: res.success, error: res.error };
};

export const subscribeToMedicalDocuments = (callback: (docs: MedicalDocument[]) => void): Unsubscribe => {
  return subscribeToCollection<MedicalDocument>('medical_documents', 'id', 'desc', callback);
};

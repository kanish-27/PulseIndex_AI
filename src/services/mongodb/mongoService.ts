/**
 * mongoService.ts
 * 
 * Thin client that calls the backend MongoDB REST API at /api/mongo/*.
 * Replaces all Firebase Firestore and Supabase writes/reads in the app.
 * 
 * API Base: http://localhost:3001/api/mongo
 * Routes:
 *   GET    /api/mongo/:collection          → list all docs
 *   GET    /api/mongo/:collection/:id      → find one by id
 *   POST   /api/mongo/:collection          → upsert (create or update)
 *   DELETE /api/mongo/:collection/:id      → delete by id
 */

const API_BASE = 'http://localhost:3001/api/mongo';

export interface ServiceResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

// ─── Generic helpers ──────────────────────────────────────────────────────────

const apiGet = async <T>(path: string): Promise<T | null> => {
  try {
    const res = await fetch(`${API_BASE}${path}`);
    if (!res.ok) return null;
    return await res.json() as T;
  } catch {
    return null;
  }
};

const apiPost = async (collection: string, data: object): Promise<ServiceResponse> => {
  try {
    const res = await fetch(`${API_BASE}/${collection}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) return { success: false, error: json.error || 'Unknown error' };
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
};

const apiDelete = async (collection: string, id: string): Promise<ServiceResponse> => {
  try {
    const res = await fetch(`${API_BASE}/${collection}/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    const json = await res.json();
    if (!res.ok) return { success: false, error: json.error || 'Unknown error' };
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
};

const apiList = async <T>(collection: string): Promise<T[]> => {
  const data = await apiGet<T[]>(`/${collection}`);
  return data || [];
};

// ─── Users ───────────────────────────────────────────────────────────────────

export const mongoSaveUser = (user: object): Promise<ServiceResponse> =>
  apiPost('users', user);

export const mongoGetUsers = <T>(): Promise<T[]> =>
  apiList<T>('users');

// ─── Patient Profiles ─────────────────────────────────────────────────────────

export const mongoSavePatientProfile = (name: string, profile: object): Promise<ServiceResponse> =>
  apiPost('patient_profiles', { ...profile, patient_name: name });

export const mongoGetPatientProfiles = <T>(): Promise<T[]> =>
  apiList<T>('patient_profiles');

// ─── Health Records ───────────────────────────────────────────────────────────

export const mongoSaveHealthRecord = (record: object): Promise<ServiceResponse> =>
  apiPost('health_records', record);

export const mongoDeleteHealthRecord = (id: string): Promise<ServiceResponse> =>
  apiDelete('health_records', id);

export const mongoGetHealthRecords = <T>(): Promise<T[]> =>
  apiList<T>('health_records');

// ─── Medical Documents ────────────────────────────────────────────────────────

export const mongoSaveMedicalDocument = (doc: object): Promise<ServiceResponse> =>
  apiPost('medical_documents', doc);

export const mongoDeleteMedicalDocument = (id: string): Promise<ServiceResponse> =>
  apiDelete('medical_documents', id);

export const mongoGetMedicalDocuments = <T>(): Promise<T[]> =>
  apiList<T>('medical_documents');

// ─── Provider Consents ────────────────────────────────────────────────────────

export const mongoSaveProviderConsent = (provider: object): Promise<ServiceResponse> =>
  apiPost('provider_consents', provider);

export const mongoGetProviderConsents = <T>(): Promise<T[]> =>
  apiList<T>('provider_consents');

export const mongoDeleteProviderConsent = (id: string): Promise<ServiceResponse> =>
  apiDelete('provider_consents', id);

// ─── Pending Requests (Access Requests) ──────────────────────────────────────

export const mongoSaveAccessRequest = (request: object): Promise<ServiceResponse> =>
  apiPost('pending_requests', request);

export const mongoDeleteAccessRequest = (id: string): Promise<ServiceResponse> =>
  apiDelete('pending_requests', id);

export const mongoGetAccessRequests = <T>(): Promise<T[]> =>
  apiList<T>('pending_requests');

// ─── Blockchain Audit Logs ────────────────────────────────────────────────────

export const mongoSaveBlockchainAuditLog = (log: object): Promise<ServiceResponse> =>
  apiPost('blockchain_audit_logs', log);

export const mongoGetBlockchainAuditLogs = <T>(): Promise<T[]> =>
  apiList<T>('blockchain_audit_logs');

// ─── Consent Signatures ───────────────────────────────────────────────────────

export const mongoSaveConsentSignature = (sig: object): Promise<ServiceResponse> =>
  apiPost('consent_signatures', sig);

export const mongoGetConsentSignatures = <T>(): Promise<T[]> =>
  apiList<T>('consent_signatures');

// ─── Consent Audit Logs ───────────────────────────────────────────────────────

export const mongoSaveConsentAuditLog = (log: object): Promise<ServiceResponse> =>
  apiPost('consent_audit_logs', log);

export const mongoGetConsentAuditLogs = <T>(): Promise<T[]> =>
  apiList<T>('consent_audit_logs');

// ─── Emergency Contacts ───────────────────────────────────────────────────────

export const mongoSaveEmergencyContact = (contact: object): Promise<ServiceResponse> =>
  apiPost('emergency_contacts', contact);

export const mongoDeleteEmergencyContact = (id: string): Promise<ServiceResponse> =>
  apiDelete('emergency_contacts', id);

export const mongoGetEmergencyContacts = <T>(): Promise<T[]> =>
  apiList<T>('emergency_contacts');

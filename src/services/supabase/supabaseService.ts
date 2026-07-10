import { supabase } from './supabaseClient';
import type { RegisteredUser, PatientProfile, HealthRecord, MedicalDocument, ProviderConsent, AccessRequest, AuditLog, ConsentSignature, ConsentAuditLog, EmergencyContact } from '../../context/AppContext';

// Check if Supabase client is active
const isSupabaseConfigured = (): boolean => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return !!url && !!anonKey && anonKey !== 'YOUR_SUPABASE_ANON_KEY';
};

// Key mappings for all objects
const toSnakeCase = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(toSnakeCase);
  if (typeof obj !== 'object') return obj;

  const result: any = {};
  for (const key of Object.keys(obj)) {
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    result[snakeKey] = toSnakeCase(obj[key]);
  }
  return result;
};

const toCamelCase = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(toCamelCase);
  if (typeof obj !== 'object') return obj;

  const result: any = {};
  for (const key of Object.keys(obj)) {
    const camelKey = key.replace(/(_\w)/g, (m) => m[1].toUpperCase());
    result[camelKey] = toCamelCase(obj[key]);
  }
  return result;
};

// Generic DB CRUD operations
export const saveSupabaseRow = async (table: string, data: any): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured()) return { success: false, error: 'Supabase not configured' };
  try {
    const dbData = toSnakeCase(data);
    const { error } = await supabase.from(table).upsert(dbData);
    if (error) {
      console.warn(`Supabase error saving row to ${table}:`, error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
};

export const deleteSupabaseRow = async (table: string, idField: string, idValue: string): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured()) return { success: false, error: 'Supabase not configured' };
  try {
    const { error } = await supabase.from(table).delete().eq(idField, idValue);
    if (error) {
      console.warn(`Supabase error deleting row from ${table}:`, error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
};

// Subscriptions
export const subscribeToSupabaseTable = (table: string, callback: (data: any[]) => void): (() => void) => {
  if (!isSupabaseConfigured()) {
    return () => {};
  }

  // Initial fetch
  supabase.from(table).select('*').then(({ data, error }) => {
    if (!error && data) {
      callback(data.map(toCamelCase));
    }
  });

  // Setup Postgres changes listener
  const channel = supabase
    .channel(`${table}_changes`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
      supabase.from(table).select('*').then(({ data, error }) => {
        if (!error && data) {
          callback(data.map(toCamelCase));
        }
      });
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

// Table-specific read single row helpers
export const getSupabaseUser = async (email: string): Promise<{ success: boolean; data?: RegisteredUser; error?: string }> => {
  if (!isSupabaseConfigured()) return { success: false, error: 'Supabase not configured' };
  try {
    const { data, error } = await supabase.from('users').select('*').eq('email', email.toLowerCase()).maybeSingle();
    if (error) return { success: false, error: error.message };
    return { success: true, data: data ? toCamelCase(data) : undefined };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
};

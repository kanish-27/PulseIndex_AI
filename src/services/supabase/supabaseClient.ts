import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey || supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY') {
  console.warn('Supabase URL or Anon Key is missing or default. Falling back to offline sandbox mode.');
}

export const supabase = createClient(
  (!supabaseUrl || supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY') ? 'https://placeholder.supabase.co' : supabaseUrl,
  (!supabaseAnonKey || supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY') ? 'placeholder_key' : supabaseAnonKey
);

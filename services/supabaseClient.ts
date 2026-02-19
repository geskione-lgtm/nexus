import { createClient } from '@supabase/supabase-js';

// Vite defines process.env via vite.config.ts
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

export const isSupabaseConfigured = () => {
  return !!supabaseUrl && !!supabaseAnonKey && !supabaseUrl.includes('placeholder');
};

if (!isSupabaseConfigured()) {
  console.warn("NEXUS: Supabase yapılandırması eksik! Vercel panelinde SUPABASE_URL ve SUPABASE_ANON_KEY tanımlanmalıdır.");
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder-project.supabase.co', 
  supabaseAnonKey || 'placeholder-key'
);
import { createClient } from '@supabase/supabase-js';

// process.env values are replaced by Vite's define plugin during build
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

export const isSupabaseConfigured = () => {
  if (!supabaseUrl || !supabaseAnonKey) return false;
  
  const urlStr = String(supabaseUrl);
  const keyStr = String(supabaseAnonKey);
  
  // Literal string "undefined" check (common in failed Vite defines)
  if (urlStr === 'undefined' || keyStr === 'undefined' || urlStr === '' || keyStr === '') return false;
  if (urlStr.includes('placeholder')) return false;
  
  return true;
};

if (!isSupabaseConfigured()) {
  console.error("NEXUS CONFIG ERROR: Supabase bağlantı bilgileri bulunamadı. Lütfen Vercel panelinde VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY tanımladığınızdan emin olun.");
}

export const supabase = createClient(
  isSupabaseConfigured() ? supabaseUrl! : 'https://placeholder-project.supabase.co', 
  isSupabaseConfigured() ? supabaseAnonKey! : 'placeholder-key'
);
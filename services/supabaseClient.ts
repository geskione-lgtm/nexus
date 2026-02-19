import { createClient } from '@supabase/supabase-js';

// Vite defines process.env via vite.config.ts
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

export const isSupabaseConfigured = () => {
  if (!supabaseUrl || !supabaseAnonKey) return false;
  
  const urlStr = String(supabaseUrl);
  const keyStr = String(supabaseAnonKey);
  
  // Build time stringified undefined/null check
  if (urlStr === 'undefined' || keyStr === 'undefined') return false;
  if (urlStr === 'null' || keyStr === 'null') return false;
  if (urlStr.includes('placeholder')) return false;
  
  return true;
};

if (!isSupabaseConfigured()) {
  console.error("NEXUS ERROR: Supabase ayarları eksik. Lütfen Vercel panelinden değişkenleri ekleyin ve RE-DEPLOY yapın.");
}

export const supabase = createClient(
  isSupabaseConfigured() ? supabaseUrl! : 'https://placeholder-project.supabase.co', 
  isSupabaseConfigured() ? supabaseAnonKey! : 'placeholder-key'
);
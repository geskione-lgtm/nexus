import { createClient } from '@supabase/supabase-js';

// Vite defines process.env via vite.config.ts mappings
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

export const isSupabaseConfigured = () => {
  if (!supabaseUrl || !supabaseAnonKey) return false;
  
  const urlStr = String(supabaseUrl);
  const keyStr = String(supabaseAnonKey);
  
  // Hem undefined (literal string) hem de gerçek undefined kontrolü
  if (urlStr === 'undefined' || keyStr === 'undefined' || urlStr === '' || keyStr === '') return false;
  if (urlStr.includes('placeholder')) return false;
  
  return true;
};

if (!isSupabaseConfigured()) {
  console.error("NEXUS CONFIG ERROR: Değişkenler build sırasında koda gömülemedi.");
}

export const supabase = createClient(
  isSupabaseConfigured() ? supabaseUrl! : 'https://placeholder-project.supabase.co', 
  isSupabaseConfigured() ? supabaseAnonKey! : 'placeholder-key'
);
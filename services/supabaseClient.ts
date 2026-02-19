import { createClient } from '@supabase/supabase-js';

// Vite defines process.env via vite.config.ts
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

export const isSupabaseConfigured = () => {
  // Eğer değişkenler undefined ise veya hala 'placeholder' içeriyorsa false döner
  if (!supabaseUrl || !supabaseAnonKey) return false;
  if (supabaseUrl.includes('placeholder')) return false;
  return true;
};

if (!isSupabaseConfigured()) {
  console.error("NEXUS ERROR: Supabase URL veya Key bulunamadı. Vercel panelinden değişkenleri ekleyin ve RE-DEPLOY yapın.");
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder-project.supabase.co', 
  supabaseAnonKey || 'placeholder-key'
);
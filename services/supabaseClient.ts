
import { createClient } from '@supabase/supabase-js';

const getEnv = (key: string): string | undefined => {
  try {
    return (window as any).process?.env?.[key] || (window as any)[key] || undefined;
  } catch {
    return undefined;
  }
};

const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');

const finalUrl = supabaseUrl || 'https://placeholder-project.supabase.co';
const finalKey = supabaseAnonKey || 'placeholder-key';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("NEXUS: Supabase yapılandırması eksik! Vercel panelinden değişkenleri kontrol edin.");
}

export const supabase = createClient(finalUrl, finalKey);

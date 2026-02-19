
import { createClient } from '@supabase/supabase-js';

const getEnv = (key: string): string | undefined => {
  try {
    // Vite'in define ile enjekte ettiği process.env'yi kontrol et
    return (window as any).process?.env?.[key] || (window as any)[key] || undefined;
  } catch {
    return undefined;
  }
};

const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');

// Varsayılan değerler sadece yapılandırma hatasında uyarı vermek içindir
const finalUrl = supabaseUrl || 'https://placeholder-project.supabase.co';
const finalKey = supabaseAnonKey || 'placeholder-key';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("NEXUS: Supabase yapılandırması eksik! Lütfen Vercel panelinde SUPABASE_URL ve SUPABASE_ANON_KEY değişkenlerini tanımlayın.");
}

export const supabase = createClient(finalUrl, finalKey);

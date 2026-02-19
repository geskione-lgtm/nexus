
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

/**
 * Ortam değişkenlerine güvenli erişim sağlar.
 * Vercel'de process.env olarak, bazı sandbox ortamlarında window üzerinden gelir.
 */
const getEnv = (key: string): string | undefined => {
  try {
    return (window as any).process?.env?.[key] || (window as any)[key] || undefined;
  } catch {
    return undefined;
  }
};

const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');

// Değişkenler eksikse placeholder kullanarak kütüphanenin çökmesini önleriz,
// ancak DatabaseService içinde bu durumu kontrol ederek fetch hatasını engelleriz.
const finalUrl = supabaseUrl || 'https://placeholder-project.supabase.co';
const finalKey = supabaseAnonKey || 'placeholder-key';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("NEXUS: Supabase yapılandırması eksik! Lütfen Vercel panelinden SUPABASE_URL ve SUPABASE_ANON_KEY değişkenlerini tanımlayın.");
}

export const supabase = createClient(finalUrl, finalKey);

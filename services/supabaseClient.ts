
import { createClient } from '@supabase/supabase-js';

// process.env'den gelen değerleri al, yoksa boş string döndür (placeholder URL hatalarına neden olur)
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = () => {
  return (
    supabaseUrl && 
    supabaseAnonKey && 
    supabaseUrl !== 'undefined' && 
    supabaseAnonKey !== 'undefined' &&
    supabaseUrl.startsWith('https://')
  );
};

// Client'ı sadece geçerli bir URL varsa oluştur, yoksa null/hata yönetimi için hazır tut
// Ancak supabase-js bir URL beklediği için en azından bir yapı oluşturuyoruz
export const supabase = createClient(
  supabaseUrl || 'https://empty.supabase.co', 
  supabaseAnonKey || 'empty'
);

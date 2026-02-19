import { createClient } from '@supabase/supabase-js';

// Vite'in define ile enjekte ettiği değişkenleri doğrudan kullanıyoruz
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder')) {
  console.error("NEXUS: Supabase yapılandırması eksik! Lütfen Vercel panelinde SUPABASE_URL ve SUPABASE_ANON_KEY değişkenlerini tanımlayın.");
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder'
);
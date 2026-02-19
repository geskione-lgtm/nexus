
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Vercel'deki hem düz hem de VITE_ ön ekli versiyonları kontrol eder
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY),
    'process.env.SUPABASE_URL': JSON.stringify(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL),
    'process.env.SUPABASE_ANON_KEY': JSON.stringify(process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY),
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
});
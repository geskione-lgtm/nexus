
import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

interface LoginProps {
  onBack: () => void;
}

const Login: React.FC<LoginProps> = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isSupabaseConfigured()) {
      alert("Sistem Yapılandırması Eksik: SUPABASE_URL veya SUPABASE_ANON_KEY tanımlanmamış. Lütfen çevre değişkenlerini kontrol edin.");
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password
        });
        if (error) throw error;
        alert("Kayıt başarılı! Lütfen giriş yapın.");
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      console.error("Auth Hatası:", err);
      let errorMessage = err.message || "Giriş başarısız.";
      
      // "Failed to fetch" hatasını kullanıcıya daha net açıkla
      if (errorMessage.includes("Failed to fetch")) {
        errorMessage = "Ağ Hatası: Supabase sunucusuna bağlanılamadı. İnternet bağlantınızı veya Supabase URL yapılandırmanızı kontrol edin.";
      }
      
      alert("Hata: " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="max-w-md w-full">
        <button 
          onClick={onBack}
          className="mb-8 flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-slate-900 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Geri Dön
        </button>

        <div className="mb-10 text-center">
          <div className="inline-flex w-14 h-14 bg-slate-950 rounded-2xl items-center justify-center mb-6 shadow-xl">
             <div className="w-6 h-6 bg-nexus-green rounded-full shadow-[0_0_15px_rgba(16,185,129,0.6)]"></div>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">NEXUS<span className="text-nexus-green font-semibold">PORTALI</span></h2>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mt-2">Medikal Kimlik Doğrulama Sistemi</p>
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-[32px] p-10 shadow-sm">
          <form onSubmit={handleAuth} className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 px-1">E-posta Adresi</label>
              <input 
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="doktor@kurum.com"
                className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-slate-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-nexus-green/20 focus:border-nexus-green transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 px-1">Şifre</label>
              <input 
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-slate-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-nexus-green/20 focus:border-nexus-green transition-all"
              />
            </div>
            <button 
              disabled={loading}
              className="w-full py-4.5 bg-slate-950 text-white font-bold uppercase tracking-widest text-xs rounded-2xl hover:bg-slate-800 transform active:scale-[0.98] transition-all shadow-lg shadow-slate-200 disabled:opacity-50"
            >
              {loading ? 'İşleniyor...' : (isSignUp ? 'Hesap Oluştur' : 'Sisteme Giriş Yap')}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-200 text-center">
             <button 
               onClick={() => setIsSignUp(!isSignUp)}
               className="text-[11px] font-bold text-slate-500 hover:text-nexus-green uppercase tracking-widest transition-colors"
             >
                {isSignUp ? 'Zaten hesabım var? Giriş Yap' : 'Yeni Kayıt? Klinik Talebi Oluştur'}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

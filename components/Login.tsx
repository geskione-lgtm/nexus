import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';

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
    
    // Konfigürasyon kontrolü
    const { supabaseUrl } = (supabase as any);
    if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
      alert("Sistem Yapılandırması Tamamlanmadı: Lütfen yönetici ile iletişime geçin (Supabase URL eksik).");
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              email_confirm: true // Bazı Supabase ayarları için gerekebilir
            }
          }
        });
        if (error) throw error;
        alert("Kayıt başarılı! Lütfen e-postanızı onaylayın (veya doğrudan giriş yapmayı deneyin).");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      console.error("Auth Hatası:", err);
      if (err.message === "Failed to fetch") {
        alert("Bağlantı Hatası: Supabase sunucusuna erişilemiyor. Lütfen Vercel Environment Variables ayarlarınızı kontrol edin.");
      } else {
        alert("Hata: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="max-w-md w-full">
        <button 
          onClick={onBack}
          className="mb-8 flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-black transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Giriş Sayfasına Dön
        </button>

        <div className="mb-10 text-center">
          <div className="inline-flex w-14 h-14 bg-black rounded-2xl items-center justify-center mb-6">
             <div className="w-6 h-6 bg-nexus-green rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
          </div>
          <h2 className="text-3xl font-black tracking-tighter uppercase text-black"><span className="text-nexus-green">Nexus</span> Portalı</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Bulut Tabanlı Tıbbi Kimlik Doğrulama</p>
        </div>

        <div className="bg-[#F9F9F9] border border-slate-100 rounded-[32px] p-10 shadow-sm">
          <form onSubmit={handleAuth}>
            <div className="mb-6">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">E-posta</label>
              <input 
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="isminiz@kurum.com"
                className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-black font-medium focus:outline-none focus:ring-2 focus:ring-nexus-green transition-all"
              />
            </div>
            <div className="mb-8">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Şifre</label>
              <input 
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-black font-medium focus:outline-none focus:ring-2 focus:ring-nexus-green transition-all"
              />
            </div>
            <button 
              disabled={loading}
              className="w-full py-5 bg-black text-white font-black uppercase tracking-widest rounded-2xl hover:bg-slate-800 transform hover:-translate-y-0.5 transition-all shadow-xl shadow-black/10 disabled:opacity-50"
            >
              {loading ? 'İşleniyor...' : (isSignUp ? 'Kayıt Ol' : 'Sisteme Giriş Yap')}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-200 text-center">
             <button 
               onClick={() => setIsSignUp(!isSignUp)}
               className="text-[10px] font-bold text-slate-500 hover:text-nexus-green uppercase tracking-widest transition-colors"
             >
                {isSignUp ? 'Zaten hesabım var? Giriş Yap' : 'Yeni Klinik mi? Kayıt Talebi'}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
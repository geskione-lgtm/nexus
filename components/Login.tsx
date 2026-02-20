
import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

interface LoginProps {
  onBack: () => void;
  onSwitchToRegister: () => void;
}

const Login: React.FC<LoginProps> = ({ onBack, onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured()) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (err: any) {
      alert("Hata: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FBFBFD]">
      <div className="max-w-sm w-full p-10 text-center animate-in fade-in slide-in-from-bottom-10 duration-1000">
        <div className="mb-12">
          <div className="w-16 h-16 bg-black rounded-[20px] flex items-center justify-center mx-auto mb-10 shadow-2xl">
            <div className="w-7 h-7 bg-white rounded-sm"></div>
          </div>
          <h2 className="text-3xl font-bold text-black tracking-tight mb-3">
            NeoBreed'e Giriş Yap
          </h2>
          <p className="text-apple-gray text-xs font-semibold uppercase tracking-widest leading-loose">
            Yapay Zeka Destekli Fetal Görüntüleme
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <input 
            type="email" required value={email} onChange={e => setEmail(e.target.value)}
            placeholder="Kurumsal E-posta"
            className="w-full px-6 py-4 bg-white border border-black/5 rounded-2xl text-sm font-medium focus:border-black/20 outline-none transition-all shadow-sm"
          />
          <input 
            type="password" required value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Şifre"
            className="w-full px-6 py-4 bg-white border border-black/5 rounded-2xl text-sm font-medium focus:border-black/20 outline-none transition-all shadow-sm"
          />
          <button 
            disabled={loading}
            className="w-full py-4.5 bg-black text-white rounded-2xl font-bold text-sm uppercase tracking-widest mt-6 hover:scale-[1.01] active:scale-[0.98] transition-all shadow-xl shadow-black/10"
          >
            {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>

        <div className="mt-10">
          <button 
            onClick={onSwitchToRegister}
            className="text-apple-gray text-[10px] font-bold uppercase tracking-widest hover:text-black transition-colors"
          >
            Yeni bir hesap oluştur
          </button>
        </div>

        <button onClick={onBack} className="mt-16 text-black/20 text-[10px] font-bold uppercase tracking-widest hover:text-black transition-colors">
          Ana Sayfaya Dön
        </button>
      </div>
    </div>
  );
};

export default Login;

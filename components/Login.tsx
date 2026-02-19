
import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

interface LoginProps {
  onBack: () => void;
}

const Login: React.FC<LoginProps> = ({ onBack }) => {
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
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FBFBFD]">
      <div className="max-w-sm w-full p-10 text-center animate-in fade-in slide-in-from-bottom-10 duration-1000">
        <div className="mb-12">
          <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center mx-auto mb-10 shadow-2xl">
            <div className="w-6 h-6 bg-white rounded-sm"></div>
          </div>
          <h2 className="text-3xl font-bold text-black tracking-tight mb-3">Sign in to Nexus</h2>
          <p className="text-apple-gray text-xs font-semibold uppercase tracking-widest">Medical Cloud Protocol</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <input 
            type="email" required value={email} onChange={e => setEmail(e.target.value)}
            placeholder="Institutional Email"
            className="w-full px-6 py-4 bg-white border border-black/5 rounded-2xl text-sm font-medium focus:border-black/20 outline-none transition-all"
          />
          <input 
            type="password" required value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Passcode"
            className="w-full px-6 py-4 bg-white border border-black/5 rounded-2xl text-sm font-medium focus:border-black/20 outline-none transition-all"
          />
          <button 
            disabled={loading}
            className="w-full py-4 bg-black text-white rounded-2xl font-bold text-sm uppercase tracking-widest mt-6 hover:scale-[1.01] active:scale-[0.98] transition-all shadow-xl shadow-black/10"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <button onClick={onBack} className="mt-12 text-apple-gray text-[10px] font-bold uppercase tracking-widest hover:text-black transition-colors">
          Return to Nexus.com
        </button>
      </div>
    </div>
  );
};

export default Login;

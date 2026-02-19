
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { DatabaseService } from '../services/databaseService';
import { UserRole } from '../types';

interface Props {
  onComplete: () => void;
}

const Onboarding: React.FC<Props> = ({ onComplete }) => {
  const [loading, setLoading] = useState(false);
  const [isSystemEmpty, setIsSystemEmpty] = useState<boolean | null>(null);
  const [name, setName] = useState('');

  useEffect(() => {
    const check = async () => {
      const empty = await DatabaseService.isSystemEmpty();
      setIsSystemEmpty(empty);
    };
    check();
  }, []);

  const handleInitialize = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Kullanıcı oturumu bulunamadı.");

      // Eğer sistem boşsa Süper Admin, değilse varsayılan olarak Doktor olarak ata
      const role = isSystemEmpty ? UserRole.SUPER_ADMIN : UserRole.DOCTOR;
      
      await DatabaseService.createInitialProfile({
        id: user.id,
        name: name,
        email: user.email!,
        role: role
      });

      onComplete();
    } catch (err: any) {
      alert("Hata: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (isSystemEmpty === null) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="w-12 h-12 border-4 border-nexus-green border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9F9F9] px-4">
      <div className="max-w-xl w-full">
        <div className="bg-white rounded-[48px] p-12 shadow-2xl border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
             <div className="w-32 h-32 bg-nexus-green rounded-full blur-3xl"></div>
          </div>

          <div className="mb-10">
            <div className="inline-flex w-16 h-16 bg-black rounded-2xl items-center justify-center mb-8">
               <div className="w-6 h-1 bg-nexus-green rounded-full"></div>
            </div>
            <h2 className="text-4xl font-black tracking-tighter uppercase text-black mb-4">
              {isSystemEmpty ? 'Sistem Başlatılıyor' : 'Profil Oluşturma'}
            </h2>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs leading-relaxed">
              {isSystemEmpty 
                ? 'Nexus ağındaki ilk yönetici sizsiniz. Bu hesap tüm sistem üzerinde tam kontrol yetkisine (Süper Admin) sahip olacaktır.' 
                : 'Nexus portalına hoş geldiniz. Devam etmek için tıbbi kimlik bilgilerinizi doğrulayın.'}
            </p>
          </div>

          <div className="space-y-8">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Tam Adınız & Ünvanınız</label>
              <input 
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Örn: Dr. Arda Yılmaz"
                className="w-full px-8 py-5 bg-[#F9F9F9] border border-slate-200 rounded-3xl text-black font-bold focus:outline-none focus:ring-2 focus:ring-nexus-green transition-all"
              />
            </div>

            <div className="pt-4">
              <button 
                disabled={loading || !name.trim()}
                onClick={handleInitialize}
                className="w-full py-6 bg-black text-white font-black uppercase tracking-widest rounded-3xl hover:bg-slate-800 transform hover:-translate-y-1 transition-all shadow-2xl shadow-black/20 disabled:opacity-50"
              >
                {loading ? 'Sentezleniyor...' : (isSystemEmpty ? 'Süper Admin Olarak Tanımla' : 'Profilimi Kaydet')}
              </button>
            </div>
          </div>

          <div className="mt-12 flex items-center justify-center gap-2">
             <span className="w-1.5 h-1.5 rounded-full bg-nexus-green animate-pulse"></span>
             <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Nexus Secure Initialization Protokolü v2.0</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;

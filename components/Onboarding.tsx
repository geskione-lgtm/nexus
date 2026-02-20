
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { DatabaseService } from '../services/databaseService';
import { UserRole } from '../types';
import { PACKAGES } from '../constants';

interface Props { onComplete: () => void; }

const Onboarding: React.FC<Props> = ({ onComplete }) => {
  const [step, setStep] = useState(1); // 1: Profil, 2: Paket, 3: Ödeme
  const [loading, setLoading] = useState(false);
  const [isSystemEmpty, setIsSystemEmpty] = useState<boolean | null>(null);
  const [formData, setFormData] = useState({ name: '', clinicName: '', packageId: 'pro' });

  useEffect(() => {
    const check = async () => {
      const empty = await DatabaseService.isSystemEmpty();
      setIsSystemEmpty(empty);
    };
    check();
  }, []);

  const handleFinalize = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Oturum bulunamadı.");

      const role = isSystemEmpty ? UserRole.SUPER_ADMIN : UserRole.DOCTOR;
      
      await DatabaseService.createInitialProfile({
        id: user.id,
        name: formData.name,
        email: user.email!,
        role: role,
        clinicName: formData.clinicName || (isSystemEmpty ? 'Merkez Yönetim' : 'Yeni Klinik'),
        packageId: formData.packageId
      });

      onComplete();
    } catch (err: any) { alert(err.message); }
    finally { setLoading(false); }
  };

  if (isSystemEmpty === null) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FBFBFD] py-20 px-4">
      <div className="max-w-4xl w-full">
        {step === 1 && (
          <div className="max-w-md mx-auto text-center animate-in fade-in zoom-in duration-500">
            <h2 className="text-3xl font-bold text-black mb-10 tracking-tight">Klinik Profilini Oluştur</h2>
            <div className="space-y-4">
              <input required placeholder="Adınız ve Ünvanınız" className="w-full px-6 py-4 bg-white border border-black/5 rounded-2xl text-sm font-medium focus:border-black/20 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              {!isSystemEmpty && <input required placeholder="Klinik İsmi" className="w-full px-6 py-4 bg-white border border-black/5 rounded-2xl text-sm font-medium focus:border-black/20 outline-none" value={formData.clinicName} onChange={e => setFormData({...formData, clinicName: e.target.value})} />}
              <button 
                disabled={!formData.name}
                onClick={() => isSystemEmpty ? handleFinalize() : setStep(2)}
                className="w-full py-4.5 bg-black text-white rounded-2xl font-bold text-sm uppercase tracking-widest mt-6 hover:scale-[1.02] transition-all shadow-xl shadow-black/10"
              >
                {isSystemEmpty ? 'Sistemi Başlat' : 'Paket Seçimine Geç'}
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-bottom-10 duration-700">
            <h2 className="text-4xl font-bold text-black text-center mb-16 tracking-tight">Size Uygun Lisansı Seçin</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {PACKAGES.map(pkg => (
                <div key={pkg.id} 
                  onClick={() => setFormData({...formData, packageId: pkg.id})}
                  className={`apple-card p-10 rounded-[40px] cursor-pointer relative group transition-all ${formData.packageId === pkg.id ? 'border-black ring-1 ring-black' : 'hover:border-black/10'}`}
                >
                  <p className="text-[10px] font-bold text-apple-gray uppercase tracking-widest mb-2">{pkg.name}</p>
                  <p className="text-3xl font-bold text-black tracking-tighter mb-8">₺{pkg.price.toLocaleString()}<span className="text-xs text-apple-gray font-medium">/ay</span></p>
                  <ul className="space-y-4 mb-12">
                    {pkg.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                        <div className="w-1 h-1 bg-nexus-mint rounded-full"></div> {f}
                      </li>
                    ))}
                  </ul>
                  <div className={`w-full py-3 rounded-full text-[10px] font-bold uppercase tracking-widest text-center transition-all ${formData.packageId === pkg.id ? 'bg-black text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'}`}>Seçili</div>
                </div>
              ))}
            </div>
            <div className="text-center mt-12">
              <button onClick={() => setStep(3)} className="px-12 py-4.5 bg-black text-white rounded-full font-bold text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-2xl">Ödeme Adımına Geç</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="max-w-md mx-auto animate-in fade-in zoom-in duration-500">
            <h2 className="text-3xl font-bold text-black text-center mb-10 tracking-tight">Güvenli Ödeme</h2>
            <div className="apple-card p-10 rounded-[40px] bg-slate-900 text-white relative overflow-hidden mb-8">
               <div className="absolute top-0 right-0 p-8 opacity-20"><div className="w-16 h-10 border border-white rounded-md"></div></div>
               <p className="text-[10px] font-bold uppercase tracking-[0.3em] mb-12">NeoBreed Pay</p>
               <p className="text-xl font-medium tracking-[0.2em] mb-8">•••• •••• •••• ••••</p>
               <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[8px] font-bold uppercase text-white/40 mb-1">Kart Sahibi</p>
                    <p className="text-sm font-bold uppercase tracking-widest">{formData.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-bold uppercase text-white/40 mb-1">Tutar</p>
                    <p className="text-lg font-bold">₺{PACKAGES.find(p => p.id === formData.packageId)?.price.toLocaleString()}</p>
                  </div>
               </div>
            </div>
            <div className="space-y-4 mb-10">
               <input placeholder="Kart Numarası" className="w-full px-6 py-4 bg-white border border-black/5 rounded-2xl text-sm font-medium focus:border-black/20 outline-none" />
               <div className="flex gap-4">
                  <input placeholder="AA/YY" className="flex-1 px-6 py-4 bg-white border border-black/5 rounded-2xl text-sm font-medium focus:border-black/20 outline-none" />
                  <input placeholder="CVV" className="flex-1 px-6 py-4 bg-white border border-black/5 rounded-2xl text-sm font-medium focus:border-black/20 outline-none" />
               </div>
            </div>
            <button 
              disabled={loading}
              onClick={handleFinalize}
              className="w-full py-5 bg-black text-white rounded-full font-bold text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-black/10"
            >
              {loading ? 'İşlem Onaylanıyor...' : 'Aboneliği Başlat'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;


import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { PACKAGES } from '../constants';

interface Props { 
  activeTab: string;
  doctors: User[]; 
  onAddDoctor: (doctor: User) => void; 
}

const SuperAdminDashboard: React.FC<Props> = ({ activeTab, doctors, onAddDoctor }) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', clinicName: '', packageId: 'basic' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddDoctor({ id: '', ...formData, role: UserRole.DOCTOR });
    setFormData({ name: '', email: '', clinicName: '', packageId: 'basic' });
    setShowForm(false);
  };

  if (activeTab === 'revenue') {
    return (
      <div className="space-y-12 animate-in fade-in duration-500">
        <h2 className="text-2xl font-black uppercase tracking-tighter">Finansal Raporlar</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Aylık Tekrarlayan Gelir (MRR)</p>
              <p className="text-5xl font-black text-black tracking-tighter mb-8">${doctors.length * 1420}</p>
              <div className="h-40 bg-slate-50 rounded-3xl flex items-end justify-between p-6">
                 {[40, 70, 55, 90, 80, 100].map((h, i) => (
                   <div key={i} className="w-8 bg-nexus-green rounded-t-lg transition-all hover:opacity-80" style={{height: `${h}%`}}></div>
                 ))}
              </div>
           </div>
           <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Lisans Dağılımı</p>
              <div className="space-y-6 pt-4">
                 {PACKAGES.map(p => (
                   <div key={p.id} className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-600">{p.name}</span>
                      <div className="flex-1 mx-4 h-2 bg-slate-50 rounded-full overflow-hidden">
                         <div className="h-full bg-black rounded-full" style={{width: `${(doctors.filter(d => d.packageId === p.id).length / doctors.length || 0) * 100}%`}}></div>
                      </div>
                      <span className="text-xs font-black">{doctors.filter(d => d.packageId === p.id).length}</span>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'analytics') {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <h2 className="text-2xl font-black uppercase tracking-tighter">Sistem Analitikleri</h2>
        <div className="bg-white rounded-[40px] p-10 border border-slate-100">
           <div className="space-y-6">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="flex items-center justify-between py-4 border-b border-slate-50 last:border-0">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-xs font-bold">L{i}</div>
                      <div>
                         <p className="text-sm font-bold text-black uppercase tracking-tight">Kritik API İsteği: Gemini Cloud</p>
                         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Süre: 1.4s • Başarılı • 12:4{i}</p>
                      </div>
                   </div>
                   <span className="text-[10px] font-black bg-nexus-green/10 text-nexus-green px-3 py-1 rounded-full uppercase tracking-widest">Uyumlu</span>
                </div>
              ))}
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <NexusStat title="Toplam Klinik" value={doctors.length.toString()} trend="Bu ay +12%" />
        <NexusStat title="Aktif Oturum" value="1.429" trend="Pik kullanımı" />
        <NexusStat title="Tahmini Gelir" value={`$${doctors.length * 4.2}M`} trend="Yüksek Büyüme" />
      </div>

      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-[#fdfdfd]">
          <div>
            <h2 className="text-2xl font-black tracking-tighter uppercase text-black">Ağ Rehberi</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Yetkili Tıbbi Ortaklar</p>
          </div>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="px-8 py-3 bg-nexus-green text-white rounded-full text-xs font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-lg shadow-nexus-green/20"
          >
            {showForm ? 'İptal' : '+ Yeni Ortak Ekle'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="p-10 bg-[#f9f9f9] border-b border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-6 animate-in slide-in-from-top duration-300">
            <input required placeholder="Ad Soyad" className="px-6 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-nexus-green outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            <input required type="email" placeholder="E-posta Adresi" className="px-6 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-nexus-green outline-none" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            <input required placeholder="Klinik/Hastane" className="px-6 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-nexus-green outline-none" value={formData.clinicName} onChange={e => setFormData({...formData, clinicName: e.target.value})} />
            <div className="flex gap-4">
              <select className="flex-1 px-6 py-4 rounded-2xl border border-slate-200 outline-none" value={formData.packageId} onChange={e => setFormData({...formData, packageId: e.target.value})}>
                {PACKAGES.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <button type="submit" className="px-8 py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-xs">Ekle</button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#fafafa] text-slate-400 text-[10px] font-black uppercase tracking-[0.15em]">
              <tr>
                <th className="px-10 py-6">Tıbbi Personel</th>
                <th className="px-10 py-6">Tesis</th>
                <th className="px-10 py-6">Lisans</th>
                <th className="px-10 py-6">Operasyonlar</th>
                <th className="px-10 py-6">Kontrol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {doctors.map(doctor => (
                <tr key={doctor.id} className="hover:bg-[#fcfcfc] transition-colors">
                  <td className="px-10 py-8">
                    <div className="font-bold text-black">{doctor.name}</div>
                    <div className="text-xs text-slate-400 font-medium">{doctor.email}</div>
                  </td>
                  <td className="px-10 py-8 text-slate-600 font-bold text-sm uppercase">{doctor.clinicName}</td>
                  <td className="px-10 py-8">
                    <span className="px-3 py-1 bg-black text-white rounded-full text-[9px] font-black uppercase tracking-widest">
                      {PACKAGES.find(p => p.id === doctor.packageId)?.name}
                    </span>
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-2">
                       <span className="w-1.5 h-1.5 bg-nexus-green rounded-full"></span>
                       <span className="text-[11px] font-black text-black uppercase tracking-widest">Şifreli</span>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <button className="text-slate-300 hover:text-black transition-colors">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                    </button>
                  </td>
                </tr>
              ))}
              {doctors.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-10 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">Ağda henüz kayıtlı klinik bulunmuyor.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const NexusStat: React.FC<{ title: string; value: string; trend: string }> = ({ title, value, trend }) => (
  <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden group">
    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
       <div className="w-12 h-12 bg-black rounded-full"></div>
    </div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">{title}</p>
    <p className="text-4xl font-black text-black tracking-tighter mb-4 uppercase">{value}</p>
    <p className="text-[11px] font-bold text-nexus-green uppercase tracking-widest">{trend}</p>
  </div>
);

export default SuperAdminDashboard;


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
        <h2 className="text-xl font-bold tracking-tight text-slate-800">Finansal Veriler</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Aylık Tahmini Gelir</p>
              <p className="text-4xl font-bold text-slate-900 tracking-tight mb-8">${doctors.length * 1420}</p>
              <div className="h-40 bg-slate-50 rounded-2xl flex items-end justify-between p-6">
                 {[40, 70, 55, 90, 80, 100].map((h, i) => (
                   <div key={i} className="w-8 bg-nexus-green rounded-t-md transition-all hover:opacity-80" style={{height: `${h}%`}}></div>
                 ))}
              </div>
           </div>
           <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Lisans Dağılımı</p>
              <div className="space-y-6 pt-4">
                 {PACKAGES.map(p => (
                   <div key={p.id} className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-600">{p.name}</span>
                      <div className="flex-1 mx-4 h-1.5 bg-slate-50 rounded-full overflow-hidden">
                         <div className="h-full bg-slate-900 rounded-full" style={{width: `${(doctors.filter(d => d.packageId === p.id).length / doctors.length || 0) * 100}%`}}></div>
                      </div>
                      <span className="text-xs font-bold text-slate-800">{doctors.filter(d => d.packageId === p.id).length}</span>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <NexusStat title="Toplam Klinik" value={doctors.length.toString()} trend="Bu ay +12%" />
        <NexusStat title="Sistem Yükü" value="%42" trend="Normal Seyir" />
        <NexusStat title="Tahmini Gelir" value={`$${(doctors.length * 0.42).toFixed(2)}M`} trend="Kararlı" />
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900 uppercase">Ağ Rehberi</h2>
            <p className="text-xs text-slate-400 font-medium mt-1">Sistemdeki yetkili doktor ve klinikler</p>
          </div>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-2.5 bg-nexus-green text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-emerald-600 transition-colors shadow-lg shadow-nexus-green/10"
          >
            {showForm ? 'İptal' : '+ Yeni Doktor Tanımla'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="p-8 bg-[#f9f9f9] border-b border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-4 animate-in slide-in-from-top duration-300">
            <input required placeholder="Ad Soyad" className="px-5 py-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-nexus-green outline-none text-sm" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            <input required type="email" placeholder="E-posta" className="px-5 py-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-nexus-green outline-none text-sm" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            <input required placeholder="Kurum Adı" className="px-5 py-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-nexus-green outline-none text-sm" value={formData.clinicName} onChange={e => setFormData({...formData, clinicName: e.target.value})} />
            <div className="flex gap-2">
              <select className="flex-1 px-4 py-3.5 rounded-xl border border-slate-200 outline-none text-sm" value={formData.packageId} onChange={e => setFormData({...formData, packageId: e.target.value})}>
                {PACKAGES.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <button type="submit" className="px-6 py-3.5 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-widest text-[10px]">Ekle</button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#fafafa] text-slate-400 text-[11px] font-bold uppercase tracking-wider">
              <tr>
                <th className="px-8 py-5">Doktor Bilgisi</th>
                <th className="px-8 py-5">Klinik</th>
                <th className="px-8 py-5">Paket</th>
                <th className="px-8 py-5">Durum</th>
                <th className="px-8 py-5 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {doctors.map(doctor => (
                <tr key={doctor.id} className="hover:bg-[#fcfcfc] transition-colors group">
                  <td className="px-8 py-6">
                    <div className="font-semibold text-slate-900 text-sm">{doctor.name}</div>
                    <div className="text-xs text-slate-400 font-medium">{doctor.email}</div>
                  </td>
                  <td className="px-8 py-6 text-slate-600 font-semibold text-xs uppercase">{doctor.clinicName}</td>
                  <td className="px-8 py-6">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold uppercase tracking-tight">
                      {PACKAGES.find(p => p.id === doctor.packageId)?.name}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-1.5">
                       <span className="w-1.5 h-1.5 bg-nexus-green rounded-full"></span>
                       <span className="text-[10px] font-bold text-slate-600 uppercase">Aktif</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button className="text-slate-300 hover:text-slate-900 transition-colors">
                      <svg className="w-5 h-5 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                    </button>
                  </td>
                </tr>
              ))}
              {doctors.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-16 text-center text-slate-400 font-semibold uppercase tracking-widest text-[11px]">Henüz kayıtlı doktor bulunmuyor.</td>
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
  <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden group hover:border-nexus-green transition-colors">
    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">{title}</p>
    <p className="text-3xl font-bold text-slate-900 tracking-tight mb-3">{value}</p>
    <p className="text-[10px] font-bold text-nexus-green uppercase tracking-wider">{trend}</p>
  </div>
);

export default SuperAdminDashboard;
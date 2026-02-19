
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

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard 
          title="Toplam Klinik" 
          value={doctors.length.toString()} 
          trend="+15% geçen aya göre" 
          icon="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          variant="green"
        />
        <StatCard 
          title="Aktif Paket" 
          value="45%" 
          trend="-5% geçen aya göre" 
          icon="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          variant="black"
        />
        <StatCard 
          title="Toplam Analiz" 
          value="1.673" 
          trend="+21% geçen aya göre" 
          icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          variant="light"
        />
        <StatCard 
          title="Tahmini Gelir" 
          value={`$${(doctors.length * 4.2).toFixed(2)}M`} 
          trend="+11% geçen aya göre" 
          icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          variant="dark"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart Area */}
        <div className="lg:col-span-2 bg-white rounded-[32px] p-8 card-shadow border border-slate-100">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Medikal Analizler</h3>
              <p className="text-xs text-slate-400 font-medium">İşlem hacmi ve bulut kullanımı</p>
            </div>
            <select className="bg-slate-50 border-none rounded-xl px-4 py-2 text-xs font-bold text-slate-600 outline-none">
              <option>Mart 2024</option>
              <option>Şubat 2024</option>
            </select>
          </div>
          <div className="h-[300px] w-full relative">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 800 300">
              <defs>
                <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="white" />
                </linearGradient>
              </defs>
              <path 
                d="M0,250 C100,240 150,180 250,190 C350,200 450,120 550,140 C650,160 750,220 800,210 V300 H0 Z" 
                className="nexus-chart-gradient"
              />
              <path 
                d="M0,250 C100,240 150,180 250,190 C350,200 450,120 550,140 C650,160 750,220 800,210" 
                fill="none" 
                stroke="#10b981" 
                strokeWidth="4"
              />
              {/* Markers */}
              <circle cx="250" cy="190" r="6" fill="white" stroke="#10b981" strokeWidth="3" />
              <circle cx="550" cy="140" r="6" fill="white" stroke="#10b981" strokeWidth="3" />
            </svg>
          </div>
        </div>

        {/* Side Performance Area */}
        <div className="bg-white rounded-[32px] p-8 card-shadow border border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 mb-8">Kanal Performansı</h3>
          <div className="flex flex-col items-center justify-center py-6">
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="80" cy="80" r="70" stroke="#f1f5f9" strokeWidth="12" fill="transparent" />
                <circle cx="80" cy="80" r="70" stroke="#10b981" strokeWidth="12" fill="transparent" 
                        strokeDasharray="440" strokeDashoffset="110" strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-slate-900">75%</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Verimlilik</span>
              </div>
            </div>
            <div className="w-full space-y-4 mt-10">
              <ProgressItem label="Yapay Zeka Doğruluğu" val="92%" color="bg-nexus-green" />
              <ProgressItem label="Bulut Senkronu" val="98%" color="bg-slate-900" />
              <ProgressItem label="API Yanıt Süresi" val="45ms" color="bg-amber-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[32px] p-8 card-shadow border border-slate-100 overflow-hidden">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Klinik Operasyonları</h3>
            <p className="text-xs text-slate-400 font-medium">Güncel ağ trafiği ve lisanslar</p>
          </div>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-3 bg-nexus-green text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-nexus-green/20"
          >
            {showForm ? 'İptal' : 'Yeni Klinik Ekle'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="mb-10 p-8 bg-slate-50 rounded-3xl grid grid-cols-1 md:grid-cols-4 gap-4 animate-in slide-in-from-top duration-300">
            <input required placeholder="Doktor Adı" className="px-5 py-3.5 rounded-xl border border-slate-200 outline-none text-sm font-medium bg-white" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            <input required type="email" placeholder="E-posta" className="px-5 py-3.5 rounded-xl border border-slate-200 outline-none text-sm font-medium bg-white" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            <input required placeholder="Klinik İsmi" className="px-5 py-3.5 rounded-xl border border-slate-200 outline-none text-sm font-medium bg-white" value={formData.clinicName} onChange={e => setFormData({...formData, clinicName: e.target.value})} />
            <div className="flex gap-2">
              <select className="flex-1 px-4 py-3.5 rounded-xl border border-slate-200 outline-none text-sm font-medium bg-white" value={formData.packageId} onChange={e => setFormData({...formData, packageId: e.target.value})}>
                {PACKAGES.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <button type="submit" className="px-6 py-3.5 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-widest text-[10px]">Kaydet</button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
                <th className="px-4 py-6"># Personel</th>
                <th className="px-4 py-6">Klinik Adı</th>
                <th className="px-4 py-6">Lisans</th>
                <th className="px-4 py-6">Durum</th>
                <th className="px-4 py-6 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {doctors.map((doctor, i) => (
                <tr key={doctor.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-4 py-6">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-400">#{i + 1}</span>
                      <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-xs">{doctor.name.charAt(0)}</div>
                      <div className="font-bold text-slate-900 text-sm tracking-tight">{doctor.name}</div>
                    </div>
                  </td>
                  <td className="px-4 py-6 text-slate-600 font-semibold text-xs uppercase tracking-tight">{doctor.clinicName}</td>
                  <td className="px-4 py-6">
                    <span className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-bold uppercase tracking-tight group-hover:bg-slate-200">
                      {PACKAGES.find(p => p.id === doctor.packageId)?.name}
                    </span>
                  </td>
                  <td className="px-4 py-6">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-bold uppercase">
                       <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                       Aktif
                    </span>
                  </td>
                  <td className="px-4 py-6 text-right">
                    <button className="p-2 text-slate-300 hover:text-slate-900 transition-colors">
                      <svg className="w-5 h-5 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: string; trend: string; icon: string; variant: 'green'|'black'|'light'|'dark' }> = ({ title, value, trend, icon, variant }) => {
  const styles = {
    green: "bg-nexus-green text-white",
    black: "bg-white text-slate-900",
    light: "bg-white text-slate-900",
    dark: "bg-slate-900 text-white"
  };

  return (
    <div className={`${styles[variant]} p-8 rounded-[32px] card-shadow border border-slate-100 relative group overflow-hidden transition-all hover:-translate-y-1`}>
      <div className="flex justify-between items-start mb-6">
        <div>
          <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${variant === 'green' || variant === 'dark' ? 'text-white/60' : 'text-slate-400'}`}>{title}</p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${variant === 'green' ? 'bg-white/20' : variant === 'dark' ? 'bg-white/10' : 'bg-slate-100 text-slate-600'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon} /></svg>
        </div>
      </div>
      <p className={`text-[10px] font-bold ${variant === 'green' || variant === 'dark' ? 'text-white/60' : trend.startsWith('+') ? 'text-emerald-500' : 'text-red-400'}`}>{trend}</p>
    </div>
  );
};

const ProgressItem: React.FC<{ label: string; val: string; color: string }> = ({ label, val, color }) => (
  <div className="space-y-2">
    <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest">
      <span className="text-slate-400">{label}</span>
      <span className="text-slate-900">{val}</span>
    </div>
    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full`} style={{width: val.includes('%') ? val : '70%'}}></div>
    </div>
  </div>
);

export default SuperAdminDashboard;

import React, { useState } from 'react';
import { User, Patient, ScanResult } from '../types';
import BabyFaceGenerator from './BabyFaceGenerator';
import { 
  Users, 
  Activity, 
  Calendar, 
  TrendingUp, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight,
  Plus,
  Search
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

interface Props { 
  activeTab: string;
  setActiveTab: (tab: string) => void;
  doctor: User; 
  patients: Patient[]; 
  onAddPatient: (p: Patient) => void; 
  onUpdatePatient: (id: string, p: Partial<Patient>) => void;
  onAddScan: (s: ScanResult) => void; 
  scanHistory: ScanResult[]; 
}

const DoctorDashboard: React.FC<Props> = ({ activeTab, setActiveTab, doctor, patients, onAddPatient, onUpdatePatient, onAddScan, scanHistory }) => {
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [editingPatientId, setEditingPatientId] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [newPatient, setNewPatient] = useState({ name: '', weeksPregnant: 20, phone: '', email: '' });
  const [searchQuery, setSearchQuery] = useState('');

  const chartData = [
    { name: 'Pzt', scans: 4, patients: 2 },
    { name: 'Sal', scans: 7, patients: 5 },
    { name: 'Çar', scans: 5, patients: 3 },
    { name: 'Per', scans: 8, patients: 6 },
    { name: 'Cum', scans: 12, patients: 8 },
    { name: 'Cmt', scans: 6, patients: 4 },
    { name: 'Paz', scans: 3, patients: 1 },
  ];

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.phone.includes(searchQuery)
  );

  const stats = [
    { label: 'Toplam Hasta', value: patients.length, icon: Users, color: 'bg-blue-500', trend: '+12%', positive: true },
    { label: 'Haftalık Analiz', value: scanHistory.length, icon: Activity, color: 'bg-nexus-mint', trend: '+5%', positive: true },
    { label: 'Bekleyen Randevu', value: 8, icon: Clock, color: 'bg-amber-500', trend: '-2', positive: false },
    { label: 'Klinik Skor', value: '98%', icon: TrendingUp, color: 'bg-purple-500', trend: '+1%', positive: true },
  ];

  const startStudio = (p: Patient) => {
    setSelectedPatient(p);
    setActiveTab('studio');
  };

  const handleEdit = (p: Patient) => {
    setNewPatient({ name: p.name, weeksPregnant: p.weeksPregnant, phone: p.phone, email: p.email || '' });
    setEditingPatientId(p.id);
    setShowPatientForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPatientId) {
      onUpdatePatient(editingPatientId, newPatient);
      setEditingPatientId(null);
    } else {
      onAddPatient({
        ...newPatient,
        id: '',
        doctorId: doctor.id,
        lastScanDate: new Date().toISOString().split('T')[0]
      } as Patient);
    }
    setNewPatient({ name: '', weeksPregnant: 20, phone: '', email: '' });
    setShowPatientForm(false);
  };

  if (activeTab === 'dashboard') {
    return (
      <div className="space-y-10 animate-in fade-in duration-700">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-black tracking-tight">Hoş Geldiniz, Dr. {doctor.name.split(' ')[0]}</h2>
            <p className="text-apple-gray text-xs font-semibold uppercase tracking-widest mt-1">Klinik Genel Bakış Paneli</p>
          </div>
          <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-apple-gray" />
              <input 
                type="text" 
                placeholder="Hasta ara..." 
                className="pl-11 pr-6 py-3 bg-white rounded-full border-none text-xs font-medium focus:ring-2 focus:ring-nexus-mint transition-all shadow-sm w-64"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <button 
              onClick={() => { setActiveTab('patients'); setShowPatientForm(true); }}
              className="px-6 py-3 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all shadow-xl shadow-black/10"
            >
              <Plus className="w-4 h-4" />
              Yeni Kayıt
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <div key={i} className="apple-card p-8 rounded-[32px] group hover:scale-[1.02] transition-all cursor-default">
              <div className="flex justify-between items-start mb-6">
                <div className={`w-12 h-12 ${stat.color} rounded-2xl flex items-center justify-center text-white shadow-lg shadow-current/20`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${stat.positive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  {stat.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {stat.trend}
                </div>
              </div>
              <p className="text-apple-gray text-[10px] font-bold uppercase tracking-widest mb-1">{stat.label}</p>
              <h3 className="text-3xl font-black text-black tracking-tighter">{stat.value}</h3>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 apple-card p-10 rounded-[40px]">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h3 className="text-xl font-bold text-black tracking-tight">Analiz Trafiği</h3>
                <p className="text-apple-gray text-[10px] font-bold uppercase tracking-widest mt-1">Son 7 Günlük Performans</p>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-nexus-mint rounded-full"></div>
                  <span className="text-[9px] font-bold text-apple-gray uppercase">Analizler</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="text-[9px] font-bold text-apple-gray uppercase">Hastalar</span>
                </div>
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#60a5fa" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fontWeight: 600, fill: '#94a3b8'}} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fontWeight: 600, fill: '#94a3b8'}} 
                  />
                  <Tooltip 
                    contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '15px'}}
                    itemStyle={{fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase'}}
                  />
                  <Area type="monotone" dataKey="scans" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorScans)" />
                  <Area type="monotone" dataKey="patients" stroke="#60a5fa" strokeWidth={3} fillOpacity={1} fill="url(#colorPatients)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="apple-card p-10 rounded-[40px] flex flex-col">
            <h3 className="text-xl font-bold text-black mb-8 tracking-tight">Son Aktiviteler</h3>
            <div className="flex-1 space-y-6 overflow-y-auto pr-2">
              {scanHistory.slice(-5).reverse().map((scan, i) => {
                const patient = patients.find(p => p.id === scan.patientId);
                return (
                  <div key={i} className="flex items-center gap-4 group cursor-pointer">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-100 border border-black/5">
                      <img src={scan.babyFaceUrl} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-xs font-bold text-black truncate">{patient?.name || 'Bilinmeyen Hasta'}</p>
                      <p className="text-[9px] font-bold text-apple-gray uppercase tracking-widest">{scan.createdAt} • AI Sentezi</p>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-apple-gray group-hover:text-nexus-mint transition-colors" />
                  </div>
                );
              })}
              {scanHistory.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-10">
                  <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-slate-300" />
                  </div>
                  <p className="text-[10px] font-bold text-apple-gray uppercase tracking-widest">Henüz aktivite yok</p>
                </div>
              )}
            </div>
            <button 
              onClick={() => setActiveTab('patients')}
              className="mt-8 w-full py-4 bg-slate-50 hover:bg-black hover:text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all"
            >
              Tümünü Görüntüle
            </button>
          </div>
        </div>
      </div>
    );
  }
  if (activeTab === 'studio') {
    return (
      <div className="animate-in fade-in duration-700">
        <div className="mb-10 flex justify-between items-center">
           <button 
              onClick={() => { setActiveTab('dashboard'); setSelectedPatient(null); }}
              className="px-6 py-2.5 bg-black/5 hover:bg-black hover:text-white rounded-full text-[10px] font-bold uppercase tracking-widest transition-all"
           >
              ← Paneli Dön
           </button>
           {selectedPatient && (
             <div className="text-sm font-bold text-black tracking-tight uppercase">
                Aktif Oturum: <span className="text-nexus-mint">{selectedPatient.name}</span>
             </div>
           )}
        </div>
        
        {selectedPatient ? (
          <BabyFaceGenerator 
            patient={selectedPatient} 
            onScanGenerated={onAddScan} 
            history={scanHistory.filter(s => s.patientId === selectedPatient.id)}
          />
        ) : (
          <div className="apple-card rounded-[48px] p-32 text-center">
             <h3 className="text-2xl font-bold text-black mb-4 tracking-tight">AI Stüdyo için Hasta Seçin</h3>
             <button onClick={() => setActiveTab('patients')} className="px-10 py-4 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest hover:scale-105 transition-all">Hasta Listesine Git</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-1000">
      <div className="flex justify-between items-end">
        <div>
           <p className="text-apple-gray text-xs font-semibold mb-1 uppercase tracking-widest">Klinik Kontrolü</p>
           <h2 className="text-4xl font-bold text-black tracking-tight">Hasta Kayıtları</h2>
        </div>
        <button 
          onClick={() => setShowPatientForm(!showPatientForm)}
          className="px-8 py-3 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/10"
        >
          {showPatientForm ? 'Kapat' : 'Yeni Hasta Ekle'}
        </button>
      </div>

      {showPatientForm && (
        <form onSubmit={handleSubmit} className="p-10 apple-card rounded-[32px] flex flex-wrap gap-8 items-end animate-in slide-in-from-top-4 duration-500">
          <div className="flex-1 min-w-[250px] space-y-2">
            <label className="text-[10px] font-bold text-apple-gray uppercase px-1">Hasta Adı Soyadı *</label>
            <input required className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none text-sm font-medium focus:bg-white transition-all shadow-inner" value={newPatient.name} onChange={e => setNewPatient({...newPatient, name: e.target.value})} />
          </div>
          <div className="w-40 space-y-2">
            <label className="text-[10px] font-bold text-apple-gray uppercase px-1">Telefon *</label>
            <input required type="tel" className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none text-sm font-medium focus:bg-white transition-all shadow-inner" value={newPatient.phone} onChange={e => setNewPatient({...newPatient, phone: e.target.value})} />
          </div>
          <div className="flex-1 min-w-[200px] space-y-2">
            <label className="text-[10px] font-bold text-apple-gray uppercase px-1">E-posta (Opsiyonel)</label>
            <input type="email" className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none text-sm font-medium focus:bg-white transition-all shadow-inner" value={newPatient.email} onChange={e => setNewPatient({...newPatient, email: e.target.value})} />
          </div>
          <div className="w-32 space-y-2">
            <label className="text-[10px] font-bold text-apple-gray uppercase px-1">Hafta</label>
            <input required type="number" className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none text-sm font-medium focus:bg-white transition-all shadow-inner" value={newPatient.weeksPregnant} onChange={e => setNewPatient({...newPatient, weeksPregnant: parseInt(e.target.value)})} />
          </div>
          <button type="submit" className="px-10 py-4 bg-nexus-mint text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-nexus-mint/20 hover:scale-[1.02] transition-all">
            {editingPatientId ? 'Güncelle' : 'Hastayı Kaydet'}
          </button>
        </form>
      )}

      <div className="apple-card rounded-[40px] overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[#FAFAFB] text-apple-gray text-[10px] font-bold uppercase tracking-widest border-b border-black/5">
            <tr>
              <th className="px-10 py-6">Hasta Kimliği</th>
              <th className="px-10 py-6">Gestasyonel Yaş</th>
              <th className="px-10 py-6">Durum</th>
              <th className="px-10 py-6 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[0.03]">
            {filteredPatients.map(p => (
              <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-10 py-8">
                  <div className="font-bold text-black text-base">{p.name}</div>
                  <div className="text-[10px] text-apple-gray font-medium">{p.phone}</div>
                </td>
                <td className="px-10 py-8">
                  <span className="text-black font-semibold text-xs bg-slate-100 px-3 py-1 rounded-full">{p.weeksPregnant}. Hafta</span>
                </td>
                <td className="px-10 py-8">
                   <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-nexus-mint rounded-full"></div>
                      <span className="text-[10px] font-bold text-black uppercase tracking-widest">Takipte</span>
                   </div>
                </td>
                <td className="px-10 py-8 text-right space-x-2">
                  <button 
                    onClick={() => handleEdit(p)}
                    className="px-4 py-2 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-slate-200 transition-all"
                  >
                    Düzenle
                  </button>
                  <button 
                    onClick={() => startStudio(p)}
                    className="px-6 py-2 bg-black text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:scale-105 transition-all shadow-md"
                  >
                    Stüdyoya Gir
                  </button>
                </td>
              </tr>
            ))}
            {filteredPatients.length === 0 && (
              <tr>
                <td colSpan={4} className="px-10 py-24 text-center text-apple-gray font-medium uppercase tracking-[0.2em] text-xs">Kayıtlı hasta bulunamadı.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DoctorDashboard;

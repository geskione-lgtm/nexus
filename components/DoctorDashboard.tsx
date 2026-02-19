
import React, { useState } from 'react';
import { User, Patient, ScanResult } from '../types';
import BabyFaceGenerator from './BabyFaceGenerator';

interface Props { 
  activeTab: string;
  setActiveTab: (tab: string) => void;
  doctor: User; 
  patients: Patient[]; 
  onAddPatient: (p: Patient) => void; 
  onAddScan: (s: ScanResult) => void; 
  scanHistory: ScanResult[]; 
}

const DoctorDashboard: React.FC<Props> = ({ activeTab, setActiveTab, doctor, patients, onAddPatient, onAddScan, scanHistory }) => {
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [newPatient, setNewPatient] = useState({ name: '', weeksPregnant: 20 });

  const handlePatientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddPatient({
      id: '',
      name: newPatient.name,
      weeksPregnant: newPatient.weeksPregnant,
      doctorId: doctor.id,
      lastScanDate: new Date().toISOString().split('T')[0]
    });
    setNewPatient({ name: '', weeksPregnant: 20 });
    setShowPatientForm(false);
  };

  const startStudio = (p: Patient) => {
    setSelectedPatient(p);
    setActiveTab('studio');
  };

  if (activeTab === 'studio') {
    return (
      <div className="animate-in fade-in zoom-in duration-300">
        <div className="mb-8 flex justify-between items-center">
           <button 
              onClick={() => { setActiveTab('dashboard'); setSelectedPatient(null); }}
              className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-black transition-colors"
           >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Stüdyo Oturumunu Kapat
           </button>
           {selectedPatient && (
             <div className="px-6 py-2 bg-black text-white rounded-full text-[10px] font-black uppercase tracking-widest">
                Hasta: {selectedPatient.name}
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
          <div className="bg-white rounded-[40px] p-20 text-center border border-slate-100">
             <h3 className="text-xl font-black uppercase mb-4">Önce Bir Hasta Seçin</h3>
             <p className="text-slate-400 text-sm mb-8">Görüntüleme stüdyosuna erişmek için aktif bir hasta profili gereklidir.</p>
             <button onClick={() => setActiveTab('patients')} className="px-10 py-4 bg-black text-white rounded-full text-xs font-black uppercase tracking-widest">Hasta Listesine Git</button>
          </div>
        )}
      </div>
    );
  }

  if (activeTab === 'analytics') {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
         <h2 className="text-2xl font-black uppercase tracking-tighter">İşlem Günlükleri</h2>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-[40px] border border-slate-100">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Başarı Oranı</p>
               <p className="text-4xl font-black">%99.4</p>
            </div>
            <div className="bg-white p-8 rounded-[40px] border border-slate-100">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Ortalama İşlem</p>
               <p className="text-4xl font-black">12.4s</p>
            </div>
            <div className="bg-white p-8 rounded-[40px] border border-slate-100">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Data Safe</p>
               <p className="text-4xl font-black">AKTİF</p>
            </div>
         </div>
         <div className="bg-white rounded-[40px] p-10 border border-slate-100">
            <div className="space-y-4">
               {scanHistory.map((s, i) => (
                 <div key={i} className="flex items-center justify-between text-xs py-4 border-b border-slate-50 last:border-0">
                    <span className="font-bold uppercase tracking-tight">TARAMA ID: {s.id}</span>
                    <span className="text-slate-400 font-medium">{s.createdAt}</span>
                    <span className="text-nexus-green font-black uppercase tracking-widest">TAMAMLANDI</span>
                 </div>
               ))}
               {scanHistory.length === 0 && <p className="text-center py-10 text-slate-400 font-bold uppercase tracking-widest text-xs">Henüz işlem kaydı bulunmuyor.</p>}
            </div>
         </div>
      </div>
    );
  }

  // Dashboard & Patient List Tabs
  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      {(activeTab === 'dashboard' || activeTab === 'patients') && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <NexusStatMini title="Kayıtlı Hastalar" value={patients.length} icon="👤" />
            <NexusStatMini title="İşlenen Taramalar" value={scanHistory.length} icon="💾" />
            <NexusStatMini title="Lisans Kredisi" value="Sınırsız" icon="🔋" />
            <NexusStatMini title="Sistem Sağlığı" value="100%" icon="🟢" />
          </div>

          <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-10 border-b border-slate-50 flex justify-between items-center">
              <div>
                 <h2 className="text-2xl font-black tracking-tighter uppercase text-black">Hasta Veritabanı</h2>
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Yetkili Bakım Profilleri</p>
              </div>
              <button 
                onClick={() => setShowPatientForm(!showPatientForm)}
                className="px-8 py-3 bg-black text-white rounded-full text-xs font-black uppercase tracking-widest hover:scale-105 transition-transform"
              >
                {showPatientForm ? 'Formu Kapat' : '+ Yeni Hasta Profili'}
              </button>
            </div>

            {showPatientForm && (
              <form onSubmit={handlePatientSubmit} className="p-10 bg-[#f9f9f9] border-b border-slate-100 flex flex-wrap gap-6 items-end animate-in slide-in-from-top duration-300">
                <div className="flex-1 min-w-[250px]">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Hasta Ad Soyad</label>
                  <input required placeholder="Resmi Kimlik Adı" className="w-full px-6 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-nexus-green outline-none" value={newPatient.name} onChange={e => setNewPatient({...newPatient, name: e.target.value})} />
                </div>
                <div className="w-40">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Gebelik Haftası</label>
                  <input required type="number" min="1" max="42" className="w-full px-6 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-nexus-green outline-none" value={newPatient.weeksPregnant} onChange={e => setNewPatient({...newPatient, weeksPregnant: parseInt(e.target.value)})} />
                </div>
                <button type="submit" className="px-10 py-4 bg-nexus-green text-white rounded-2xl font-black uppercase tracking-widest text-xs">Oluştur</button>
              </form>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#fafafa] text-slate-400 text-[10px] font-black uppercase tracking-[0.15em]">
                  <tr>
                    <th className="px-10 py-6">Hasta Kimliği</th>
                    <th className="px-10 py-6">Gebelik Süreci</th>
                    <th className="px-10 py-6">Son İşlem</th>
                    <th className="px-10 py-6">Durum</th>
                    <th className="px-10 py-6">Aksiyon</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {patients.map(p => (
                    <tr key={p.id} className="hover:bg-[#fcfcfc] transition-colors group">
                      <td className="px-10 py-8 font-bold text-black uppercase text-sm tracking-tight">{p.name}</td>
                      <td className="px-10 py-8 text-slate-600 font-bold text-sm">{p.weeksPregnant} HAFTA</td>
                      <td className="px-10 py-8 text-slate-400 text-xs font-medium">{p.lastScanDate}</td>
                      <td className="px-10 py-8">
                        <span className="px-3 py-1 bg-black text-white rounded-full text-[9px] font-black uppercase tracking-widest">Aktif Takip</span>
                      </td>
                      <td className="px-10 py-8">
                        <button 
                          onClick={() => startStudio(p)}
                          className="px-8 py-3 bg-white border border-slate-200 text-black rounded-full text-xs font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all shadow-sm"
                        >
                          Stüdyoyu Başlat
                        </button>
                      </td>
                    </tr>
                  ))}
                  {patients.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-10 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">Henüz kayıtlı hasta profili bulunmuyor.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const NexusStatMini: React.FC<{ title: string; value: string | number; icon: string }> = ({ title, value, icon }) => (
  <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex justify-between items-center group hover:border-nexus-green transition-colors">
    <div>
      <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">{title}</p>
      <p className="text-2xl font-black text-black tracking-tight">{value}</p>
    </div>
    <div className="text-xl bg-[#f9f9f9] w-10 h-10 flex items-center justify-center rounded-full group-hover:bg-nexus-green group-hover:text-white transition-colors">{icon}</div>
  </div>
);

export default DoctorDashboard;

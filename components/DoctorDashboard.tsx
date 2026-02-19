
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
              className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
           >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Stüdyodan Çık
           </button>
           {selectedPatient && (
             <div className="px-5 py-2.5 bg-slate-950 text-white rounded-full text-[10px] font-bold uppercase tracking-widest shadow-xl">
                Aktif Hasta: {selectedPatient.name}
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
          <div className="bg-white rounded-[32px] p-20 text-center border border-slate-100 shadow-sm">
             <h3 className="text-xl font-bold text-slate-900 mb-2">Hasta Seçimi Gerekli</h3>
             <p className="text-slate-400 text-sm mb-10 font-medium">Görüntüleme stüdyosunu kullanmak için listeden bir hasta seçin.</p>
             <button onClick={() => setActiveTab('patients')} className="px-10 py-4 bg-slate-950 text-white rounded-full text-[11px] font-bold uppercase tracking-widest hover:bg-black transition-all shadow-lg">Hastalarımı Listele</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <NexusStatMini title="Kayıtlı Hastalar" value={patients.length} icon="👤" />
        <NexusStatMini title="Toplam Analiz" value={scanHistory.length} icon="💾" />
        <NexusStatMini title="Lisans" value="Premium" icon="🔋" />
        <NexusStatMini title="Bulut Durumu" value="Aktif" icon="🟢" />
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-white">
          <div>
             <h2 className="text-lg font-bold tracking-tight text-slate-900 uppercase">Hasta Kayıtları</h2>
             <p className="text-xs font-semibold text-slate-400 mt-1">Takip altındaki medikal profiller</p>
          </div>
          <button 
            onClick={() => setShowPatientForm(!showPatientForm)}
            className="px-6 py-2.5 bg-slate-950 text-white rounded-full text-[11px] font-bold uppercase tracking-widest hover:bg-black transition-all shadow-md active:scale-95"
          >
            {showPatientForm ? 'Vazgeç' : '+ Yeni Hasta Kaydı'}
          </button>
        </div>

        {showPatientForm && (
          <form onSubmit={handlePatientSubmit} className="p-8 bg-slate-50 border-b border-slate-100 flex flex-wrap gap-6 items-end animate-in slide-in-from-top duration-300">
            <div className="flex-1 min-w-[240px]">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Hasta Adı Soyadı</label>
              <input required placeholder="Ad Soyad" className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-nexus-green/20 focus:border-nexus-green outline-none text-sm font-medium" value={newPatient.name} onChange={e => setNewPatient({...newPatient, name: e.target.value})} />
            </div>
            <div className="w-40">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Gebelik Haftası</label>
              <input required type="number" min="1" max="42" className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-nexus-green/20 focus:border-nexus-green outline-none text-sm font-medium" value={newPatient.weeksPregnant} onChange={e => setNewPatient({...newPatient, weeksPregnant: parseInt(e.target.value)})} />
            </div>
            <button type="submit" className="px-10 py-3.5 bg-nexus-green text-white rounded-2xl font-bold uppercase tracking-widest text-[11px] shadow-lg shadow-nexus-green/20">Kaydı Tamamla</button>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-8 py-5">Hasta Tanımı</th>
                <th className="px-8 py-5">Hafta Bilgisi</th>
                <th className="px-8 py-5">Son İşlem</th>
                <th className="px-8 py-5 text-right">Kontrol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {patients.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/30 transition-colors group">
                  <td className="px-8 py-6 font-semibold text-slate-900 text-sm tracking-tight">{p.name}</td>
                  <td className="px-8 py-6">
                    <span className="text-slate-600 font-bold text-xs bg-slate-100 px-2 py-0.5 rounded-md">{p.weeksPregnant}. HAFTA</span>
                  </td>
                  <td className="px-8 py-6 text-slate-400 text-xs font-semibold tracking-tight">{p.lastScanDate}</td>
                  <td className="px-8 py-6 text-right">
                    <button 
                      onClick={() => startStudio(p)}
                      className="px-5 py-2 bg-white border border-slate-200 text-slate-900 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-slate-950 hover:text-white transition-all shadow-sm"
                    >
                      AI Sentezleyici
                    </button>
                  </td>
                </tr>
              ))}
              {patients.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center text-slate-300 font-bold uppercase tracking-widest text-[11px]">Kayıtlı hastanız bulunmamaktadır.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const NexusStatMini: React.FC<{ title: string; value: string | number; icon: string }> = ({ title, value, icon }) => (
  <div className="bg-white p-7 rounded-[28px] border border-slate-100 shadow-sm flex justify-between items-center group hover:border-nexus-green/50 transition-all">
    <div>
      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1.5">{title}</p>
      <p className="text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
    </div>
    <div className="text-lg bg-slate-50 w-11 h-11 flex items-center justify-center rounded-2xl group-hover:bg-nexus-green group-hover:text-white transition-all shadow-sm">{icon}</div>
  </div>
);

export default DoctorDashboard;

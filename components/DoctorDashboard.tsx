
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
             <div className="px-5 py-2 bg-slate-900 text-white rounded-full text-[10px] font-bold uppercase tracking-widest">
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
          <div className="bg-white rounded-[32px] p-16 text-center border border-slate-100">
             <h3 className="text-lg font-bold text-slate-900 mb-2">Hasta Seçimi Gerekli</h3>
             <p className="text-slate-400 text-sm mb-8 font-medium">Görüntüleme için lütfen hasta listesinden bir seçim yapın.</p>
             <button onClick={() => setActiveTab('patients')} className="px-8 py-3 bg-slate-900 text-white rounded-full text-[11px] font-bold uppercase tracking-widest hover:bg-black transition-colors">Hastaları Listele</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <NexusStatMini title="Kayıtlı Hastalar" value={patients.length} icon="👤" />
        <NexusStatMini title="Toplam İşlem" value={scanHistory.length} icon="💾" />
        <NexusStatMini title="Lisans Kredisi" value="Sınırsız" icon="🔋" />
        <NexusStatMini title="Sistem Durumu" value="Aktif" icon="🟢" />
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center">
          <div>
             <h2 className="text-lg font-bold tracking-tight text-slate-900 uppercase">Hasta Veritabanı</h2>
             <p className="text-xs font-medium text-slate-400 mt-1">Takip altındaki hasta profilleri</p>
          </div>
          <button 
            onClick={() => setShowPatientForm(!showPatientForm)}
            className="px-6 py-2.5 bg-slate-900 text-white rounded-full text-[11px] font-bold uppercase tracking-widest hover:bg-black transition-colors"
          >
            {showPatientForm ? 'Kapat' : '+ Yeni Hasta Kaydı'}
          </button>
        </div>

        {showPatientForm && (
          <form onSubmit={handlePatientSubmit} className="p-8 bg-[#f9f9f9] border-b border-slate-100 flex flex-wrap gap-4 items-end animate-in slide-in-from-top duration-300">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Ad Soyad</label>
              <input required placeholder="Hasta Adı" className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-nexus-green outline-none text-sm" value={newPatient.name} onChange={e => setNewPatient({...newPatient, name: e.target.value})} />
            </div>
            <div className="w-32">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Hafta</label>
              <input required type="number" min="1" max="42" className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-nexus-green outline-none text-sm" value={newPatient.weeksPregnant} onChange={e => setNewPatient({...newPatient, weeksPregnant: parseInt(e.target.value)})} />
            </div>
            <button type="submit" className="px-8 py-3 bg-nexus-green text-white rounded-xl font-bold uppercase tracking-widest text-[11px]">Kaydet</button>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#fafafa] text-slate-400 text-[11px] font-bold uppercase tracking-wider">
              <tr>
                <th className="px-8 py-5">Hasta Adı</th>
                <th className="px-8 py-5">Gebelik Haftası</th>
                <th className="px-8 py-5">Son Tarama</th>
                <th className="px-8 py-5 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {patients.map(p => (
                <tr key={p.id} className="hover:bg-[#fcfcfc] transition-colors group">
                  <td className="px-8 py-6 font-semibold text-slate-900 text-sm tracking-tight">{p.name}</td>
                  <td className="px-8 py-6 text-slate-600 font-bold text-xs">{p.weeksPregnant}. HAFTA</td>
                  <td className="px-8 py-6 text-slate-400 text-xs font-medium">{p.lastScanDate}</td>
                  <td className="px-8 py-6 text-right">
                    <button 
                      onClick={() => startStudio(p)}
                      className="px-5 py-2 bg-white border border-slate-200 text-slate-900 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all"
                    >
                      Sentezleyiciyi Aç
                    </button>
                  </td>
                </tr>
              ))}
              {patients.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-8 py-16 text-center text-slate-400 font-semibold uppercase tracking-widest text-[11px]">Kayıtlı hasta bulunmuyor.</td>
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
  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex justify-between items-center group hover:border-nexus-green transition-colors">
    <div>
      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1.5">{title}</p>
      <p className="text-xl font-bold text-slate-900 tracking-tight">{value}</p>
    </div>
    <div className="text-lg bg-slate-50 w-10 h-10 flex items-center justify-center rounded-full group-hover:bg-nexus-green group-hover:text-white transition-colors">{icon}</div>
  </div>
);

export default DoctorDashboard;
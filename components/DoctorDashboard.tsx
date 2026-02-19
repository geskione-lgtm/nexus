
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

  const startStudio = (p: Patient) => {
    setSelectedPatient(p);
    setActiveTab('studio');
  };

  if (activeTab === 'studio') {
    return (
      <div className="animate-in fade-in duration-700">
        <div className="mb-10 flex justify-between items-center">
           <button 
              onClick={() => { setActiveTab('dashboard'); setSelectedPatient(null); }}
              className="px-6 py-2.5 bg-black/5 hover:bg-black hover:text-white rounded-full text-[10px] font-bold uppercase tracking-widest transition-all"
           >
              ← Dashboard
           </button>
           {selectedPatient && (
             <div className="text-sm font-bold text-black tracking-tight uppercase">
                Active Session: <span className="text-nexus-mint">{selectedPatient.name}</span>
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
             <h3 className="text-2xl font-bold text-black mb-4 tracking-tight">Select Patient for Studio</h3>
             <button onClick={() => setActiveTab('patients')} className="px-10 py-4 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest hover:scale-105 transition-all">Go to Patients</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-1000">
      <div className="flex justify-between items-end">
        <div>
           <p className="text-apple-gray text-xs font-semibold mb-1 uppercase tracking-widest">Medical Control</p>
           <h2 className="text-4xl font-bold text-black tracking-tight">Patient Records</h2>
        </div>
        <button 
          onClick={() => setShowPatientForm(!showPatientForm)}
          className="px-8 py-3 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/10"
        >
          {showPatientForm ? 'Close' : 'Add Patient'}
        </button>
      </div>

      {showPatientForm && (
        <form onSubmit={(e) => { e.preventDefault(); onAddPatient({...newPatient, id: '', doctorId: doctor.id, lastScanDate: new Date().toLocaleDateString()}); setShowPatientForm(false); }} className="p-10 apple-card rounded-[32px] flex flex-wrap gap-8 items-end animate-in slide-in-from-top-4 duration-500">
          <div className="flex-1 min-w-[300px] space-y-2">
            <label className="text-[10px] font-bold text-apple-gray uppercase px-1">Full Name</label>
            <input required className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none text-sm font-medium focus:bg-white transition-all" value={newPatient.name} onChange={e => setNewPatient({...newPatient, name: e.target.value})} />
          </div>
          <div className="w-40 space-y-2">
            <label className="text-[10px] font-bold text-apple-gray uppercase px-1">Weeks</label>
            <input required type="number" className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none text-sm font-medium focus:bg-white transition-all" value={newPatient.weeksPregnant} onChange={e => setNewPatient({...newPatient, weeksPregnant: parseInt(e.target.value)})} />
          </div>
          <button type="submit" className="px-10 py-4 bg-nexus-mint text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-nexus-mint/20 hover:scale-[1.02] transition-all">Save Patient</button>
        </form>
      )}

      <div className="apple-card rounded-[40px] overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[#FAFAFB] text-apple-gray text-[10px] font-bold uppercase tracking-widest border-b border-black/5">
            <tr>
              <th className="px-10 py-6">Patient Name</th>
              <th className="px-10 py-6">Gestational Age</th>
              <th className="px-10 py-6">Status</th>
              <th className="px-10 py-6 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[0.03]">
            {patients.map(p => (
              <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-10 py-8 font-bold text-black text-base">{p.name}</td>
                <td className="px-10 py-8">
                  <span className="text-black font-semibold text-xs bg-slate-100 px-3 py-1 rounded-full">{p.weeksPregnant} Weeks</span>
                </td>
                <td className="px-10 py-8">
                   <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-nexus-mint rounded-full"></div>
                      <span className="text-[10px] font-bold text-black uppercase tracking-widest">Monitored</span>
                   </div>
                </td>
                <td className="px-10 py-8 text-right">
                  <button 
                    onClick={() => startStudio(p)}
                    className="px-6 py-2 bg-black text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:scale-105 transition-all shadow-md"
                  >
                    Enter Studio
                  </button>
                </td>
              </tr>
            ))}
            {patients.length === 0 && (
              <tr>
                <td colSpan={4} className="px-10 py-24 text-center text-apple-gray font-medium uppercase tracking-[0.2em] text-xs">No patients found in records.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DoctorDashboard;

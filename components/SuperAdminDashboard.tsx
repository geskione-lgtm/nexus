
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
    <div className="space-y-12 animate-in fade-in duration-1000">
      {/* Header Info */}
      <div className="flex justify-between items-end">
        <div>
           <p className="text-apple-gray text-xs font-semibold mb-1 uppercase tracking-widest">Network Overview</p>
           <h2 className="text-4xl font-bold text-black tracking-tight">Active Clinics</h2>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="px-8 py-3 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/10"
        >
          {showForm ? 'Cancel' : 'New Clinic'}
        </button>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <StatItem title="Total Nodes" value={doctors.length.toString()} trend="+12% this week" />
        <StatItem title="Compute Usage" value="1.4TB" trend="Optimal" />
        <StatItem title="Monthly MRR" value={`$${(doctors.length * 1420).toLocaleString()}`} trend="Growth" />
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="p-10 apple-card rounded-[32px] grid grid-cols-1 md:grid-cols-4 gap-6 animate-in slide-in-from-top-4 duration-500">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-apple-gray uppercase px-1">Doctor Name</label>
            <input required className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none text-sm font-medium focus:bg-white transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-apple-gray uppercase px-1">Institutional Email</label>
            <input required type="email" className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none text-sm font-medium focus:bg-white transition-all" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-apple-gray uppercase px-1">Clinic Name</label>
            <input required className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none text-sm font-medium focus:bg-white transition-all" value={formData.clinicName} onChange={e => setFormData({...formData, clinicName: e.target.value})} />
          </div>
          <div className="flex flex-col justify-end">
             <button type="submit" className="w-full py-4 bg-black text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-colors">Add Doctor</button>
          </div>
        </form>
      )}

      {/* Table Area */}
      <div className="apple-card rounded-[40px] overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[#FAFAFB] text-apple-gray text-[10px] font-bold uppercase tracking-widest border-b border-black/5">
            <tr>
              <th className="px-10 py-6">Medical Provider</th>
              <th className="px-10 py-6">Institution</th>
              <th className="px-10 py-6">Tier</th>
              <th className="px-10 py-6 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[0.03]">
            {doctors.map(doctor => (
              <tr key={doctor.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-10 py-8">
                  <div className="font-bold text-black text-base">{doctor.name}</div>
                  <div className="text-xs text-apple-gray font-medium mt-0.5">{doctor.email}</div>
                </td>
                <td className="px-10 py-8 text-apple-gray font-semibold text-xs uppercase tracking-tight">{doctor.clinicName}</td>
                <td className="px-10 py-8">
                  <span className="px-3 py-1 bg-black text-white rounded-full text-[9px] font-bold uppercase tracking-widest">
                    {PACKAGES.find(p => p.id === doctor.packageId)?.name}
                  </span>
                </td>
                <td className="px-10 py-8 text-right">
                   <div className="inline-flex items-center gap-2">
                      <span className="w-2 h-2 bg-nexus-mint rounded-full"></span>
                      <span className="text-[10px] font-bold text-black uppercase tracking-widest">Secure</span>
                   </div>
                </td>
              </tr>
            ))}
            {doctors.length === 0 && (
              <tr>
                <td colSpan={4} className="px-10 py-24 text-center text-apple-gray font-medium uppercase tracking-[0.2em] text-xs">No active nodes registered.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const StatItem: React.FC<{ title: string; value: string; trend: string }> = ({ title, value, trend }) => (
  <div className="apple-card p-10 rounded-[40px] relative overflow-hidden group">
    <p className="text-[10px] font-bold text-apple-gray uppercase tracking-widest mb-3">{title}</p>
    <p className="text-4xl font-bold text-black tracking-tight mb-4">{value}</p>
    <p className="text-[10px] font-bold text-nexus-mint uppercase tracking-widest">{trend}</p>
    <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-100 transition-opacity">
       <div className="w-10 h-10 bg-black/5 rounded-full flex items-center justify-center">
          <div className="w-2 h-2 bg-black rounded-full"></div>
       </div>
    </div>
  </div>
);

export default SuperAdminDashboard;

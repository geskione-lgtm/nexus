
import React, { useEffect, useState } from 'react';
import { User, UserRole } from '../types';
import { PACKAGES } from '../constants';
import { DatabaseService } from '../services/databaseService';

interface Props { 
  activeTab: string;
}

const SuperAdminDashboard: React.FC<Props> = ({ activeTab }) => {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const data = await DatabaseService.getDoctorsWithStats();
      setDoctors(data);
      setLoading(false);
    };
    fetch();
  }, [activeTab]);

  if (activeTab === 'revenue') {
    return (
      <div className="space-y-12 animate-in fade-in duration-700">
        <h2 className="text-4xl font-bold text-black tracking-tight">Finansal Analiz</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="apple-card p-10 rounded-[40px]">
              <p className="text-[10px] font-bold text-apple-gray uppercase tracking-widest mb-4">Aylık Tahmini Gelir (MRR)</p>
              <p className="text-5xl font-bold text-black tracking-tighter mb-10">₺{(doctors.reduce((acc, d) => acc + (PACKAGES.find(p => p.id === d.packageId)?.price || 0), 0)).toLocaleString()}</p>
              <div className="h-40 flex items-end gap-2">
                 {[40, 70, 55, 90, 85, 100, 75].map((h, i) => (
                   <div key={i} className="flex-1 bg-black/5 rounded-t-xl relative group overflow-hidden">
                      <div className="absolute bottom-0 w-full bg-black transition-all duration-1000" style={{height: `${h}%`}}></div>
                   </div>
                 ))}
              </div>
           </div>
           <div className="apple-card p-10 rounded-[40px]">
              <p className="text-[10px] font-bold text-apple-gray uppercase tracking-widest mb-4">Lisans Dağılımı</p>
              <div className="space-y-8 pt-4">
                 {PACKAGES.map(pkg => (
                    <div key={pkg.id}>
                       <div className="flex justify-between text-xs font-bold mb-2">
                          <span className="text-black uppercase">{pkg.name}</span>
                          <span className="text-apple-gray">{doctors.filter(d => d.packageId === pkg.id).length} Klinik</span>
                       </div>
                       <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                          <div className="h-full bg-black rounded-full" style={{width: `${(doctors.filter(d => d.packageId === pkg.id).length / (doctors.length || 1)) * 100}%`}}></div>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-1000">
      {/* Stat Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <StatCard title="Toplam Kayıtlı Klinik" value={doctors.length.toString()} label="Aktif Node" />
        <StatCard title="Toplam Hasta Havuzu" value={doctors.reduce((acc, d) => acc + d.patientCount, 0).toString()} label="Data ID" />
        <StatCard title="Sistem Sağlığı" value="%99.9" label="Stable Core" />
      </div>

      {/* Doctor List */}
      <div className="space-y-6">
        <h3 className="text-2xl font-bold text-black tracking-tight px-2">Klinik Ağı</h3>
        <div className="apple-card rounded-[40px] overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-[#FAFAFB] text-apple-gray text-[10px] font-bold uppercase tracking-widest border-b border-black/5">
              <tr>
                <th className="px-10 py-6">Klinik & Doktor ID</th>
                <th className="px-10 py-6">Lisans Tipi</th>
                <th className="px-10 py-6">Hasta Sayısı</th>
                <th className="px-10 py-6 text-right">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.03]">
              {doctors.map(doctor => (
                <tr key={doctor.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-10 py-8">
                    <div className="font-bold text-black text-base">{doctor.clinicName}</div>
                    <div className="text-[10px] text-apple-gray font-bold uppercase tracking-widest mt-1">ID: {doctor.id.slice(0, 13)}...</div>
                  </td>
                  <td className="px-10 py-8">
                    <span className="px-3 py-1 bg-black text-white rounded-full text-[9px] font-bold uppercase tracking-widest">
                      {PACKAGES.find(p => p.id === doctor.packageId)?.name}
                    </span>
                  </td>
                  <td className="px-10 py-8 font-bold text-black text-sm">
                    {doctor.patientCount} <span className="text-[10px] text-apple-gray font-medium uppercase ml-1">Profil</span>
                  </td>
                  <td className="px-10 py-8 text-right">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-bold uppercase tracking-widest">
                       <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                       Aktif
                    </div>
                  </td>
                </tr>
              ))}
              {doctors.length === 0 && !loading && (
                <tr>
                  <td colSpan={4} className="px-10 py-24 text-center text-apple-gray font-medium uppercase tracking-[0.2em] text-xs">Henüz kayıtlı klinik bulunmamaktadır.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: string; label: string }> = ({ title, value, label }) => (
  <div className="apple-card p-10 rounded-[40px]">
    <p className="text-[10px] font-bold text-apple-gray uppercase tracking-widest mb-3">{title}</p>
    <p className="text-4xl font-bold text-black tracking-tighter mb-4">{value}</p>
    <p className="text-[10px] font-bold text-black/20 uppercase tracking-[0.3em]">{label}</p>
  </div>
);

export default SuperAdminDashboard;


import React, { useEffect, useState } from 'react';
import { User, UserRole, Package } from '../types';
import { PACKAGES as INITIAL_PACKAGES } from '../constants';
import { DatabaseService } from '../services/databaseService';

interface Props { 
  activeTab: string;
}

const SuperAdminDashboard: React.FC<Props> = ({ activeTab }) => {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [packages, setPackages] = useState<Package[]>(INITIAL_PACKAGES);
  const [loading, setLoading] = useState(true);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [showPackageForm, setShowPackageForm] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const data = await DatabaseService.getDoctorsWithStats();
      setDoctors(data);
      setLoading(false);
    };
    fetch();
  }, [activeTab]);

  const handleSavePackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPackage) {
      setPackages(packages.map(p => p.id === editingPackage.id ? editingPackage : p));
      setEditingPackage(null);
      setShowPackageForm(false);
    }
  };

  const addNewFeature = () => {
    if (editingPackage) {
      setEditingPackage({
        ...editingPackage,
        features: [...editingPackage.features, ' Yeni Özellik']
      });
    }
  };

  const removeFeature = (index: number) => {
    if (editingPackage) {
      setEditingPackage({
        ...editingPackage,
        features: editingPackage.features.filter((_, i) => i !== index)
      });
    }
  };

  if (activeTab === 'packages') {
    return (
      <div className="space-y-12 animate-in fade-in duration-700">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-apple-gray text-xs font-semibold mb-1 uppercase tracking-widest">Abonelik Yönetimi</p>
            <h2 className="text-4xl font-bold text-black tracking-tight">Lisans Paketleri</h2>
          </div>
          {!showPackageForm && (
            <button 
              onClick={() => {
                setEditingPackage({ id: `pkg_${Date.now()}`, name: '', price: 0, limit: 100, features: [] });
                setShowPackageForm(true);
              }}
              className="px-8 py-3 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-black/10"
            >
              Yeni Paket Ekle
            </button>
          )}
        </div>

        {showPackageForm && editingPackage && (
          <div className="apple-card p-10 rounded-[40px] animate-in slide-in-from-top-4 duration-500">
            <h3 className="text-xl font-bold mb-8 text-black">Paket Detaylarını Düzenle</h3>
            <form onSubmit={handleSavePackage} className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-apple-gray uppercase px-1">Paket Adı</label>
                  <input required className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none text-sm font-medium focus:bg-white transition-all shadow-inner" 
                    value={editingPackage.name} onChange={e => setEditingPackage({...editingPackage, name: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-apple-gray uppercase px-1">Aylık Fiyat (₺)</label>
                    <input required type="number" className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none text-sm font-medium focus:bg-white transition-all shadow-inner" 
                      value={editingPackage.price} onChange={e => setEditingPackage({...editingPackage, price: parseInt(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-apple-gray uppercase px-1">Analiz Limiti</label>
                    <input required type="number" className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none text-sm font-medium focus:bg-white transition-all shadow-inner" 
                      value={editingPackage.limit} onChange={e => setEditingPackage({...editingPackage, limit: parseInt(e.target.value)})} />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-apple-gray uppercase px-1 flex justify-between">
                    Paket Özellikleri
                    <button type="button" onClick={addNewFeature} className="text-nexus-mint hover:underline">+ Ekle</button>
                  </label>
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {editingPackage.features.map((feat, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input className="flex-1 px-4 py-3 bg-slate-50 rounded-xl border-none text-xs font-medium focus:bg-white transition-all shadow-inner" 
                          value={feat} onChange={e => {
                            const newFeats = [...editingPackage.features];
                            newFeats[idx] = e.target.value;
                            setEditingPackage({...editingPackage, features: newFeats});
                          }} />
                        <button type="button" onClick={() => removeFeature(idx)} className="p-2 text-red-400 hover:text-red-600">×</button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="submit" className="flex-1 py-4 bg-black text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-colors">Kaydet</button>
                  <button type="button" onClick={() => setShowPackageForm(false)} className="px-8 py-4 bg-slate-100 text-black rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-colors">Vazgeç</button>
                </div>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {packages.map(pkg => (
            <div key={pkg.id} className="apple-card p-10 rounded-[40px] flex flex-col relative group">
              <div className="mb-8">
                <p className="text-[10px] font-bold text-apple-gray uppercase tracking-widest mb-2">{pkg.name}</p>
                <p className="text-3xl font-bold text-black tracking-tighter">₺{pkg.price.toLocaleString()}<span className="text-xs text-apple-gray font-medium">/ay</span></p>
              </div>
              <ul className="space-y-3 flex-1 mb-10">
                {pkg.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-[11px] font-semibold text-slate-600">
                    <div className="w-1 h-1 bg-nexus-mint rounded-full"></div> {f}
                  </li>
                ))}
              </ul>
              <div className="pt-6 border-t border-black/5 flex justify-between items-center">
                 <p className="text-[10px] font-bold text-apple-gray uppercase tracking-widest">Limit: {pkg.limit} İşlem</p>
                 <button 
                  onClick={() => { setEditingPackage(pkg); setShowPackageForm(true); }}
                  className="text-[10px] font-bold text-black uppercase tracking-widest hover:underline"
                 >
                   Düzenle
                 </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activeTab === 'revenue') {
    return (
      <div className="space-y-12 animate-in fade-in duration-700">
        <h2 className="text-4xl font-bold text-black tracking-tight">Finansal Analiz</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="apple-card p-10 rounded-[40px]">
              <p className="text-[10px] font-bold text-apple-gray uppercase tracking-widest mb-4">Aylık Tahmini Gelir (MRR)</p>
              <p className="text-5xl font-bold text-black tracking-tighter mb-10">₺{(doctors.reduce((acc, d) => acc + (packages.find(p => p.id === d.packageId)?.price || 0), 0)).toLocaleString()}</p>
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
                 {packages.map(pkg => (
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
                      {packages.find(p => p.id === doctor.packageId)?.name}
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


import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { User, UserRole, Package } from '../types';
import { PACKAGES as INITIAL_PACKAGES } from '../constants';
import { DatabaseService } from '../services/databaseService';
import { 
  Building2, 
  Users, 
  Activity, 
  TrendingUp, 
  Plus, 
  ShieldCheck, 
  CreditCard,
  ArrowRight,
  MoreHorizontal,
  CheckCircle2
} from 'lucide-react';
import { KpiCard } from './ui/KpiCard';
import { ChartCard } from './ui/ChartCard';
import { DataTableCard } from './ui/DataTableCard';
import { SoftCard } from './ui/SoftCard';
import { EmptyState } from './ui/EmptyState';

interface Props { 
  activeTab: string;
}

const SuperAdminDashboard: React.FC<Props> = ({ activeTab }) => {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [allPatients, setAllPatients] = useState<any[]>([]);
  const [packages, setPackages] = useState<Package[]>(INITIAL_PACKAGES);
  const [loading, setLoading] = useState(true);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [showPackageForm, setShowPackageForm] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      if (activeTab === 'dashboard' || activeTab === 'network') {
        const data = await DatabaseService.getDoctorsWithStats();
        setDoctors(data);
      } else if (activeTab === 'patients') {
        const data = await DatabaseService.getAllPatientsWithDoctorInfo();
        setAllPatients(data);
      }
      setLoading(false);
    };
    fetch();
  }, [activeTab]);

  const maskName = (name: string) => {
    return name.split(' ').map(part => {
      if (!part) return '';
      if (part.length <= 1) return part;
      return part[0] + '.'.repeat(part.length - 1);
    }).join(' ');
  };

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
      <div className="space-y-10">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <h2 className="text-4xl font-black tracking-tighter text-text-primary">Lisans Paketleri</h2>
            <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.25em]">Abonelik ve Limit Yönetimi</p>
          </div>
          {!showPackageForm && (
            <button 
              onClick={() => {
                setEditingPackage({ id: `pkg_${Date.now()}`, name: '', price: 0, limit: 100, features: [] });
                setShowPackageForm(true);
              }}
              className="px-10 py-4 bg-text-primary text-white rounded-full text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-black/20 flex items-center gap-3"
            >
              <Plus className="w-4 h-4" /> Yeni Paket Ekle
            </button>
          )}
        </div>

        {showPackageForm && editingPackage && (
          <SoftCard className="animate-in slide-in-from-top-4 duration-500">
            <h3 className="text-xl font-black mb-10 text-text-primary tracking-tight">Paket Detaylarını Düzenle</h3>
            <form onSubmit={handleSavePackage} className="grid grid-cols-1 xl:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest ml-1">Paket Adı</label>
                  <input required className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all" 
                    value={editingPackage.name} onChange={e => setEditingPackage({...editingPackage, name: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest ml-1">Aylık Fiyat (₺)</label>
                    <input required type="number" className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all" 
                      value={editingPackage.price} onChange={e => setEditingPackage({...editingPackage, price: parseInt(e.target.value)})} />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest ml-1">Analiz Limiti</label>
                    <input required type="number" className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all" 
                      value={editingPackage.limit} onChange={e => setEditingPackage({...editingPackage, limit: parseInt(e.target.value)})} />
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest ml-1 flex justify-between">
                    Paket Özellikleri
                    <button type="button" onClick={addNewFeature} className="text-primary hover:underline font-black">+ Ekle</button>
                  </label>
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-4 scrollbar-hide">
                    {editingPackage.features.map((feat, idx) => (
                      <div key={idx} className="flex gap-3">
                        <input className="flex-1 px-5 py-3 bg-slate-50 rounded-xl border-none text-xs font-bold focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all" 
                          value={feat} onChange={e => {
                            const newFeats = [...editingPackage.features];
                            newFeats[idx] = e.target.value;
                            setEditingPackage({...editingPackage, features: newFeats});
                          }} />
                        <button type="button" onClick={() => removeFeature(idx)} className="w-10 h-10 flex items-center justify-center text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors">×</button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-4 pt-6">
                  <button type="submit" className="flex-1 py-4 bg-text-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition-all shadow-xl shadow-black/10">Kaydet</button>
                  <button type="button" onClick={() => setShowPackageForm(false)} className="px-10 py-4 bg-slate-100 text-text-primary rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">Vazgeç</button>
                </div>
              </div>
            </form>
          </SoftCard>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {packages.map(pkg => (
            <SoftCard key={pkg.id} className="relative group flex flex-col h-full">
              <div className="mb-10">
                <div className="flex justify-between items-start mb-6">
                  <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.25em]">{pkg.name}</p>
                  <div className="p-2 bg-primary/5 rounded-xl text-primary">
                    <CreditCard className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-4xl font-black text-text-primary tracking-tighter">
                  ₺{pkg.price.toLocaleString()}
                  <span className="text-xs text-text-secondary font-bold uppercase tracking-widest ml-2 opacity-40">/ay</span>
                </h3>
              </div>
              
              <ul className="space-y-4 flex-1 mb-12">
                {pkg.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-xs font-bold text-text-secondary">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    <span className="tracking-tight">{f}</span>
                  </li>
                ))}
              </ul>
              
              <div className="pt-8 border-t border-border-subtle flex justify-between items-center">
                 <div className="space-y-1">
                   <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest opacity-40">İşlem Limiti</p>
                   <p className="text-sm font-black text-text-primary tracking-tight">{pkg.limit} Analiz</p>
                 </div>
                 <button 
                  onClick={() => { setEditingPackage(pkg); setShowPackageForm(true); }}
                  className="w-10 h-10 rounded-full bg-slate-50 border border-border-subtle flex items-center justify-center hover:bg-text-primary hover:text-white transition-all group"
                 >
                   <MoreHorizontal className="w-4 h-4" />
                 </button>
              </div>
            </SoftCard>
          ))}
        </div>
      </div>
    );
  }

  if (activeTab === 'patients') {
    return (
      <div className="space-y-10">
        <div className="space-y-1">
          <h2 className="text-4xl font-black tracking-tighter text-text-primary">Global Hasta Havuzu</h2>
          <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.25em]">Maskelenmiş Anonim Veri Seti</p>
        </div>

        <DataTableCard 
          title="Tüm Kayıtlar" 
          subtitle={`${allPatients.length} Toplam Profil`}
        >
          <table className="w-full text-left">
            <thead className="text-[10px] font-black text-text-secondary uppercase tracking-widest border-b border-border-subtle">
              <tr>
                <th className="px-10 py-6">Hasta Kimliği (Maskeli)</th>
                <th className="px-10 py-6">Bağlı Klinik</th>
                <th className="px-10 py-6">Kayıt Tarihi</th>
                <th className="px-10 py-6 text-right">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {allPatients.map(patient => (
                <tr key={patient.id} className="hover:bg-slate-50/30 transition-colors group">
                  <td className="px-10 py-8 font-black text-text-primary text-base tracking-tight">
                    {maskName(patient.name)}
                  </td>
                  <td className="px-10 py-8">
                    <div className="text-text-primary font-black text-xs tracking-tight">{patient.profiles?.clinic_name || 'Bilinmiyor'}</div>
                    <div className="text-[9px] text-text-secondary font-bold uppercase tracking-widest mt-1 opacity-50">{patient.profiles?.name}</div>
                  </td>
                  <td className="px-10 py-8 text-text-secondary text-xs font-bold uppercase tracking-widest opacity-60">
                    {patient.last_scan_date}
                  </td>
                  <td className="px-10 py-8 text-right">
                    <span className="text-[9px] font-black text-primary uppercase tracking-widest bg-primary/5 px-4 py-1.5 rounded-full border border-primary/10">
                      Anonim Veri
                    </span>
                  </td>
                </tr>
              ))}
              {allPatients.length === 0 && !loading && (
                <tr>
                  <td colSpan={4}>
                    <EmptyState 
                      title="Veri Bulunmuyor"
                      description="Sistemde henüz anonimleştirilmiş hasta kaydı mevcut değil."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </DataTableCard>
      </div>
    );
  }

  if (activeTab === 'revenue') {
    return (
      <div className="space-y-10">
        <div className="space-y-1">
          <h2 className="text-4xl font-black tracking-tighter text-text-primary">Finansal Analiz</h2>
          <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.25em]">Gelir ve Lisans Metrikleri</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
           <SoftCard className="flex flex-col">
              <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.25em] mb-4">Aylık Tahmini Gelir (MRR)</p>
              <h3 className="text-6xl font-black text-text-primary tracking-tighter mb-12">
                ₺{(doctors.reduce((acc, d) => acc + (packages.find(p => p.id === d.packageId)?.price || 0), 0)).toLocaleString()}
              </h3>
              <div className="h-48 flex items-end gap-3">
                 {[40, 70, 55, 90, 85, 100, 75].map((h, i) => (
                   <div key={i} className="flex-1 bg-slate-50 rounded-2xl relative group overflow-hidden h-full">
                      <div className="absolute bottom-0 w-full bg-text-primary transition-all duration-1000 ease-out group-hover:bg-primary" style={{height: `${h}%`}}></div>
                   </div>
                 ))}
              </div>
           </SoftCard>

           <SoftCard className="flex flex-col">
              <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.25em] mb-10">Lisans Dağılımı</p>
              <div className="space-y-10 flex-1 flex flex-col justify-center">
                 {packages.map(pkg => (
                    <div key={pkg.id} className="space-y-3">
                       <div className="flex justify-between items-end">
                          <span className="text-xs font-black text-text-primary uppercase tracking-widest">{pkg.name}</span>
                          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">{doctors.filter(d => d.packageId === pkg.id).length} Klinik</span>
                       </div>
                       <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(doctors.filter(d => d.packageId === pkg.id).length / (doctors.length || 1)) * 100}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full bg-text-primary rounded-full" 
                          />
                       </div>
                    </div>
                 ))}
              </div>
           </SoftCard>
        </div>
      </div>
    );
  }

  if (activeTab === 'reports') {
    return (
      <div className="space-y-10">
        <h2 className="text-4xl font-black tracking-tighter text-text-primary">Sistem Raporları</h2>
        <EmptyState 
          title="Global Raporlar"
          description="Tüm kliniklerin performans ve kullanım raporları burada listelenecektir."
          icon={<TrendingUp className="w-10 h-10" />}
        />
      </div>
    );
  }

  if (activeTab === 'settings') {
    return (
      <div className="space-y-10">
        <h2 className="text-4xl font-black tracking-tighter text-text-primary">Sistem Ayarları</h2>
        <EmptyState 
          title="Yönetici Ayarları"
          description="Sistem genelindeki yapılandırmalar ve yönetici tercihleri burada olacaktır."
          icon={<ShieldCheck className="w-10 h-10" />}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
          <KpiCard 
            label="Toplam Kayıtlı Klinik" 
            value={doctors.length} 
            icon={<Building2 />} 
            color="bg-indigo-500"
            delta={{ value: 8, isPositive: true }}
          />
          <KpiCard 
            label="Toplam Hasta Havuzu" 
            value={doctors.reduce((acc, d) => acc + d.patientCount, 0)} 
            icon={<Users />} 
            color="bg-emerald-500"
            delta={{ value: 15, isPositive: true }}
          />
          <KpiCard 
            label="Sistem Sağlığı" 
            value="%99.9" 
            icon={<ShieldCheck />} 
            color="bg-primary"
          />
        </div>
        
        {/* System Status Bento */}
        <SoftCard className="bg-indigo-600 text-white relative overflow-hidden group flex flex-col justify-between">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-all duration-700" />
          <div className="relative z-10">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Sunucu Durumu</p>
            <h4 className="text-lg font-bold tracking-tight">Global Node: Aktif</h4>
            <p className="text-xs text-white/40 font-medium mt-1">Gecikme: 24ms</p>
          </div>
          <div className="relative z-10 flex items-center gap-2 mt-4">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Tüm Sistemler Operasyonel</span>
          </div>
        </SoftCard>
      </div>

      {/* Doctor List */}
      <DataTableCard 
        title="Klinik Ağı Yönetimi" 
        subtitle={`${doctors.length} Aktif Node Bulundu`}
        onSearch={() => {}}
        actions={
          <button className="px-6 py-2.5 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Yeni Klinik Ekle
          </button>
        }
      >
        <table className="w-full text-left">
          <thead className="text-[10px] font-bold text-text-secondary uppercase tracking-wider border-b border-border-subtle">
            <tr>
              <th className="px-6 py-4">Klinik & Doktor ID</th>
              <th className="px-6 py-4">Lisans Tipi</th>
              <th className="px-6 py-4">Hasta Sayısı</th>
              <th className="px-6 py-4">Üretilen Resim</th>
              <th className="px-6 py-4 text-right">Durum</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {doctors.map(doctor => (
              <tr key={doctor.id} className="hover:bg-surface-hover transition-colors group">
                <td className="px-6 py-5">
                  <div className="font-semibold text-text-primary text-sm tracking-tight">{doctor.clinicName}</div>
                  <div className="text-[10px] text-text-secondary font-medium mt-1 opacity-60">ID: {doctor.id.slice(0, 13)}...</div>
                </td>
                <td className="px-6 py-5">
                  <span className="px-3 py-1 bg-text-primary text-white rounded-md text-[9px] font-bold uppercase tracking-wider">
                    {packages.find(p => p.id === doctor.packageId)?.name}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <div className="font-semibold text-text-primary text-sm">{doctor.patientCount}</div>
                  <div className="text-[9px] text-text-secondary font-medium uppercase tracking-wider opacity-60">Profil</div>
                </td>
                <td className="px-6 py-5">
                  <div className="font-semibold text-primary text-sm">{doctor.scanCount}</div>
                  <div className="text-[9px] text-text-secondary font-medium uppercase tracking-wider opacity-60">Render</div>
                </td>
                <td className="px-6 py-5 text-right">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-bold uppercase tracking-wider border border-emerald-100">
                     <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                     Aktif
                  </div>
                </td>
              </tr>
            ))}
            {doctors.length === 0 && !loading && (
              <tr>
                <td colSpan={5}>
                  <EmptyState 
                    title="Klinik Bulunmuyor"
                    description="Sistemde henüz kayıtlı klinik veya doktor hesabı bulunmamaktadır."
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </DataTableCard>
    </div>
  );
};

export default SuperAdminDashboard;

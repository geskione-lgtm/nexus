
import React, { useState } from 'react';
import { User, Patient, ScanResult } from '../types';
import BabyFaceGenerator from './BabyFaceGenerator';
import FetalGenerator from './FetalGenerator';
import BiometrikFCS from './BiometrikFCS';
import { 
  Users, 
  Activity, 
  Calendar, 
  TrendingUp, 
  Clock, 
  Plus,
  Search,
  UserPlus,
  ArrowRight,
  Stethoscope,
  ChevronRight,
  Microscope,
  FileText,
  Settings,
  ChevronDown,
  Baby,
  Box,
  UserCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { KpiCard } from './ui/KpiCard';
import { ChartCard } from './ui/ChartCard';
import { ActivityList } from './ui/ActivityList';
import { DataTableCard } from './ui/DataTableCard';
import { EmptyState } from './ui/EmptyState';
import { SoftCard } from './ui/SoftCard';

import { Modal } from './ui/Modal';
import { parseGA, formatGA } from '../constants';

interface Props { 
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedPatient: Patient | null;
  setSelectedPatient: (p: Patient | null) => void;
  doctor: User; 
  patients: Patient[]; 
  onAddPatient: (p: Patient) => void; 
  onUpdatePatient: (id: string, p: Partial<Patient>) => void;
  onAddScan: (s: ScanResult) => void; 
  scanHistory: ScanResult[]; 
}

const DoctorDashboard: React.FC<Props> = ({ activeTab, setActiveTab, selectedPatient, setSelectedPatient, doctor, patients, onAddPatient, onUpdatePatient, onAddScan, scanHistory }) => {
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [editingPatientId, setEditingPatientId] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [gaInput, setGaInput] = useState('20w0d');
  const [newPatient, setNewPatient] = useState({ name: '', weeksPregnant: 20, phone: '', email: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingMeasurements, setPendingMeasurements] = useState<any>(null);

  const chartData = [
    { name: 'Pzt', scans: 4 },
    { name: 'Sal', scans: 7 },
    { name: 'Çar', scans: 5 },
    { name: 'Per', scans: 8 },
    { name: 'Cum', scans: 12 },
    { name: 'Cmt', scans: 6 },
    { name: 'Paz', scans: 3 },
  ];

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.phone.includes(searchQuery)
  );

  const startStudio = (p: Patient) => {
    setSelectedPatient(p);
    setActiveTab('studio');
  };

  const handleEdit = (p: Patient) => {
    setNewPatient({ name: p.name, weeksPregnant: p.weeksPregnant, phone: p.phone, email: p.email || '' });
    setGaInput(formatGA(p.weeksPregnant));
    setEditingPatientId(p.id);
    setShowPatientForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const weeksDecimal = parseGA(gaInput);
    const patientData = { ...newPatient, weeksPregnant: weeksDecimal };
    
    if (editingPatientId) {
      onUpdatePatient(editingPatientId, patientData);
      setEditingPatientId(null);
    } else {
      onAddPatient({
        ...patientData,
        id: '',
        doctorId: doctor.id,
        lastScanDate: new Date().toISOString().split('T')[0]
      } as Patient);
    }
    setNewPatient({ name: '', weeksPregnant: 20, phone: '', email: '' });
    setGaInput('20w0d');
    setShowPatientForm(false);
  };

  if (activeTab === 'dashboard') {
    return (
      <div className="space-y-8">
        {/* Top Section: KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <KpiCard 
            label="Toplam Hasta" 
            value={patients.length} 
            icon={<Users />} 
            color="bg-[#2563eb]"
          />
          <KpiCard 
            label="Toplam Analiz" 
            value={scanHistory.length} 
            icon={<Activity />} 
            color="bg-indigo-500"
          />
          <KpiCard 
            label="Klinik Skor" 
            value="100%" 
            icon={<TrendingUp />} 
            color="bg-amber-500"
          />
        </div>

        {/* Middle Section: Chart */}
        <div className="grid grid-cols-1 gap-6">
          <ChartCard 
            title="Analiz Trafiği" 
            subtitle="Klinik Performans Verileri"
            action={
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-[#2563eb] rounded-full"></div>
                  <span className="text-[10px] font-medium text-text-secondary uppercase tracking-wider">Analizler</span>
                </div>
              </div>
            }
          >
            <div className="h-[400px] w-full relative">
              <ResponsiveContainer width="100%" height={400} minWidth={0}>
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
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
                    contentStyle={{borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '12px'}}
                    itemStyle={{fontSize: '11px', fontWeight: '600'}}
                  />
                  <Area type="monotone" dataKey="scans" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorScans)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        {/* Bottom Section: Recent Activity & Quick Actions */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <ActivityList 
              title="Son Aktiviteler"
              onItemClick={(id) => {
                const scan = scanHistory.find(s => s.id === id);
                if (scan) {
                  const patient = patients.find(p => p.id === scan.patientId);
                  if (patient) startStudio(patient);
                }
              }}
              items={scanHistory.slice(-5).reverse().map(scan => {
                const patient = patients.find(p => p.id === scan.patientId);
                return {
                  id: scan.id,
                  title: patient?.name || 'Bilinmeyen Hasta',
                  subtitle: 'AI Yüz Sentezi Tamamlandı',
                  time: scan.createdAt,
                  status: 'success',
                  icon: <img src={scan.babyFaceUrl} className="w-full h-full object-cover rounded-lg" />
                };
              })}
            />
          </div>
          
          {/* Quick Actions Bento */}
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => setActiveTab('patients')}
              className="aspect-square bg-emerald-50 rounded-3xl flex flex-col items-center justify-center gap-3 group hover:bg-[#2563eb] transition-all shadow-sm active:scale-95"
            >
              <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-[#2563eb] shadow-sm group-hover:scale-110 transition-transform">
                <Plus className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-medium text-[#2563eb] uppercase tracking-wider group-hover:text-white">Yeni Hasta</span>
            </button>
            <button 
              onClick={() => setActiveTab('studio')}
              className="aspect-square bg-indigo-50 rounded-3xl flex flex-col items-center justify-center gap-3 group hover:bg-indigo-500 transition-all shadow-sm active:scale-95"
            >
              <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-indigo-500 shadow-sm group-hover:scale-110 transition-transform">
                <Microscope className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-medium text-indigo-500 uppercase tracking-wider group-hover:text-white">AI Stüdyo</span>
            </button>
            <button 
              onClick={() => setActiveTab('reports')}
              className="aspect-square bg-amber-50 rounded-3xl flex flex-col items-center justify-center gap-3 group hover:bg-amber-500 transition-all shadow-sm active:scale-95"
            >
              <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-amber-500 shadow-sm group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-medium text-amber-500 uppercase tracking-wider group-hover:text-white">Raporlar</span>
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className="aspect-square bg-slate-100 rounded-3xl flex flex-col items-center justify-center gap-3 group hover:bg-[#111827] transition-all shadow-sm active:scale-95"
            >
              <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-[#111827] shadow-sm group-hover:scale-110 transition-transform">
                <Settings className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-medium text-[#111827] uppercase tracking-wider group-hover:text-white">Ayarlar</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'studio' || activeTab === 'fetal-studio' || activeTab === 'biometrik-fcs') {
    const isFetal = activeTab === 'fetal-studio';
    const isBiometric = activeTab === 'biometrik-fcs';
    
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
           <button 
              onClick={() => { setActiveTab('dashboard'); setSelectedPatient(null); }}
              className="px-8 py-3 bg-[#2563eb] text-white rounded-full text-[10px] font-medium uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-primary/20"
           >
              ← PANELİ DÖN
           </button>
           {selectedPatient && (
             <div className="flex items-center gap-4 px-6">
                <p className="text-[10px] font-medium text-text-primary uppercase tracking-[0.2em]">
                  AKTİF OTURUM: <span className="text-primary font-bold">{selectedPatient.name}</span>
                </p>
                <button 
                  onClick={() => setSelectedPatient(null)}
                  className="px-4 py-1.5 bg-[#2563eb] text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-[#1d4ed8] transition-all"
                >
                  DEĞİŞTİR
                </button>
             </div>
           )}
        </div>
        
        {selectedPatient ? (
          isFetal ? (
            <FetalGenerator 
              patient={selectedPatient} 
              onScanGenerated={onAddScan} 
              history={scanHistory.filter(s => s.patientId === selectedPatient.id)}
            />
          ) : isBiometric ? (
            <BiometrikFCS 
              onProceedToStudio={(m) => {
                setPendingMeasurements(m);
                setActiveTab('studio');
              }}
              initialMeasurements={pendingMeasurements || { gebelikHaftasi: selectedPatient.weeksPregnant }}
            />
          ) : (
            <BabyFaceGenerator 
              patient={selectedPatient} 
              onScanGenerated={onAddScan} 
              history={scanHistory.filter(s => s.patientId === selectedPatient.id)}
              initialMeasurements={pendingMeasurements}
            />
          )
        ) : (
          <div className="space-y-6">
            <div className="bg-[#2563eb]/5 border border-[#2563eb]/10 rounded-[32px] p-8 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-[#2563eb]/10 flex items-center justify-center">
                  <Users className="w-8 h-8 text-[#2563eb]" />
                </div>
                <div>
                  <h3 className="text-2xl font-medium text-[#111827] tracking-tight">
                    {isFetal ? "Fetal Stüdyo" : isBiometric ? "Biometrik FCS" : "AI Stüdyo"} için Hasta Seçin
                  </h3>
                  <p className="text-xs text-text-secondary font-medium uppercase tracking-widest opacity-60 mt-1">
                    İşleme devam etmek için aşağıdan bir hasta seçmelisiniz
                  </p>
                </div>
              </div>
            </div>

            <DataTableCard 
              title="Hasta Seçimi" 
              subtitle={`${filteredPatients.length} Kayıtlı Hasta`}
              onSearch={setSearchQuery}
            >
              <table className="w-full text-left">
                <thead className="text-[10px] font-medium text-text-secondary uppercase tracking-widest border-b border-border-subtle">
                  <tr>
                    <th className="px-10 py-6">Hasta Adı</th>
                    <th className="px-10 py-6">Hafta</th>
                    <th className="px-10 py-6 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {filteredPatients.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/30 transition-colors group">
                      <td className="px-10 py-8">
                        <div className="font-medium text-[#111827] text-base tracking-tight">{p.name}</div>
                      </td>
                      <td className="px-10 py-8">
                        <span className="text-[#111827] font-medium text-[10px] bg-slate-100 px-4 py-1.5 rounded-full uppercase tracking-widest">{p.weeksPregnant}. Hafta</span>
                      </td>
                      <td className="px-10 py-8 text-right">
                        <button 
                          onClick={() => setSelectedPatient(p)}
                          className="px-8 py-3 bg-[#2563eb] text-white rounded-full text-[10px] font-medium uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-primary/20 inline-flex items-center gap-2"
                        >
                          Seç ve Başlat <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </DataTableCard>
          </div>
        )}
      </div>
    );
  }

  if (activeTab === 'patients') {
    return (
      <div className="space-y-10">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <h2 className="text-4xl font-medium tracking-tighter text-[#111827]">Hasta Kayıtları</h2>
            <p className="text-[10px] font-medium text-text-secondary uppercase tracking-[0.25em]">Klinik Veri Yönetimi</p>
          </div>
          <button 
            onClick={() => {
              setEditingPatientId(null);
              setNewPatient({ name: '', weeksPregnant: 20, phone: '', email: '' });
              setGaInput('20w0d');
              setShowPatientForm(true);
            }}
            className="px-10 py-4 bg-[#2563eb] text-white rounded-full text-xs font-medium uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-[#2563eb]/20 flex items-center gap-3"
          >
            <Plus className="w-4 h-4" /> Yeni Hasta Ekle
          </button>
        </div>

        <Modal
          isOpen={showPatientForm}
          onClose={() => setShowPatientForm(false)}
          title={editingPatientId ? 'Hasta Bilgilerini Güncelle' : 'Yeni Hasta Kaydı'}
        >
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-medium text-text-secondary uppercase tracking-widest ml-1">Hasta Adı Soyadı *</label>
                <input required className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none text-sm font-medium focus:bg-white focus:ring-4 focus:ring-[#2563eb]/5 transition-all" value={newPatient.name} onChange={e => setNewPatient({...newPatient, name: e.target.value})} />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-medium text-text-secondary uppercase tracking-widest ml-1">Telefon *</label>
                <input required type="tel" className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none text-sm font-medium focus:bg-white focus:ring-4 focus:ring-[#2563eb]/5 transition-all" value={newPatient.phone} onChange={e => setNewPatient({...newPatient, phone: e.target.value})} />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-medium text-text-secondary uppercase tracking-widest ml-1">E-posta (Opsiyonel)</label>
                <input type="email" className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none text-sm font-medium focus:bg-white focus:ring-4 focus:ring-[#2563eb]/5 transition-all" value={newPatient.email} onChange={e => setNewPatient({...newPatient, email: e.target.value})} />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-medium text-text-secondary uppercase tracking-widest ml-1">Gestasyonel Yaş (Örn: 21w6d)</label>
                <div className="relative">
                  <input 
                    required 
                    className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none text-sm font-medium focus:bg-white focus:ring-4 focus:ring-[#2563eb]/5 transition-all" 
                    value={gaInput} 
                    onChange={e => setGaInput(e.target.value)}
                    placeholder="21w6d"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#2563eb] bg-[#2563eb]/5 px-2 py-1 rounded-lg">
                    {parseGA(gaInput).toFixed(1)} Hafta
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              <button type="button" onClick={() => setShowPatientForm(false)} className="flex-1 py-4 bg-slate-100 text-[#111827] rounded-2xl font-medium text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">
                İptal
              </button>
              <button type="submit" className="flex-[2] py-4 bg-[#2563eb] text-white rounded-2xl font-medium text-xs uppercase tracking-widest shadow-lg shadow-[#2563eb]/20 hover:scale-[1.02] transition-all">
                {editingPatientId ? 'Güncelle' : 'Kaydet'}
              </button>
            </div>
          </form>
        </Modal>

        <DataTableCard 
          title="Hasta Listesi" 
          subtitle={`${filteredPatients.length} Kayıtlı Hasta`}
          onSearch={setSearchQuery}
        >
          <table className="w-full text-left">
            <thead className="text-[10px] font-medium text-text-secondary uppercase tracking-widest border-b border-border-subtle">
              <tr>
                <th className="px-10 py-6">Hasta Kimliği</th>
                <th className="px-10 py-6">Gestasyonel Yaş</th>
                <th className="px-10 py-6">Durum</th>
                <th className="px-10 py-6 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filteredPatients.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/30 transition-colors group">
                  <td className="px-10 py-8">
                    <div className="font-medium text-[#111827] text-base tracking-tight">{p.name}</div>
                    <div className="text-[10px] text-text-secondary font-medium uppercase tracking-widest mt-1 opacity-50">{p.phone}</div>
                  </td>
                  <td className="px-10 py-8">
                    <span className="text-[#111827] font-medium text-[10px] bg-slate-100 px-4 py-1.5 rounded-full uppercase tracking-widest">{formatGA(p.weeksPregnant)}</span>
                  </td>
                  <td className="px-10 py-8">
                     <div className="flex items-center gap-2.5">
                        <div className="w-2 h-2 bg-[#2563eb] rounded-full shadow-[0_0_8px_#2563eb]"></div>
                        <span className="text-[10px] font-medium text-[#111827] uppercase tracking-widest">Aktif Takip</span>
                     </div>
                  </td>
                  <td className="px-10 py-8 text-right space-x-3">
                    <button 
                      onClick={() => handleEdit(p)}
                      className="px-5 py-2.5 bg-slate-100 text-[#111827] rounded-full text-[10px] font-medium uppercase tracking-widest hover:bg-slate-200 transition-all"
                    >
                      Düzenle
                    </button>
                    
                    <div className="relative inline-block text-left">
                      <button 
                        onClick={() => setOpenDropdownId(openDropdownId === p.id ? null : p.id)}
                        className="px-6 py-2.5 bg-[#2563eb] text-white rounded-full text-[10px] font-medium uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-[#2563eb]/20 inline-flex items-center gap-2"
                      >
                        AI Stüdyo <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${openDropdownId === p.id ? 'rotate-180' : ''}`} />
                      </button>

                      <AnimatePresence>
                        {openDropdownId === p.id && (
                          <>
                            <div 
                              className="fixed inset-0 z-10" 
                              onClick={() => setOpenDropdownId(null)}
                            />
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.95, y: 10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: 10 }}
                              className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-border-subtle z-20 overflow-hidden"
                            >
                              <div className="p-2 space-y-1">
                                <button 
                                  onClick={() => {
                                    setSelectedPatient(p);
                                    setActiveTab('studio');
                                    setOpenDropdownId(null);
                                  }}
                                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest text-[#111827] hover:bg-slate-50 transition-colors text-left"
                                >
                                  <UserCircle className="w-4 h-4 text-[#2563eb]" />
                                  Yüz Sentezi
                                </button>
                                <button 
                                  onClick={() => {
                                    setSelectedPatient(p);
                                    setActiveTab('fetal-studio');
                                    setOpenDropdownId(null);
                                  }}
                                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest text-[#111827] hover:bg-slate-50 transition-colors text-left"
                                >
                                  <Baby className="w-4 h-4 text-[#2563eb]" />
                                  Fetal Stüdyo
                                </button>
                                <button 
                                  onClick={() => {
                                    setSelectedPatient(p);
                                    setActiveTab('biometrik-fcs');
                                    setOpenDropdownId(null);
                                  }}
                                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest text-[#111827] hover:bg-slate-50 transition-colors text-left"
                                >
                                  <Box className="w-4 h-4 text-[#2563eb]" />
                                  Biometrik FCS
                                </button>
                              </div>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredPatients.length === 0 && (
                <tr>
                  <td colSpan={4}>
                    <EmptyState 
                      title="Hasta Bulunamadı"
                      description="Arama kriterlerinize uygun hasta kaydı bulunmuyor."
                      icon={<Users className="w-8 h-8" />}
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

  if (activeTab === 'reports') {
    return (
      <div className="space-y-10">
        <h2 className="text-4xl font-medium tracking-tighter text-[#111827]">Raporlar</h2>
        <EmptyState 
          title="Henüz Rapor Bulunmuyor"
          description="Klinik raporlarınız ve analiz sonuçlarınız burada listelenecektir."
          icon={<FileText className="w-10 h-10" />}
          action={
            <button 
              onClick={() => setActiveTab('dashboard')}
              className="px-10 py-4 bg-[#2563eb] text-white rounded-full text-xs font-bold uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-[#2563eb]/20"
            >
              Panel'e Dön
            </button>
          }
        />
      </div>
    );
  }

  if (activeTab === 'settings') {
    return (
      <div className="space-y-10">
        <h2 className="text-4xl font-medium tracking-tighter text-[#111827]">Ayarlar</h2>
        <EmptyState 
          title="Sistem Ayarları"
          description="Klinik profiliniz ve uygulama ayarlarınız yakında burada olacaktır."
          icon={<Settings className="w-10 h-10" />}
          action={
            <button 
              onClick={() => setActiveTab('dashboard')}
              className="px-10 py-4 bg-[#2563eb] text-white rounded-full text-xs font-bold uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-[#2563eb]/20"
            >
              Panel'e Dön
            </button>
          }
        />
      </div>
    );
  }

  if (activeTab === 'biometrik-fcs') {
    return null; // Handled by the unified studio/fetal/biometric block above
  }

  return null;
};

export default DoctorDashboard;


import React, { useState, useEffect } from 'react';
import { User, UserRole, Patient, ScanResult } from './types';
import { DatabaseService } from './services/databaseService';
import { supabase } from './services/supabaseClient';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import DoctorDashboard from './components/DoctorDashboard';
import Landing from './components/Landing';
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import CloudStatus from './components/CloudStatus';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<'landing' | 'login' | 'dashboard'>('landing');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [doctors, setDoctors] = useState<User[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);

  // Supabase Auth Listener
  useEffect(() => {
    const checkUser = async () => {
      const profile = await DatabaseService.getCurrentProfile();
      if (profile) {
        setCurrentUser(profile);
        setCurrentPage('dashboard');
      }
    };

    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const profile = await DatabaseService.getCurrentProfile();
        setCurrentUser(profile);
        setCurrentPage('dashboard');
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setCurrentPage('landing');
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  // Data Loading
  useEffect(() => {
    if (currentUser) {
      const fetchData = async () => {
        setIsSyncing(true);
        try {
          if (currentUser.role === UserRole.SUPER_ADMIN) {
            const docs = await DatabaseService.getDoctors();
            setDoctors(docs);
          } else {
            const [pts, scans] = await Promise.all([
              DatabaseService.getPatients(currentUser.id),
              DatabaseService.getScans()
            ]);
            setPatients(pts);
            setScanHistory(scans);
          }
        } catch (e) {
          console.error("Veri çekme hatası:", e);
        }
        setIsSyncing(false);
      };
      fetchData();
    }
  }, [currentUser]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const addDoctor = async (doctor: User) => {
    setIsSyncing(true);
    try {
      const saved = await DatabaseService.saveDoctor(doctor);
      setDoctors(prev => [...prev, saved]);
    } catch (e) { alert("Hata: " + e.message); }
    setIsSyncing(false);
  };

  const addPatient = async (patient: Omit<Patient, 'id'>) => {
    setIsSyncing(true);
    try {
      const saved = await DatabaseService.savePatient(patient);
      setPatients(prev => [...prev, saved]);
    } catch (e) { alert("Hata: " + e.message); }
    setIsSyncing(false);
  };

  const addScan = async (scan: Omit<ScanResult, 'id'>) => {
    setIsSyncing(true);
    try {
      const saved = await DatabaseService.saveScan(scan);
      setScanHistory(prev => [saved, ...prev]);
    } catch (e) { alert("Hata: " + e.message); }
    setIsSyncing(false);
  };

  if (currentPage === 'landing') {
    return <Landing onAccessPortal={() => setCurrentPage('login')} />;
  }

  if (currentPage === 'login' && !currentUser) {
    return <Login onBack={() => setCurrentPage('landing')} />;
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {currentUser && <Sidebar user={currentUser} activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} />}
      
      <main className="flex-1 overflow-y-auto bg-[#F9F9F9] p-8 md:p-12">
        <header className="mb-12 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-2">
               <span className="w-2 h-2 rounded-full bg-nexus-green animate-pulse"></span>
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Bulut Erişimi: {currentUser?.clinicName || 'Merkez Yönetim'}</span>
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-black uppercase">
              {activeTab === 'dashboard' ? `${currentUser?.name.split(' ')[0]} Terminali` : activeTab.toUpperCase().replace('_', ' ')}
            </h1>
          </div>
          <CloudStatus isSyncing={isSyncing} />
        </header>

        {currentUser?.role === UserRole.SUPER_ADMIN ? (
          <SuperAdminDashboard 
            activeTab={activeTab}
            doctors={doctors} 
            onAddDoctor={addDoctor} 
          />
        ) : (
          currentUser && <DoctorDashboard 
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            doctor={currentUser} 
            patients={patients} 
            onAddPatient={addPatient}
            onAddScan={addScan}
            scanHistory={scanHistory}
          />
        )}
      </main>
    </div>
  );
};

export default App;

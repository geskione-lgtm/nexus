
import React, { useState, useEffect } from 'react';
import { User, UserRole, Patient, ScanResult } from './types';
import { DatabaseService } from './services/databaseService';
import { supabase, isSupabaseConfigured } from './services/supabaseClient';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import DoctorDashboard from './components/DoctorDashboard';
import Landing from './components/Landing';
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import CloudStatus from './components/CloudStatus';
import Onboarding from './components/Onboarding';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<'landing' | 'login' | 'dashboard' | 'onboarding'>('landing');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  
  const [doctors, setDoctors] = useState<User[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);

  const checkUserStatus = async () => {
    setIsSyncing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const profile = await DatabaseService.getCurrentProfile();
        if (profile) {
          setCurrentUser(profile);
          setCurrentPage('dashboard');
        } else {
          setCurrentPage('onboarding');
        }
      } else {
        setCurrentUser(null);
        if (currentPage === 'dashboard' || currentPage === 'onboarding') {
          setCurrentPage('landing');
        }
      }
    } catch (e) {
      console.error("Auth check error:", e);
    }
    setAuthChecked(true);
    setIsSyncing(false);
  };

  useEffect(() => {
    checkUserStatus();

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        checkUserStatus();
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setCurrentPage('landing');
      }
    });
    return () => authListener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (currentUser && currentPage === 'dashboard') {
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
          console.error("Data fetching error:", e);
        }
        setIsSyncing(false);
      };
      fetchData();
    }
  }, [currentUser, currentPage]);

  if (!authChecked && currentPage !== 'landing') {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="w-12 h-12 border-4 border-nexus-green border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (currentPage === 'landing') {
    return <Landing onAccessPortal={() => setCurrentPage('login')} />;
  }

  if (currentPage === 'login' && !currentUser) {
    return <Login onBack={() => setCurrentPage('landing')} />;
  }

  if (currentPage === 'onboarding') {
    return <Onboarding onComplete={checkUserStatus} />;
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {currentUser && <Sidebar user={currentUser} activeTab={activeTab} onTabChange={setActiveTab} onLogout={() => supabase.auth.signOut()} />}
      
      <main className="flex-1 overflow-y-auto bg-[#F9F9F9] p-8 md:p-12">
        <header className="mb-12 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-2">
               <span className="w-2 h-2 rounded-full bg-nexus-green animate-pulse"></span>
               <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Erişim: {currentUser?.clinicName || 'Yönetim'}</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              {activeTab === 'dashboard' ? `${currentUser?.name?.split(' ')[0] || 'Kullanıcı'} Paneli` : activeTab.toUpperCase().replace('_', ' ')}
            </h1>
          </div>
          <CloudStatus isSyncing={isSyncing} />
        </header>

        {currentUser?.role === UserRole.SUPER_ADMIN ? (
          <SuperAdminDashboard 
            activeTab={activeTab}
            doctors={doctors} 
            onAddDoctor={async (d) => {
              setIsSyncing(true);
              try { await DatabaseService.saveDoctor(d); checkUserStatus(); } catch(e) { alert(e.message); }
              setIsSyncing(false);
            }} 
          />
        ) : (
          currentUser && <DoctorDashboard 
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            doctor={currentUser} 
            patients={patients} 
            onAddPatient={async (p) => {
              setIsSyncing(true);
              try { await DatabaseService.savePatient(p); checkUserStatus(); } catch(e) { alert(e.message); }
              setIsSyncing(false);
            }}
            onAddScan={async (s) => {
              setIsSyncing(true);
              try { await DatabaseService.saveScan(s); checkUserStatus(); } catch(e) { alert(e.message); }
              setIsSyncing(false);
            }}
            scanHistory={scanHistory}
          />
        )}
      </main>
    </div>
  );
};

export default App;
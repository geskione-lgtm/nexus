
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
    if (!isSupabaseConfigured()) {
      setAuthChecked(true);
      return;
    }

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

    if (isSupabaseConfigured()) {
      const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          checkUserStatus();
        } else if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
          setCurrentPage('landing');
        }
      });
      return () => authListener.subscription.unsubscribe();
    }
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

  // EĞER AYARLAR YOKSA KIRMIZI UYARI EKRANINI GÖSTERİR
  if (!isSupabaseConfigured()) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F9F9F9] p-8 text-center">
        <div className="max-w-md bg-white p-12 rounded-[48px] shadow-2xl border border-red-100">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-8">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tighter mb-4">Sistem Bağlantısı Yok</h2>
          <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8">
            Nexus hala <b>placeholder-project</b> adresine bağlanmaya çalışıyor. Vercel Environment Variables ayarlarını yaptıktan sonra uygulamayı yeniden <b>Deploy</b> etmelisiniz.
          </p>
          <div className="flex flex-col gap-3 text-left">
             <p className="text-[10px] font-bold text-slate-400 uppercase ml-2">Beklenen Değişkenler:</p>
             <code className="bg-slate-50 p-4 rounded-xl text-[11px] text-slate-500 break-all font-mono">
               SUPABASE_URL<br/>
               SUPABASE_ANON_KEY
             </code>
             <button onClick={() => window.location.reload()} className="mt-6 px-8 py-4 bg-black text-white rounded-full font-black uppercase tracking-widest text-xs">Ayarları Kontrol Ettim, Yeniden Yükle</button>
          </div>
        </div>
      </div>
    );
  }

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
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Bulut Erişimi: {currentUser?.clinicName || 'Merkez Yönetim'}</span>
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-black uppercase">
              {activeTab === 'dashboard' ? `${currentUser?.name?.split(' ')[0] || 'Admin'} Terminali` : activeTab.toUpperCase().replace('_', ' ')}
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

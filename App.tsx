
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
      <div className="h-screen flex items-center justify-center bg-[#f4f7f6]">
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
    <div className="flex h-screen bg-[#f4f7f6] overflow-hidden">
      {/* Sidebar */}
      {currentUser && (
        <Sidebar 
          user={currentUser} 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
          onLogout={() => supabase.auth.signOut()} 
        />
      )}
      
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto px-10 py-8 relative">
        {/* Header Bar */}
        <header className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 capitalize">
              {activeTab === 'dashboard' ? 'Admin Dashboard' : activeTab.replace('_', ' ')}
            </h1>
            <div className="hidden md:flex items-center bg-white border border-slate-100 rounded-2xl px-4 py-2 card-shadow">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input type="text" placeholder="Burada ara..." className="bg-transparent border-none outline-none px-3 text-xs font-medium w-48" />
            </div>
          </div>
          <div className="flex items-center gap-4">
             <CloudStatus isSyncing={isSyncing} />
          </div>
        </header>

        {/* Dashboard Content */}
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
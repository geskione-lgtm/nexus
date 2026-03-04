
import React, { useState, useEffect } from 'react';
import { User, UserRole, Patient, ScanResult } from './types';
import { DatabaseService } from './services/databaseService';
import { supabase } from './services/supabaseClient';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import DoctorDashboard from './components/DoctorDashboard';
import Landing from './components/Landing';
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import Register from './components/Register';
import CloudStatus from './components/CloudStatus';
import Onboarding from './components/Onboarding';
import { PageShell } from './components/ui/PageShell';
import { TopBar } from './components/ui/TopBar';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<'landing' | 'login' | 'register' | 'dashboard' | 'onboarding'>('landing');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  
  // Fixed: Removed doctors state as it's not provided by current DatabaseService and not needed by SuperAdminDashboard (it fetches its own)
  const [patients, setPatients] = useState<Patient[]>([]);
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);

  const checkUserStatus = async () => {
    setIsSyncing(true);
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        if (error.message?.includes('Refresh Token Not Found') || error.message?.includes('Invalid Refresh Token')) {
          console.warn("Session expired or invalid, signing out...");
          await supabase.auth.signOut();
          setCurrentUser(null);
          setCurrentPage('landing');
          setAuthChecked(true);
          setIsSyncing(false);
          return;
        }
      }
      
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
          // Fixed: Removed DatabaseService.getDoctors call as it doesn't exist.
          // Data fetching is now scoped to UserRole.DOCTOR for patients and scans.
          if (currentUser.role === UserRole.DOCTOR) {
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
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-floating"></div>
          <p className="text-xs font-medium text-text-secondary uppercase tracking-widest animate-pulse">Sistem Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (currentPage === 'landing') {
    return <Landing onLogin={() => setCurrentPage('login')} onRegister={() => setCurrentPage('register')} />;
  }

  if (currentPage === 'login' && !currentUser) {
    return <Login onBack={() => setCurrentPage('landing')} onSwitchToRegister={() => setCurrentPage('register')} />;
  }

  if (currentPage === 'register' && !currentUser) {
    return <Register onBack={() => setCurrentPage('landing')} onSwitchToLogin={() => setCurrentPage('login')} />;
  }

  if (currentPage === 'onboarding') {
    return <Onboarding onComplete={checkUserStatus} />;
  }

  if (!currentUser) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-floating"></div>
          <p className="text-xs font-medium text-text-secondary uppercase tracking-widest animate-pulse">Oturum Doğrulanıyor...</p>
        </div>
      </div>
    );
  }

  return (
    <PageShell
      user={currentUser}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onLogout={() => supabase.auth.signOut()}
    >
      <TopBar 
        user={currentUser} 
        onLogout={() => supabase.auth.signOut()} 
        onTabChange={setActiveTab}
        activeTab={activeTab}
        title={activeTab === 'dashboard' ? 'Genel Bakış' : activeTab === 'studio' ? 'AI Stüdyo' : activeTab === 'fetal-studio' ? 'Fetal Stüdyo' : activeTab === 'biometrik-fcs' ? 'Biometrik FCS' : activeTab === 'patients' ? 'Hasta Kayıtları' : activeTab === 'packages' ? 'Lisans Paketleri' : activeTab === 'revenue' ? 'Finansal Analiz' : activeTab === 'reports' ? 'Raporlar' : activeTab === 'settings' ? 'Ayarlar' : activeTab.replace('_', ' ')}
      />

      {/* Dashboard Content */}
      {currentUser?.role === UserRole.SUPER_ADMIN ? (
        <SuperAdminDashboard activeTab={activeTab} />
      ) : (
        currentUser && (
          <DoctorDashboard 
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            selectedPatient={selectedPatient}
            setSelectedPatient={setSelectedPatient}
            doctor={currentUser} 
            patients={patients} 
            onAddPatient={async (p) => {
              setIsSyncing(true);
              try { await DatabaseService.savePatient(p); checkUserStatus(); } catch(e: any) { alert(e.message); }
              setIsSyncing(false);
            }}
            onUpdatePatient={async (id, p) => {
              setIsSyncing(true);
              try { await DatabaseService.updatePatient(id, p); checkUserStatus(); } catch(e: any) { alert(e.message); }
              setIsSyncing(false);
            }}
            onAddScan={async (s) => {
              // Scan is already saved in BabyFaceGenerator
              // We just need to refresh the data
              setIsSyncing(true);
              try { 
                await checkUserStatus(); 
              } catch(e: any) { 
                console.error("Refresh error:", e);
              }
              setIsSyncing(false);
            }}
            scanHistory={scanHistory}
          />
        )
      )}
    </PageShell>
  );
};

export default App;

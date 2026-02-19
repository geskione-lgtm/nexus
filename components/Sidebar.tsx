
import React from 'react';
import { User, UserRole } from '../types';

interface SidebarProps { 
  user: User; 
  activeTab: string; 
  onTabChange: (tab: string) => void; 
  onLogout: () => void; 
}

const Sidebar: React.FC<SidebarProps> = ({ user, activeTab, onTabChange, onLogout }) => {
  const isAdmin = user.role === UserRole.SUPER_ADMIN;

  return (
    <aside className="w-72 bg-white border-r border-slate-100 flex flex-col p-8 z-50">
      <div className="flex items-center gap-3 mb-12 cursor-pointer" onClick={() => onTabChange('dashboard')}>
        <div className="w-8 h-8 bg-black rounded flex flex-col items-center justify-center gap-0.5">
          <div className="w-5 h-1 bg-nexus-green rounded-full"></div>
          <div className="w-5 h-1 bg-white rounded-full"></div>
          <div className="w-5 h-1 bg-white rounded-full"></div>
        </div>
        <span className="text-xl font-black tracking-tighter uppercase">Nexus</span>
      </div>

      <nav className="flex-1 space-y-2">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Operasyonlar</p>
        
        <NavItem 
          active={activeTab === 'dashboard'} 
          onClick={() => onTabChange('dashboard')}
          label="Kontrol Merkezi" 
          icon="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" 
        />
        
        {isAdmin ? (
          <>
            <NavItem 
              active={activeTab === 'network'} 
              onClick={() => onTabChange('network')}
              label="Klinik Ağı" 
              icon="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" 
            />
            <NavItem 
              active={activeTab === 'revenue'} 
              onClick={() => onTabChange('revenue')}
              label="Gelir & Abonelik" 
              icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </>
        ) : (
          <>
            <NavItem 
              active={activeTab === 'patients'} 
              onClick={() => onTabChange('patients')}
              label="Hasta Veritabanı" 
              icon="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" 
            />
            <NavItem 
              active={activeTab === 'studio'} 
              onClick={() => onTabChange('studio')}
              label="Görüntüleme Stüdyosu" 
              icon="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.628.283a2 2 0 01-1.186.127l-2.387-.477a2 2 0 00-1.022.547l-2.387 2.387a2 2 0 000 2.828l.477.477a2 2 0 002.828 0l2.387-2.387a2 2 0 00.547-1.022l.477-2.387a6 6 0 00-.517-3.86l-.283-.628a2 2 0 01-.127-1.186l.477-2.387a2 2 0 00-.547-1.022L7.387 2.113a2 2 0 00-2.828 0l-.477.477a2 2 0 000 2.828l2.387 2.387a2 2 0 001.022.547l2.387.477a6 6 0 003.86-.517l.628-.283a2 2 0 011.186-.127l2.387.477a2 2 0 001.022-.547l2.387-2.387a2 2 0 000-2.828l-.477-.477a2 2 0 00-2.828 0l-2.387 2.387z" 
            />
          </>
        )}
        <NavItem 
          active={activeTab === 'analytics'} 
          onClick={() => onTabChange('analytics')}
          label="Analiz Günlükleri" 
          icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" 
        />
      </nav>

      <div className="mt-auto space-y-6">
        <div className="p-5 bg-[#F9F9F9] rounded-[24px] border border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Cloud Hesabı</p>
          <p className="text-sm font-bold truncate text-black">{user.email}</p>
          <p className="text-[10px] text-nexus-green font-bold uppercase mt-1">Status: Online</p>
        </div>
        <button 
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-3 py-4 bg-white border border-slate-200 text-black rounded-full hover:bg-black hover:text-white transition-all text-xs font-black uppercase tracking-widest"
        >
          Oturumu Kapat
        </button>
      </div>
    </aside>
  );
};

const NavItem: React.FC<{ label: string; icon: string; active?: boolean; onClick: () => void }> = ({ label, icon, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-[13px] font-bold transition-all ${active ? 'bg-black text-white shadow-lg shadow-black/10' : 'text-slate-500 hover:text-black hover:bg-slate-50'}`}
  >
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon} />
    </svg>
    {label}
  </button>
);

export default Sidebar;

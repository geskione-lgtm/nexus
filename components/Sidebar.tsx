
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
    <aside className="w-[280px] sidebar-dark flex flex-col p-6 z-50 text-white/70">
      {/* Logo Area */}
      <div className="flex items-center gap-3 mb-12 px-2">
        <div className="w-10 h-10 bg-nexus-green rounded-xl flex items-center justify-center shadow-lg shadow-nexus-green/20">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <span className="text-xl font-bold tracking-tight text-white">Nexus Admin</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        <NavItem 
          active={activeTab === 'dashboard'} 
          onClick={() => onTabChange('dashboard')}
          label="Kontrol Paneli" 
          icon="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" 
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
              label="Gelir Analizi" 
              icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </>
        ) : (
          <>
            <NavItem 
              active={activeTab === 'patients'} 
              onClick={() => onTabChange('patients')}
              label="Hastalarım" 
              icon="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
            />
            <NavItem 
              active={activeTab === 'studio'} 
              onClick={() => onTabChange('studio')}
              label="AI Stüdyo" 
              icon="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" 
            />
          </>
        )}
      </nav>

      {/* User & Logout */}
      <div className="mt-auto border-t border-white/10 pt-6">
        <div className="flex items-center gap-3 px-2 mb-6">
          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold">
            {user.name.charAt(0)}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-white truncate">{user.name}</p>
            <p className="text-[10px] font-medium text-white/40 truncate">{user.email}</p>
          </div>
        </div>
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold text-red-400 hover:bg-red-500/10 transition-all"
        >
          <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Oturumu Kapat
        </button>
      </div>
    </aside>
  );
};

const NavItem: React.FC<{ label: string; icon: string; active?: boolean; onClick: () => void }> = ({ label, icon, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all group ${active ? 'bg-nexus-green text-white shadow-lg shadow-nexus-green/20' : 'hover:bg-white/5 hover:text-white'}`}
  >
    <svg className={`w-5 h-5 ${active ? 'text-white' : 'text-white/40 group-hover:text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon} />
    </svg>
    {label}
  </button>
);

export default Sidebar;
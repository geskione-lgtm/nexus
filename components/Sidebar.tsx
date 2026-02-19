
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
    <aside className="w-[260px] sidebar-dark flex flex-col p-8 z-50">
      {/* Brand */}
      <div className="flex items-center gap-3 mb-16">
        <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-white/10">
          <div className="w-5 h-5 bg-black rounded-sm"></div>
        </div>
        <span className="text-lg font-bold tracking-tight text-white uppercase">Nexus</span>
      </div>

      {/* Nav Groups */}
      <div className="flex-1 space-y-10">
        <div>
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-6 ml-2">Genel</p>
          <nav className="space-y-1">
            <NavItem 
              active={activeTab === 'dashboard'} 
              onClick={() => onTabChange('dashboard')}
              label="Overview" 
              icon="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" 
            />
            {isAdmin ? (
              <>
                <NavItem 
                  active={activeTab === 'network'} 
                  onClick={() => onTabChange('network')}
                  label="Network" 
                  icon="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" 
                />
                <NavItem 
                  active={activeTab === 'revenue'} 
                  onClick={() => onTabChange('revenue')}
                  label="Analytics" 
                  icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" 
                />
              </>
            ) : (
              <>
                <NavItem 
                  active={activeTab === 'patients'} 
                  onClick={() => onTabChange('patients')}
                  label="Patients" 
                  icon="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
                />
                <NavItem 
                  active={activeTab === 'studio'} 
                  onClick={() => onTabChange('studio')}
                  label="Studio" 
                  icon="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" 
                />
              </>
            )}
          </nav>
        </div>
      </div>

      {/* User Info */}
      <div className="pt-8 border-t border-white/10">
        <div className="mb-6 flex items-center gap-3">
           <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white text-xs font-bold uppercase">
             {user.name.charAt(0)}
           </div>
           <div className="overflow-hidden">
              <p className="text-sm font-semibold text-white truncate">{user.name}</p>
              <p className="text-[10px] text-white/40 truncate">{user.role}</p>
           </div>
        </div>
        <button 
          onClick={onLogout}
          className="w-full py-3 bg-white/5 hover:bg-red-500/10 text-white/60 hover:text-red-400 rounded-xl text-xs font-bold transition-all text-center"
        >
          Logout
        </button>
      </div>
    </aside>
  );
};

const NavItem: React.FC<{ label: string; icon: string; active?: boolean; onClick: () => void }> = ({ label, icon, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-all group ${active ? 'bg-white text-black shadow-lg shadow-white/5' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
  >
    <svg className={`w-5 h-5 ${active ? 'text-black' : 'text-white/20 group-hover:text-white/40'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon} />
    </svg>
    {label}
  </button>
);

export default Sidebar;

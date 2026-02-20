
import React from 'react';
import { HeartPulse, LayoutDashboard, Users, Package, TrendingUp, UserCircle, Microscope } from 'lucide-react';
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
    <aside className="w-[280px] sidebar-dark flex flex-col p-8 z-50">
      {/* Brand */}
      <div className="flex items-center gap-3 mb-16">
        <div className="w-11 h-11 bg-gradient-to-br from-white to-slate-200 rounded-2xl flex items-center justify-center shadow-xl shadow-white/10 group transition-all">
          <HeartPulse className="w-6 h-6 text-black animate-pulse" />
        </div>
        <span className="text-xl font-black tracking-tighter text-white uppercase tracking-widest">NeoBreed</span>
      </div>

      {/* Nav Groups */}
      <div className="flex-1 space-y-10">
        <div>
          <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] mb-6 ml-2">Yönetim Paneli</p>
          <nav className="space-y-1">
            <NavItem 
              active={activeTab === 'dashboard'} 
              onClick={() => onTabChange('dashboard')}
              label="Genel Bakış" 
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
                  active={activeTab === 'patients'} 
                  onClick={() => onTabChange('patients')}
                  label="Hasta Havuzu" 
                  icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" 
                />
                <NavItem 
                  active={activeTab === 'packages'} 
                  onClick={() => onTabChange('packages')}
                  label="Lisans Paketleri" 
                  icon="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" 
                />
                <NavItem 
                  active={activeTab === 'revenue'} 
                  onClick={() => onTabChange('revenue')}
                  label="Finansal Analiz" 
                  icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" 
                />
              </>
            ) : (
              <>
                <NavItem 
                  active={activeTab === 'patients'} 
                  onClick={() => onTabChange('patients')}
                  label="Hasta Kayıtları" 
                  icon="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
                />
                <NavItem 
                  active={activeTab === 'studio'} 
                  onClick={() => onTabChange('studio')}
                  label="AI Stüdyo" 
                  icon="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" 
                />
              </>
            )}
          </nav>
        </div>
      </div>

      {/* User Info */}
      <div className="pt-8 border-t border-white/5">
        <div className="mb-6 flex items-center gap-3">
           <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white text-xs font-bold">
             {user.name.charAt(0)}
           </div>
           <div className="overflow-hidden">
              <p className="text-sm font-semibold text-white truncate">{user.name}</p>
              <p className="text-[9px] text-white/30 uppercase tracking-widest truncate">{user.role === UserRole.SUPER_ADMIN ? 'Süper Admin' : 'Uzman Doktor'}</p>
           </div>
        </div>
        <button 
          onClick={onLogout}
          className="w-full py-4 bg-white/5 hover:bg-red-500/10 text-white/40 hover:text-red-400 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all text-center"
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
    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-[18px] text-sm font-medium transition-all group ${active ? 'bg-white text-black shadow-xl shadow-white/5' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
  >
    <svg className={`w-5 h-5 ${active ? 'text-black' : 'text-white/20 group-hover:text-white/40'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon} />
    </svg>
    {label}
  </button>
);

export default Sidebar;

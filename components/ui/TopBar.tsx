
import React from 'react';
import { Search, Bell, User as UserIcon, LogOut, Settings } from 'lucide-react';
import { User } from '../../types';

interface TopBarProps {
  user: User;
  onLogout: () => void;
  onTabChange: (tab: string) => void;
  activeTab: string;
  title: string;
}

export const TopBar: React.FC<TopBarProps> = ({ user, onLogout, onTabChange, activeTab, title }) => {
  return (
    <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-medium tracking-tight text-[#111827]">
          Hoş Geldiniz, <span className="text-[#2563eb]">{user.name.split(' ')[0]}</span>
        </h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 bg-surface border border-border-subtle rounded-full shadow-sm">
            <div className="w-1.5 h-1.5 bg-[#2563eb] rounded-full animate-pulse" />
            <p className="text-[10px] font-medium text-text-secondary uppercase tracking-wider">
              Sistem Aktif · {new Date().toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
            </p>
          </div>
          <p className="text-[10px] font-medium text-text-secondary/50 uppercase tracking-widest">NeoBreed v4.0</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Navigation */}
        <nav className="hidden xl:flex items-center bg-surface border border-border-subtle p-1 rounded-xl shadow-sm">
          <button 
            onClick={() => onTabChange('dashboard')}
            className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'dashboard' ? 'bg-[#2563eb] text-white shadow-md' : 'text-text-secondary hover:text-[#111827] hover:bg-surface-hover'}`}
          >
            Panel
          </button>
          <button 
            onClick={() => onTabChange('reports')}
            className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'reports' ? 'bg-[#2563eb] text-white shadow-md' : 'text-text-secondary hover:text-[#111827] hover:bg-surface-hover'}`}
          >
            Raporlar
          </button>
          <button 
            onClick={() => onTabChange('settings')}
            className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'settings' ? 'bg-[#2563eb] text-white shadow-md' : 'text-text-secondary hover:text-[#111827] hover:bg-surface-hover'}`}
          >
            Ayarlar
          </button>
        </nav>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-surface border border-border-subtle p-1 rounded-xl shadow-sm">
            <button className="w-10 h-10 flex items-center justify-center bg-[#2563eb] text-white rounded-lg transition-all relative group shadow-sm">
              <Bell className="w-4 h-4" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-[#2563eb] shadow-sm"></span>
            </button>
            <button 
              onClick={() => onTabChange('settings')}
              className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all group ${activeTab === 'settings' ? 'bg-[#2563eb] text-white shadow-md' : 'bg-surface border border-border-subtle text-text-secondary hover:bg-surface-hover'}`}
            >
              <Settings className="w-4 h-4" />
            </button>
            <div className="w-px h-6 bg-border-subtle mx-1"></div>
            <button 
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 bg-[#2563eb] text-white rounded-lg transition-all shadow-sm hover:bg-[#1d4ed8]"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">Çıkış</span>
            </button>
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-3 bg-surface border border-border-subtle pl-2 pr-4 py-2 rounded-xl shadow-sm hover:bg-surface-hover transition-all cursor-pointer group">
            <div className="w-8 h-8 rounded-lg bg-[#2563eb] text-white flex items-center justify-center text-xs font-medium">
              {user.name.charAt(0)}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-medium text-[#111827] leading-none">
                {user.name}
              </p>
              <p className="text-[10px] font-medium text-text-secondary uppercase tracking-wider mt-1">
                {user.role === 'SUPER_ADMIN' ? 'Yönetici' : 'Doktor'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};


import React from 'react';
import { 
  HeartPulse, 
  LayoutDashboard, 
  Users, 
  Package, 
  TrendingUp, 
  UserCircle, 
  Microscope, 
  LogOut, 
  X, 
  Box, 
  Baby,
  ChevronDown,
  ChevronRight as ChevronRightIcon
} from 'lucide-react';
import { User, UserRole } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarProps { 
  user: User; 
  activeTab: string; 
  onTabChange: (tab: string) => void; 
  onLogout: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, activeTab, onTabChange, onLogout, isOpen, onClose }) => {
  const isAdmin = user.role === UserRole.SUPER_ADMIN;
  const [isStudioOpen, setIsStudioOpen] = React.useState(activeTab.includes('studio') || activeTab === 'biometrik-fcs');

  const studioTabs = ['studio', 'fetal-studio', 'biometrik-fcs'];
  const isStudioActive = studioTabs.includes(activeTab);

  React.useEffect(() => {
    if (isStudioActive) setIsStudioOpen(true);
  }, [activeTab, isStudioActive]);

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside className={`
        fixed lg:static inset-y-0 left-0 w-72 h-full bg-surface border-r border-border-subtle flex flex-col z-[70] transition-transform duration-500 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand */}
        <div className="p-8 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 bg-[#2563eb] rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-300">
              <HeartPulse className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-medium tracking-tight text-[#111827] leading-none">NeoBreed</span>
              <span className="text-[10px] font-medium text-[#2563eb] uppercase tracking-wider mt-1">Intelligence</span>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-2 hover:bg-slate-100 rounded-full">
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

      {/* Nav Groups */}
      <div className="flex-1 px-4 space-y-8">
        <div>
          <p className="text-[10px] font-medium text-text-secondary uppercase tracking-widest mb-4 px-4 opacity-50">YÖNETİM PANELİ</p>
          <nav className="space-y-1">
            <NavItem 
              active={activeTab === 'dashboard'} 
              onClick={() => onTabChange('dashboard')}
              label="Genel Bakış" 
              icon={<LayoutDashboard className="w-5 h-5" />} 
            />
            {isAdmin ? (
              <>
                <NavItem 
                  active={activeTab === 'network'} 
                  onClick={() => onTabChange('network')}
                  label="Klinik Ağı" 
                  icon={<Users className="w-5 h-5" />} 
                />
                <NavItem 
                  active={activeTab === 'patients'} 
                  onClick={() => onTabChange('patients')}
                  label="Hasta Havuzu" 
                  icon={<UserCircle className="w-5 h-5" />} 
                />
                <NavItem 
                  active={activeTab === 'packages'} 
                  onClick={() => onTabChange('packages')}
                  label="Lisanslar" 
                  icon={<Package className="w-5 h-5" />} 
                />
                <NavItem 
                  active={activeTab === 'revenue'} 
                  onClick={() => onTabChange('revenue')}
                  label="Finansal" 
                  icon={<TrendingUp className="w-5 h-5" />} 
                />
              </>
            ) : (
              <>
                <NavItem 
                  active={activeTab === 'patients'} 
                  onClick={() => onTabChange('patients')}
                  label="Hasta Kayıtları" 
                  icon={<Users className="w-5 h-5" />} 
                />
                
                {/* Expandable AI Studio Group */}
                <div className="space-y-1">
                  <button 
                    onClick={() => setIsStudioOpen(!isStudioOpen)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all group relative ${
                      isStudioActive && !isStudioOpen
                        ? 'bg-[#2563eb] text-white shadow-lg shadow-[#2563eb]/20' 
                        : 'text-text-secondary hover:bg-surface-hover hover:text-[#111827]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`${isStudioActive && !isStudioOpen ? 'text-white' : 'text-text-secondary group-hover:text-[#111827]'} transition-colors`}>
                        <Microscope className="w-5 h-5" />
                      </div>
                      <span className="tracking-tight uppercase text-[10px] tracking-widest">AI Stüdyo</span>
                    </div>
                    <div className={`${isStudioActive && !isStudioOpen ? 'text-white' : 'text-text-secondary'} transition-transform duration-300 ${isStudioOpen ? 'rotate-180' : ''}`}>
                      <ChevronDown className="w-4 h-4" />
                    </div>
                    {isStudioActive && !isStudioOpen && (
                      <motion.div 
                        layoutId="activeNavIndicator"
                        className="absolute left-0 w-1 h-5 bg-[#2563eb] rounded-r-full"
                      />
                    )}
                  </button>

                  <AnimatePresence>
                    {isStudioOpen && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden pl-4 space-y-1"
                      >
                        <NavItem 
                          active={activeTab === 'studio'} 
                          onClick={() => onTabChange('studio')}
                          label="Yüz Sentezi" 
                          icon={<UserCircle className="w-4 h-4" />} 
                          isSubItem
                        />
                        <NavItem 
                          active={activeTab === 'fetal-studio'} 
                          onClick={() => onTabChange('fetal-studio')}
                          label="Fetal Stüdyo" 
                          icon={<Baby className="w-4 h-4" />} 
                          isSubItem
                        />
                        <NavItem 
                          active={activeTab === 'biometrik-fcs'} 
                          onClick={() => onTabChange('biometrik-fcs')}
                          label="Biometrik FCS" 
                          icon={<Box className="w-4 h-4" />} 
                          isSubItem
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            )}
          </nav>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-border-subtle">
        <div className="p-4 rounded-xl hover:bg-surface-hover transition-colors group">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#2563eb]/10 text-[#2563eb] flex items-center justify-center text-sm font-medium">
              {user.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-[#111827] truncate">{user.name}</p>
              <p className="text-[10px] text-text-secondary font-medium uppercase tracking-wider truncate">
                {user.role === UserRole.SUPER_ADMIN ? 'Süper Yönetici' : 'Uzman Doktor'}
              </p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full py-3 flex items-center justify-center gap-2 bg-[#2563eb] text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-[#2563eb]/20 hover:bg-[#1d4ed8]"
          >
            <LogOut className="w-4 h-4" />
            <span>Sistemden Ayrıl</span>
          </button>
        </div>
      </div>
    </aside>
    </>
  );
};

const NavItem: React.FC<{ label: string; icon: React.ReactNode; active?: boolean; onClick: () => void; isSubItem?: boolean }> = ({ label, icon, active, onClick, isSubItem }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all group relative ${
      active 
        ? 'bg-[#2563eb] text-white shadow-lg shadow-[#2563eb]/20' 
        : 'text-text-secondary hover:bg-surface-hover hover:text-[#111827]'
    } ${isSubItem ? 'py-2.5' : ''}`}
  >
    <div className={`${active ? 'text-white' : 'text-text-secondary group-hover:text-[#111827]'} transition-colors ${isSubItem ? 'scale-90' : ''}`}>
      {icon}
    </div>
    <span className={`tracking-tight uppercase tracking-widest ${isSubItem ? 'text-[9px]' : 'text-[10px]'}`}>{label}</span>
    {active && (
      <motion.div 
        layoutId="activeNavIndicator"
        className="absolute left-0 w-1 h-5 bg-[#2563eb] rounded-r-full"
      />
    )}
  </button>
);

export default Sidebar;

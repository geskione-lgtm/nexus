
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, HeartPulse } from 'lucide-react';

import { User } from '../../types';
import Sidebar from '../Sidebar';

interface PageShellProps {
  children: React.ReactNode;
  user: User;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
}

export const PageShell: React.FC<PageShellProps> = ({ children, user, activeTab, onTabChange, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden relative font-sans">
      {/* Background Noise Texture */}
      <div className="bg-noise"></div>
      
      {/* Sidebar Area */}
      <Sidebar 
        user={user} 
        activeTab={activeTab} 
        onTabChange={(tab) => {
          onTabChange(tab);
          setIsSidebarOpen(false);
        }} 
        onLogout={onLogout} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative scroll-smooth lg:z-[80]">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-surface border-b border-border-subtle sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <HeartPulse className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-text-primary">NeoBreed</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 hover:bg-slate-100 rounded-lg text-text-secondary"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 md:p-6 lg:p-8 max-w-[1920px] mx-auto">
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeTab}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

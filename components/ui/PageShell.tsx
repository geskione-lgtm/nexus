
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

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
  return (
    <div className="flex h-screen bg-background overflow-hidden relative font-sans">
      {/* Background Noise Texture */}
      <div className="bg-noise"></div>
      
      {/* Sidebar Area */}
      <Sidebar 
        user={user} 
        activeTab={activeTab} 
        onTabChange={onTabChange} 
        onLogout={onLogout} 
      />
      
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative z-10 scroll-smooth">
        <div className="p-6 lg:p-8 max-w-[1920px] mx-auto">
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

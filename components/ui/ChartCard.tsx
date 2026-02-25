
import React from 'react';
import { SoftCard } from './SoftCard';
import { Maximize2 } from 'lucide-react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}

export const ChartCard: React.FC<ChartCardProps> = ({ title, subtitle, children, action }) => {
  return (
    <SoftCard className="flex flex-col h-full relative group">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-sm font-semibold text-text-primary tracking-tight">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-text-secondary mt-1">
              {subtitle}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {action}
          <button className="p-2 hover:bg-surface-hover border border-border-subtle rounded-lg transition-all text-text-secondary hover:text-text-primary active:scale-95">
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="flex-1 min-h-[300px] w-full">
        {children}
      </div>
    </SoftCard>
  );
};

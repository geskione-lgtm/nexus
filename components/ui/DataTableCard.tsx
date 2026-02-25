
import React from 'react';
import { SoftCard } from './SoftCard';
import { Search, Filter, Plus, MoreHorizontal } from 'lucide-react';

interface DataTableCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onSearch?: (query: string) => void;
  actions?: React.ReactNode;
}

export const DataTableCard: React.FC<DataTableCardProps> = ({ title, subtitle, children, onSearch, actions }) => {
  return (
    <SoftCard className="flex flex-col" noPadding>
      <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle">
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
        
        <div className="flex flex-wrap items-center gap-3">
          {onSearch && (
            <div className="flex items-center bg-surface-hover border border-border-subtle rounded-lg px-3 py-2 w-full md:w-64 focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/10 transition-all group">
              <Search className="w-4 h-4 text-text-secondary group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Ara..." 
                onChange={(e) => onSearch(e.target.value)}
                className="bg-transparent border-none outline-none px-2 text-sm font-medium w-full text-text-primary placeholder:text-text-secondary/50" 
              />
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-surface-hover border border-border-subtle rounded-lg text-text-secondary transition-all active:scale-95">
              <Filter className="w-4 h-4" />
            </button>
            <button className="p-2 hover:bg-surface-hover border border-border-subtle rounded-lg text-text-secondary transition-all active:scale-95">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
          
          {actions}
        </div>
      </div>
      
      <div className="overflow-x-auto">
        {children}
      </div>
    </SoftCard>
  );
};

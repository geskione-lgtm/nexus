
import React from 'react';
import { SoftCard } from './SoftCard';
import { ChevronRight, Clock, ArrowUpRight } from 'lucide-react';

interface ActivityItem {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  icon?: React.ReactNode;
  status?: 'success' | 'warning' | 'info';
}

interface ActivityListProps {
  title: string;
  items: ActivityItem[];
  onItemClick?: (id: string) => void;
}

export const ActivityList: React.FC<ActivityListProps> = ({ title, items, onItemClick }) => {
  return (
    <SoftCard className="flex flex-col h-full" noPadding>
      <div className="p-6 flex justify-between items-center border-b border-border-subtle">
        <h3 className="text-sm font-semibold text-text-primary tracking-tight">
          {title}
        </h3>
        <button className="w-8 h-8 rounded-lg hover:bg-surface-hover border border-border-subtle flex items-center justify-center text-text-secondary transition-all active:scale-95">
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {items.length > 0 ? (
          <div className="divide-y divide-border-subtle">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => onItemClick?.(item.id)}
                className="w-full text-left p-4 hover:bg-surface-hover transition-all flex items-center gap-4 group"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-all group-hover:scale-105 overflow-hidden ${
                  item.status === 'success' ? 'bg-emerald-50 text-emerald-600' :
                  item.status === 'warning' ? 'bg-amber-50 text-amber-600' :
                  'bg-gray-50 text-gray-600'
                }`}>
                  {item.icon || <Clock className="w-5 h-5" />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate">
                    {item.title}
                  </p>
                  <p className="text-xs text-text-secondary truncate mt-0.5">
                    {item.subtitle}
                  </p>
                </div>
                
                <div className="text-right shrink-0">
                  <p className="text-[10px] font-medium text-text-secondary uppercase tracking-wider">
                    {item.time}
                  </p>
                  <ChevronRight className="w-4 h-4 text-text-secondary/30 ml-auto mt-1 group-hover:translate-x-0.5 transition-all" />
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <p className="text-xs font-medium text-text-secondary uppercase tracking-widest">
              Kayıt Bulunmuyor
            </p>
          </div>
        )}
      </div>
    </SoftCard>
  );
};

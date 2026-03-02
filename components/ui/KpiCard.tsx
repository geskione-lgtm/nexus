
import React from 'react';
import { SoftCard } from './SoftCard';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'motion/react';

interface KpiCardProps {
  label: string;
  value: string | number;
  delta?: {
    value: number;
    isPositive: boolean;
  };
  icon: React.ReactNode;
  color?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({ label, value, delta, icon, color = "bg-primary" }) => {
  return (
    <SoftCard className="relative group flex flex-col justify-between min-h-[160px]">
      <div className="flex justify-between items-start">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm ${color}`}>
          {React.cloneElement(icon as React.ReactElement, { className: "w-5 h-5" })}
        </div>
        {delta && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium ${
            delta.isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
          }`}>
            {delta.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {delta.value}%
          </div>
        )}
      </div>
      
      <div className="mt-4">
        <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">
          {label}
        </p>
        <h3 className="text-3xl font-medium tracking-tight text-text-primary">
          {value}
        </h3>
      </div>
    </SoftCard>
  );
};

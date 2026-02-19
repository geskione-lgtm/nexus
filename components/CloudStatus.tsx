
import React from 'react';

const CloudStatus: React.FC<{ isSyncing: boolean }> = ({ isSyncing }) => {
  return (
    <div className="flex items-center gap-3">
      <div className="p-3 bg-white border border-slate-100 rounded-2xl card-shadow group cursor-pointer hover:bg-slate-50 transition-colors">
        <div className="relative">
          <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
        </div>
      </div>
      
      <div className="hidden lg:flex items-center gap-3 px-6 py-2.5 bg-white border border-slate-100 rounded-2xl card-shadow">
        <div className={`w-2.5 h-2.5 rounded-full ${isSyncing ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500 shadow-[0_0_8px_#10b981]'}`}></div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
          {isSyncing ? 'Senkronizasyon...' : 'Cloud Aktif'}
        </span>
      </div>
    </div>
  );
};

export default CloudStatus;
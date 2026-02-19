
import React from 'react';

const CloudStatus: React.FC<{ isSyncing: boolean }> = ({ isSyncing }) => {
  return (
    <div className="flex items-center gap-6 px-6 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-amber-400 animate-pulse' : 'bg-nexus-green shadow-[0_0_8px_#10b981]'}`}></div>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
          {isSyncing ? 'Bulut Senkronizasyonu...' : 'Google Cloud: Bağlı'}
        </span>
      </div>
      <div className="h-4 w-px bg-slate-100"></div>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-nexus-green shadow-[0_0_8px_#10b981]"></div>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">DB: Aktif</span>
      </div>
    </div>
  );
};

export default CloudStatus;

import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Toast() {
  const { toast } = useApp();

  if (!toast) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md text-xs font-semibold ${
          toast.type === 'error'
            ? 'bg-rose-950/90 border-rose-500/50 text-rose-200'
            : toast.type === 'info'
            ? 'bg-slate-900/90 border-slate-700 text-slate-200'
            : 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
        }`}
      >
        {toast.type === 'error' ? (
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
        ) : toast.type === 'info' ? (
          <Info className="w-4 h-4 text-slate-400 shrink-0" />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        )}
        <span>{toast.message}</span>
      </div>
    </div>
  );
}

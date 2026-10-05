import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export default function ToastContainer({ toasts, removeToast }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 max-w-md w-full pointer-events-none">
      {toasts.map((toast) => {
        const isDanger = toast.type === 'danger';
        const isWarning = toast.type === 'warning';
        const isSuccess = toast.type === 'success';

        let borderColor = 'border-cyan-500/40';
        let bgColor = 'bg-slate-900/95';
        let icon = <Info className="w-5 h-5 text-cyan-400 shrink-0" />;

        if (isDanger) {
          borderColor = 'border-rose-500/60';
          bgColor = 'bg-[#180a0f]/95';
          icon = <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />;
        } else if (isWarning) {
          borderColor = 'border-amber-500/60';
          bgColor = 'bg-[#181308]/95';
          icon = <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
        } else if (isSuccess) {
          borderColor = 'border-emerald-500/60';
          bgColor = 'bg-[#091811]/95';
          icon = <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg border shadow-xl backdrop-blur-md transition-all duration-300 transform translate-y-0 ${bgColor} ${borderColor}`}
          >
            {icon}
            <div className="flex-1 text-xs md:text-sm text-slate-200 leading-snug">
              {toast.message}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white transition-colors ml-1 p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}


import React from 'react';
import { Report } from '../types';

interface Props {
  reports: Report[];
  onEdit: (report: Report) => void;
  onDelete: (id: string) => void;
  onPrint: (report: Report) => void;
  onMarkExported: (report: Report) => void;
  onQuickUse: (report: Report) => void;
}

const ReportList: React.FC<Props> = ({ reports, onEdit, onDelete, onPrint, onMarkExported, onQuickUse }) => {
  const isManualTemplate = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  return (
    <div className="space-y-3 pb-32">
      {reports.length === 0 && (
        <div className="py-20 text-center space-y-4 opacity-20 grayscale">
          <div className="text-7xl">📑</div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em]">Sem Registros</p>
        </div>
      )}
      
      {reports.map((report) => (
        <div 
          key={report.id}
          className={`relative group rounded-xl border-2 transition-all duration-200 active:scale-[0.99] overflow-hidden ${
            report.isExported ? 'bg-slate-900/30 border-slate-800/40 opacity-70' : 'bg-slate-900 border-slate-800 shadow-lg'
          }`}
          onClick={() => report.isTemplate ? onQuickUse(report) : onEdit(report)}
        >
          {/* Indicador Lateral Técnico */}
          <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${
            report.isTemplate ? 'bg-sky-500 shadow-[0_0_10px_rgba(56,189,248,0.5)]' : 
            report.isOmFinished ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 
            'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
          }`}></div>

          <div className="p-5 pl-6">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-3">
                   {/* Nº OM - GRANDE E VISÍVEL */}
                   <span className="mono text-[15px] font-black text-sky-400 bg-sky-400/10 px-3 py-1 rounded-md border border-sky-400/20">
                     {report.omNumber || 'SEM OM'}
                   </span>
                   {report.isExported && (
                      <span className="bg-emerald-500/10 text-emerald-500 text-[8px] font-black px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-widest">✓ Enviado</span>
                   )}
                </div>
                
                <h3 className="text-[15px] font-black text-slate-100 uppercase leading-tight truncate tracking-tight mb-3">
                  {report.omDescription}
                </h3>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                   <span className="text-[10px] text-slate-500 font-bold flex items-center gap-2 uppercase tracking-widest">
                      <span className="opacity-40">🗓</span> {report.date ? report.date.split('-').reverse().join('/') : '--/--'}
                   </span>
                   <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-2">
                      <span className="opacity-40">⚙️</span> {report.activityType}
                   </span>
                </div>
              </div>

              {(!report.isTemplate || isManualTemplate(report.id)) && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(report.id); }} 
                  className="p-3 bg-slate-950 hover:bg-red-900/30 rounded-lg text-slate-600 hover:text-red-500 transition-all border border-slate-800"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
            
            {/* HORÁRIOS - VISIBILIDADE MÁXIMA */}
            {!report.isTemplate && (
              <div className="mt-5 pt-5 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-[9px] font-black uppercase text-slate-600 tracking-[0.2em]">Execução:</span>
                  <div className="flex items-center gap-2">
                    <span className="mono text-lg font-black text-white bg-slate-950 px-3 py-1 rounded-lg border border-white/10 shadow-inner">
                      {report.startTime || '00:00'}
                    </span>
                    <span className="text-slate-700 font-black">→</span>
                    <span className="mono text-lg font-black text-white bg-slate-950 px-3 py-1 rounded-lg border border-white/10 shadow-inner">
                      {report.endTime || '00:00'}
                    </span>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                  report.isOmFinished ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                }`}>
                  {report.isOmFinished ? 'Finalizada' : 'Aberta'}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ReportList;

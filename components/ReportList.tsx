
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
  const isManualTemplate = (id: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  };

  const handleCardClick = (report: Report) => {
    if (report.isTemplate) {
      onQuickUse(report);
    } else {
      onEdit(report);
    }
  };

  return (
    <div className="grid gap-2 max-w-full mx-auto">
      {reports.map((report) => (
        <div 
          key={report.id}
          className={`rounded-xl shadow-md transition-all cursor-pointer flex overflow-hidden border border-slate-800 group ${
            report.isExported ? 'bg-[#1e293b]/40' : 'bg-[#161c2d]'
          } hover:border-blue-500/50 active:scale-[0.98]`}
          onClick={() => handleCardClick(report)}
        >
          {/* Indicador lateral extra fino */}
          <div className={`w-1 shrink-0 ${report.isTemplate ? 'bg-blue-600' : report.isOmFinished ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>

          <div className="flex-1 p-2.5 flex flex-col justify-center min-w-0">
            <div className="flex justify-between items-center gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                   <span className="text-[7px] font-black text-slate-500 uppercase tracking-tighter bg-slate-800/50 px-1 rounded">
                     {report.omNumber || 'SEM NÚMERO'}
                   </span>
                   {report.isExported && (
                      <span className="text-[7px] font-black text-emerald-500 uppercase">✓ Enviado</span>
                   )}
                </div>
                {/* Título com fonte reduzida para container ficar mais "fino" */}
                <h3 className="font-bold text-[11px] text-slate-100 uppercase leading-tight truncate">
                  {report.omDescription}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                   <span className="text-[8px] text-slate-500 flex items-center gap-1">
                      📅 {report.date ? report.date.split('-').reverse().join('/') : '--/--/----'}
                   </span>
                   <span className="text-[8px] text-slate-500 flex items-center gap-1 uppercase tracking-tighter">
                      🛡️ {report.activityType}
                   </span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0 ml-2">
                {/* Excluir disponível se for relatório ou modelo manual */}
                {(!report.isTemplate || isManualTemplate(report.id)) && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(report.id); }} 
                    className="p-1.5 hover:bg-red-900/30 rounded-md text-slate-500 hover:text-red-400 transition-colors"
                    title="Excluir"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            
            {/* Infos de tempo reduzidas para relatórios ativos */}
            {!report.isTemplate && (
              <div className="flex items-center gap-3 pt-1 border-t border-slate-800/30 mt-1">
                <span className="text-[8px] font-bold text-slate-500">⏰ {report.startTime || '--:--'} - {report.endTime || '--:--'}</span>
                <span className={`text-[7px] font-black px-1 py-0.5 rounded uppercase ${report.isOmFinished ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                  {report.isOmFinished ? 'Finalizada' : 'Aberta'}
                </span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ReportList;

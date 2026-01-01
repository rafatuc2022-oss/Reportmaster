
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
  // Função para verificar se é um UUID (criado manualmente)
  const isManualTemplate = (id: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  };

  return (
    <div className="grid gap-4">
      {reports.map((report) => (
        <div 
          key={report.id}
          className={`rounded-3xl shadow-lg transition-all cursor-pointer group flex relative overflow-hidden active:scale-[0.99] border-2 ${
            report.isExported 
              ? 'bg-emerald-50 border-emerald-300' 
              : 'bg-white border-slate-200'
          }`}
          onClick={() => onEdit(report)}
        >
          {/* Barra lateral indicadora */}
          <div className={`w-1.5 self-stretch ${report.isOmFinished ? 'bg-emerald-500' : 'bg-amber-400'}`}></div>

          <div className="flex-1 p-5">
            <div className="flex justify-between items-start gap-3 mb-3">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-1 rounded-md uppercase tracking-wider border border-slate-200">
                    {report.isTemplate ? 'Modelo' : `OM: ${report.omNumber || '---'}`}
                  </span>
                  {!report.isTemplate && (
                     <>
                        <span className={`text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-wide border flex items-center gap-1 ${report.isOmFinished ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${report.isOmFinished ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                            {report.isOmFinished ? 'Finalizada' : 'Em Aberto'}
                        </span>
                        {report.isExported && (
                            <span className="text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-wide border bg-green-600 text-white border-green-600 flex items-center gap-1">
                                ✓✓ Enviado
                            </span>
                        )}
                     </>
                  )}
                </div>
                <h3 className="font-bold text-base text-slate-800 leading-snug uppercase line-clamp-2 pr-2">
                  {report.omDescription}
                </h3>
              </div>
              
              <div className="flex gap-2 shrink-0">
                {/* Só permite excluir se NÃO for template OU se for um template manual (UUID) */}
                {(!report.isTemplate || isManualTemplate(report.id)) && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(report.id); }}
                    className="w-10 h-10 flex items-center justify-center bg-white hover:bg-red-50 hover:text-red-500 rounded-xl text-red-400 transition-all border-2 border-slate-200 shadow-sm active:scale-95"
                    title="Excluir"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-100">
              <div className="grid grid-cols-3 gap-2 flex-1">
                <div className="flex flex-col bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <span className="font-black text-slate-400 uppercase text-[8px] tracking-wider mb-0.5">Data</span>
                  <span className="font-bold text-xs text-slate-700">{report.date ? report.date.split('-').reverse().join('/') : '--/--'}</span>
                </div>
                <div className="flex flex-col bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <span className="font-black text-slate-400 uppercase text-[8px] tracking-wider mb-0.5">Início</span>
                  <span className="font-bold text-xs text-emerald-600">{report.startTime || '--:--'}</span>
                </div>
                <div className="flex flex-col bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <span className="font-black text-slate-400 uppercase text-[8px] tracking-wider mb-0.5">Fim</span>
                  <span className="font-bold text-xs text-red-500">{report.endTime || '--:--'}</span>
                </div>
              </div>

              {report.isTemplate && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onQuickUse(report); }}
                  className="bg-blue-600 text-white px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-md active:scale-95 shrink-0"
                >
                  <span>🛠️</span> Utilizar Modelo
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ReportList;

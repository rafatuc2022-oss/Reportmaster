
import React, { useState, useEffect, useMemo } from 'react';
import { Report, AppView, Category } from './types';
import { storage } from './services/storage';
import { generatePDF } from './services/pdfService';
import ReportForm from './components/ReportForm';
import ReportList from './components/ReportList';
import ShiftStart from './components/ShiftStart';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('LIST');
  const [reports, setReports] = useState<Report[]>([]);
  const [currentReport, setCurrentReport] = useState<Report | null>(null);
  
  const [activeCategory, setActiveCategory] = useState<Category>('FIXO');
  const [activeTab, setActiveTab] = useState('MEUS MODELOS');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setReports(storage.getReports());
  }, []);

  const handleCreateNew = () => {
    setCurrentReport(null);
    setView('CREATE');
  };

  const handleEdit = (report: Report) => {
    setCurrentReport(report);
    setView('EDIT');
  };

  const handleSave = (formData: Report) => {
    if (view === 'CREATE') {
      const templateToSave = { ...formData, isTemplate: true, category: activeCategory };
      storage.addReport(templateToSave);
      setActiveTab('MEUS MODELOS');
    } else if (view === 'EDIT') {
      if (currentReport?.isTemplate) {
        const newFilledReport = { ...formData, id: crypto.randomUUID(), createdAt: Date.now(), isTemplate: false, category: activeCategory };
        storage.addReport(newFilledReport);
        setActiveTab('RELATÓRIOS');
      } else {
        storage.updateReport(formData);
        setActiveTab('RELATÓRIOS');
      }
    }
    setReports(storage.getReports());
    setView('LIST');
  };

  const handleMarkAsExported = (report: Report) => {
    const updatedReport = { ...report, isExported: true };
    if (!report.isTemplate) {
        storage.updateReport(updatedReport);
        setReports(storage.getReports());
    }
    return updatedReport;
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Deseja excluir este item permanentemente?')) {
      storage.deleteReport(id);
      setReports(storage.getReports());
    }
  };

  const handlePrint = (report: Report) => {
    generatePDF(report);
  };

  const getDurationMinutes = (start: string, end: string) => {
    if (!start || !end) return 0;
    const [h1, m1] = start.split(':').map(Number);
    const [h2, m2] = end.split(':').map(Number);
    let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (diff < 0) diff += 24 * 60;
    return diff;
  };

  const filteredReports = useMemo(() => {
    let result = reports.filter(r => {
      const matchesCategory = r.category === activeCategory || (!r.category && activeCategory === 'FIXO');
      let matchesTab = activeTab === 'MEUS MODELOS' ? r.isTemplate : activeTab === 'RELATÓRIOS' ? !r.isTemplate : true;
      const matchesSearch = r.omDescription.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           r.omNumber.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesTab && matchesSearch;
    });
    if (activeTab === 'RELATÓRIOS') {
      result.sort((a, b) => (a.startTime || '00:00').localeCompare(b.startTime || '00:00'));
    } else {
      result.sort((a, b) => b.createdAt - a.createdAt);
    }
    return result;
  }, [reports, activeCategory, activeTab, searchQuery]);

  const totalExecutionTime = useMemo(() => {
    const totalMinutes = filteredReports.reduce((acc, r) => acc + getDurationMinutes(r.startTime, r.endTime), 0);
    return { hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 };
  }, [filteredReports]);

  return (
    <div className="min-h-screen bg-slate-50 pb-6">
      <header className="bg-white p-4 sticky top-0 z-50 border-b border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg">RM</div>
            <div>
              <h1 className="text-lg font-black text-slate-900 tracking-tight leading-none">ReportMaster</h1>
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">Automação Serra Sul</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-4">
        {view === 'LIST' ? (
          <>
            <div className="relative">
               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
               </div>
               <input 
                 type="text" 
                 placeholder="Pesquisar por OM ou Descrição..."
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-slate-200 bg-white shadow-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-sm font-medium text-slate-500"
               />
            </div>

            <div className="flex bg-slate-200/50 p-1.5 rounded-2xl gap-1.5">
               <button onClick={() => setActiveCategory('FIXO')} className={`flex-1 py-3 rounded-xl font-black text-xs transition-all uppercase tracking-widest ${activeCategory === 'FIXO' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-white/50'}`}>🔧 Fixos</button>
               <button onClick={() => setActiveCategory('MÓVEL')} className={`flex-1 py-3 rounded-xl font-black text-xs transition-all uppercase tracking-widest ${activeCategory === 'MÓVEL' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-white/50'}`}>🚛 Móveis</button>
            </div>

            <div className="flex border-b border-slate-200">
               {['MEUS MODELOS', 'RELATÓRIOS', 'BOA JORNADA'].map(tab => (
                 <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-3 font-black text-[10px] uppercase tracking-tighter border-b-4 transition-all ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}>{tab.replace('MEUS ', '')}</button>
               ))}
            </div>

            {activeTab === 'BOA JORNADA' ? <ShiftStart /> : (
              <>
                {activeTab === 'RELATÓRIOS' && filteredReports.length > 0 && (
                  <div className="bg-white p-4 rounded-2xl border-2 border-blue-100 shadow-sm flex items-center justify-between">
                    <div>
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tempo Total de Execução</h3>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-2xl font-black text-blue-600">{totalExecutionTime.hours}h</span>
                        <span className="text-sm font-black text-blue-400">{totalExecutionTime.minutes.toString().padStart(2, '0')}m</span>
                      </div>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-xl text-xl">⏱️</div>
                  </div>
                )}
                {activeTab === 'MEUS MODELOS' && (
                  <button onClick={handleCreateNew} className="w-full bg-white border-2 border-dashed border-blue-400 text-blue-600 font-black py-4 rounded-2xl hover:bg-blue-50 transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-widest group"><span className="text-xl group-hover:scale-125 transition-transform">➕</span> Criar Novo Modelo {activeCategory}</button>
                )}
                <div className="space-y-3">
                  {filteredReports.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                      <span className="text-5xl block mb-4 grayscale opacity-30">📂</span>
                      <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Nenhum item encontrado.</p>
                    </div>
                  ) : (
                    <ReportList reports={filteredReports} onEdit={handleEdit} onDelete={handleDelete} onPrint={handlePrint} onMarkExported={handleMarkAsExported} />
                  )}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
            <ReportForm initialData={currentReport} onSave={handleSave} onCancel={() => setView('LIST')} isEdit={view === 'EDIT'} onMarkExported={handleMarkAsExported} />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;

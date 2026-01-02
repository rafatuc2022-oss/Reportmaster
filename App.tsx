
import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const [activeCategory, setActiveCategory] = useState<Category>('FIXO');
  const [activeTab, setActiveTab] = useState('MEUS MODELOS');
  const [searchQuery, setSearchQuery] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleQuickUse = (template: Report) => {
    const getTodayStr = () => new Date().toISOString().split('T')[0];
    const newFilledReport: Report = { 
      ...template, 
      id: crypto.randomUUID(), 
      createdAt: Date.now(), 
      isTemplate: false, 
      date: getTodayStr(),
      category: activeCategory,
      isExported: false
    };
    storage.addReport(newFilledReport);
    setReports(storage.getReports());
    setActiveTab('RELATÓRIOS');
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    if (window.confirm('Excluir este registro permanentemente?')) {
      storage.deleteReport(id);
      setReports(storage.getReports());
    }
  };

  const handlePrint = (report: Report) => generatePDF(report);

  const handleExportBackup = () => {
    const data = storage.getReports();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_reportmaster_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setIsMenuOpen(false);
  };

  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedData = JSON.parse(content);
        if (Array.isArray(importedData)) {
          if (window.confirm('Isso substituirá todos os dados atuais. Continuar?')) {
            storage.saveReports(importedData);
            setReports(storage.getReports());
          }
        }
      } catch (err) { alert('Erro no arquivo.'); }
    };
    reader.readAsText(file);
    setIsMenuOpen(false);
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
    <div className="min-h-screen bg-[#020617] text-slate-200">
      
      {/* SIDEBAR MODERNA */}
      <div className={`fixed inset-0 z-[100] transition-all duration-500 ${isMenuOpen ? 'visible' : 'invisible'}`}>
        <div className={`absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-500 ${isMenuOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setIsMenuOpen(false)}></div>
        <div className={`absolute top-0 left-0 h-full w-72 bg-[#0f172a] border-r border-slate-800 shadow-2xl transition-transform duration-300 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-8 border-b border-slate-800 bg-slate-900/50">
              <div className="w-10 h-10 bg-sky-500 rounded-lg flex items-center justify-center text-slate-950 font-black text-lg mb-3">RM</div>
              <span className="font-black text-white uppercase tracking-tighter text-base">Menu Administrativo</span>
          </div>
          <div className="p-6 space-y-4">
             <button onClick={handleExportBackup} className="w-full flex items-center gap-4 p-4 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-700 text-xs font-black transition-all text-left uppercase tracking-widest">
                <span className="text-xl">💾</span> Backup do Sistema
             </button>
             <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center gap-4 p-4 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-700 text-xs font-black transition-all text-left uppercase tracking-widest">
                <span className="text-xl">📥</span> Restaurar Dados
             </button>
             <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
          </div>
          <div className="mt-auto p-8 border-t border-slate-800 opacity-40">
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-center leading-relaxed">Automação Mina S11D<br/>Industrial v2.6</p>
          </div>
        </div>
      </div>

      {/* HEADER COMPACTO E LIMPO */}
      <header className="glass sticky top-0 z-[60] border-b border-white/10 px-6 py-4">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <button onClick={() => setIsMenuOpen(true)} className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-900 border border-slate-700 text-sky-400 active:scale-95 transition-all">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <div className="text-center">
              <h1 className="text-sm font-black text-white tracking-[0.2em] uppercase">ReportMaster</h1>
              <p className="text-[9px] font-bold text-sky-500 uppercase tracking-widest flex items-center justify-center gap-2 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                Status: Sincronizado
              </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-[9px] font-black text-sky-500">
            PRO
          </div>
        </div>
      </header>

      <main className={`max-w-xl mx-auto space-y-6 ${view === 'LIST' ? 'p-5' : 'p-0'}`}>
        {view === 'LIST' ? (
          <>
            {/* BUSCA COM DESIGN ESTRUTURADO */}
            <div className="relative">
               <input 
                 type="text" 
                 placeholder="Pesquisar Ordem de Manutenção..."
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full pl-12 pr-6 py-4 rounded-xl bg-slate-900 border-2 border-slate-800 text-base font-bold text-white outline-none focus:border-sky-500 transition-all placeholder:text-slate-600 shadow-xl"
               />
               <svg className="w-5 h-5 absolute left-4 top-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>

            {/* SELETOR DE CATEGORIA */}
            <div className="flex p-1 bg-slate-900 rounded-xl border border-slate-800">
               <button onClick={() => setActiveCategory('FIXO')} className={`flex-1 py-3 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all ${activeCategory === 'FIXO' ? 'bg-sky-500 text-slate-950 shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>Ativos Fixos</button>
               <button onClick={() => setActiveCategory('MÓVEL')} className={`flex-1 py-3 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all ${activeCategory === 'MÓVEL' ? 'bg-sky-500 text-slate-950 shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>Equip. Móveis</button>
            </div>

            {/* TABS DE NAVEGAÇÃO */}
            <div className="flex gap-6 border-b border-slate-800 px-2 overflow-x-auto no-scrollbar">
               {(['MEUS MODELOS', 'RELATÓRIOS', 'BOA JORNADA']).map(tab => (
                 <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)} 
                  className={`pb-4 text-[10px] font-black uppercase tracking-widest whitespace-nowrap border-b-2 transition-all ${activeTab === tab ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-500'}`}
                 >
                   {tab}
                 </button>
               ))}
            </div>

            {activeTab === 'BOA JORNADA' ? <ShiftStart /> : (
              <div className="space-y-4 animate-in fade-in duration-500">
                {activeTab === 'MEUS MODELOS' && (
                  <button onClick={handleCreateNew} className="w-full bg-sky-600 p-5 rounded-xl font-black text-slate-950 hover:bg-sky-500 transition-all active:scale-[0.98] shadow-lg flex items-center justify-center gap-3 uppercase tracking-widest text-xs">
                    <span className="text-xl">✚</span> Novo Modelo: {activeCategory}
                  </button>
                )}
                
                {activeTab === 'RELATÓRIOS' && filteredReports.length > 0 && (
                  <div className="bg-slate-900/40 p-5 rounded-xl border border-slate-800 flex items-center justify-between shadow-lg">
                    <div>
                      <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Horas Operacionais</h3>
                      <p className="mono text-2xl font-black text-sky-400">{totalExecutionTime.hours}h {totalExecutionTime.minutes}m</p>
                    </div>
                    <div className="w-12 h-12 bg-sky-500/10 rounded-lg flex items-center justify-center text-2xl border border-sky-500/20">⏱️</div>
                  </div>
                )}

                <ReportList 
                  reports={filteredReports} 
                  onEdit={handleEdit} 
                  onDelete={handleDelete} 
                  onPrint={handlePrint} 
                  onMarkExported={handleMarkAsExported}
                  onQuickUse={handleQuickUse} 
                />
              </div>
            )}
          </>
        ) : (
          <ReportForm 
            initialData={currentReport} 
            onSave={handleSave} 
            onCancel={() => setView('LIST')} 
            isEdit={view === 'EDIT'} 
            onMarkExported={handleMarkAsExported} 
          />
        )}
      </main>
    </div>
  );
};

export default App;

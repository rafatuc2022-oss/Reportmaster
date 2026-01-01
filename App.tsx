
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
    if (window.confirm('Deseja excluir este item permanentemente?')) {
      storage.deleteReport(id);
      setReports(storage.getReports());
    }
  };

  const handlePrint = (report: Report) => {
    generatePDF(report);
  };

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
          if (window.confirm('Atenção: Isso substituirá todos os seus dados atuais pelos dados do backup. Deseja continuar?')) {
            storage.saveReports(importedData);
            setReports(storage.getReports());
            alert('Backup restaurado com sucesso!');
          }
        } else {
          alert('Arquivo de backup inválido.');
        }
      } catch (err) {
        alert('Erro ao processar o arquivo de backup.');
      }
    };
    reader.readAsText(file);
    setIsMenuOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
    <div className="min-h-screen bg-[#0b1120] pb-10 relative overflow-x-hidden text-slate-200">
      
      {/* SIDE MENU */}
      <div className={`fixed inset-0 z-[100] transition-opacity duration-300 ${isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}></div>
        <div className={`absolute top-0 left-0 h-full w-72 bg-[#161c2d] border-r border-slate-800 shadow-2xl transition-transform duration-300 flex flex-col ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-sm">RM</div>
              <span className="font-black text-slate-100 uppercase tracking-tight">Menu</span>
            </div>
            <button onClick={() => setIsMenuOpen(false)} className="text-slate-500 hover:text-white">✕</button>
          </div>
          <div className="flex-1 p-4 space-y-2">
             <button onClick={handleExportBackup} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800 text-slate-300 font-bold text-sm transition-colors"><span>💾</span> Backup (Exportar)</button>
             <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800 text-slate-300 font-bold text-sm transition-colors"><span>📥</span> Restaurar (Importar)</button>
             <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
          </div>
        </div>
      </div>

      {/* HEADER COMPACTO */}
      <header className="bg-[#0b1120] p-4 sticky top-0 z-50 border-b border-slate-800">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMenuOpen(true)} className="p-2 -ml-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div>
                <h1 className="text-lg font-black text-white tracking-tight leading-none">ReportMaster</h1>
                <p className="text-[9px] font-bold text-blue-500 uppercase tracking-widest mt-0.5">S11D - SERRA SUL</p>
            </div>
          </div>
        </div>
      </header>

      <main className={`max-w-xl mx-auto space-y-5 ${view === 'LIST' ? 'p-4' : 'p-0'}`}>
        {view === 'LIST' ? (
          <>
            <div className="relative">
               <input 
                 type="text" 
                 placeholder="Buscar modelo..."
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#161c2d] border border-slate-800 text-sm font-medium text-slate-200 outline-none focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-slate-500"
               />
               <svg className="w-5 h-5 absolute left-3 top-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>

            {/* CATEGORY SELECTOR */}
            <div className="flex bg-[#161c2d] p-1 rounded-xl border border-slate-800">
               <button onClick={() => setActiveCategory('FIXO')} className={`flex-1 py-2.5 rounded-lg font-bold text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeCategory === 'FIXO' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}><span>🔧</span> FIXOS</button>
               <button onClick={() => setActiveCategory('MÓVEL')} className={`flex-1 py-2.5 rounded-lg font-bold text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeCategory === 'MÓVEL' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}><span>🚛</span> MÓVEIS</button>
            </div>

            {/* TABS COMPACTAS */}
            <div className="flex justify-around border-b border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500">
               <button onClick={() => setActiveTab('MEUS MODELOS')} className={`pb-3 px-2 border-b-2 transition-all ${activeTab === 'MEUS MODELOS' ? 'border-blue-500 text-blue-500' : 'border-transparent'}`}>Meus Modelos</button>
               <button onClick={() => setActiveTab('RELATÓRIOS')} className={`pb-3 px-2 border-b-2 transition-all ${activeTab === 'RELATÓRIOS' ? 'border-blue-500 text-blue-500' : 'border-transparent'}`}>Relatórios</button>
               <button onClick={() => setActiveTab('BOA JORNADA')} className={`pb-3 px-2 border-b-2 transition-all ${activeTab === 'BOA JORNADA' ? 'border-blue-500 text-blue-500' : 'border-transparent'}`}>Início de Turno</button>
            </div>

            {activeTab === 'BOA JORNADA' ? <ShiftStart /> : (
              <div className="space-y-3">
                {activeTab === 'MEUS MODELOS' && (
                  <button onClick={handleCreateNew} className="w-full bg-blue-600 text-white font-black py-4 rounded-xl hover:bg-blue-500 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest shadow-lg active:scale-95"><span>+</span> Novo Modelo {activeCategory}</button>
                )}
                
                {activeTab === 'RELATÓRIOS' && filteredReports.length > 0 && (
                  <div className="bg-[#161c2d] p-4 rounded-xl border border-slate-800 flex items-center justify-between shadow-lg">
                    <div>
                      <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Tempo Total Turno</h3>
                      <p className="text-xl font-black text-blue-500">{totalExecutionTime.hours}h {totalExecutionTime.minutes}m</p>
                    </div>
                    <span className="text-2xl opacity-50">⏱️</span>
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
          <ReportForm initialData={currentReport} onSave={handleSave} onCancel={() => setView('LIST')} isEdit={view === 'EDIT'} onMarkExported={handleMarkAsExported} />
        )}
      </main>
    </div>
  );
};

export default App;

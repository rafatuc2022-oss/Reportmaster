
import React, { useState, useRef, useEffect } from 'react';
import { Report, Shift, WorkCenter, ActivityType, Category, PhotoItem } from '../types';
import { generatePDF } from '../services/pdfService';

const SHIFT_TECHNICIANS: Record<Shift, string[]> = {
  'A': ['Ilton', 'Hannyel', 'Misael', 'Arilson', 'Pedro', 'Diran', 'Alcino', 'Assuero'],
  'B': ['Luiz Gustavo', 'Rafael', 'Lucas', 'Jeferson', 'Eduardo', 'Luiz Neto', 'victor', 'Geovane'],
  'C': ['Marcos', 'Wanderson', 'Wilian', 'Gustavo', 'Joao leno', 'Patrick', 'Jhon Dultra', 'Fabricio', 'Daniel Alves', 'Victor'],
  'D': ['Doclenio', 'Geraldo', 'Darlan', 'Cícero', 'fredson', 'Thiago', 'Rodrigo', 'Hitalo']
};

interface Props {
  initialData: Report | null;
  onSave: (report: Report) => void;
  onCancel: () => void;
  isEdit: boolean;
  onMarkExported: (report: Report) => void;
}

const ReportForm: React.FC<Props> = ({ initialData, onSave, onCancel, isEdit, onMarkExported }) => {
  const getTodayStr = () => new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState<Report>(() => {
    let processedPhotos: PhotoItem[] = [];
    if (initialData?.photos) {
        processedPhotos = initialData.photos.map(p => (typeof p === 'string' ? { id: crypto.randomUUID(), url: p, caption: '' } : p));
    }
    const data = initialData ? { ...initialData, photos: processedPhotos } : {
      id: crypto.randomUUID(), createdAt: Date.now(), category: 'FIXO' as Category, isTemplate: true, omDescription: '', activityExecuted: '', date: getTodayStr(), omNumber: '', equipment: '', location: '', activityType: 'preventiva' as ActivityType, startTime: '', endTime: '', iamoDeviation: false, iamoExplanation: '', isOmFinished: false, hasPendencies: false, pendencyExplanation: '', observations: '', teamShift: 'A' as Shift, workCenter: 'SC108HH' as WorkCenter, technicians: '', photos: []
    };
    if (isEdit && data.isTemplate) data.date = getTodayStr();
    return data;
  });

  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    let finalValue = value;
    if (name === 'omNumber') finalValue = value.replace(/\D/g, ''); 
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : finalValue }));
    if (finalValue) setErrors(prev => { const n = {...prev}; delete n[name]; return n; });
  };

  const toggleTechnician = (name: string) => {
    setFormData(prev => {
      const current = prev.technicians.split(',').map(t => t.trim()).filter(Boolean);
      const next = current.includes(name) ? current.filter(t => t !== name) : [...current, name];
      return { ...prev, technicians: next.join(', ') };
    });
    setErrors(prev => { const n = {...prev}; delete n['technicians']; return n; });
  };

  const validate = () => {
    const nE: Record<string, boolean> = {};
    const check = (f: keyof Report) => { if (!formData[f]) nE[f as string] = true; };
    
    check('omDescription');
    check('activityExecuted');

    if (!formData.isTemplate) {
      ['omNumber', 'startTime', 'endTime', 'technicians', 'date', 'equipment'].forEach(f => check(f as keyof Report));
    }

    setErrors(nE);
    if (Object.keys(nE).length > 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return false;
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (validate()) onSave(formData); };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
      };
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files; if (!files) return;
    const newPhotos: PhotoItem[] = [];
    for (let i = 0; i < files.length; i++) {
        const compressed = await compressImage(files[i]);
        newPhotos.push({ id: crypto.randomUUID(), url: compressed, caption: '' });
    }
    setFormData(prev => ({ ...prev, photos: [...prev.photos, ...newPhotos] }));
  };

  const openEditor = (id: string) => setEditingPhotoId(id);

  const saveEditedImage = () => {
      if (canvasRef.current && editingPhotoId) {
          const newUrl = canvasRef.current.toDataURL('image/jpeg', 0.8);
          setFormData(prev => ({ ...prev, photos: prev.photos.map(p => p.id === editingPhotoId ? { ...p, url: newUrl } : p) }));
          setEditingPhotoId(null);
          setIsDrawing(false);
      }
  };

  useEffect(() => {
    if (editingPhotoId && canvasRef.current) {
      const photo = formData.photos.find(p => p.id === editingPhotoId);
      if (photo) {
        const ctx = canvasRef.current.getContext('2d');
        const img = new Image();
        img.src = photo.url;
        img.onload = () => {
          if (canvasRef.current && ctx) {
            canvasRef.current.width = img.width;
            canvasRef.current.height = img.height;
            ctx.drawImage(img, 0, 0);
            ctx.strokeStyle = "red";
            ctx.lineWidth = 8;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
          }
        };
      }
    }
  }, [editingPhotoId, formData.photos]);

  const handleExportAction = (type: 'PDF' | 'WHATSAPP') => {
    if (!validate()) return;
    const upd = { ...formData, isExported: true };
    setFormData(upd); onMarkExported(upd);
    if (type === 'PDF') generatePDF(upd);
    else {
        const text = `*RELATÓRIO DE EXECUÇÃO*
*AUTOMAÇÃO MINA SERRA SUL*
   
🗓️ Data: ${upd.date.split('-').reverse().join('/')}

🚜 Equipamento: ${upd.equipment || 'N/A'}
   
📂 N° OM: ${upd.omNumber}
   
🛠️ Tipo de Atividade: ${upd.activityType === 'preventiva' ? 'Preventiva' : 'Corretiva'}
   
⏰ Horário Inicial: ${upd.startTime}
⏰ Horario final: ${upd.endTime}   
🛑 Desvio IAMO: ${upd.iamoDeviation ? `SIM (${upd.iamoExplanation})` : 'NÃO'}
   
♻️ Descrição da OM: ${upd.omDescription}
   
📈 Atividades executada:
${upd.activityExecuted}
   
 
 

🎯 OM finalizada: ${upd.isOmFinished ? 'Finalizada' : 'Em Aberto'}

🔔 Pendências: ${upd.hasPendencies ? `Sim (${upd.pendencyExplanation})` : 'Não'}
 
⚠️ Obs: ${upd.observations || 'Nenhum'}
   
📈 Equipe turno: Turno ${upd.teamShift}
   
🔖 Centro de Trabalho: ${upd.workCenter}
   
👥 Técnicos: ${upd.technicians}`;

        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  const inputStyle = (f: string) => `w-full bg-slate-900 border-2 px-5 py-4 rounded-xl outline-none text-base font-bold transition-all shadow-md ${errors[f] ? 'border-red-500 bg-red-500/10 animate-pulse ring-2 ring-red-500/20' : 'border-slate-800 focus:border-sky-500 focus:bg-slate-950 text-white'}`;
  const labelStyle = (f: string) => `text-[11px] font-black uppercase mb-2.5 block tracking-[0.2em] ml-1 transition-colors ${errors[f] ? 'text-red-500' : 'text-slate-500'}`;
  const sectionHeader = "flex items-center gap-4 mb-8 pb-3 border-b border-white/10";

  return (
    <div className="min-h-screen bg-[#020617] pb-48">
      {/* HEADER FIXO */}
      <div className="glass sticky top-0 z-[60] px-6 py-5 flex items-center gap-5 border-b border-white/10 shadow-xl">
        <button onClick={onCancel} className="p-2.5 bg-slate-900 rounded-lg text-slate-400 border border-slate-700 active:scale-95 transition-all">
           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div>
           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-500 block mb-1">
             {formData.isTemplate ? 'Configuração de Modelo' : 'Relatório Técnico'}
           </span>
           <span className="text-base font-black uppercase text-white tracking-tight">
             {formData.isTemplate ? 'Definição de Atividade' : 'Formulário de Campo'}
           </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6 max-w-xl mx-auto">
        
        {formData.isTemplate ? (
          <div className={`bg-slate-900/40 p-6 rounded-2xl border transition-all shadow-xl space-y-6 ${Object.keys(errors).length > 0 ? 'border-red-500/30' : 'border-slate-800'}`}>
             <div className={sectionHeader}>
                <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center text-xl border border-indigo-500/20">📋</div>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-300">Configuração do Modelo</h3>
             </div>
             <div>
                <label className={labelStyle('omDescription')}>♻️ Descrição da OM</label>
                <textarea name="omDescription" value={formData.omDescription} onChange={handleChange} className={inputStyle('omDescription') + " h-24 resize-none font-bold text-lg"} placeholder="Ex: MP Lógica CFTV..." />
             </div>
             <div>
                <label className={labelStyle('activityExecuted')}>📈 Atividade Executada (Padrão)</label>
                <textarea name="activityExecuted" value={formData.activityExecuted} onChange={handleChange} className={inputStyle('activityExecuted') + " h-[500px] resize-none font-medium leading-relaxed text-base bg-slate-950/50"} placeholder="Descreva os passos que compõem este modelo..." />
             </div>
          </div>
        ) : (
          <>
            {/* BLOCO 1: IDENTIFICAÇÃO BÁSICA */}
            <div className={`bg-slate-900/40 p-6 rounded-2xl border transition-all shadow-xl space-y-6 ${ (errors.date || errors.equipment || errors.omNumber) ? 'border-red-500/30' : 'border-slate-800'}`}>
               <div className={sectionHeader}>
                  <div className="w-10 h-10 bg-sky-500/10 rounded-lg flex items-center justify-center text-xl border border-sky-500/20">🗓️</div>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-300">Identificação</h3>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className={labelStyle('date')}>🗓️ Data</label>
                    <input type="date" name="date" value={formData.date} onChange={handleChange} className={inputStyle('date')} />
                  </div>
                  <div>
                    <label className={labelStyle('equipment')}>🚜 Equipamento</label>
                    <input name="equipment" value={formData.equipment} onChange={handleChange} className={inputStyle('equipment') + " uppercase"} placeholder="EX: BM1080KS01" />
                  </div>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className={labelStyle('omNumber')}>📂 N° OM</label>
                    <input type="tel" inputMode="numeric" name="omNumber" value={formData.omNumber} onChange={handleChange} className={inputStyle('omNumber') + " mono text-lg"} placeholder="000000" />
                  </div>
                  <div>
                    <label className={labelStyle('activityType')}>🛠️ Tipo de Atividade</label>
                    <select name="activityType" value={formData.activityType} onChange={handleChange} className={inputStyle('activityType')}>
                       <option value="preventiva">Preventiva</option>
                       <option value="corretiva">Corretiva</option>
                    </select>
                  </div>
               </div>
            </div>

            {/* BLOCO 2: TEMPOS E DESVIOS */}
            <div className={`bg-slate-900/40 p-6 rounded-2xl border transition-all shadow-xl space-y-6 ${ (errors.startTime || errors.endTime) ? 'border-red-500/30' : 'border-slate-800'}`}>
               <div className={sectionHeader}>
                  <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center text-xl border border-amber-500/20">⏰</div>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-300">Cronograma</h3>
               </div>
               <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className={labelStyle('startTime')}>⏰ Horário Inicial</label>
                    <input type="time" name="startTime" value={formData.startTime} onChange={handleChange} className={inputStyle('startTime') + " mono text-xl text-center"} />
                  </div>
                  <div>
                    <label className={labelStyle('endTime')}>⏰ Horário Final</label>
                    <input type="time" name="endTime" value={formData.endTime} onChange={handleChange} className={inputStyle('endTime') + " mono text-xl text-center"} />
                  </div>
               </div>
               <div className={`p-5 rounded-xl border-2 transition-all duration-300 ${formData.iamoDeviation ? 'bg-red-500/5 border-red-500/20' : 'bg-slate-950/50 border-slate-800'}`}>
                  <div className="flex items-center justify-between">
                     <span className="text-[11px] font-black text-slate-100 uppercase tracking-widest block">🛑 Desvio IAMO</span>
                     <input type="checkbox" name="iamoDeviation" checked={formData.iamoDeviation} onChange={handleChange} className="w-6 h-6 rounded-md accent-red-500" />
                  </div>
                  {formData.iamoDeviation && (
                     <textarea name="iamoExplanation" value={formData.iamoExplanation} onChange={handleChange} className="w-full mt-4 bg-slate-950 border border-red-500/30 rounded-lg p-4 outline-none text-base font-bold text-red-400 focus:border-red-500 transition-all shadow-inner" placeholder="Justifique o desvio..." />
                  )}
               </div>
            </div>

            {/* BLOCO 3: DESCRIÇÃO E EXECUÇÃO */}
            <div className={`bg-slate-900/40 p-6 rounded-2xl border transition-all shadow-xl space-y-6 ${ (errors.omDescription || errors.activityExecuted) ? 'border-red-500/30' : 'border-slate-800'}`}>
               <div className={sectionHeader}>
                  <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center text-xl border border-indigo-500/20">♻️</div>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-300">Detalhamento</h3>
               </div>
               <div>
                  <label className={labelStyle('omDescription')}>♻️ Descrição da OM</label>
                  <textarea name="omDescription" value={formData.omDescription} onChange={handleChange} className={inputStyle('omDescription') + " h-24 resize-none font-bold text-lg"} placeholder="O que está sendo feito?" />
               </div>
               <div>
                  <label className={labelStyle('activityExecuted')}>📈 Atividades executada</label>
                  <textarea name="activityExecuted" value={formData.activityExecuted} onChange={handleChange} className={inputStyle('activityExecuted') + " h-[400px] resize-none font-medium leading-relaxed text-base bg-slate-950/50"} placeholder="Descreva os passos realizados..." />
               </div>
            </div>

            {/* BLOCO 4: STATUS E OBSERVAÇÕES */}
            <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800 transition-all shadow-xl space-y-6">
               <div className={sectionHeader}>
                  <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center text-xl border border-purple-500/20">🎯</div>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-300">Conclusão</h3>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <label className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.isOmFinished ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-800 bg-slate-950'}`}>
                    <span className="text-[11px] font-black uppercase text-slate-200">🎯 Finalizada</span>
                    <input type="checkbox" name="isOmFinished" checked={formData.isOmFinished} onChange={handleChange} className="w-6 h-6 accent-emerald-500" />
                  </label>
                  <label className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.hasPendencies ? 'border-amber-500 bg-amber-500/10' : 'border-slate-800 bg-slate-950'}`}>
                    <span className="text-[11px] font-black uppercase text-slate-200">🔔 Pendências</span>
                    <input type="checkbox" name="hasPendencies" checked={formData.hasPendencies} onChange={handleChange} className="w-6 h-6 accent-amber-500" />
                  </label>
               </div>
               {formData.hasPendencies && (
                  <textarea name="pendencyExplanation" value={formData.pendencyExplanation} onChange={handleChange} className={inputStyle('pendencyExplanation') + " h-24"} placeholder="Qual a pendência?" />
               )}
               <div>
                  <label className={labelStyle('observations')}>⚠️ Obs</label>
                  <textarea name="observations" value={formData.observations} onChange={handleChange} className={inputStyle('observations') + " h-24 resize-none"} placeholder="Observações importantes..." />
               </div>
            </div>

            {/* BLOCO 5: EQUIPE E RESPONSÁVEIS */}
            <div className={`bg-slate-900/40 p-6 rounded-2xl border transition-all shadow-xl space-y-6 ${ errors.technicians ? 'border-red-500/30' : 'border-slate-800'}`}>
               <div className={sectionHeader}>
                  <div className="w-10 h-10 bg-sky-500/10 rounded-lg flex items-center justify-center text-xl border border-sky-500/20">👥</div>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-300">Equipe</h3>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className={labelStyle('teamShift')}>📈 Equipe turno</label>
                    <select name="teamShift" value={formData.teamShift} onChange={handleChange} className={inputStyle('teamShift')}>
                      {(['A','B','C','D'] as Shift[]).map(s => <option key={s} value={s}>Turno {s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelStyle('workCenter')}>🔖 Centro de Trabalho</label>
                    <select name="workCenter" value={formData.workCenter} onChange={handleChange} className={inputStyle('workCenter')}>
                      {(['SC108HH','SC118HH','SC103HH','SC105HH','SC117HH'] as WorkCenter[]).map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                  </div>
               </div>
               <div className="space-y-4">
                  <label className={labelStyle('technicians')}>👥 Técnicos (Seleção Rápida)</label>
                  <div className={`flex flex-wrap gap-2.5 p-4 bg-slate-950 rounded-xl border transition-all no-scrollbar overflow-x-auto ${errors.technicians ? 'border-red-500/50' : 'border-slate-800'}`}>
                    {SHIFT_TECHNICIANS[formData.teamShift].map(t => (
                      <button key={t} type="button" onClick={() => toggleTechnician(t)} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all border-2 ${formData.technicians.toLowerCase().includes(t.toLowerCase()) ? 'bg-sky-500 border-sky-500 text-slate-950 shadow-md' : 'bg-slate-800 border-slate-800 text-slate-500'}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                  <input name="technicians" value={formData.technicians} onChange={handleChange} className={inputStyle('technicians')} placeholder="Técnicos responsáveis..." />
               </div>
            </div>

            {/* BLOCO 6: FOTOS */}
            <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800 transition-all shadow-xl space-y-6">
               <div className={sectionHeader}>
                  <div className="w-10 h-10 bg-pink-500/10 rounded-lg flex items-center justify-center text-xl border border-pink-500/20">📸</div>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-300">Evidências Visuais</h3>
               </div>
               <div className="grid grid-cols-2 gap-5">
                  {formData.photos.map(p => (
                     <div key={p.id} className="group relative aspect-square rounded-xl overflow-hidden border border-slate-700 shadow-lg bg-slate-950">
                        <img src={p.url} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-4 transition-all duration-200">
                           <button type="button" onClick={() => openEditor(p.id)} className="w-12 h-12 bg-sky-500 text-slate-950 rounded-lg font-black active:scale-90 transition-all text-xl flex items-center justify-center">✏️</button>
                           <button type="button" onClick={() => setFormData(f => ({...f, photos: f.photos.filter(ph => ph.id !== p.id)}))} className="w-12 h-12 bg-red-600 text-white rounded-lg font-black active:scale-90 transition-all text-xl flex items-center justify-center">✕</button>
                        </div>
                     </div>
                  ))}
                  <button type="button" onClick={() => cameraInputRef.current?.click()} className="aspect-square rounded-xl border-2 border-dashed border-slate-800 flex flex-col items-center justify-center text-slate-600 hover:text-sky-500 hover:border-sky-500/40 transition-all bg-slate-950/40">
                     <span className="text-4xl mb-2">📷</span>
                     <span className="text-[10px] font-black uppercase tracking-widest">Câmera</span>
                  </button>
                  <button type="button" onClick={() => galleryInputRef.current?.click()} className="aspect-square rounded-xl border-2 border-dashed border-slate-800 flex flex-col items-center justify-center text-slate-600 hover:text-sky-400 hover:border-sky-400/40 transition-all bg-slate-950/40">
                     <span className="text-4xl mb-2">🖼️</span>
                     <span className="text-[10px] font-black uppercase tracking-widest">Galeria</span>
                  </button>
               </div>
               <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} className="hidden" />
               <input ref={galleryInputRef} type="file" multiple accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            </div>
          </>
        )}

        {/* BARRA DE AÇÕES FIXA */}
        <div className="fixed bottom-0 left-0 right-0 z-[100] p-6 pb-[env(safe-area-inset-bottom)]">
           <div className="max-w-md mx-auto glass p-3 rounded-2xl border border-white/10 shadow-2xl">
              <div className="flex items-center gap-3">
                 <button type="submit" className="flex-1 h-14 bg-sky-600 text-slate-950 rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-lg">
                    {formData.isTemplate ? '💾 Salvar Modelo' : '💾 Salvar Relatório'}
                 </button>
                 
                 {!formData.isTemplate && (
                    <>
                       <button type="button" onClick={() => handleExportAction('PDF')} className="w-14 h-14 bg-slate-900 text-white rounded-xl flex items-center justify-center border border-slate-700 active:scale-95 transition-all shadow-lg text-xl">📄</button>
                       <button type="button" onClick={() => handleExportAction('WHATSAPP')} className="w-14 h-14 bg-emerald-600 text-white rounded-xl flex items-center justify-center active:scale-95 transition-all shadow-lg">
                          <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                       </button>
                    </>
                 )}
              </div>
           </div>
        </div>

      </form>

      {/* ANOTAÇÃO EM FOTO */}
      {editingPhotoId && (
          <div className="fixed inset-0 z-[200] bg-black flex flex-col animate-in fade-in duration-300">
              <div className="p-5 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
                  <button type="button" onClick={() => setEditingPhotoId(null)} className="text-slate-500 font-black text-[11px] uppercase px-4">Sair</button>
                  <span className="text-[11px] font-black uppercase text-sky-400 tracking-widest">Marcação Técnica</span>
                  <button type="button" onClick={saveEditedImage} className="text-emerald-500 font-black text-[11px] uppercase px-4">Salvar</button>
              </div>
              <div className="flex-1 bg-black relative flex items-center justify-center overflow-hidden touch-none">
                  <canvas 
                    ref={canvasRef} 
                    onMouseDown={(e) => { setIsDrawing(true); const ctx = canvasRef.current?.getContext('2d'); if (!ctx || !canvasRef.current) return; const rect = canvasRef.current.getBoundingClientRect(); ctx.beginPath(); ctx.moveTo((e.clientX - rect.left) * (canvasRef.current.width/rect.width), (e.clientY - rect.top) * (canvasRef.current.height/rect.height)); }} 
                    onMouseMove={(e) => { if (!isDrawing || !canvasRef.current) return; const ctx = canvasRef.current.getContext('2d'); if (!ctx) return; const rect = canvasRef.current.getBoundingClientRect(); ctx.lineTo((e.clientX - rect.left) * (canvasRef.current.width/rect.width), (e.clientY - rect.top) * (canvasRef.current.height/rect.height)); ctx.stroke(); }} 
                    onMouseUp={() => setIsDrawing(false)}
                    onTouchStart={(e) => { e.preventDefault(); setIsDrawing(true); const ctx = canvasRef.current?.getContext('2d'); if (!ctx || !canvasRef.current) return; const rect = canvasRef.current.getBoundingClientRect(); const touch = e.touches[0]; ctx.beginPath(); ctx.moveTo((touch.clientX - rect.left) * (canvasRef.current.width/rect.width), (touch.clientY - rect.top) * (canvasRef.current.height/rect.height)); }}
                    onTouchMove={(e) => { e.preventDefault(); if (!isDrawing || !canvasRef.current) return; const ctx = canvasRef.current.getContext('2d'); if (!ctx) return; const rect = canvasRef.current.getBoundingClientRect(); const touch = e.touches[0]; ctx.lineTo((touch.clientX - rect.left) * (canvasRef.current.width/rect.width), (touch.clientY - rect.top) * (canvasRef.current.height/rect.height)); ctx.stroke(); }}
                    onTouchEnd={() => setIsDrawing(false)}
                    className="max-w-full max-h-full object-contain cursor-crosshair" 
                  />
              </div>
          </div>
      )}
    </div>
  );
};

export default ReportForm;

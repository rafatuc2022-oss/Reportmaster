
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
        processedPhotos = initialData.photos.map(p => {
            if (typeof p === 'string') {
                return { id: crypto.randomUUID(), url: p, caption: '' };
            }
            return p;
        });
    }

    const data = initialData ? { ...initialData, photos: processedPhotos } : {
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      category: 'FIXO' as Category,
      isTemplate: true,
      omDescription: '',
      activityExecuted: '',
      date: getTodayStr(),
      omNumber: '',
      equipment: '',
      location: '', 
      activityType: 'preventiva' as ActivityType,
      startTime: '',
      endTime: '',
      iamoDeviation: false,
      iamoExplanation: '',
      isOmFinished: false,
      hasPendencies: false,
      pendencyExplanation: '',
      observations: '',
      teamShift: 'A' as Shift,
      workCenter: 'SC108HH' as WorkCenter,
      technicians: '',
      photos: []
    };

    if (isEdit && data.isTemplate) {
      data.date = getTodayStr();
    }
    return data;
  });

  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [validationMsg, setValidationMsg] = useState<string | null>(null);
  
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    let finalValue = value;

    if (name === 'omNumber') {
      finalValue = value.replace(/\D/g, ''); 
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : finalValue
    }));

    if (finalValue) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
      if (validationMsg) setValidationMsg(null);
    }
  };

  const toggleTechnician = (name: string) => {
    setFormData(prev => {
      const currentTechs = prev.technicians.split(',').map(t => t.trim()).filter(t => t !== '');
      let newTechs;
      if (currentTechs.includes(name)) {
        newTechs = currentTechs.filter(t => t !== name);
      } else {
        newTechs = [...currentTechs, name];
      }
      return { ...prev, technicians: newTechs.join(', ') };
    });
  };

  const validate = (forceStrict = false) => {
    const newErrors: Record<string, boolean> = {};
    const missingFields: string[] = [];

    const checkField = (field: keyof Report, label: string) => {
        if (!formData[field]) {
            newErrors[field as string] = true;
            missingFields.push(label);
        }
    };

    checkField('omDescription', 'Descrição da OM');
    
    if (forceStrict || (isEdit && !formData.isTemplate)) {
      checkField('omNumber', 'N° OM');
      checkField('startTime', 'Início');
      checkField('endTime', 'Fim');
      checkField('activityExecuted', 'Atividades');
      checkField('technicians', 'Técnicos');
      checkField('date', 'Data');
    }

    setErrors(newErrors);

    if (missingFields.length > 0) {
        setValidationMsg(`Falta preencher: ${missingFields.join(', ')}`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return false;
    }

    setValidationMsg(null);
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate(false)) return;
    onSave(formData);
  };

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
          
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(compressedDataUrl);
        };
      };
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const processedPhotos: PhotoItem[] = [];
    for (let i = 0; i < files.length; i++) {
      const compressed = await compressImage(files[i]);
      processedPhotos.push({
          id: crypto.randomUUID(),
          url: compressed,
          caption: ''
      });
    }
    
    setFormData(prev => ({ ...prev, photos: [...prev.photos, ...processedPhotos] }));
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  const updateCaption = (id: string, text: string) => {
      setFormData(prev => ({
          ...prev,
          photos: prev.photos.map(p => p.id === id ? { ...p, caption: text } : p)
      }));
  };

  const openEditor = (id: string) => {
      setEditingPhotoId(id);
  };

  const closeEditor = () => {
      setEditingPhotoId(null);
      setIsDrawing(false);
  };

  const saveEditedImage = () => {
      if (canvasRef.current && editingPhotoId) {
          const newUrl = canvasRef.current.toDataURL('image/jpeg', 0.8);
          setFormData(prev => ({
              ...prev,
              photos: prev.photos.map(p => p.id === editingPhotoId ? { ...p, url: newUrl } : p)
          }));
          closeEditor();
      }
  };

  useEffect(() => {
      if (editingPhotoId && canvasRef.current) {
          const photo = formData.photos.find(p => p.id === editingPhotoId);
          if (photo) {
              const canvas = canvasRef.current;
              const ctx = canvas.getContext('2d');
              const img = new Image();
              img.src = photo.url;
              img.onload = () => {
                  canvas.width = img.width;
                  canvas.height = img.height;
                  ctx?.drawImage(img, 0, 0);
                  if (ctx) {
                      ctx.strokeStyle = "red";
                      ctx.lineWidth = 5;
                      ctx.lineCap = "round";
                  }
              };
          }
      }
  }, [editingPhotoId]);

  const startDrawing = (e: any) => {
      setIsDrawing(true);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX || e.touches[0].clientX) - rect.left;
      const y = (e.clientY || e.touches[0].clientY) - rect.top;
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      ctx.beginPath();
      ctx.moveTo(x * scaleX, y * scaleY);
  };

  const draw = (e: any) => {
      if (!isDrawing || !canvasRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const rect = canvas.getBoundingClientRect();
      const clientX = e.clientX || (e.touches ? e.touches[0].clientX : 0);
      const clientY = e.clientY || (e.touches ? e.touches[0].clientY : 0);
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      ctx.lineTo(x * scaleX, y * scaleY);
      ctx.stroke();
  };

  const stopDrawing = () => {
      setIsDrawing(false);
      const ctx = canvasRef.current?.getContext('2d');
      ctx?.closePath();
  };

  const handleExportAction = (type: 'PDF' | 'WHATSAPP') => {
    if (!validate(true)) return;
    const updatedForm = { ...formData, isExported: true };
    setFormData(updatedForm);
    onMarkExported(updatedForm);

    if (type === 'PDF') {
        generatePDF(updatedForm);
    } else {
        handleWhatsappShareLogic(updatedForm);
    }
  };

  const handleWhatsappShareLogic = (data: Report) => {
    const text = 
`RELATÓRIO DE EXECUÇÃO
AUTOMAÇÃO MINA SERRA SUL

🗓️ Data: ${data.date.split('-').reverse().join('/')}
🚜 Equipamento: ${data.equipment || 'N/A'}
📍 Local: ${data.location || 'N/A'}

📂 N° OM: ${data.omNumber || 'N/A'}

🛠️ Tipo de Atividade: ${data.activityType === 'preventiva' ? 'Preventiva' : 'Corretiva'}

⏰ Horário Inicial: ${data.startTime}
⏰ Horario final: ${data.endTime}
🛑 Desvio IAMO: ${data.iamoDeviation ? `SIM (${data.iamoExplanation})` : 'NÃO'}

♻️ Descrição da OM:
${data.omDescription}

📈 Atividades executada:
${data.activityExecuted}

🎯 OM finalizada: ${data.isOmFinished ? 'Finalizada' : 'Aberta'}
🔔 Pendências: ${data.hasPendencies ? `Sim (${data.pendencyExplanation})` : 'Não'}

⚠️ Obs: ${data.observations || 'N/A'}

📈 Equipe turno: ${data.teamShift}

🔖 Centro de Trabalho: ${data.workCenter}

👥 Técnicos: ${data.technicians}`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const getFieldStyle = (fieldName: string) => {
    const base = "w-full px-4 py-3 rounded-xl border-2 outline-none font-semibold text-sm transition-all text-slate-700 shadow-sm ";
    const state = errors[fieldName] 
      ? "border-red-400 bg-red-50 focus:border-red-500 animate-pulse" 
      : "border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:shadow-blue-100/50";
    return base + state;
  };

  const labelStyle = "text-[10px] font-black uppercase text-slate-500 mb-1.5 flex items-center gap-1 tracking-wider";

  const currentShiftTechs = SHIFT_TECHNICIANS[formData.teamShift] || [];

  return (
    <div className="min-h-screen bg-slate-950 pb-44">
      {/* 1. HEADER */}
      <div className="bg-white border-b border-slate-200 px-5 py-4 sticky top-0 z-50 flex items-center gap-4 shadow-xl">
        <button type="button" onClick={onCancel} className="p-2 -ml-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none mb-1">Relatório de Execução</p>
          <h2 className="text-sm font-black text-slate-800 uppercase leading-tight tracking-tight">Automação Mina Serra Sul</h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-0 sm:p-5 space-y-6 w-full max-w-full">
        
        {/* 2. DADOS INICIAIS */}
        <div className="bg-white p-4 sm:p-6 rounded-none sm:rounded-3xl border-b sm:border border-slate-200 shadow-xl space-y-5">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-50">
            <span className="bg-blue-100 text-blue-600 p-1.5 rounded-lg text-lg">🚜</span>
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest">Dados Iniciais</h3>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className={labelStyle}>🗓️ Data <span className="text-red-500">*</span></label>
              <input type="date" name="date" value={formData.date} onChange={handleChange} className={getFieldStyle('date')} />
            </div>
            <div>
              <label className={labelStyle}>🚜 Equipamento</label>
              <input name="equipment" value={formData.equipment} onChange={handleChange} placeholder="EX: BM1080KS01" className={getFieldStyle('equipment') + " uppercase tracking-wide"} />
            </div>
            <div>
              <label className={labelStyle}>📍 Localização</label>
              <input name="location" value={formData.location} onChange={handleChange} placeholder="EX: OVERLAND / 5ª LINHA" className={getFieldStyle('location') + " uppercase tracking-wide"} />
            </div>
          </div>
        </div>

        {/* 3. N° OM e TIPO */}
        <div className="bg-white p-4 sm:p-6 rounded-none sm:rounded-3xl border-b sm:border border-slate-200 shadow-xl space-y-5">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-50">
            <span className="bg-indigo-100 text-indigo-600 p-1.5 rounded-lg text-lg">📂</span>
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest">Ordem de Manutenção</h3>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className={labelStyle}>📂 N° OM <span className="text-red-500">*</span></label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">#</span>
                <input type="tel" inputMode="numeric" pattern="[0-9]*" name="omNumber" value={formData.omNumber} onChange={handleChange} className={getFieldStyle('omNumber') + " pl-8 font-bold text-lg"} placeholder="000000" />
              </div>
            </div>
            <div>
              <label className={labelStyle}>🛠️ Tipo de Atividade</label>
              <div className="relative">
                 <select name="activityType" value={formData.activityType} onChange={handleChange} className={getFieldStyle('activityType') + " appearance-none"}>
                  <option value="preventiva">🛡️ PREVENTIVA</option>
                  <option value="corretiva">🔧 CORRETIVA</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">▼</div>
              </div>
            </div>
          </div>
        </div>

        {/* 5. HORÁRIOS / IAMO */}
        <div className="bg-white p-4 sm:p-6 rounded-none sm:rounded-3xl border-b sm:border border-slate-200 shadow-xl space-y-5">
           <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-50">
             <span className="bg-orange-100 text-orange-600 p-1.5 rounded-lg text-lg">⏰</span>
             <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest">Cronograma</h3>
           </div>
           <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelStyle}>Início <span className="text-red-500">*</span></label>
                <input type="time" name="startTime" value={formData.startTime} onChange={handleChange} className={getFieldStyle('startTime') + " text-center tracking-widest font-bold"} />
              </div>
              <div>
                <label className={labelStyle}>Final <span className="text-red-500">*</span></label>
                <input type="time" name="endTime" value={formData.endTime} onChange={handleChange} className={getFieldStyle('endTime') + " text-center tracking-widest font-bold"} />
              </div>
           </div>
           <div className="pt-2">
              <div className={`p-4 rounded-2xl border-2 transition-all duration-300 ${formData.iamoDeviation ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex items-center justify-between mb-3">
                   <label className="text-[11px] font-black uppercase text-slate-600 flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${formData.iamoDeviation ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
                      Desvio IAMO?
                   </label>
                   <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                      <input type="checkbox" name="iamoDeviation" checked={formData.iamoDeviation} onChange={handleChange} className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer transition-transform duration-200 ease-in-out checked:right-0 checked:border-red-500 border-slate-300 right-5" />
                      <label className={`toggle-label block overflow-hidden h-5 rounded-full cursor-pointer ${formData.iamoDeviation ? 'bg-red-200' : 'bg-slate-200'}`}></label>
                   </div>
                </div>
                {formData.iamoDeviation && (
                  <textarea name="iamoExplanation" value={formData.iamoExplanation} onChange={handleChange} className="w-full bg-white rounded-xl p-3 border border-red-200 text-sm text-slate-700 placeholder:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500/20" placeholder="Descreva o motivo do desvio..." rows={2} />
                )}
              </div>
           </div>
        </div>

        {/* 6. EXECUÇÃO */}
        <div className="bg-white p-4 sm:p-6 rounded-none sm:rounded-3xl border-b sm:border border-slate-200 shadow-xl space-y-5">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-50">
             <span className="bg-emerald-100 text-emerald-600 p-1.5 rounded-lg text-lg">📝</span>
             <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest">Execução</h3>
           </div>
          <div>
            <label className={labelStyle}>♻️ Descrição da OM <span className="text-red-500">*</span></label>
            <textarea name="omDescription" value={formData.omDescription} onChange={handleChange} className={getFieldStyle('omDescription') + " min-h-[60px] resize-none leading-relaxed font-bold"} placeholder="Ex: MP LOGICA CFTV" />
          </div>
          <div>
            <label className={labelStyle}>📈 Atividades Executadas <span className="text-red-500">*</span></label>
            <textarea name="activityExecuted" value={formData.activityExecuted} onChange={handleChange} className={getFieldStyle('activityExecuted') + " min-h-[250px] bg-amber-50/50 border-amber-100 focus:bg-white resize-none font-medium leading-relaxed text-sm"} placeholder="✅ Detalhe as ações executadas..." />
          </div>
        </div>

        {/* 8. CONCLUSÃO */}
        <div className="bg-white p-4 sm:p-6 rounded-none sm:rounded-3xl border-b sm:border border-slate-200 shadow-xl space-y-5">
           <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-50">
             <span className="bg-purple-100 text-purple-600 p-1.5 rounded-lg text-lg">🏁</span>
             <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest">Conclusão</h3>
           </div>
           <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <label className={`flex items-center justify-between p-3 sm:p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.isOmFinished ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
                <span className="text-[10px] font-black uppercase text-slate-600 leading-none">OM Finalizada</span>
                <input type="checkbox" name="isOmFinished" checked={formData.isOmFinished} onChange={handleChange} className="w-5 h-5 accent-emerald-500" />
              </label>
              <label className={`flex items-center justify-between p-3 sm:p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.hasPendencies ? 'border-amber-500 bg-amber-50' : 'border-slate-200 bg-slate-50'}`}>
                <span className="text-[10px] font-black uppercase text-slate-600 leading-none">Com Pendência</span>
                <input type="checkbox" name="hasPendencies" checked={formData.hasPendencies} onChange={handleChange} className="w-5 h-5 accent-amber-500" />
              </label>
           </div>
           {formData.hasPendencies && (
            <div className="animate-in slide-in-from-top-2 duration-300">
              <label className={labelStyle}>🔔 Detalhe da Pendência</label>
              <textarea name="pendencyExplanation" value={formData.pendencyExplanation} onChange={handleChange} className={getFieldStyle('pendencyExplanation') + " min-h-[80px] border-amber-200 focus:border-amber-400"} placeholder="Descreva o que ficou pendente..." />
            </div>
           )}
           <div>
              <label className={labelStyle}>⚠️ Observações Gerais</label>
              <textarea name="observations" value={formData.observations} onChange={handleChange} className={getFieldStyle('observations') + " min-h-[80px] resize-none"} placeholder="Observações adicionais..." />
           </div>
        </div>

        {/* 9. RESPONSÁVEIS */}
        <div className="bg-white p-4 sm:p-6 rounded-none sm:rounded-3xl border-b sm:border border-slate-200 shadow-xl space-y-5">
           <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-50">
             <span className="bg-blue-100 text-blue-600 p-1.5 rounded-lg text-lg">👥</span>
             <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest">Responsáveis</h3>
           </div>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelStyle}>Equipe / Turno</label>
                <select name="teamShift" value={formData.teamShift} onChange={handleChange} className={getFieldStyle('teamShift')}>
                  <option value="A">TURNO A</option>
                  <option value="B">TURNO B</option>
                  <option value="C">TURNO C</option>
                  <option value="D">TURNO D</option>
                </select>
              </div>
              <div>
                <label className={labelStyle}>Centro de Trabalho</label>
                <select name="workCenter" value={formData.workCenter} onChange={handleChange} className={getFieldStyle('workCenter')}>
                  <option value="SC108HH">SC108HH</option>
                  <option value="SC118HH">SC118HH</option>
                  <option value="SC103HH">SC103HH</option>
                  <option value="SC105HH">SC105HH</option>
                  <option value="SC117HH">SC117HH</option>
                </select>
              </div>
           </div>
           
           <div>
              <label className={labelStyle}>👥 Seleção Rápida de Equipe (Turno {formData.teamShift})</label>
              <div className="flex flex-wrap gap-2 mb-4 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                {currentShiftTechs.map(name => {
                  const isSelected = formData.technicians.toLowerCase().includes(name.toLowerCase());
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => toggleTechnician(name)}
                      className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all border-2 ${
                        isSelected 
                        ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                        : 'bg-white border-slate-200 text-slate-500'
                      }`}
                    >
                      {isSelected && <span className="mr-1">✓</span>}
                      {name}
                    </button>
                  );
                })}
              </div>

              <label className={labelStyle}>Técnicos <span className="text-red-500">*</span></label>
              <input name="technicians" value={formData.technicians} onChange={handleChange} className={getFieldStyle('technicians')} placeholder="Nome dos técnicos (separados por vírgula)..." />
           </div>
        </div>

        {/* 10. EVIDÊNCIAS */}
        <div className="bg-white p-4 sm:p-6 rounded-none sm:rounded-3xl border-b sm:border border-slate-200 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
             <span className="bg-pink-100 text-pink-600 p-1.5 rounded-lg text-lg">📸</span>
             <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest">Evidências</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
            {formData.photos.map((photo) => (
              <div key={photo.id} className="flex flex-col gap-2">
                  <div className="aspect-square rounded-2xl overflow-hidden relative group border-2 border-slate-200 shadow-sm bg-slate-100">
                    <img src={photo.url} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setFormData(p => ({...p, photos: p.photos.filter(ph => ph.id !== photo.id)}))} className="absolute top-2 right-2 bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                     <button type="button" onClick={() => openEditor(photo.id)} className="absolute bottom-2 right-2 bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                  </div>
                  <input type="text" placeholder="Legenda..." value={photo.caption} onChange={(e) => updateCaption(photo.id, e.target.value)} className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white focus:border-blue-400 outline-none text-center" />
              </div>
            ))}
            {!formData.isTemplate ? (
              <>
                <button type="button" onClick={() => cameraInputRef.current?.click()} className="aspect-square rounded-2xl border-2 border-dashed border-blue-300 flex flex-col items-center justify-center text-blue-500 hover:bg-blue-50 transition-all bg-slate-50">
                  <span className="text-3xl mb-1">📷</span>
                  <span className="text-[9px] font-black uppercase tracking-wide">Câmera</span>
                </button>
                <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} className="hidden" />
                <button type="button" onClick={() => galleryInputRef.current?.click()} className="aspect-square rounded-2xl border-2 border-dashed border-indigo-300 flex flex-col items-center justify-center text-indigo-500 hover:bg-indigo-50 transition-all bg-slate-50">
                  <span className="text-3xl mb-1">🖼️</span>
                  <span className="text-[9px] font-black uppercase tracking-wide">Galeria</span>
                </button>
                <input ref={galleryInputRef} type="file" multiple accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </>
            ) : (
              <div className="col-span-full py-6 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                <span className="text-2xl mb-2 opacity-30">💾</span>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Salve para adicionar fotos</p>
              </div>
            )}
          </div>
        </div>

        {/* ACTIONS */}
        <div className="fixed bottom-0 left-0 right-0 z-50">
           <div className="bg-white border-t border-slate-200 p-4 shadow-[0_-5px_30px_rgba(0,0,0,0.2)] rounded-t-3xl">
              <div className="w-full max-w-md mx-auto flex gap-3">
                  {isEdit && !formData.isTemplate ? (
                    <>
                      <button type="submit" className="flex-1 bg-blue-600 text-white py-3.5 rounded-xl font-black text-[13px] uppercase tracking-widest hover:bg-blue-500 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30"><span>💾</span> Salvar</button>
                      <button type="button" onClick={() => handleExportAction('PDF')} className="bg-slate-100 text-slate-600 w-14 h-14 rounded-xl font-black text-2xl hover:bg-slate-200 active:scale-95 transition-all flex items-center justify-center border border-slate-200 shrink-0">📄</button>
                      <button type="button" onClick={() => handleExportAction('WHATSAPP')} className="bg-[#25D366] text-white w-14 h-14 rounded-xl font-black text-xl hover:bg-[#20bd5a] active:scale-95 transition-all flex items-center justify-center shadow-lg shadow-green-600/30 shrink-0"><svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg></button>
                    </>
                  ) : (
                    <button type="submit" className="flex-1 bg-emerald-500 text-white py-3.5 rounded-xl font-black text-[13px] uppercase tracking-widest hover:bg-emerald-400 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20"><span>🛠️</span> Utilizar Esse Modelo</button>
                  )}
               </div>
           </div>
        </div>
      </form>
    </div>
  );
};

export default ReportForm;

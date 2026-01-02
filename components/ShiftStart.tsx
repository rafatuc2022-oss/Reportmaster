
import React, { useState, useEffect } from 'react';
import { Shift } from '../types';

const ShiftStart: React.FC = () => {
  const [selectedShift, setSelectedShift] = useState<Shift>('A');
  const [editableMessage, setEditableMessage] = useState<string>("");

  const getTodayStr = () => {
    const today = new Date();
    const d = String(today.getDate()).padStart(2, '0');
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const y = today.getFullYear();
    return `${d}/${m}/${y}`;
  };

  const getTemplate = (shift: Shift): string => {
    const date = getTodayStr();

    switch (shift) {
      case 'A':
        return `📣 Evento: Boa Jornada
📋 Tema: Atividades relacionadas ao turno
📍 Local: Contêiner Automação de Mina
🗓 Data: ${date}
⛑ Palestrantes: Todos
📈 Status: DSS realizado com a equipe do Turno A
🗣 Participantes: Equipes SONDA / SOTREQ / HEXAGON / ALCON / VALE

Bom dia, pessoal!
Estamos assumindo as atividades do Turno A.
Ao Turno D, desejamos um ótimo descanso! 🙌

Equipes Mobilizadas
 
Vale:
Denis

SONDA

Técnico de Controle:
N/A

Equipe Truckless:
Hannyel 
⁠Mizael

Equipe Móveis:
Marcos
Arilson

Sotreq:
Diran

Hexagon:
Alcino

Alcon:
Kesia

Creare:
Assuero`;
      case 'B':
        return `📣 Evento: Boa Jornada ✅  
📋 Tema: Atividades relacionadas ao turno.
📍 Local: Contêiner Automação de Mina
🗓 Data: ${date}
⛑ Palestrantes: Todos
📈 Realizado o DSS com equipe do turno B
🗣️ Participantes Equipe SONDA/SOTREQ/HEXAGON/ALCON/CREARE

Boa noite pessoal, estamos assumindo as atividades do Turno B, ao Turno A bom descanso!!!

Equipes Mobilizadas. 

SONDA

EQ. Fixos
Luiz Gustavo 
Rafael

EQ. Móveis
Jeferson 
Geneilsom 

Sotreq
Mauro 

Hexagon
Luiz Neto

Creare
Vitor

Vale
Alessandra`;
      case 'C':
        return `📣 Evento: Boa Jornada  
📋 Tema: Atividades relacionadas ao turno.
📍 Local: Contêiner Automação de Mina
🗓 Data: ${date}
⛑ Palestrantes: Todos
📈 Realizado o DSS com equipe do Turno C
🗣️ Participantes Equipe SONDA/SOTREQ/HEXAGON/ALCON/VALE/ CREARE

* Bom dia pessoal, estamos assumindo as atividades do Turno C, ao Turno D bom descanso!!

* Equipes Mobilizadas

* SONDA

* Téc. Controle
* Camila ADM

* Eq. Truckless
* Marcos
* Wanderson  

* Eq. Móveis
* Wilian 
* Gustavo  

* Sotreq
* Joao leno

* Hexagon
* Patrick 
* Jhon Dultra 

* Alcon
* Fabricio

* Creare
* Victor  

* Vale
Daniel Alves`;
      case 'D':
        return `📣 Evento: Boa Jornada  
📋 Tema: Atividades relacionadas ao turno.
📍 Local: Contêiner Automação de Mina
🗓 Data: ${date}
⛑ Palestrantes: Todos
📈 Realizado o DSS com equipe do Turno D
🗣️ Participantes Equipe SONDA/SOTREQ/HEXAGON/CREARE/VALE


Boa noite  galera, estamos assumindo as atividades do Turno D, ao Turno C bom descanso!!

Equipes Mobilizadas

SONDA

EQ. Fixos
Doclenio
Geraldo

EQ. Móveis
Darlan
Cicero

Sotreq
Thiago

Hexagon
Rodrigo

Creare
Hitalo

Vale
Renato`;
      default: return "";
    }
  };

  useEffect(() => {
    setEditableMessage(getTemplate(selectedShift));
  }, [selectedShift]);

  const handleSend = () => {
    if (!editableMessage.trim()) return;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(editableMessage)}`, '_blank');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 rounded-xl flex items-center justify-center text-3xl border border-emerald-500/20">📣</div>
          <div>
            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none mb-1.5">Boa Jornada</h2>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Relatório de Assunção</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-8">
          {(['A', 'B', 'C', 'D'] as Shift[]).map((shift) => (
            <button
              key={shift}
              onClick={() => setSelectedShift(shift)}
              className={`py-6 rounded-xl border-2 transition-all flex flex-col items-center justify-center active:scale-95 ${
                selectedShift === shift
                  ? 'border-sky-500 bg-sky-500/10 text-sky-600 dark:text-sky-400 shadow-lg'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-600 hover:border-sky-500/30'
              }`}
            >
              <span className="text-[9px] font-black uppercase tracking-widest mb-1 opacity-50">Turno</span>
              <span className="text-2xl font-black">{shift}</span>
            </button>
          ))}
        </div>

        <div className="space-y-3 mb-8">
          <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-[0.2em] ml-2 block">Visualização da Mensagem</label>
          <textarea
            value={editableMessage}
            onChange={(e) => setEditableMessage(e.target.value)}
            className="w-full h-[550px] p-5 rounded-xl bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white font-medium text-sm outline-none focus:border-sky-500 transition-all resize-none shadow-inner leading-relaxed no-scrollbar"
            placeholder="Gerando mensagem de jornada..."
          />
        </div>

        <button
          onClick={handleSend}
          className="w-full h-16 bg-[#25D366] text-white dark:text-slate-950 rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-xl flex items-center justify-center gap-3"
        >
          <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
          Sincronizar no WhatsApp
        </button>
      </div>
    </div>
  );
};

export default ShiftStart;

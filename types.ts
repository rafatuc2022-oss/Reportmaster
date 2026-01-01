
export type Shift = 'A' | 'B' | 'C' | 'D';
export type WorkCenter = 'SC108HH' | 'SC118HH' | 'SC103HH' | 'SC105HH' | 'SC117HH';
export type ActivityType = 'preventiva' | 'corretiva';
export type Category = 'FIXO' | 'MÓVEL';

export interface PhotoItem {
  id: string;
  url: string; // Base64 da imagem
  caption: string; // Legenda
}

export interface Report {
  id: string;
  createdAt: number;
  category: Category;
  isTemplate: boolean; // True se for apenas o modelo, False se for um relatório utilizado/preenchido
  isExported?: boolean; // True se já foi gerado PDF ou enviado no Wpp
  
  // Non-editable after creation
  omDescription: string;
  activityExecuted: string;
  
  // Editable fields
  date: string;
  omNumber: string;
  equipment: string;
  location: string; // Campo Localização
  activityType: ActivityType;
  startTime: string;
  endTime: string;
  iamoDeviation: boolean;
  iamoExplanation?: string;
  isOmFinished: boolean;
  hasPendencies: boolean;
  pendencyExplanation?: string;
  observations?: string;
  teamShift: Shift;
  workCenter: WorkCenter;
  technicians: string;
  photos: PhotoItem[]; // Agora é uma lista de objetos
}

export type AppView = 'LIST' | 'CREATE' | 'EDIT' | 'VIEW';

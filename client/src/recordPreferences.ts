export type RecordCategory = "diario" | "ocorrencia" | "acao" | "producao" | "material" | "equipe" | "maquina";
export type RecordDisplay = "lista" | "cards" | "tabela" | "timeline";

export const RECORD_CATEGORIES: Array<{ id: RecordCategory; label: string; description: string }> = [
  { id: "diario", label: "Diário de obra", description: "Registros gerais do dia e atividades executadas." },
  { id: "ocorrencia", label: "Ocorrências", description: "Problemas, desvios, impedimentos e fatos relevantes." },
  { id: "acao", label: "Ações", description: "Demandas, responsáveis, prazos e pendências." },
  { id: "producao", label: "Produção", description: "Quantidades produzidas e evolução dos serviços." },
  { id: "material", label: "Materiais", description: "Entradas, consumo, estoque e solicitações." },
  { id: "equipe", label: "Equipe", description: "Presença, composição e atividades das equipes." },
  { id: "maquina", label: "Máquinas", description: "Uso, horímetro, disponibilidade e ocorrências." },
];

export const RECORD_DISPLAYS: Array<{ id: RecordDisplay; label: string }> = [
  { id: "lista", label: "Lista" },
  { id: "cards", label: "Cards" },
  { id: "tabela", label: "Tabela" },
  { id: "timeline", label: "Linha do tempo" },
];

const STORAGE_KEY = "negocio-fechado-record-preferences";
export type RecordPreferences = Record<RecordCategory, RecordDisplay>;

export const defaultRecordPreferences: RecordPreferences = {
  diario: "lista",
  ocorrencia: "cards",
  acao: "lista",
  producao: "tabela",
  material: "tabela",
  equipe: "cards",
  maquina: "tabela",
};

export function loadRecordPreferences(): RecordPreferences {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") as Partial<RecordPreferences> | null;
    return { ...defaultRecordPreferences, ...(parsed || {}) };
  } catch {
    return { ...defaultRecordPreferences };
  }
}

export function saveRecordPreferences(preferences: RecordPreferences) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
}

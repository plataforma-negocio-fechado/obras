export type FieldRecordType = "custo" | "material" | "maquina" | "equipe" | "ocorrencia" | "acao" | "diario";

export type FieldCandidate = {
  type: FieldRecordType;
  title: string;
  summary: string;
  confidence: number;
  fields: Record<string, string>;
};

const money = /R\$\s?([\d.]+(?:,\d{1,2})?)/i;

function normalize(text: string) {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function extractMoney(text: string) {
  const match = text.match(money);
  return match?.[1] ? `R$ ${match[1]}` : undefined;
}

/**
 * Primeira camada de inteligência do Campo.
 * Ela não grava nada: apenas transforma a mensagem em uma sugestão estruturada
 * para validação do gestor. Depois podemos trocar o motor por OpenRouter sem
 * alterar o contrato usado pela interface.
 */
export function suggestFieldRecords(text: string): FieldCandidate[] {
  const clean = text.trim();
  if (!clean) return [];

  const n = normalize(clean);
  const value = extractMoney(clean);
  const candidates: FieldCandidate[] = [];

  if (/abastec|combust|gasolina|diesel|posto|litro/.test(n)) {
    const vehicle = n.match(/\b(pc|patrol|escavadeira|retroescavadeira|caminhao|carro|topografo|moto|trator)\b/)?.[1];
    candidates.push({
      type: "custo",
      title: "Abastecimento",
      summary: [vehicle && vehicle.toUpperCase(), value].filter(Boolean).join(" · ") || "Despesa de combustível identificada",
      confidence: value ? 0.96 : 0.82,
      fields: { categoria: "combustível", ...(vehicle ? { equipamento: vehicle.toUpperCase() } : {}), ...(value ? { valor: value } : {}) },
    });
  }

  if (/brita|areia|cimento|tubo|manilha|concreto|aco|ferro|material|insumo/.test(n)) {
    const material = clean.match(/(?:brita|areia|cimento|tubo|manilha|concreto|a[cç]o|ferro|material|insumo)[^,.!?;]*/i)?.[0];
    candidates.push({
      type: "material",
      title: "Material identificado",
      summary: material?.trim() || "Material/insumo mencionado",
      confidence: 0.88,
      fields: { descricao: material?.trim() || clean },
    });
  }

  if (/pc|patrol|escavadeira|retroescavadeira|caminhao|trator|maquina|equipamento/.test(n)) {
    candidates.push({
      type: "maquina",
      title: "Equipamento mencionado",
      summary: clean.length > 100 ? `${clean.slice(0, 97)}...` : clean,
      confidence: 0.8,
      fields: { observacao: clean },
    });
  }

  if (/problema|travou|parado|atraso|nao veio|nao chegou|nao bate|diverg|erro|pendencia|faltando|aguardando|imped/.test(n)) {
    candidates.push({
      type: "ocorrencia",
      title: "Ocorrência identificada",
      summary: clean.length > 120 ? `${clean.slice(0, 117)}...` : clean,
      confidence: 0.9,
      fields: { descricao: clean },
    });
  }

  if (/precisa|providenciar|verificar|comprar|enviar|resolver|ligar|confirmar|cobrar|agendar/.test(n)) {
    candidates.push({
      type: "acao",
      title: "Ação sugerida",
      summary: clean.length > 120 ? `${clean.slice(0, 117)}...` : clean,
      confidence: 0.84,
      fields: { descricao: clean },
    });
  }

  if (candidates.length === 0) {
    candidates.push({
      type: "diario",
      title: "Registro de campo",
      summary: clean.length > 140 ? `${clean.slice(0, 137)}...` : clean,
      confidence: 0.65,
      fields: { relato: clean },
    });
  }

  return candidates;
}

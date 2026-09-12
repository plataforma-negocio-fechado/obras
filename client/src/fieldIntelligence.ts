export type FieldRecordType = "custo" | "material" | "maquina" | "equipe" | "ocorrencia" | "acao" | "diario";

export type FieldCandidate = {
  type: FieldRecordType;
  title: string;
  summary: string;
  confidence: number;
  fields: Record<string, string>;
};

const money = /(?:r\$\s*)?(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?|\d+(?:,\d{1,2})?)/i;
const quantityPattern = /\b(\d+(?:[,.]\d+)?)\s*(carradas?|cargas?|ca[cç]ambas?|unidades?|und(?:\.)?|tubos?|sacos?|m[³3]|m2|m²|m|toneladas?|ton|kg|litros?|l)\b/i;

function normalize(text: string) {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function short(text: string, max = 160) {
  return text.length > max ? `${text.slice(0, max - 3)}...` : text;
}

function extractMoney(text: string) {
  const match = text.match(/r\$\s*([\d.]+(?:,\d{1,2})?)/i);
  if (!match?.[1]) return undefined;
  return `R$ ${match[1]}`;
}

function extractQuantity(text: string) {
  const match = text.match(quantityPattern);
  if (!match) return undefined;
  return { quantity: match[1], unit: match[2].toLowerCase() };
}

function extractMachine(normalized: string) {
  const aliases: Array<[RegExp, string]> = [
    [/\bpc\b/, "PC"],
    [/\bpatrol\b/, "PATROL"],
    [/\bescavadeira\b/, "ESCAVADEIRA"],
    [/\bretroescavadeira\b/, "RETROESCAVADEIRA"],
    [/\bcaminhao\b/, "CAMINHÃO"],
    [/\btrator\b/, "TRATOR"],
    [/\bmotoniveladora\b/, "MOTONIVELADORA"],
    [/\brolo\b/, "ROLO"],
  ];
  return aliases.find(([pattern]) => pattern.test(normalized))?.[1];
}

function extractReason(text: string) {
  const match = text.match(/(?:porque|pq|por causa de|devido a|em raz[aã]o de)\s+(.+?)(?:[.!?]|$)/i);
  return match?.[1]?.trim();
}

function extractFront(normalized: string) {
  const match = normalized.match(/(?:na|no|para a|para o|da|do|frente)\s+(drenagem|escavacao|aterro|pavimentacao|limpeza|obra|servico|terraplenagem|sinalizacao)/i);
  return match?.[1];
}

function extractDuration(text: string) {
  const match = text.match(/(?:por|durante|de)\s+(\d+(?:[,.]\d+)?)\s*(hora|horas|minuto|minutos)/i);
  if (!match) return undefined;
  const value = Number(match[1].replace(",", "."));
  if (!Number.isFinite(value)) return undefined;
  return match[2].startsWith("min") ? String(value / 60) : String(value);
}

function isCost(normalized: string) {
  return /\b(paguei|pagamento|comprei|compra|custou|gastei|despesa|nota|orcamento|abasteci|abastecimento|combustivel|diesel|gasolina)\b/.test(normalized);
}

function isMaterial(normalized: string) {
  return /\b(brita|areia|cimento|tubo|tubos|manilha|manilhas|concreto|aco|ferro|material|insumo|cascalho|piçarra|picarra|pedra|britas)\b/.test(normalized);
}

function isProblem(normalized: string) {
  return /\b(problema|travou|parado|parada|atraso|nao veio|nao chegou|nao bate|diverg|erro|pendencia|faltando|aguardando|impedi|estourou|quebrou|defeito|falha|interromp)\b/.test(normalized);
}

function isAction(normalized: string) {
  return /\b(precisa|precisamos|providenciar|verificar|comprar|enviar|resolver|ligar|confirmar|cobrar|agendar|programar|solicitar|fazer|corrigir|acompanhar)\b/.test(normalized);
}

/**
 * Motor local do Campo.
 *
 * Linguagem livre -> candidatos estruturados -> revisão humana.
 * Nada aqui grava na gestão. A confirmação fica apenas no histórico local
 * enquanto o backend e as integrações são construídos em uma etapa posterior.
 */
export function suggestFieldRecords(text: string): FieldCandidate[] {
  const clean = text.trim();
  if (!clean) return [];

  const n = normalize(clean);
  const value = extractMoney(clean);
  const machine = extractMachine(n);
  const quantity = extractQuantity(clean);
  const front = extractFront(n);
  const reason = extractReason(clean);
  const candidates: FieldCandidate[] = [];

  // Custo explícito.
  if (value && isCost(n)) {
    const fuel = /abastec|combustivel|gasolina|diesel/.test(n);
    const description = fuel ? `Abastecimento${machine ? ` da ${machine}` : ""}` : short(clean, 90);
    candidates.push({
      type: "custo",
      title: description,
      summary: [machine, value].filter(Boolean).join(" · ") || "Despesa identificada",
      confidence: fuel ? 0.98 : 0.92,
      fields: {
        categoria: fuel ? "combustível" : "despesa",
        ...(machine ? { equipamento: machine } : {}),
        valor: value,
      },
    });
  }

  // Material, principalmente quando existe recebimento/entrega/compra.
  if (isMaterial(n)) {
    const materialMatch = clean.match(/(?:brita|areia|cimento|tubos?|manilhas?|concreto|a[cç]o|ferro|material|insumo|cascalho|pi[cç]arra|pedra)(?:\s+de\s+[^,.!?;]+)?/i);
    const material = materialMatch?.[0]?.trim() || "Material/insumo mencionado";
    const quantityText = quantity ? `${quantity.quantity} ${quantity.unit}` : undefined;
    const receiving = /receb|chegou|chegaram|entreg|compr|trouxe|descarreg/.test(n);
    candidates.push({
      type: "material",
      title: receiving ? "Material recebido" : "Material identificado",
      summary: [material, quantityText, front && `frente: ${front}`].filter(Boolean).join(" · "),
      confidence: quantity ? 0.97 : 0.88,
      fields: {
        descricao: material,
        ...(quantity ? { quantidade: quantity.quantity, unidade: quantity.unit } : {}),
        ...(front ? { frente: front } : {}),
      },
    });
  }

  // Equipe com quantidade por função.
  const teamMatches = Array.from(n.matchAll(/\b(\d+)\s+(operador(?:es)?|pedreiro(?:s)?|ajudante(?:s)?|servente(?:s)?|encarregado(?:s)?|topografo(?:s)?)\b/g));
  if (teamMatches.length) {
    const roles = teamMatches.map((match) => `${match[2]}: ${match[1]}`).join(" · ");
    candidates.push({
      type: "equipe",
      title: "Equipe em campo",
      summary: [roles, front && `frente: ${front}`].filter(Boolean).join(" · "),
      confidence: 0.96,
      fields: {
        equipe: roles,
        ...(front ? { frente: front } : {}),
      },
    });
  }

  // Evento de máquina. Abastecimento não duplica como evento de máquina.
  const hasMachineEvent = Boolean(machine && /parad[ao]|rodou|chegou|hora[s]?|quebrou|estourou|defeito|problema|manutenc|funcion|uso|operou|bomba/.test(n));
  if (hasMachineEvent && !value || (hasMachineEvent && !/abastec|combustivel|diesel|gasolina/.test(n))) {
    const durationHours = extractDuration(clean);
    const event = /parad[ao]|nao rodou|interromp/.test(n)
      ? "parada"
      : /chegou/.test(n)
        ? "chegada"
        : /quebrou|estourou|defeito|problema|manutenc|falha|bomba/.test(n)
          ? "falha/manutenção"
          : "uso de máquina";
    candidates.push({
      type: "maquina",
      title: "Evento de máquina",
      summary: [machine, event, durationHours ? `${durationHours} h` : undefined, reason].filter(Boolean).join(" · "),
      confidence: durationHours || reason ? 0.96 : 0.89,
      fields: {
        equipamento: machine!,
        evento: event,
        ...(durationHours ? { duracaoHoras: durationHours } : {}),
        ...(reason ? { motivo: reason } : {}),
      },
    });
  }

  // Ocorrência: qualquer problema que afete execução, equipamento ou prazo.
  if (isProblem(n)) {
    const impact = /parad[ao]|nao rodou|impedi|interromp/.test(n) ? "serviço/máquina parado" : "execução impactada";
    candidates.push({
      type: "ocorrencia",
      title: "Ocorrência identificada",
      summary: short(clean),
      confidence: reason || /parad[ao]|quebrou|falha/.test(n) ? 0.95 : 0.88,
      fields: {
        descricao: clean,
        impacto: impact,
        ...(machine ? { equipamento: machine } : {}),
      },
    });
  }

  // Ação explícita ou implícita de acompanhamento.
  if (isAction(n)) {
    candidates.push({
      type: "acao",
      title: "Ação sugerida",
      summary: short(clean),
      confidence: 0.86,
      fields: {
        descricao: clean,
        ...(front ? { frente: front } : {}),
      },
    });
  }

  // Produção/serviço tende a ser diário quando não há categoria específica.
  if (candidates.length === 0) {
    candidates.push({
      type: "diario",
      title: "Registro de campo",
      summary: short(clean),
      confidence: 0.72,
      fields: {
        relato: clean,
        ...(front ? { frente: front } : {}),
      },
    });
  }

  return candidates;
}

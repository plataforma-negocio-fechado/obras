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

function extractQuantity(text: string) {
  const match = text.match(/\b(\d+(?:[,.]\d+)?)\s*(carradas?|cargas?|unidades?|und(?:\.)?|tubos?|sacos?|m[³3]|m2|m²|m|toneladas?|ton|kg|litros?|l)\b/i);
  if (!match) return undefined;
  return { quantity: match[1], unit: match[2].toLowerCase() };
}

function extractMachine(text: string, normalized: string) {
  const match = normalized.match(/\b(pc|patrol|escavadeira|retroescavadeira|caminhao|trator)\b/);
  return match?.[1]?.toUpperCase() ?? (normalized.includes("maquina") || normalized.includes("equipamento") ? "Equipamento não especificado" : undefined);
}

function short(text: string, max = 120) {
  return text.length > max ? `${text.slice(0, max - 3)}...` : text;
}

/**
 * Primeira camada de inteligência do Campo.
 * Não grava nada: transforma a mensagem em sugestões estruturadas para revisão.
 * O contrato é compartilhado com a camada de IA, permitindo trocar o motor sem
 * alterar a interface.
 */
export function suggestFieldRecords(text: string): FieldCandidate[] {
  const clean = text.trim();
  if (!clean) return [];

  const n = normalize(clean);
  const value = extractMoney(clean);
  const candidates: FieldCandidate[] = [];

  const machine = extractMachine(clean, n);
  const hasProblem = /problema|travou|parad[ao]|atraso|nao veio|nao chegou|nao bate|diverg|erro|pendencia|faltando|aguardando|imped|estourou|quebrou|defeito/.test(n);
  const hasMachineEvent = machine && /parad[ao]|rodou|chegou|abastec|horas?|quebrou|estourou|defeito|problema|manutenc|funcion/.test(n);
  const hasFuelCost = value && /abastec|combustivel|gasolina|diesel|posto/.test(n);

  // Custo: só criar quando existe evidência de uma despesa, preferencialmente valor.
  if (hasFuelCost) {
    candidates.push({
      type: "custo",
      title: "Abastecimento",
      summary: [machine, value].filter(Boolean).join(" · ") || "Despesa de combustível identificada",
      confidence: value ? 0.96 : 0.82,
      fields: {
        categoria: "combustível",
        ...(machine ? { equipamento: machine } : {}),
        ...(value ? { valor: value } : {}),
      },
    });
  }

  // Material: preservar quantidade e unidade quando aparecem na frase.
  if (/brita|areia|cimento|tubo|manilha|concreto|aco|ferro|material|insumo/.test(n)) {
    const materialMatch = clean.match(/(?:brita|areia|cimento|tubo|manilha|concreto|a[cç]o|ferro|material|insumo)[^,.!?;]*/i);
    const material = materialMatch?.[0]?.trim() || "Material/insumo mencionado";
    const quantity = extractQuantity(clean);

    candidates.push({
      type: "material",
      title: "Material identificado",
      summary: quantity ? `${material} · ${quantity.quantity} ${quantity.unit}` : material,
      confidence: quantity ? 0.94 : 0.88,
      fields: {
        descricao: material,
        ...(quantity ? { quantidade: quantity.quantity, unidade: quantity.unit } : {}),
      },
    });
  }

  // Equipe: priorizar equipe quando houver cargos e quantidades explícitas.
  const teamMatches = [
    ...Array.from(n.matchAll(/\b(\d+)\s+(operador(?:es)?|pedreiro(?:s)?|ajudante(?:s)?|servente(?:s)?|encarregado(?:s)?|topografo(?:s)?)\b/g)),
  ];
  if (teamMatches.length) {
    const roles = teamMatches.map((match) => `${match[2]}: ${match[1]}`).join(" · ");
    const front = n.match(/(?:na|no|para a|para o|da|do)\s+(drenagem|escavacao|aterro|pavimentacao|pavimenta[cç]ao|obra|servico)/i)?.[1];
    candidates.push({
      type: "equipe",
      title: "Equipe em campo",
      summary: [roles, front && `frente: ${front}`].filter(Boolean).join(" · "),
      confidence: 0.94,
      fields: {
        equipe: roles,
        ...(front ? { frente: front } : {}),
      },
    });
  }

  // Máquina: extrair evento, duração e motivo em vez de guardar apenas observação.
  if (hasMachineEvent) {
    const duration = n.match(/(?:por|de|durante)\s+(\d+(?:[,.]\d+)?)\s*(hora|horas|minuto|minutos)/i)?.[0];
    const event = /parad[ao]|nao rodou|não rodou/.test(n)
      ? "parada"
      : /abastec/.test(n)
        ? "abastecimento"
        : /chegou/.test(n)
          ? "chegada"
          : /quebrou|estourou|defeito|problema|manutenc/.test(n)
            ? "falha/manutenção"
            : "evento de máquina";
    const reasonMatch = clean.match(/(?:porque|pq|por causa de|devido a)\s+(.+?)(?:\.|$)/i);
    const reason = reasonMatch?.[1]?.trim();

    candidates.push({
      type: "maquina",
      title: "Evento de máquina",
      summary: [machine, event, duration, reason].filter(Boolean).join(" · "),
      confidence: duration || reason ? 0.94 : 0.86,
      fields: {
        ...(machine ? { equipamento: machine } : {}),
        evento: event,
        ...(duration ? { duracao: duration.replace(/^(?:por|de|durante)\s+/i, "") } : {}),
        ...(reason ? { motivo: reason } : {}),
      },
    });
  }

  // Ocorrência: problemas de execução devem virar ocorrência, mesmo quando há diário implícito.
  if (hasProblem) {
    const impact = /parad[ao]|nao rodou|não rodou/.test(n) ? "serviço/máquina parado" : undefined;
    candidates.push({
      type: "ocorrencia",
      title: "Ocorrência identificada",
      summary: short(clean),
      confidence: 0.92,
      fields: {
        descricao: clean,
        ...(impact ? { impacto: impact } : {}),
      },
    });
  }

  if (/precisa|providenciar|verificar|comprar|enviar|resolver|ligar|confirmar|cobrar|agendar/.test(n)) {
    candidates.push({
      type: "acao",
      title: "Ação sugerida",
      summary: short(clean),
      confidence: 0.84,
      fields: { descricao: clean },
    });
  }

  if (candidates.length === 0) {
    candidates.push({
      type: "diario",
      title: "Registro de campo",
      summary: short(clean, 140),
      confidence: 0.65,
      fields: { relato: clean },
    });
  }

  return candidates;
}

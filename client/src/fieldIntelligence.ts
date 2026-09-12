export type FieldRecordType = "custo" | "material" | "maquina" | "equipe" | "ocorrencia" | "acao" | "diario";

export type FieldCandidate = {
  type: FieldRecordType;
  title: string;
  summary: string;
  confidence: number;
  fields: Record<string, string>;
};

const money = /R\$\s?([\d.]+(?:,\d{1,2})?)/i;
const quantityPattern = /\b(\d+(?:[,.]\d+)?)\s*(carradas?|cargas?|ca[cç]ambas?|unidades?|und(?:\.)?|tubos?|sacos?|m[³3]|m2|m²|m|toneladas?|ton|kg|litros?|l)\b/i;

function normalize(text: string) {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function extractMoney(text: string) {
  const match = text.match(money);
  return match?.[1] ? `R$ ${match[1]}` : undefined;
}

function extractQuantity(text: string) {
  const match = text.match(quantityPattern);
  if (!match) return undefined;
  return { quantity: match[1], unit: match[2].toLowerCase() };
}

function extractMachine(normalized: string) {
  const match = normalized.match(/\b(pc|patrol|escavadeira|retroescavadeira|caminhao|caminhão|trator|motoniveladora|rolo)\b/);
  if (!match) return normalized.includes("maquina") || normalized.includes("equipamento") ? "Equipamento não especificado" : undefined;
  return match[1].toUpperCase();
}

function short(text: string, max = 140) {
  return text.length > max ? `${text.slice(0, max - 3)}...` : text;
}

function extractReason(text: string) {
  const match = text.match(/(?:porque|pq|por causa de|devido a)\s+(.+?)(?:[.!?]|$)/i);
  return match?.[1]?.trim();
}

function extractFront(normalized: string) {
  const match = normalized.match(/(?:na|no|para a|para o|da|do)\s+(drenagem|escavacao|aterro|pavimentacao|pavimenta[cç]ao|limpeza|obra|servico)/i);
  return match?.[1];
}

function extractDuration(text: string) {
  const match = text.match(/(?:por|durante|de)\s+(\d+(?:[,.]\d+)?)\s*(hora|horas|minuto|minutos)/i);
  if (!match) return undefined;
  const value = Number(match[1].replace(",", "."));
  if (!Number.isFinite(value)) return undefined;
  return match[2].startsWith("min") ? String(value / 60) : String(value);
}

/**
 * Motor local do Campo.
 *
 * A mensagem chega em linguagem livre e sai como candidatos estruturados.
 * Nenhum candidato é gravado automaticamente: a confirmação é a fronteira
 * entre interpretação e dado de gestão.
 *
 * Este motor é deliberadamente determinístico para funcionar também no
 * GitHub Pages, sem expor chave de IA no navegador. Quando uma API de IA
 * estiver disponível, FieldPage pode continuar usando-a como primeira opção
 * e cair aqui como fallback.
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

  const hasFuelCost = Boolean(value && /abastec|combustivel|gasolina|diesel|posto/.test(n));
  const hasMaterial = /brita|areia|cimento|tubo|manilha|concreto|aco|ferro|material|insumo|ca[cç]amba/.test(n);
  const hasProblem = /problema|travou|parad[ao]|atraso|nao veio|nao chegou|nao bate|diverg|erro|pendencia|faltando|aguardando|imped|estourou|quebrou|defeito|falha/.test(n);

  // 1. Custos explícitos.
  if (value && (hasFuelCost || /pag(?:uei|amento)|compr(?:ei|a)|custou|gastei|despesa|nota|or[cç]amento/.test(n))) {
    const description = hasFuelCost
      ? `Abastecimento${machine ? ` da ${machine}` : ""}`
      : short(clean, 90);

    candidates.push({
      type: "custo",
      title: description,
      summary: [machine, value].filter(Boolean).join(" · ") || "Despesa identificada",
      confidence: hasFuelCost ? 0.98 : 0.90,
      fields: {
        categoria: hasFuelCost ? "combustível" : "despesa",
        ...(machine ? { equipamento: machine } : {}),
        valor: value!,
      },
    });
  }

  // 2. Materiais recebidos/comprados.
  if (hasMaterial) {
    const materialMatch = clean.match(/(?:brita|areia|cimento|tubos?|manilhas?|concreto|a[cç]o|ferro|material|insumo)(?:\s+de\s+[^,.!?;]+)?/i);
    const material = materialMatch?.[0]?.trim() || "Material/insumo mencionado";
    const quantityText = quantity ? `${quantity.quantity} ${quantity.unit}` : undefined;
    const receiving = /receb|chegou|chegaram|entreg|compr|trouxe|descarreg/.test(n);

    candidates.push({
      type: "material",
      title: receiving ? "Material recebido" : "Material identificado",
      summary: [material, quantityText, front && `frente: ${front}`].filter(Boolean).join(" · "),
      confidence: quantity ? 0.96 : 0.88,
      fields: {
        descricao: material,
        ...(quantity ? { quantidade: quantity.quantity, unidade: quantity.unit } : {}),
        ...(front ? { frente: front } : {}),
      },
    });
  }

  // 3. Equipe com cargos e quantidades explícitas.
  const teamMatches = Array.from(n.matchAll(/\b(\d+)\s+(operador(?:es)?|pedreiro(?:s)?|ajudante(?:s)?|servente(?:s)?|encarregado(?:s)?|topografo(?:s)?)\b/g));
  if (teamMatches.length) {
    const roles = teamMatches.map((match) => `${match[2]}: ${match[1]}`).join(" · ");
    candidates.push({
      type: "equipe",
      title: "Equipe em campo",
      summary: [roles, front && `frente: ${front}`].filter(Boolean).join(" · "),
      confidence: 0.95,
      fields: {
        equipe: roles,
        ...(front ? { frente: front } : {}),
      },
    });
  }

  // 4. Evento de máquina. Abastecimento isolado não vira máquina para evitar duplicidade.
  const hasMachineEvent = Boolean(
    machine && /parad[ao]|rodou|chegou|hora[s]?|quebrou|estourou|defeito|problema|manutenc|funcion|uso|operou/.test(n),
  );
  if (hasMachineEvent && !hasFuelCost) {
    const durationHours = extractDuration(clean);
    const event = /parad[ao]|nao rodou/.test(n)
      ? "parada"
      : /chegou/.test(n)
        ? "chegada"
        : /quebrou|estourou|defeito|problema|manutenc|falha/.test(n)
          ? "falha/manutenção"
          : "uso de máquina";

    candidates.push({
      type: "maquina",
      title: "Evento de máquina",
      summary: [machine, event, durationHours ? `${durationHours} h` : undefined, reason].filter(Boolean).join(" · "),
      confidence: durationHours || reason ? 0.95 : 0.88,
      fields: {
        equipamento: machine!,
        evento: event,
        ...(durationHours ? { duracaoHoras: durationHours } : {}),
        ...(reason ? { motivo: reason } : {}),
      },
    });
  }

  // 5. Ocorrência: problemas que afetam execução ou prazo.
  if (hasProblem) {
    const impact = /parad[ao]|nao rodou|imped/.test(n) ? "serviço/máquina parado" : "execução impactada";
    candidates.push({
      type: "ocorrencia",
      title: "Ocorrência identificada",
      summary: short(clean),
      confidence: reason || /parad[ao]|quebrou|falha/.test(n) ? 0.94 : 0.88,
      fields: {
        descricao: clean,
        impacto: impact,
        ...(machine ? { equipamento: machine } : {}),
      },
    });
  }

  // 6. Ações explícitas.
  if (/precisa|providenciar|verificar|comprar|enviar|resolver|ligar|confirmar|cobrar|agendar|programar|solicitar/.test(n)) {
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

  // 7. Fallback: toda mensagem útil vira diário, em vez de desaparecer.
  if (candidates.length === 0) {
    candidates.push({
      type: "diario",
      title: "Registro de campo",
      summary: short(clean),
      confidence: 0.70,
      fields: {
        relato: clean,
        ...(front ? { frente: front } : {}),
      },
    });
  }

  return candidates;
}

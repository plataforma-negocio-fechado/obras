export type FieldRecordType = "producao" | "custo" | "material" | "maquina" | "equipe" | "ocorrencia" | "acao" | "diario";

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
    [/\bsapinho\b/, "SAPINHO"],
    [/\bcompactador(?:a)?\b/, "COMPACTADOR"],
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

function extractMachines(normalized: string) {
  const aliases: Array<[RegExp, string]> = [
    [/\bpc\b/, "PC"],
    [/\bsapinho\b/, "SAPINHO"],
    [/\bcompactador(?:a)?\b/, "COMPACTADOR"],
    [/\bpatrol\b/, "PATROL"],
    [/\bescavadeira\b/, "ESCAVADEIRA"],
    [/\bretroescavadeira\b/, "RETROESCAVADEIRA"],
    [/\bcaminhao\b/, "CAMINHÃO"],
    [/\btrator\b/, "TRATOR"],
    [/\bmotoniveladora\b/, "MOTONIVELADORA"],
    [/\brolo\b/, "ROLO"],
  ];
  return aliases.filter(([pattern]) => pattern.test(normalized)).map(([, label]) => label);
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

function isProduction(normalized: string) {
  const hasExecutionVerb = /\b(executamos?|executou|fizemos|fiz|produ[cç][aã]o|produzimos|assentamos?|escavamos?|compactamos?|espalhamos?|regularizamos?|avancamos?|avançamos?|conclu[ií]mos?|realizamos?)\b/.test(normalized);
  const hasProgressQuantity = /\b\d+(?:[,.]\d+)?\s*(m|metro|metros|m2|m²|m3|m³|unidades?|un|tubos?|toneladas?|ton|kg)\b/.test(normalized);
  return hasExecutionVerb && hasProgressQuantity;
}

function isProblem(normalized: string) {
  return /\b(problema|travou|parado|parada|atraso|nao veio|nao chegou|nao bate|diverg|erro|pendencia|faltando|aguardando|impedi|estourou|quebrou|defeito|falha|interromp|suporte|capacidade)\b/.test(normalized);
}

function isAction(normalized: string) {
  return /\b(precisa|precisamos|providenciar|verificar|comprar|enviar|resolver|ligar|confirmar|cobrar|agendar|programar|solicitar|fazer|corrigir|acompanhar)\b/.test(normalized);
}

function extractDecision(text: string) {
  const match = text.match(/(?:nao pensa(?:mos)?|não pensa(?:mos)?|decidimos?|vamos|iremos|optamos?)\s+(?:em\s+)?(.+?)(?:[.!?]|$)/i);
  return match?.[1]?.trim();
}

function extractLoadContext(text: string) {
  const number = text.match(/\b(quatro|4)\s+(?:carros?|cargas?|carradas?)\b/i);
  const capacity = text.match(/\b(\d+(?:[,.]\d+)?)\s*(m[³3]|metros?)\s*(?:cada|por)\b/i);
  if (!number) return undefined;
  return capacity ? `${number[1]} cargas · ${capacity[1]} ${capacity[2]} cada` : `${number[1]} cargas`;
}

/**
 * Motor local do Campo.
 *
 * Linguagem livre -> candidatos estruturados -> revisão humana.
 * A confirmação é feita na interface antes de incorporar o relato à memória operacional.
 */
export function suggestFieldRecords(text: string): FieldCandidate[] {
  const clean = text.trim();
  if (!clean) return [];

  const n = normalize(clean);
  const value = extractMoney(clean);
  const machine = extractMachine(n);
  const machines = extractMachines(n);
  const quantity = extractQuantity(clean);
  const front = extractFront(n);
  const reason = extractReason(clean);
  const decision = extractDecision(clean);
  const candidates: FieldCandidate[] = [];

  if (isProduction(n)) {
    const production = clean.match(/\b(\d+(?:[,.]\d+)?)\s*(m|metro|metros|m2|m²|m3|m³|unidades?|un|tubos?|toneladas?|ton|kg)\b/i);
    const productionValue = production?.[1];
    const productionUnit = production?.[2]?.toLowerCase();
    candidates.push({
      type: "producao",
      title: "Produção registrada",
      summary: [productionValue && productionUnit ? `${productionValue} ${productionUnit}` : undefined, front && `frente: ${front}`, machines.length ? machines.join(" + ") : undefined, decision && `decisão: ${decision}`].filter(Boolean).join(" · "),
      confidence: productionValue ? 0.97 : 0.86,
      fields: {
        quantidade: productionValue ?? "",
        unidade: productionUnit ?? "",
        ...(front ? { frente: front } : {}),
        ...(machines.length ? { maquinas: machines.join(" + ") } : {}),
        ...(decision ? { decisao: decision } : {}),
      },
    });
  }

  if (value && isCost(n)) {
    const fuel = /abastec|combustivel|gasolina|diesel/.test(n);
    const description = fuel ? `Abastecimento${machine ? ` da ${machine}` : ""}` : short(clean, 90);
    candidates.push({
      type: "custo",
      title: description,
      summary: [machine, value].filter(Boolean).join(" · ") || "Despesa identificada",
      confidence: fuel ? 0.98 : 0.92,
      fields: { categoria: fuel ? "combustível" : "despesa", ...(machine ? { equipamento: machine } : {}), valor: value },
    });
  }

  if (isMaterial(n)) {
    const materialMatch = clean.match(/(?:brita|areia|cimento|tubos?|manilhas?|concreto|a[cç]o|ferro|material|insumo|cascalho|pi[cç]arra|pedra)(?:\s+de\s+[^,.!?;]+)?/i);
    const material = materialMatch?.[0]?.trim() || "Material/insumo mencionado";
    const quantityText = quantity ? `${quantity.quantity} ${quantity.unit}` : undefined;
    const loadContext = extractLoadContext(clean);
    const receiving = /receb|chegou|chegaram|entreg|compr|trouxe|descarreg/.test(n);
    candidates.push({
      type: "material",
      title: receiving ? "Material recebido" : "Material identificado",
      summary: [material, loadContext ?? quantityText, front && `frente: ${front}`].filter(Boolean).join(" · "),
      confidence: loadContext || quantity ? 0.97 : 0.88,
      fields: {
        descricao: material,
        ...(loadContext ? { recebimento: loadContext } : {}),
        ...(quantity ? { quantidade: quantity.quantity, unidade: quantity.unit } : {}),
        ...(front ? { frente: front } : {}),
      },
    });
  }

  const teamMatches = Array.from(n.matchAll(/\b(\d+)\s+(operador(?:es)?|pedreiro(?:s)?|ajudante(?:s)?|servente(?:s)?|encarregado(?:s)?|topografo(?:s)?)\b/g));
  if (teamMatches.length) {
    const roles = teamMatches.map((match) => `${match[2]}: ${match[1]}`).join(" · ");
    candidates.push({ type: "equipe", title: "Equipe em campo", summary: [roles, front && `frente: ${front}`].filter(Boolean).join(" · "), confidence: 0.96, fields: { equipe: roles, ...(front ? { frente: front } : {}) } });
  }

  const hasMachineEvent = Boolean(machine && /parad[ao]|rodou|chegou|hora[s]?|quebrou|estourou|defeito|problema|manutenc|funcion|uso|operou|bomba|compact/.test(n));
  const isFuel = /abastec|combustivel|diesel|gasolina/.test(n);
  if (hasMachineEvent && !isFuel) {
    const durationHours = extractDuration(clean);
    const event = /parad[ao]|nao rodou|interromp/.test(n) ? "parada" : /chegou/.test(n) ? "chegada" : /quebrou|estourou|defeito|problema|manutenc|falha|bomba/.test(n) ? "falha/manutenção" : "uso de máquina";
    candidates.push({ type: "maquina", title: "Evento de máquina", summary: [machines.join(" + ") || machine, event, durationHours ? `${durationHours} h` : undefined, reason].filter(Boolean).join(" · "), confidence: durationHours || reason ? 0.96 : 0.89, fields: { equipamento: machines.join(" + ") || machine!, evento: event, ...(durationHours ? { duracaoHoras: durationHours } : {}), ...(reason ? { motivo: reason } : {}) } });
  }

  if (isProblem(n)) {
    const impact = /parad[ao]|nao rodou|impedi|interromp/.test(n) ? "serviço/máquina parado" : "execução requer verificação";
    candidates.push({ type: "ocorrencia", title: "Ocorrência identificada", summary: short(clean), confidence: reason || /parad[ao]|quebrou|falha|suporte|capacidade/.test(n) ? 0.95 : 0.88, fields: { descricao: clean, impacto: impact, ...(machine ? { equipamento: machine } : {}), ...(decision ? { decisao: decision } : {}) } });
  }

  if (isAction(n)) {
    candidates.push({ type: "acao", title: "Ação sugerida", summary: short(clean), confidence: 0.86, fields: { descricao: clean, ...(front ? { frente: front } : {}) } });
  }

  if (candidates.length === 0) {
    candidates.push({ type: "diario", title: "Registro de campo", summary: short(clean), confidence: 0.72, fields: { relato: clean, ...(front ? { frente: front } : {}) } });
  }

  return candidates;
}

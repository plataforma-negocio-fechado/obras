import { z } from "zod";

const candidateSchema = z.object({
  type: z.enum(["custo", "material", "maquina", "equipe", "ocorrencia", "acao", "diario"]),
  title: z.string().min(1).max(120),
  summary: z.string().min(1).max(500),
  confidence: z.number().min(0).max(1),
  fields: z.record(z.string(), z.string()).default({}),
});

const responseSchema = z.object({ candidates: z.array(candidateSchema).max(12) });

const SYSTEM_PROMPT = `Você é o organizador operacional do Negócio Fechado, uma plataforma para gestão de obras.
Sua função é transformar mensagens de campo em sugestões estruturadas para um gestor revisar.

Tipos permitidos: custo, material, maquina, equipe, ocorrencia, acao, diario.

Regras:
- Não invente informações que não estejam na mensagem.
- Extraia valores monetários, equipamentos, materiais, pessoas, datas e ações quando estiverem explícitos.
- Uma mesma mensagem pode gerar mais de um registro.
- Use confidence entre 0 e 1 de acordo com a evidência disponível.
- fields deve conter apenas dados realmente identificados.
- Se não houver uma categoria específica, use diario.
- Responda SOMENTE com JSON válido no formato: {"candidates":[...]}.
`;

function extractJson(text: string) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)?.[1];
  const raw = fenced ?? text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("Resposta da IA não contém JSON");
  return JSON.parse(raw.slice(start, end + 1));
}

export async function organizeWithOpenRouter(text: string) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY não configurada");

  const model = process.env.OPENROUTER_MODEL || "openrouter/free";
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "http://localhost:3000",
      "X-Title": "Negócio Fechado · Campo",
    },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: text.trim().slice(0, 12000) },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`OpenRouter retornou ${response.status}${detail ? `: ${detail.slice(0, 300)}` : ""}`);
  }

  const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenRouter não retornou conteúdo");

  return responseSchema.parse(extractJson(content)).candidates;
}

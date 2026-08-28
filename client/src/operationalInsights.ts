import type { LocalProject } from "@/localStore";

export type AttentionItem = {
  id: "overdue-actions" | "upcoming-actions" | "critical-events" | "stale-fronts";
  count: number;
  label: string;
  description: string;
  tone: "critical" | "warning" | "neutral";
  path: "/acoes" | "/ocorrencias" | "/diario";
};

function isoDay(value: Date) {
  return value.toISOString().slice(0, 10);
}

function addDays(referenceDate: Date, days: number) {
  const next = new Date(referenceDate);
  next.setDate(next.getDate() + days);
  return next;
}

export function getOperationalAttention(project: LocalProject, referenceDate = new Date()): AttentionItem[] {
  const today = isoDay(referenceDate);
  const nextWeek = isoDay(addDays(referenceDate, 7));
  const staleCutoff = isoDay(addDays(referenceDate, -7));
  const activeActions = project.actions.filter((action) => !action.done && action.due !== "A definir");
  const overdueActions = activeActions.filter((action) => action.due < today);
  const upcomingActions = activeActions.filter((action) => action.due >= today && action.due <= nextWeek);
  const criticalEvents = project.events.filter((event) => event.status !== "Resolvido" && event.priority === "Crítica");
  const latestDiaryByFront = new Map<string, string>();

  project.diaries.forEach((diary) => {
    const current = latestDiaryByFront.get(diary.frontId);
    if (!current || diary.date > current) latestDiaryByFront.set(diary.frontId, diary.date);
  });

  const staleFronts = project.fronts.filter((front) => {
    const isActive = (front.progress > 0 && front.progress < 100) || front.status === "Atenção";
    const latest = latestDiaryByFront.get(front.id)?.slice(0, 10);
    return isActive && (!latest || latest < staleCutoff);
  });

  return [
    overdueActions.length > 0 ? { id: "overdue-actions", count: overdueActions.length, label: "Ações vencidas", description: "Replaneje ou conclua os itens com prazo ultrapassado.", tone: "critical", path: "/acoes" } : null,
    criticalEvents.length > 0 ? { id: "critical-events", count: criticalEvents.length, label: "Eventos críticos", description: "Há impacto crítico que ainda precisa de tratamento.", tone: "critical", path: "/ocorrencias" } : null,
    upcomingActions.length > 0 ? { id: "upcoming-actions", count: upcomingActions.length, label: "Prazos nos próximos 7 dias", description: "Confira responsáveis e condições para executar no prazo.", tone: "warning", path: "/acoes" } : null,
    staleFronts.length > 0 ? { id: "stale-fronts", count: staleFronts.length, label: "Frentes sem atualização", description: "Registre o diário das frentes em andamento sem atualização recente.", tone: "neutral", path: "/diario" } : null,
  ].filter((item): item is AttentionItem => Boolean(item));
}

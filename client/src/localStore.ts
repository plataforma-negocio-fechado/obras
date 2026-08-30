import { useCallback, useEffect, useRef, useState } from "react";
import {
  appendMissingByLabel,
  applyProduction,
  removeProduction,
  sameLabel,
} from "@/localRules";
import { getCurrentUser, readRemoteSnapshot, writeRemoteSnapshot } from "@/syncService";
import { supabase } from "@/supabaseClient";

export type LocalPriority = "Crítica" | "Alta" | "Média" | "Baixa";
export type LocalEventStatus = "Aberto" | "Em tratamento" | "Resolvido";
export type LocalAction = { id: string; title: string; owner: string; due: string; priority: LocalPriority; done: boolean; eventId?: string; frontId?: string };
export type LocalEvent = { id: string; title: string; description: string; date: string; impact: string; decision: string; priority: LocalPriority; status: LocalEventStatus; frontId?: string };
export type LocalDiary = { id: string; date: string; frontId: string; service: string; summary: string; occurrence: string; weather: string; workforce: number; hours: number; production: number; evidenceName?: string; evidenceDataUrl?: string; evidenceType?: string };
export type LocalFront = { id: string; name: string; code: string; progress: number; status: string; detail: string; executed: number; planned: number; unit: string; services: string[] };
export type LocalWeeklyTarget = { id: string; frontId: string; weekEnd: string; planned: number; note: string };
export type LocalMaterialReceipt = { id: string; date: string; item: string; specification: string; quantity: number; unit: string; supplier: string; frontId?: string; location: string; reference: string; unitCost?: number };
export type LocalTeamMember = { id: string; name: string; role: string; company: string; active: boolean };
export type LocalTeamAssignmentStatus = "Alocado" | "Ocioso" | "Folga" | "Outro";
export type LocalTeamAssignment = { id: string; date: string; memberId: string; frontId?: string; status: LocalTeamAssignmentStatus; note: string };
export type LocalMachine = { id: string; name: string; type: string; identifier: string; active: boolean };
export type LocalMachineCondition = "Trabalhando" | "Parado" | "Manutenção" | "Disponível";
export type LocalMachineLog = { id: string; date: string; machineId: string; frontId?: string; operator: string; condition: LocalMachineCondition; hourmeterStart?: number; hourmeterEnd?: number; note: string };
export type LocalProject = { name: string; location: string; status: string; description: string; fronts: LocalFront[]; actions: LocalAction[]; events: LocalEvent[]; diaries: LocalDiary[]; weeklyTargets: LocalWeeklyTarget[]; materialReceipts: LocalMaterialReceipt[]; teamMembers: LocalTeamMember[]; teamAssignments: LocalTeamAssignment[]; machines: LocalMachine[]; machineLogs: LocalMachineLog[] };

const seed: LocalProject = {
  name: "Jardim Planalto", location: "Remígio/PB", status: "Em execução", description: "Loteamento em 2 etapas · cerca de 500 lotes",
  fronts: [
    { id: "drn-01", name: "Drenagem", code: "DRN-01", progress: 72, status: "Atenção", detail: "Solo saturado; assentamento bloqueado", executed: 310, planned: 430, unit: "m", services: ["Escavação", "Assentamento de tubulação", "Reaterro", "Bombeamento"] },
    { id: "via-01", name: "Limpeza e abertura das vias", code: "VIA-01", progress: 0, status: "Aguardando", detail: "Depende da patrol da Niemeyer", executed: 0, planned: 100, unit: "%", services: ["Limpeza", "Abertura de caixa", "Regularização"] },
    { id: "ter-02", name: "Terraplenagem e preparação viária", code: "TER-02", progress: 0, status: "Planejada", detail: "Topografia executiva a definir", executed: 0, planned: 100, unit: "%", services: ["Corte", "Aterro", "Compactação"] },
    { id: "pav-01", name: "Pavimentação", code: "PAV-01", progress: 0, status: "Não iniciada", detail: "CBUQ após preparação da infraestrutura", executed: 0, planned: 100, unit: "%", services: ["Base", "Imprimação", "CBUQ"] },
    { id: "agu-03", name: "Água", code: "AGU-03", progress: 0, status: "Planejada", detail: "Projeto completo e aprovado", executed: 0, planned: 100, unit: "%", services: ["Rede de água", "Ligações"] },
    { id: "ele-01", name: "Elétrica", code: "ELE-01", progress: 0, status: "Planejada", detail: "Projeto completo e aprovado", executed: 0, planned: 100, unit: "%", services: ["Infraestrutura elétrica", "Postes"] },
    { id: "amb-01", name: "Ambiental", code: "AMB-01", progress: 0, status: "Planejada", detail: "Projeto completo e aprovado", executed: 0, planned: 100, unit: "%", services: ["Controle ambiental", "Mitigação"] },
  ],
  events: [{ id: "event-1", title: "Solo saturado no trecho de drenagem", description: "Presença de água abaixo da região de assentamento no trecho DRN-01.", date: "2026-08-27T12:00:00.000Z", impact: "Assentamento da tubulação bloqueado até o rebaixamento.", decision: "Executar bombeamento, estabilizar o fundo e liberar após inspeção.", priority: "Crítica", status: "Em tratamento", frontId: "drn-01" }],
  actions: ["Executar dreno lateral abaixo da tubulação", "Mobilizar sistema de bombeamento", "Realizar bombeamento e rebaixamento", "Repor material com escavadeira", "Espalhar e regularizar com trator", "Aplicar camada drenante de rachinha", "Inspecionar e liberar o fundo", "Retomar assentamento da tubulação", "Liberar o trecho para assentamento", "Definir e executar o método de assentamento e içamento da tubulação", "Iniciar ou retomar o assentamento dos tubos", "Registrar evidência fotográfica do trecho"].map((title, index) => ({ id: `act-${index + 1}`, title, owner: index === 0 ? "Equipe Remígio" : "Não informado", due: "A definir", priority: "Crítica" as LocalPriority, done: false, eventId: "event-1", frontId: "drn-01" })),
  diaries: [], weeklyTargets: [], materialReceipts: [], teamMembers: [], teamAssignments: [], machines: [], machineLogs: [],
};
export const LOCAL_STORAGE_KEY = "obra-piloto-local-v1"; const KEY = LOCAL_STORAGE_KEY;
function makeId(prefix: string) { if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `${prefix}-${crypto.randomUUID()}`; return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }
function mergeSeedActions(rawActions: LocalAction[] | undefined) { return appendMissingByLabel(rawActions ?? [], seed.actions); }
function normalizeProject(raw: Partial<LocalProject>): LocalProject {
  const isLegacyJardimPlanalto = raw.name === "Jardim Planalto" && raw.location === "São Paulo";
  const rawFronts = Array.isArray(raw.fronts) && raw.fronts.length > 0 ? raw.fronts : seed.fronts;
  return { ...seed, ...raw, location: isLegacyJardimPlanalto ? seed.location : raw.location ?? seed.location,
    fronts: rawFronts.map((front) => { const seedFront = seed.fronts.find((item) => item.id === front.id); return { ...front, services: Array.isArray(front.services) && front.services.length > 0 ? front.services : seedFront?.services ?? [] }; }),
    actions: mergeSeedActions(Array.isArray(raw.actions) ? raw.actions : undefined),
    events: Array.isArray(raw.events) ? raw.events : seed.events,
    diaries: Array.isArray(raw.diaries) ? raw.diaries : [],
    weeklyTargets: Array.isArray(raw.weeklyTargets) ? raw.weeklyTargets : [],
    materialReceipts: Array.isArray(raw.materialReceipts) ? raw.materialReceipts : [],
    teamMembers: Array.isArray(raw.teamMembers) ? raw.teamMembers : [],
    teamAssignments: Array.isArray(raw.teamAssignments) ? raw.teamAssignments : [],
    machines: Array.isArray(raw.machines) ? raw.machines : [], machineLogs: Array.isArray(raw.machineLogs) ? raw.machineLogs : [] };
}
export function serializeLocalProject(project: LocalProject) { return JSON.stringify(project, null, 2); }
export function parseLocalBackup(text: string): LocalProject { const parsed: unknown = JSON.parse(text); if (!parsed || typeof parsed !== "object") throw new Error("Arquivo de backup inválido"); const candidate = parsed as Partial<LocalProject>; if (!Array.isArray(candidate.fronts) || !Array.isArray(candidate.actions) || !Array.isArray(candidate.events) || !Array.isArray(candidate.diaries)) throw new Error("Backup incompleto: fronts, actions, events e diaries são obrigatórios"); return normalizeProject(candidate); }
function load(): LocalProject { try { const raw = localStorage.getItem(KEY); return raw ? normalizeProject(JSON.parse(raw) as Partial<LocalProject>) : seed; } catch { return seed; } }
export function useLocalProject() {
  const [project, setProject] = useState<LocalProject>(load); const [syncStatus, setSyncStatus] = useState<"local" | "syncing" | "synced" | "offline">("local"); const syncUserId = useRef<string | null>(null); const hydrated = useRef(false); const syncing = useRef(false); const projectRef = useRef(project); projectRef.current = project;
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(project)); }, [project]);
  const syncNow = useCallback(async () => { try { const user = await getCurrentUser(); hydrated.current = true; if (!user) { syncUserId.current = null; setSyncStatus("local"); return; } syncUserId.current = user.id; setSyncStatus("syncing"); const remote = await readRemoteSnapshot(user.id); if (remote) setProject(normalizeProject(remote.project)); else await writeRemoteSnapshot(user.id, projectRef.current); setSyncStatus("synced"); } catch { hydrated.current = true; setSyncStatus("offline"); } }, []);
  useEffect(() => { void syncNow(); const refresh = () => { void syncNow(); }; const { data } = supabase.auth.onAuthStateChange(refresh); window.addEventListener("focus", refresh); window.addEventListener("online", refresh); return () => { data.subscription.unsubscribe(); window.removeEventListener("focus", refresh); window.removeEventListener("online", refresh); }; }, [syncNow]);
  useEffect(() => { if (!hydrated.current || !syncUserId.current || syncing.current) return; syncing.current = true; setSyncStatus("syncing"); void writeRemoteSnapshot(syncUserId.current, project).then(() => setSyncStatus("synced")).catch(() => setSyncStatus("offline")).finally(() => { syncing.current = false; }); }, [project]);
  const update = useCallback((fn: (current: LocalProject) => LocalProject) => { setProject((current) => fn(current)); }, []);
  const updateProject = useCallback((changes: Pick<LocalProject, "name" | "location" | "status" | "description">) => update((current) => ({ ...current, ...changes })), [update]);
  const addDiary = useCallback((entry: Omit<LocalDiary, "id">) => update((current) => ({ ...current, diaries: [{ ...entry, id: makeId("diary") }, ...current.diaries], fronts: current.fronts.map((front) => front.id !== entry.frontId ? front : { ...front, ...applyProduction(front, entry.production) }) })), [update]);
  const updateDiary = useCallback((id: string, entry: Omit<LocalDiary, "id">) => update((current) => { const oldDiary = current.diaries.find((diary) => diary.id === id); if (!oldDiary) return current; let fronts = current.fronts.map((front) => front.id === oldDiary.frontId ? { ...front, ...removeProduction(front, oldDiary.production) } : front); fronts = fronts.map((front) => front.id === entry.frontId ? { ...front, ...applyProduction(front, entry.production) } : front); return { ...current, diaries: current.diaries.map((diary) => diary.id === id ? { ...entry, id } : diary), fronts }; }), [update]);
  const deleteDiary = useCallback((id: string) => update((current) => { const diary = current.diaries.find((item) => item.id === id); if (!diary) return current; return { ...current, diaries: current.diaries.filter((item) => item.id !== id), fronts: current.fronts.map((front) => front.id === diary.frontId ? { ...front, ...removeProduction(front, diary.production) } : front) }; }), [update]);
  const addEvent = useCallback((event: Omit<LocalEvent, "id">) => update((current) => ({ ...current, events: [{ ...event, id: makeId("event") }, ...current.events] })), [update]);
  const setEventStatus = useCallback((id: string, status: LocalEventStatus) => update((current) => ({ ...current, events: current.events.map((event) => event.id === id ? { ...event, status } : event) })), [update]);
  const addAction = useCallback((action: Omit<LocalAction, "id">) => update((current) => ({ ...current, actions: [{ ...action, id: makeId("action") }, ...current.actions] })), [update]);
  const updateAction = useCallback((id: string, changes: Partial<Pick<LocalAction, "owner" | "due" | "priority" | "frontId" | "eventId">>) => update((current) => ({ ...current, actions: current.actions.map((action) => action.id === id ? { ...action, ...changes } : action) })), [update]);
  const replaceProject = useCallback((next: LocalProject) => setProject(normalizeProject(next)), []);
  const toggleAction = useCallback((id: string) => update((current) => ({ ...current, actions: current.actions.map((action) => action.id === id ? { ...action, done: !action.done } : action) })), [update]);
  const addFront = useCallback((front: Omit<LocalFront, "id">) => update((current) => ({ ...current, fronts: [...current.fronts, { ...front, id: makeId("front") }] })), [update]);
  const addService = useCallback((frontId: string, service: string) => update((current) => ({ ...current, fronts: current.fronts.map((front) => front.id === frontId && !front.services.some((item) => sameLabel(item, service)) ? { ...front, services: [...front.services, service] } : front) })), [update]);
  const upsertWeeklyTarget = useCallback((target: Omit<LocalWeeklyTarget, "id">) => update((current) => { const existing = current.weeklyTargets.find((item) => item.frontId === target.frontId && item.weekEnd === target.weekEnd); return { ...current, weeklyTargets: existing ? current.weeklyTargets.map((item) => item.id === existing.id ? { ...item, ...target } : item) : [...current.weeklyTargets, { ...target, id: makeId("weekly-target") }] }; }), [update]);
  const deleteWeeklyTarget = useCallback((id: string) => update((current) => ({ ...current, weeklyTargets: current.weeklyTargets.filter((item) => item.id !== id) })), [update]);
  const addMaterialReceipt = useCallback((receipt: Omit<LocalMaterialReceipt, "id">) => update((current) => ({ ...current, materialReceipts: [{ ...receipt, id: makeId("material") }, ...current.materialReceipts] })), [update]);
  const addTeamMember = useCallback((member: Omit<LocalTeamMember, "id">) => update((current) => ({ ...current, teamMembers: [...current.teamMembers, { ...member, id: makeId("team-member") }] })), [update]);
  const upsertTeamAssignment = useCallback((assignment: Omit<LocalTeamAssignment, "id">) => update((current) => { const existing = current.teamAssignments.find((item) => item.memberId === assignment.memberId && item.date === assignment.date); return { ...current, teamAssignments: existing ? current.teamAssignments.map((item) => item.id === existing.id ? { ...item, ...assignment } : item) : [{ ...assignment, id: makeId("team-assignment") }, ...current.teamAssignments] }; }), [update]);
  const addMachine = useCallback((machine: Omit<LocalMachine, "id">) => update((current) => ({ ...current, machines: [...current.machines, { ...machine, id: makeId("machine") }] })), [update]);
  const upsertMachineLog = useCallback((log: Omit<LocalMachineLog, "id">) => update((current) => { const existing = current.machineLogs.find((item) => item.machineId === log.machineId && item.date === log.date); return { ...current, machineLogs: existing ? current.machineLogs.map((item) => item.id === existing.id ? { ...item, ...log } : item) : [{ ...log, id: makeId("machine-log") }, ...current.machineLogs] }; }), [update]);
  return { project, syncStatus, syncNow, updateProject, addDiary, updateDiary, deleteDiary, addEvent, setEventStatus, addAction, updateAction, replaceProject, toggleAction, addFront, addService, upsertWeeklyTarget, deleteWeeklyTarget, addMaterialReceipt, addTeamMember, upsertTeamAssignment, addMachine, upsertMachineLog };
}

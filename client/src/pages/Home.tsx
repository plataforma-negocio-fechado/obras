import { useMemo, useState } from "react";
import { AlertTriangle, ArrowUpRight, CalendarDays, Check, ClipboardList, FileText, PackageCheck, Plus, Wrench, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLocalProject, type LocalEvent, type LocalPriority } from "@/localStore";
import { usePilotLocation } from "@/pilotRouting";
import { getOperationalAttention } from "@/operationalInsights";
import { addMemoryEvent, useOperationalMemory } from "@/operationalMemory";

type RegisterKind = "produção" | "material" | "custo" | "máquina" | "ocorrência" | "ação" | "diário";
const meta: Record<RegisterKind, { label: string; description: string; icon: React.ReactNode }> = {
  produção: { label: "Produção", description: "O que foi executado", icon: <ClipboardList className="h-4 w-4" /> },
  material: { label: "Material", description: "Recebimento ou consumo", icon: <PackageCheck className="h-4 w-4" /> },
  custo: { label: "Custo", description: "Despesa ou pagamento", icon: <FileText className="h-4 w-4" /> },
  máquina: { label: "Máquina", description: "Uso, parada ou manutenção", icon: <Wrench className="h-4 w-4" /> },
  ocorrência: { label: "Ocorrência", description: "Problema ou impedimento", icon: <AlertTriangle className="h-4 w-4" /> },
  ação: { label: "Ação", description: "Algo que precisa acontecer", icon: <Check className="h-4 w-4" /> },
  diário: { label: "Diário", description: "Resumo do dia", icon: <CalendarDays className="h-4 w-4" /> },
};
function Kicker({ children }: { children: React.ReactNode }) { return <p className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-[#737a7b]">{children}</p>; }
function dateLabel(value: string) { return new Date(value).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }); }
function RegisterPanel({ kind, onClose, onCreate }: { kind: RegisterKind; onClose: () => void; onCreate: (title: string, description: string) => void }) {
  const [title, setTitle] = useState(""); const [description, setDescription] = useState("");
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-brand-navy/30 p-3 sm:items-center"><Card className="w-full max-w-2xl border-brand bg-white shadow-[8px_8px_0_#d7d0c4]"><CardContent className="p-5 sm:p-7"><div className="flex items-start justify-between"><div><Kicker>Novo evento · {meta[kind].label}</Kicker><h2 className="mt-1 font-display text-3xl font-semibold text-brand-navy">Registrar informação</h2><p className="mt-2 text-sm text-[#737a7b]">O registro ficará disponível no histórico operacional.</p></div><Button variant="outline" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button></div><div className="mt-5 space-y-3"><Input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder={kind === "produção" ? "Ex.: Executamos 150 m de drenagem" : `Título do registro de ${meta[kind].label.toLowerCase()}`} className="h-12" /><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Quantidade, local, contexto, decisão ou observação..." className="min-h-[130px]" /></div><div className="mt-5 flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Cancelar</Button><Button disabled={!title.trim()} onClick={() => { onCreate(title.trim(), description.trim()); onClose(); }} className="bg-brand-navy text-white"><Plus className="mr-2 h-4 w-4" />Registrar</Button></div></CardContent></Card></div>;
}

export default function Home() {
  const [, navigate] = usePilotLocation();
  const { project, addEvent } = useLocalProject();
  const memory = useOperationalMemory();
  const [registerKind, setRegisterKind] = useState<RegisterKind | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);
  const todayLocal = project.events.filter((event) => event.date.slice(0, 10) === today);
  const attention = useMemo(() => getOperationalAttention(project).slice(0, 3), [project]);
  const pending = project.actions.filter((action) => !action.done).length;
  const openIssues = project.events.filter((event) => event.status !== "Resolvido").length;
  const activeFronts = project.fronts.filter((front) => front.progress > 0 && front.progress < 100).length;
  const recent = [...memory.map((event) => ({ id: event.id, title: event.title, description: event.summary, date: event.createdAt, kind: event.type, source: event.source, evidence: event.evidence.length })), ...project.events.map((event) => ({ id: event.id, title: event.title, description: event.description, date: event.date, kind: "evento", source: "web", evidence: 0 }))].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);
  const selectedMemory = memory.find((event) => event.id === selected) ?? null;

  const create = (kind: RegisterKind, title: string, description: string) => {
    const priority: LocalPriority = kind === "ocorrência" ? "Alta" : "Baixa";
    const event: Omit<LocalEvent, "id"> = { title: `${meta[kind].label}: ${title}`, description: description || `Registro direto de ${meta[kind].label.toLowerCase()}.`, date: new Date().toISOString(), impact: "A avaliar", decision: "A definir", priority, status: kind === "ocorrência" ? "Aberto" : "Resolvido" };
    addEvent(event);
    addMemoryEvent({ type: kind, title: event.title, summary: event.description, source: "web", confirmed: true, evidence: [] });
  };

  return <main className="min-h-screen bg-brand-cream px-4 py-6 sm:px-7 lg:px-10 lg:py-8"><div className="mx-auto max-w-6xl">
    <header className="mb-6 flex flex-col gap-5 border-b border-black/10 pb-5 lg:flex-row lg:items-end lg:justify-between"><div><Kicker>Memória operacional da obra</Kicker><h1 className="mt-2 font-display text-5xl font-semibold leading-[.9] tracking-tight text-brand-navy">{project.name}</h1><p className="mt-3 text-sm text-[#737a7b]">{project.location}<span className="mx-2">·</span><span className="font-semibold">{project.status}</span></p></div><div className="flex gap-2"><Button variant="outline" onClick={() => navigate("/planejamento")}><CalendarDays className="mr-2 h-4 w-4" />Planejamento</Button><Button onClick={() => setRegisterKind("produção")} className="bg-brand-navy text-white"><Plus className="mr-2 h-4 w-4" />Registrar</Button></div></header>

    <section className="grid gap-3 sm:grid-cols-4">{[["Eventos hoje", todayLocal.length, "Registros na obra"], ["Em tratamento", openIssues, "Ocorrências abertas"], ["Ações", pending, "Pendências"], ["Frentes", activeFronts, "Em andamento"]].map(([label, value, detail]) => <Card key={String(label)} className="border-brand bg-white shadow-[4px_4px_0_#d7d0c4]"><CardContent className="p-4 sm:p-5"><Kicker>{String(label)}</Kicker><p className="mt-2 text-3xl font-semibold tracking-tight text-brand-navy">{String(value).padStart(2, "0")}</p><p className="mt-1 text-xs text-[#737a7b]">{String(detail)}</p></CardContent></Card>)}</section>

    <section className="mt-7"><div className="mb-3 flex items-end justify-between"><div><Kicker>Leitura operacional</Kicker><h2 className="mt-1 font-display text-3xl font-semibold text-brand-navy">O que pede atenção</h2></div><span className="text-xs text-[#858b8b]">Contexto + histórico</span></div>{attention.length ? <div className="grid gap-3 md:grid-cols-3">{attention.map((item) => <button key={item.id} type="button" onClick={() => navigate(item.path)} className="rounded-[.9rem] border border-[#e1d8d1] border-l-4 border-l-[#d89b45] bg-white p-4 text-left shadow-[4px_4px_0_#d7d0c4]"><div className="flex justify-between"><span className="text-2xl font-semibold text-brand-navy">{String(item.count).padStart(2, "0")}</span><ArrowUpRight className="h-4 w-4 text-[#858b8b]" /></div><h3 className="mt-3 text-xs font-bold uppercase tracking-wide text-brand-navy">{item.label}</h3><p className="mt-1 text-xs leading-5 text-[#737a7b]">{item.description}</p></button>)}</div> : <Card className="border-brand bg-white"><CardContent className="flex items-center gap-3 p-5"><Check className="h-5 w-5" />Nada crítico identificado.</CardContent></Card>}</section>

    <div className="mt-7 grid gap-6 lg:grid-cols-[1.35fr_.65fr]"><section><div className="mb-3 flex items-end justify-between"><div><Kicker>Memória</Kicker><h2 className="mt-1 font-display text-3xl font-semibold text-brand-navy">Atividade recente</h2></div><Button variant="ghost" onClick={() => navigate("/timeline")}>Ver histórico <ArrowUpRight className="ml-2 h-4 w-4" /></Button></div><Card className="border-brand bg-white shadow-[4px_4px_0_#d7d0c4]"><CardContent className="p-0">{recent.length ? <div className="divide-y divide-black/10">{recent.map((event) => <button key={`${event.source}-${event.id}`} type="button" onClick={() => event.source === "campo" ? setSelected(event.id) : undefined} className="flex w-full items-start gap-4 p-4 text-left hover:bg-[#F5F1E9]/60"><span className="mt-1 grid h-9 w-9 shrink-0 place-items-center bg-[#F5F1E9] text-brand-navy">{event.source === "campo" ? <MicIcon /> : <ClipboardList className="h-4 w-4" />}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-wide text-[#858b8b]"><span>{event.kind}</span><span>·</span><span>{dateLabel(event.date)}</span>{event.evidence > 0 && <><span>·</span><span>{event.evidence} evidência(s)</span></>}</div><h3 className="mt-1 text-sm font-bold text-brand-navy">{event.title}</h3><p className="mt-1 line-clamp-2 text-xs leading-5 text-[#737a7b]">{event.description}</p></div></button>)}</div> : <div className="p-6 text-sm text-[#737a7b]">Nenhum evento registrado ainda.</div>}</CardContent></Card></section>

    <section><div className="mb-3"><Kicker>Planejamento</Kicker><h2 className="mt-1 font-display text-3xl font-semibold text-brand-navy">Esta semana</h2></div><Card className="border-brand bg-white shadow-[4px_4px_0_#d7d0c4]"><CardContent className="p-5"><div className="space-y-4">{project.weeklyTargets.slice(-4).map((target) => { const front = project.fronts.find((item) => item.id === target.frontId); return <div key={target.id}><div className="flex justify-between gap-3"><span className="text-xs font-bold text-brand-navy">{front?.name ?? "Frente"}</span><span className="text-xs text-[#737a7b]">Meta {target.planned} {front?.unit ?? "un"}</span></div><div className="mt-2 h-2 bg-[#dedfd9]"><div className="h-2 bg-[#8da65a]" style={{ width: `${front && front.planned ? Math.min(100, Math.round((front.executed / target.planned) * 100)) : 0}%` }} /></div></div>; })}{project.weeklyTargets.length === 0 && <p className="text-sm leading-6 text-[#737a7b]">Nenhuma meta semanal definida.</p>}<Button variant="outline" className="w-full" onClick={() => navigate("/planejamento")}>Abrir planejamento semanal</Button></div></CardContent></Card></section></div>

    <section className="mt-7"><div className="mb-3"><Kicker>Entrada direta</Kicker><h2 className="mt-1 font-display text-3xl font-semibold text-brand-navy">Registrar sem formulário longo</h2></div><div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">{(Object.keys(meta) as RegisterKind[]).map((kind) => <button key={kind} type="button" onClick={() => setRegisterKind(kind)} className="rounded-[.9rem] border border-brand bg-white p-4 text-left shadow-[4px_4px_0_#d7d0c4] hover:-translate-y-0.5"><span className="grid h-8 w-8 place-items-center bg-[#F5F1E9] text-brand-navy">{meta[kind].icon}</span><h3 className="mt-3 text-xs font-bold uppercase tracking-wide text-brand-navy">{meta[kind].label}</h3><p className="mt-1 text-xs text-[#737a7b]">{meta[kind].description}</p></button>)}</div></section>

    {registerKind && <RegisterPanel kind={registerKind} onClose={() => setRegisterKind(null)} onCreate={(title, description) => create(registerKind, title, description)} />}
    {selectedMemory && <div className="fixed inset-0 z-50 flex items-end justify-center bg-brand-navy/30 p-3 sm:items-center"><Card className="w-full max-w-2xl border-brand bg-white shadow-[8px_8px_0_#d7d0c4]"><CardContent className="p-6"><div className="flex justify-between gap-4"><div><Kicker>Evento confirmado · Campo</Kicker><h2 className="mt-1 font-display text-3xl font-semibold text-brand-navy">{selectedMemory.title}</h2></div><Button variant="outline" size="icon" onClick={() => setSelected(null)}><X className="h-4 w-4" /></Button></div><p className="mt-4 text-sm leading-6 text-[#555d5f]">{selectedMemory.summary}</p><div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-lg bg-[#F5F1E9] p-3"><Kicker>Origem</Kicker><p className="mt-1 text-sm font-semibold">Campo</p></div><div className="rounded-lg bg-[#F5F1E9] p-3"><Kicker>Confirmação</Kicker><p className="mt-1 text-sm font-semibold">Humana</p></div><div className="rounded-lg bg-[#F5F1E9] p-3"><Kicker>Evidências</Kicker><p className="mt-1 text-sm font-semibold">{selectedMemory.evidence.length} arquivo(s)</p></div></div><div className="mt-5 space-y-2">{selectedMemory.evidence.map((item) => <div key={item.id} className="rounded-lg border border-black/10 p-3 text-xs"><b>{item.type}</b> · {item.name}</div>)}</div></CardContent></Card></div>}
  </div></main>;
}
function MicIcon() { return <span className="text-sm">🎙</span>; }

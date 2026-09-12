import { useMemo, useState } from "react";
import { AlertTriangle, ArrowUpRight, Camera, Check, CircleDot, ClipboardList, FileText, PackageCheck, Plus, Wrench, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLocalProject, type LocalEvent, type LocalPriority } from "@/localStore";
import { usePilotLocation } from "@/pilotRouting";
import { getOperationalAttention } from "@/operationalInsights";

type RegisterKind = "produção" | "material" | "custo" | "máquina" | "ocorrência" | "ação" | "diário";

const Kicker = ({ children }: { children: React.ReactNode }) => <p className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-[#737a7b]">{children}</p>;

const kindMeta: Record<RegisterKind, { label: string; description: string; icon: React.ReactNode }> = {
  produção: { label: "Produção", description: "O que foi executado", icon: <ClipboardList className="h-4 w-4" /> },
  material: { label: "Material", description: "Recebimento ou consumo", icon: <PackageCheck className="h-4 w-4" /> },
  custo: { label: "Custo", description: "Despesa ou pagamento", icon: <FileText className="h-4 w-4" /> },
  máquina: { label: "Máquina", description: "Uso, parada ou manutenção", icon: <Wrench className="h-4 w-4" /> },
  ocorrência: { label: "Ocorrência", description: "Problema ou impedimento", icon: <AlertTriangle className="h-4 w-4" /> },
  ação: { label: "Ação", description: "Algo que precisa acontecer", icon: <CircleDot className="h-4 w-4" /> },
  diário: { label: "Diário", description: "Resumo do dia", icon: <ClipboardList className="h-4 w-4" /> },
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function eventKind(title: string) {
  const value = title.toLowerCase();
  if (value.includes("produção") || value.includes("execução")) return "Produção";
  if (value.includes("material") || value.includes("brita")) return "Material";
  if (value.includes("custo") || value.includes("abastecimento") || value.includes("pagamento")) return "Custo";
  if (value.includes("máquina") || value.includes("pc") || value.includes("equipamento")) return "Máquina";
  if (value.includes("ação")) return "Ação";
  return "Ocorrência";
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <Card className="rounded-[1rem] border border-brand bg-white shadow-[4px_4px_0_#d7d0c4]"><CardContent className="p-4 sm:p-5"><Kicker>{label}</Kicker><p className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-brand-navy">{value}</p><p className="mt-1 text-xs text-[#737a7b]">{detail}</p></CardContent></Card>;
}

function RegisterPanel({ onClose, onCreate }: { onClose: () => void; onCreate: (kind: RegisterKind, title: string, description: string) => void }) {
  const [kind, setKind] = useState<RegisterKind>("produção");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const submit = () => {
    if (!title.trim()) return;
    onCreate(kind, title.trim(), description.trim());
    onClose();
  };
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-brand-navy/30 p-3 sm:items-center"><Card className="w-full max-w-2xl rounded-[1.25rem] border border-brand bg-white shadow-[8px_8px_0_#d7d0c4]"><CardContent className="p-5 sm:p-7">
    <div className="flex items-start justify-between gap-4"><div><Kicker>Novo evento da obra</Kicker><h2 className="mt-1 font-display text-3xl font-semibold text-brand-navy">O que aconteceu?</h2><p className="mt-2 text-sm text-[#737a7b]">Tudo que for registrado aqui vira parte da memória da obra.</p></div><Button variant="outline" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button></div>
    <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">{(Object.keys(kindMeta) as RegisterKind[]).map((item) => <button key={item} type="button" onClick={() => setKind(item)} className={`rounded-lg border p-3 text-left transition ${kind === item ? "border-brand-navy bg-brand-navy text-white" : "border-black/10 bg-[#F5F1E9] text-brand-navy"}`}><span className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.06em]">{kindMeta[item].icon}{kindMeta[item].label}</span><span className={`mt-1 block text-[10px] ${kind === item ? "text-white/65" : "text-[#737a7b]"}`}>{kindMeta[item].description}</span></button>)}</div>
    <div className="mt-5 space-y-3"><Input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder={kind === "produção" ? "Ex.: Executamos 150 m de drenagem" : `Título do registro de ${kind}`} className="h-12 border-brand/20 bg-[#F5F1E9]/50" /><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Contexto, quantidade, local, decisão, observação..." className="min-h-[120px] border-brand/20 bg-[#F5F1E9]/50" /></div>
    <div className="mt-5 flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Cancelar</Button><Button disabled={!title.trim()} onClick={submit} className="bg-brand-navy text-white hover:bg-[#123d57]"><Check className="mr-2 h-4 w-4" />Registrar evento</Button></div>
  </CardContent></Card></div>;
}

export default function Home() {
  const [, navigate] = usePilotLocation();
  const { project, addEvent } = useLocalProject();
  const [registerOpen, setRegisterOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);
  const todayEvents = project.events.filter((event) => event.date.slice(0, 10) === today);
  const openIssues = project.events.filter((event) => event.status !== "Resolvido");
  const pendingActions = project.actions.filter((action) => !action.done);
  const activeFronts = project.fronts.filter((front) => front.progress > 0 && front.progress < 100).slice(0, 4);
  const attention = useMemo(() => getOperationalAttention(project).slice(0, 3), [project]);
  const recentEvents = project.events.slice(0, 8);
  const selectedEvent = project.events.find((event) => event.id === selectedEventId) ?? null;

  const createEvent = (kind: RegisterKind, title: string, description: string) => {
    const priority: LocalPriority = kind === "ocorrência" ? "Alta" : "Baixa";
    const event: Omit<LocalEvent, "id"> = {
      title: `${kindMeta[kind].label}: ${title}`,
      description: description || `Registro direto de ${kindMeta[kind].label.toLowerCase()} feito pela plataforma.`,
      date: new Date().toISOString(),
      impact: "A avaliar",
      decision: "A definir",
      priority,
      status: kind === "ocorrência" ? "Aberto" : "Resolvido",
    };
    addEvent(event);
  };

  return <main className="min-h-screen bg-brand-cream px-4 py-6 sm:px-7 lg:px-10 lg:py-8"><div className="mx-auto max-w-6xl">
    <header className="mb-6 border-b border-black/10 pb-5"><div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><Kicker>Memória operacional da obra</Kicker><h1 className="mt-2 font-display text-5xl font-semibold leading-[0.88] tracking-tight text-brand-navy sm:text-6xl">{project.name}</h1><p className="mt-3 text-sm text-[#737a7b]">{project.location}<span className="mx-2">·</span><span className="font-semibold text-[#789249]">{project.status}</span></p></div><Button onClick={() => setRegisterOpen(true)} className="h-12 rounded-lg bg-brand-navy px-5 text-xs font-bold uppercase tracking-[0.14em] text-white hover:bg-[#123d57]"><Plus className="mr-2 h-4 w-4" />Registrar</Button></div></header>

    <section className="grid gap-3 sm:grid-cols-4"><Metric label="Eventos hoje" value={String(todayEvents.length).padStart(2, "0")} detail="Informações registradas" /><Metric label="Em tratamento" value={String(openIssues.length).padStart(2, "0")} detail="Ocorrências abertas" /><Metric label="Ações" value={String(pendingActions.length).padStart(2, "0")} detail="Pendências" /><Metric label="Frentes" value={String(activeFronts.length).padStart(2, "0")} detail="Em andamento" /></section>

    <section className="mt-7"><div className="mb-3 flex items-end justify-between"><div><Kicker>Leitura operacional</Kicker><h2 className="mt-1 font-display text-3xl font-semibold leading-none text-brand-navy">O que pede atenção</h2></div><span className="text-xs text-[#858b8b]">Contexto + histórico</span></div>{attention.length ? <div className="grid gap-3 md:grid-cols-3">{attention.map((item) => <button key={item.id} type="button" onClick={() => navigate(item.path)} className="min-h-28 rounded-[.9rem] border border-[#e1d8d1] border-l-4 border-l-[#d89b45] bg-white p-4 text-left shadow-[4px_4px_0_#d7d0c4]"><div className="flex justify-between"><span className="text-2xl font-semibold text-brand-navy">{String(item.count).padStart(2, "0")}</span><ArrowUpRight className="h-4 w-4 text-[#858b8b]" /></div><h3 className="mt-3 text-xs font-bold uppercase tracking-[0.08em] text-brand-navy">{item.label}</h3><p className="mt-1 text-xs leading-5 text-[#737a7b]">{item.description}</p></button>)}</div> : <Card className="border-brand bg-white"><CardContent className="flex items-center gap-3 p-5"><Check className="h-5 w-5 text-[#789249]" />Nada crítico identificado.</CardContent></Card>}</section>

    <div className="mt-7 grid gap-6 lg:grid-cols-[1.35fr_.65fr]"><section><div className="mb-3 flex items-end justify-between"><div><Kicker>Histórico</Kicker><h2 className="mt-1 font-display text-3xl font-semibold leading-none text-brand-navy">Atividade recente</h2></div><Button variant="ghost" onClick={() => navigate("/timeline")} className="text-xs font-semibold text-brand-navy">Ver tudo <ArrowUpRight className="ml-2 h-4 w-4" /></Button></div><Card className="rounded-[1rem] border border-brand bg-white shadow-[4px_4px_0_#d7d0c4]"><CardContent className="p-0">{recentEvents.length ? <div className="divide-y divide-black/10">{recentEvents.map((event) => <button key={event.id} type="button" onClick={() => setSelectedEventId(event.id)} className="flex w-full items-start gap-4 p-4 text-left transition hover:bg-[#F5F1E9]/60 sm:p-5"><span className="mt-1 grid h-9 w-9 shrink-0 place-items-center bg-[#F5F1E9] text-brand-navy"><ClipboardList className="h-4 w-4" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><Kicker>{eventKind(event.title)}</Kicker><span className="text-[10px] text-[#858b8b]">{formatDate(event.date)}</span></div><h3 className="mt-1 text-sm font-bold text-brand-navy">{event.title}</h3><p className="mt-1 line-clamp-2 text-xs leading-5 text-[#737a7b]">{event.description}</p></div><ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-[#858b8b]" /></button>)}</div> : <div className="p-6 text-sm text-[#737a7b]">A obra ainda não tem eventos. Use <b>Registrar</b> para criar o primeiro.</div>}</CardContent></Card></section>

    <section><div className="mb-3"><Kicker>Frentes</Kicker><h2 className="mt-1 font-display text-3xl font-semibold leading-none text-brand-navy">Onde acompanhar</h2></div><div className="space-y-3">{activeFronts.map((front) => <Card key={front.id} className="rounded-[1rem] border border-brand bg-white shadow-[4px_4px_0_#d7d0c4]"><CardContent className="p-4"><div className="flex justify-between gap-3"><div><Kicker>{front.code}</Kicker><h3 className="mt-1 text-xs font-bold uppercase tracking-[0.06em] text-brand-navy">{front.name}</h3></div><span className="text-xl font-semibold text-brand-navy">{front.progress}%</span></div><p className="mt-2 text-xs leading-5 text-[#737a7b]">{front.detail}</p></CardContent></Card>)}{!activeFronts.length && <Card><CardContent className="p-5 text-sm text-[#737a7b]">Nenhuma frente em andamento.</CardContent></Card>}</div></section></div>

    <section className="mt-7"><div className="mb-3 flex items-end justify-between"><div><Kicker>Entrada direta</Kicker><h2 className="mt-1 font-display text-3xl font-semibold leading-none text-brand-navy">Registrar sem formulário longo</h2></div><span className="text-xs text-[#858b8b]">Cada registro vira evento</span></div><div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">{(Object.keys(kindMeta) as RegisterKind[]).map((kind) => <button key={kind} type="button" onClick={() => setRegisterOpen(true)} className="rounded-[.9rem] border border-brand bg-white p-4 text-left shadow-[4px_4px_0_#d7d0c4] transition hover:-translate-y-0.5"><span className="grid h-8 w-8 place-items-center bg-[#F5F1E9] text-brand-navy">{kindMeta[kind].icon}</span><h3 className="mt-3 text-xs font-bold uppercase tracking-[0.08em] text-brand-navy">{kindMeta[kind].label}</h3><p className="mt-1 text-xs text-[#737a7b]">{kindMeta[kind].description}</p></button>)}</div></section>

    {selectedEvent && <div className="fixed inset-0 z-40 flex items-end justify-center bg-brand-navy/25 p-3 sm:items-center"><Card className="w-full max-w-2xl rounded-[1.25rem] border border-brand bg-white shadow-[8px_8px_0_#d7d0c4]"><CardContent className="p-5 sm:p-7"><div className="flex items-start justify-between gap-4"><div><Kicker>{eventKind(selectedEvent.title)} · {formatDate(selectedEvent.date)}</Kicker><h2 className="mt-2 font-display text-3xl font-semibold text-brand-navy">{selectedEvent.title}</h2></div><Button variant="outline" size="icon" onClick={() => setSelectedEventId(null)}><X className="h-4 w-4" /></Button></div><div className="mt-5 space-y-4"><div><Kicker>Resumo</Kicker><p className="mt-1 text-sm leading-6 text-[#50585a]">{selectedEvent.description}</p></div><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-lg bg-[#F5F1E9] p-3"><Kicker>Status</Kicker><p className="mt-1 text-sm font-semibold text-brand-navy">{selectedEvent.status}</p></div><div className="rounded-lg bg-[#F5F1E9] p-3"><Kicker>Prioridade</Kicker><p className="mt-1 text-sm font-semibold text-brand-navy">{selectedEvent.priority}</p></div><div className="rounded-lg bg-[#F5F1E9] p-3"><Kicker>Origem</Kicker><p className="mt-1 text-sm font-semibold text-brand-navy">Registro direto</p></div></div><div><Kicker>Impacto</Kicker><p className="mt-1 text-sm text-[#50585a]">{selectedEvent.impact}</p></div><div><Kicker>Decisão</Kicker><p className="mt-1 text-sm text-[#50585a]">{selectedEvent.decision}</p></div></div></CardContent></Card></div>}

    {registerOpen && <RegisterPanel onClose={() => setRegisterOpen(false)} onCreate={createEvent} />}
  </div></main>;
}

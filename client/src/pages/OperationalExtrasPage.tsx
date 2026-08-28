import { useMemo, useState } from "react";
import { useLocalProject, type LocalPriority } from "@/localStore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Check, Plus, Search, SlidersHorizontal, Wrench } from "lucide-react";
import { toast } from "sonner";

type Props = { mode: "frentes" | "eventos" | "timeline" };
type StatusFilter = "Todos" | "Abertas" | "Concluídas";

const Kicker = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#71756f]">{children}</p>
);

const priorities: LocalPriority[] = ["Crítica", "Alta", "Média", "Baixa"];

function formatDate(value: string) {
  if (value === "A definir") return "Sem prazo";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("pt-BR");
}

function priorityClass(priority: LocalPriority) {
  if (priority === "Crítica") return "bg-[#c95a4a] text-white";
  if (priority === "Alta") return "bg-[#d89b45] text-white";
  return "bg-[#dedfda] text-[#555b53]";
}

export default function OperationalExtrasPage({ mode }: Props) {
  const { project, addAction, toggleAction, addEvent, setEventStatus, addService } = useLocalProject();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("Todos");
  const [showForm, setShowForm] = useState(false);
  const [frontId, setFrontId] = useState(project.fronts[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [owner, setOwner] = useState("");
  const [due, setDue] = useState("");
  const [priority, setPriority] = useState<LocalPriority>("Alta");
  const [serviceDraft, setServiceDraft] = useState<Record<string, string>>({});
  const [eventDescription, setEventDescription] = useState("");
  const [eventImpact, setEventImpact] = useState("");
  const [eventDecision, setEventDecision] = useState("");

  const filteredFronts = useMemo(() => project.fronts.filter((front) =>
    `${front.name} ${front.code} ${front.status} ${front.detail}`.toLowerCase().includes(query.toLowerCase())
  ), [project.fronts, query]);

  const filteredActions = useMemo(() => project.actions.filter((action) => {
    const matchesQuery = `${action.title} ${action.owner} ${action.priority}`.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = statusFilter === "Todos" || (statusFilter === "Concluídas" ? action.done : !action.done);
    return matchesQuery && matchesStatus;
  }), [project.actions, query, statusFilter]);

  const filteredEvents = useMemo(() => project.events.filter((event) =>
    `${event.title} ${event.description} ${event.impact} ${event.decision} ${event.status}`.toLowerCase().includes(query.toLowerCase())
  ), [project.events, query]);

  const timeline = useMemo(() => [
    ...project.diaries.map((diary) => ({ id: `d-${diary.id}`, date: diary.date, label: "Diário de obra", text: `${diary.service}: ${diary.summary}`, meta: `${diary.production} ${project.fronts.find((front) => front.id === diary.frontId)?.unit ?? "un"}`, color: "bg-[#8da65a]" })),
    ...project.events.map((event) => ({ id: `e-${event.id}`, date: event.date, label: `Evento · ${event.status}`, text: `${event.title}: ${event.impact}`, meta: event.priority, color: "bg-[#d89b45]" })),
    ...project.actions.map((action) => ({ id: `a-${action.id}`, date: action.due !== "A definir" ? `${action.due}T12:00:00` : "1970-01-01T00:00:00", label: action.done ? "Ação concluída" : "Ação aberta", text: action.title, meta: `${action.owner} · ${action.priority}`, color: action.done ? "bg-[#b8d36a]" : "bg-[#c95a4a]" })),
  ].filter((item) => `${item.label} ${item.text} ${item.meta}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => b.date.localeCompare(a.date)), [project, query]);

  const saveAction = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim()) { toast.error("Informe a ação"); return; }
    addAction({ title: title.trim(), owner: owner.trim() || "Não informado", due: due || "A definir", priority, done: false, frontId: frontId || undefined });
    setTitle(""); setOwner(""); setDue(""); setShowForm(false);
    toast.success("Ação criada com sucesso");
  };

  const saveEvent = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || !eventDescription.trim()) { toast.error("Informe o título e a descrição"); return; }
    addEvent({ title: title.trim(), description: eventDescription.trim(), date: new Date().toISOString(), impact: eventImpact.trim() || "Impacto não informado", decision: eventDecision.trim() || "Decisão pendente", priority, status: "Aberto", frontId: frontId || undefined });
    setTitle(""); setEventDescription(""); setEventImpact(""); setEventDecision(""); setShowForm(false);
    toast.success("Evento registrado");
  };

  if (mode === "frentes") return (
    <Page title="Frentes de serviço" subtitle="Acompanhe o avanço e os serviços de cada frente." count={`${project.fronts.length} frentes`} query={query} setQuery={setQuery}>
      <div className="grid gap-4 lg:grid-cols-2">
        {filteredFronts.map((front) => (
          <Card key={front.id} className="rounded-none border-0 bg-[#f6f6f3] shadow-[4px_4px_0_#d0d1cb]"><CardContent className="p-5">
            <div className="flex items-start justify-between gap-3"><div><Kicker>{front.code}</Kicker><h2 className="mt-1 text-xl font-black uppercase">{front.name}</h2></div><Badge className="rounded-none bg-[#202321]">{front.status}</Badge></div>
            <p className="mt-3 text-sm text-[#70756e]">{front.detail}</p>
            <div className="mt-5"><div className="flex justify-between text-xs font-bold"><span>Avanço</span><span>{front.progress}%</span></div><div className="mt-2 h-2 bg-[#dedfda]"><div className="h-full bg-[#789249]" style={{ width: `${Math.min(100, Math.max(0, front.progress))}%` }} /></div><p className="mt-2 text-xs text-[#70756e]">{front.executed} / {front.planned} {front.unit}</p></div>
            <div className="mt-5 border-t border-black/10 pt-4"><Kicker>Serviços</Kicker><div className="mt-2 flex flex-wrap gap-2">{front.services.map((service) => <span key={service} className="bg-[#e8e9e4] px-2 py-1 text-xs">{service}</span>)}</div>
              <div className="mt-4 flex gap-2"><Input value={serviceDraft[front.id] ?? ""} onChange={(e) => setServiceDraft((current) => ({ ...current, [front.id]: e.target.value }))} placeholder="Novo serviço" className="bg-white" /><Button type="button" variant="outline" onClick={() => { addService(front.id, serviceDraft[front.id] ?? ""); setServiceDraft((current) => ({ ...current, [front.id]: "" })); }}><Plus className="h-4 w-4" /></Button></div>
            </div>
          </CardContent></Card>
        ))}
      </div>
      {filteredFronts.length === 0 && <Empty text="Nenhuma frente encontrada." />}
    </Page>
  );

  if (mode === "eventos") return (
    <Page title="Eventos e ações" subtitle="Registre ocorrências e acompanhe o plano de ação." count={`${project.events.length} eventos · ${project.actions.length} ações`} query={query} setQuery={setQuery}>
      <div className="mb-6 flex flex-wrap gap-2"><Button onClick={() => setShowForm((value) => !value)} className="bg-[#202321] text-white"><Plus className="mr-2 h-4 w-4" />{showForm ? "Fechar" : "Novo registro"}</Button><Button variant="outline" onClick={() => setStatusFilter("Todos")}>Todas</Button><Button variant="outline" onClick={() => setStatusFilter("Abertas")}>Abertas</Button><Button variant="outline" onClick={() => setStatusFilter("Concluídas")}>Concluídas</Button></div>
      {showForm && <Card className="mb-6 rounded-none border-0 bg-[#f6f6f3] shadow-[4px_4px_0_#d0d1cb]"><CardContent className="grid gap-4 p-5 md:grid-cols-2"><div className="md:col-span-2 flex gap-2"><Button type="button" variant="outline" onClick={() => { setShowForm(true); }}>Evento</Button><Button type="button" variant="outline" onClick={() => { setShowForm(false); setTimeout(() => setShowForm(true), 0); }}>Ação</Button></div><p className="md:col-span-2 text-sm text-[#70756e]">Use os formulários abaixo para registrar um evento ou uma ação.</p>
        <form className="contents" onSubmit={saveEvent}><Input className="md:col-span-2 bg-white" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título do evento" /><Textarea className="md:col-span-2 bg-white" value={eventDescription} onChange={(e) => setEventDescription(e.target.value)} placeholder="Descrição" /><Input className="bg-white" value={eventImpact} onChange={(e) => setEventImpact(e.target.value)} placeholder="Impacto" /><Input className="bg-white" value={eventDecision} onChange={(e) => setEventDecision(e.target.value)} placeholder="Decisão" /><select value={frontId} onChange={(e) => setFrontId(e.target.value)} className="h-10 border border-black/10 bg-white px-3"><option value="">Frente</option>{project.fronts.map((front) => <option key={front.id} value={front.id}>{front.code} · {front.name}</option>)}</select><select value={priority} onChange={(e) => setPriority(e.target.value as LocalPriority)} className="h-10 border border-black/10 bg-white px-3">{priorities.map((item) => <option key={item}>{item}</option>)}</select><Button type="submit" className="bg-[#202321] text-white">Salvar evento</Button></form></CardContent></Card>}
      <div className="grid gap-6 lg:grid-cols-2"><section><Kicker>Ocorrências</Kicker><h2 className="mt-1 text-2xl font-black uppercase">Eventos</h2><div className="mt-4 space-y-3">{filteredEvents.map((event) => <Card key={event.id} className="rounded-none border-0 bg-[#f6f6f3]"><CardContent className="p-5"><div className="flex justify-between gap-3"><h3 className="font-black">{event.title}</h3><Badge className={`rounded-none ${priorityClass(event.priority)}`}>{event.priority}</Badge></div><p className="mt-2 text-sm">{event.description}</p><p className="mt-3 text-xs text-[#70756e]">Status: {event.status}</p><div className="mt-3 flex gap-2"><Button size="sm" variant="outline" onClick={() => setEventStatus(event.id, event.status === "Resolvido" ? "Aberto" : "Resolvido")}>{event.status === "Resolvido" ? "Reabrir" : "Resolver"}</Button></div></CardContent></Card>)}{filteredEvents.length === 0 && <Empty text="Nenhum evento encontrado." />}</div></section>
      <section><Kicker>Plano operacional</Kicker><h2 className="mt-1 text-2xl font-black uppercase">Ações</h2><div className="mt-4 space-y-3">{filteredActions.map((action) => <Card key={action.id} className="rounded-none border-0 bg-[#f6f6f3]"><CardContent className="flex gap-3 p-5"><Button size="icon" variant="outline" onClick={() => { toggleAction(action.id); toast.success(action.done ? "Ação reaberta" : "Ação concluída"); }}><Check className={`h-4 w-4 ${action.done ? "text-[#789249]" : ""}`} /></Button><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><h3 className={action.done ? "font-black line-through text-[#858a82]" : "font-black"}>{action.title}</h3><Badge className={`rounded-none ${priorityClass(action.priority)}`}>{action.priority}</Badge></div><p className="mt-2 text-xs text-[#70756e]">{action.owner} · {formatDate(action.due)}</p></div></CardContent></Card>)}{filteredActions.length === 0 && <Empty text="Nenhuma ação encontrada." />}</div></section></div>
    </Page>
  );

  return (
    <Page title="Linha do tempo" subtitle="Visão cronológica dos principais registros da obra." count={`${timeline.length} registros`} query={query} setQuery={setQuery}>
      <div className="space-y-3">{timeline.map((item) => <Card key={item.id} className="rounded-none border-0 bg-[#f6f6f3] shadow-[4px_4px_0_#d0d1cb]"><CardContent className="flex gap-4 p-5"><div className={`mt-1 h-3 w-3 shrink-0 rounded-full ${item.color}`} /><div><Kicker>{item.date.startsWith("1970") ? "Sem prazo" : formatDate(item.date)} · {item.label}</Kicker><p className="mt-2 text-sm leading-6">{item.text}</p><p className="mt-2 text-[10px] uppercase tracking-[0.12em] text-[#858a82]">{item.meta}</p></div></CardContent></Card>)}{timeline.length === 0 && <Empty text="Nenhum registro corresponde à busca." />}</div>
    </Page>
  );
}

function Page({ title, subtitle, count, query, setQuery, children }: { title: string; subtitle: string; count: string; query: string; setQuery: (value: string) => void; children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#ececea] px-4 py-8 sm:px-8 lg:px-12"><div className="mx-auto max-w-6xl"><Kicker>Projeto Piloto · Jardim Planalto</Kicker><div className="mt-3 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-4xl font-black uppercase tracking-[-0.06em] sm:text-5xl">{title}</h1><p className="mt-3 max-w-2xl text-sm text-[#70756e]">{subtitle}</p></div><Badge className="rounded-none bg-[#202321] px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-white">{count}</Badge></div><div className="relative mt-8 max-w-md"><Search className="absolute left-3 top-3 h-4 w-4 text-[#858a82]" /><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar..." className="border-black/10 bg-white pl-9" /></div><div className="mt-6">{children}</div></div></div>;
}

function Empty({ text }: { text: string }) { return <Card className="rounded-none border-0 bg-[#f6f6f3]"><CardContent className="p-5 text-sm text-[#70756e]">{text}</CardContent></Card>; }

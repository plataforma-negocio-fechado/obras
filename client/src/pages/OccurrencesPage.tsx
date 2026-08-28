import { useMemo, useState } from "react";
import { useLocalProject, type LocalEventStatus, type LocalPriority } from "@/localStore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, X } from "lucide-react";
import { toast } from "sonner";

const priorities: LocalPriority[] = ["Crítica", "Alta", "Média", "Baixa"];
const statuses: LocalEventStatus[] = ["Aberto", "Em tratamento", "Resolvido"];
const priorityClass = (p: LocalPriority) => p === "Crítica" ? "bg-[#c95a4a] text-white" : p === "Alta" ? "bg-[#d89b45] text-white" : "bg-[#dedfda] text-[#555b53]";

export default function OccurrencesPage() {
  const { project, addEvent, setEventStatus } = useLocalProject();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"Todos" | LocalEventStatus>("Todos");
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [impact, setImpact] = useState("");
  const [decision, setDecision] = useState("");
  const [frontId, setFrontId] = useState(project.fronts[0]?.id ?? "");
  const [priority, setPriority] = useState<LocalPriority>("Alta");

  const items = useMemo(() => project.events.filter((event) => {
    const text = `${event.title} ${event.description} ${event.impact} ${event.decision} ${event.status}`.toLowerCase();
    return text.includes(query.toLowerCase()) && (filter === "Todos" || event.status === filter);
  }), [project.events, query, filter]);

  const close = () => { setOpen(false); setTitle(""); setDescription(""); setImpact(""); setDecision(""); setPriority("Alta"); };
  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return toast.error("Informe o título e a descrição da ocorrência");
    addEvent({ title: title.trim(), description: description.trim(), date: new Date().toISOString(), impact: impact.trim() || "Impacto ainda não informado", decision: decision.trim() || "Aguardando definição", priority, status: "Aberto", frontId: frontId || undefined });
    close(); toast.success("Ocorrência registrada");
  };

  return <div className="min-h-screen bg-[#ececea] px-4 py-8 sm:px-8 lg:px-12"><div className="mx-auto max-w-5xl">
    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#71756f]">Operação</p>
    <div className="mt-3 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-4xl font-black uppercase tracking-[-0.06em] sm:text-5xl">Ocorrências</h1><p className="mt-3 max-w-2xl text-sm text-[#70756e]">Registre problemas e desvios, acompanhe o tratamento e marque a resolução.</p></div><Button onClick={() => setOpen(true)} className="bg-[#202321] text-white"><Plus className="mr-2 h-4 w-4" />Nova ocorrência</Button></div>
    <div className="mt-7 flex flex-wrap gap-2">{(["Todos", ...statuses] as const).map(item => <Button key={item} variant={filter === item ? "default" : "outline"} className={filter === item ? "bg-[#202321] text-white" : ""} onClick={() => setFilter(item)}>{item}</Button>)}</div>
    <div className="relative mt-5 max-w-md"><Search className="absolute left-3 top-3 h-4 w-4 text-[#858a82]"/><Input value={query} onChange={e => setQuery(e.target.value)} className="bg-white pl-9" placeholder="Buscar ocorrência..."/></div>
    <div className="mt-6 space-y-3">{items.map(event => <Card key={event.id} className="rounded-none border-0 bg-[#f6f6f3] shadow-[4px_4px_0_#d0d1cb]"><CardContent className="p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#71756f]">{event.status}</p><h2 className="mt-1 font-black">{event.title}</h2></div><Badge className={`rounded-none ${priorityClass(event.priority)}`}>{event.priority}</Badge></div><p className="mt-3 text-sm leading-6">{event.description}</p><div className="mt-4 grid gap-2 text-xs text-[#70756e] sm:grid-cols-2"><p><b>Impacto:</b> {event.impact}</p><p><b>Tratamento:</b> {event.decision}</p></div><div className="mt-4 flex flex-wrap gap-2">{statuses.map(status => <Button key={status} size="sm" variant={event.status === status ? "default" : "outline"} className={event.status === status ? "bg-[#202321] text-white" : ""} onClick={() => { setEventStatus(event.id, status); toast.success(`Status atualizado para ${status}`); }}>{status}</Button>)}</div></CardContent></Card>)}{items.length === 0 && <Card className="rounded-none border-0 bg-[#f6f6f3]"><CardContent className="p-5 text-sm text-[#70756e]">Nenhuma ocorrência encontrada.</CardContent></Card>}</div>
    {open && <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-4 sm:p-8"><div className="mx-auto mt-4 max-w-2xl rounded-none bg-[#f6f6f3] shadow-xl"><div className="flex items-start justify-between border-b border-black/10 p-5"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#71756f]">Novo registro</p><h2 className="mt-1 text-2xl font-black uppercase">Nova ocorrência</h2></div><Button size="icon" variant="outline" onClick={close}><X className="h-4 w-4"/></Button></div><form onSubmit={save} className="grid gap-4 p-5 md:grid-cols-2"><Input value={title} onChange={e => setTitle(e.target.value)} className="bg-white md:col-span-2" placeholder="O que aconteceu?"/><Textarea value={description} onChange={e => setDescription(e.target.value)} className="min-h-28 bg-white md:col-span-2" placeholder="Descreva a ocorrência e o contexto"/><Input value={impact} onChange={e => setImpact(e.target.value)} className="bg-white" placeholder="Qual foi o impacto?"/><Input value={decision} onChange={e => setDecision(e.target.value)} className="bg-white" placeholder="Tratamento inicial / decisão"/><select value={frontId} onChange={e => setFrontId(e.target.value)} className="h-10 border border-black/10 bg-white px-3"><option value="">Sem frente vinculada</option>{project.fronts.map(f => <option key={f.id} value={f.id}>{f.code} · {f.name}</option>)}</select><select value={priority} onChange={e => setPriority(e.target.value as LocalPriority)} className="h-10 border border-black/10 bg-white px-3">{priorities.map(p => <option key={p}>{p}</option>)}</select><div className="flex justify-end gap-2 md:col-span-2"><Button type="button" variant="outline" onClick={close}>Cancelar</Button><Button type="submit" className="bg-[#202321] text-white">Salvar ocorrência</Button></div></form></div></div>}
  </div></div>;
}

import { useMemo, useState } from "react";
import { useLocalProject, type LocalPriority } from "@/localStore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Check, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";

const priorities: LocalPriority[] = ["Crítica", "Alta", "Média", "Baixa"];
const priorityClass = (p: LocalPriority) => p === "Crítica" ? "bg-[#c95a4a] text-white" : p === "Alta" ? "bg-[#d89b45] text-white" : "bg-[#dedfda] text-[#555b53]";

export default function ActionsPage() {
  const { project, addAction, toggleAction, replaceProject } = useLocalProject();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"Todos" | "Pendentes" | "Concluídas">("Todos");
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [owner, setOwner] = useState("");
  const [due, setDue] = useState("");
  const [frontId, setFrontId] = useState("");
  const [eventId, setEventId] = useState("");
  const [priority, setPriority] = useState<LocalPriority>("Alta");

  const actions = useMemo(() => project.actions.filter(a => {
    const event = a.eventId ? project.events.find(e => e.id === a.eventId) : undefined;
    const text = `${a.title} ${a.owner} ${a.priority} ${event?.title ?? ""}`.toLowerCase().includes(query.toLowerCase());
    return text && (filter === "Todos" || filter === "Concluídas" ? a.done : !a.done);
  }), [project.actions, project.events, query, filter]);

  const reset = () => { setTitle(""); setOwner(""); setDue(""); setFrontId(""); setEventId(""); setPriority("Alta"); };
  const close = () => { setOpen(false); reset(); };
  const openNew = (linkedEventId = "") => { reset(); const event = linkedEventId ? project.events.find(e => e.id === linkedEventId) : undefined; setEventId(linkedEventId); setFrontId(event?.frontId ?? ""); setTitle(event ? `Resolver: ${event.title}` : ""); setOpen(true); };
  const save = (e: React.FormEvent) => { e.preventDefault(); if (!title.trim()) return toast.error("Informe a ação"); addAction({ title: title.trim(), owner: owner.trim() || "Não informado", due: due || "A definir", priority, done: false, frontId: frontId || undefined, eventId: eventId || undefined }); close(); toast.success("Ação criada"); };
  const remove = (id: string) => { if (!window.confirm("Excluir esta ação?")) return; replaceProject({ ...project, actions: project.actions.filter(a => a.id !== id) }); toast.success("Ação excluída"); };

  return <div className="min-h-screen bg-[#ececea] px-4 py-8 sm:px-8 lg:px-12"><div className="mx-auto max-w-5xl">
    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#71756f]">Operação</p>
    <div className="mt-3 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-4xl font-black uppercase tracking-[-0.06em] sm:text-5xl">Plano de ação</h1><p className="mt-3 text-sm text-[#70756e]">Acompanhe tudo que precisa ser feito na obra.</p></div><Button onClick={() => openNew()} className="bg-[#202321] text-white"><Plus className="mr-2 h-4 w-4" />Nova ação</Button></div>
    <div className="mt-7 flex flex-wrap gap-2">{(["Todos", "Pendentes", "Concluídas"] as const).map(item => <Button key={item} variant={filter === item ? "default" : "outline"} className={filter === item ? "bg-[#202321] text-white" : ""} onClick={() => setFilter(item)}>{item}</Button>)}</div>
    <div className="relative mt-5 max-w-md"><Search className="absolute left-3 top-3 h-4 w-4 text-[#858a82]"/><Input value={query} onChange={e => setQuery(e.target.value)} className="bg-white pl-9" placeholder="Buscar ação..."/></div>
    <div className="mt-5 space-y-3">{actions.map(a => { const event = a.eventId ? project.events.find(e => e.id === a.eventId) : undefined; const front = a.frontId ? project.fronts.find(f => f.id === a.frontId) : undefined; return <Card key={a.id} className="rounded-none border-0 bg-[#f6f6f3] shadow-[4px_4px_0_#d0d1cb]"><CardContent className="p-5"><div className="flex flex-wrap items-start gap-3"><Button size="icon" variant="outline" onClick={() => toggleAction(a.id)} aria-label={a.done ? "Reabrir ação" : "Concluir ação"}><Check className={`h-4 w-4 ${a.done ? "text-[#789249]" : ""}`}/></Button><div className="min-w-0 flex-1"><div className="flex flex-wrap justify-between gap-3"><h2 className={a.done ? "font-black line-through text-[#858a82]" : "font-black"}>{a.title}</h2><Badge className={`rounded-none ${priorityClass(a.priority)}`}>{a.priority}</Badge></div><p className="mt-2 text-xs text-[#70756e]">{a.owner} · {a.due === "A definir" ? "Sem prazo" : new Date(`${a.due}T12:00:00`).toLocaleDateString("pt-BR")}</p>{front&&<p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#858a82]">{front.code} · {front.name}</p>}{event&&<div className="mt-3 border-l-2 border-[#d89b45] pl-3"><p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#a9782d]">Originada da ocorrência</p><p className="mt-1 text-xs font-semibold">{event.title}</p></div>}</div><Button size="icon" variant="ghost" onClick={() => remove(a.id)} className="text-[#b84f42]" aria-label="Excluir ação"><Trash2 className="h-4 w-4"/></Button></div></CardContent></Card>})}{actions.length === 0 && <Card className="rounded-none border-0 bg-[#f6f6f3]"><CardContent className="p-5 text-sm text-[#70756e]">Nenhuma ação encontrada.</CardContent></Card>}</div>
    {open && <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-0 md:p-8"><div className="min-h-screen bg-[#f6f6f3] md:mx-auto md:min-h-0 md:max-w-2xl md:rounded-none md:shadow-xl"><div className="sticky top-0 flex items-start justify-between border-b border-black/10 bg-[#f6f6f3] p-5"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#71756f]">Novo registro</p><h2 className="mt-1 text-2xl font-black uppercase">Nova ação</h2></div><Button size="icon" variant="outline" onClick={close}><X className="h-4 w-4"/></Button></div><form onSubmit={save} className="grid gap-4 p-5 md:grid-cols-2"><Input autoFocus value={title} onChange={e => setTitle(e.target.value)} className="bg-white md:col-span-2" placeholder="O que precisa ser feito?"/><Input value={owner} onChange={e => setOwner(e.target.value)} className="bg-white" placeholder="Responsável"/><Input type="date" value={due} onChange={e => setDue(e.target.value)} className="bg-white"/><select value={frontId} onChange={e => setFrontId(e.target.value)} className="h-10 border bg-white px-3"><option value="">Frente relacionada</option>{project.fronts.map(f => <option key={f.id} value={f.id}>{f.code} · {f.name}</option>)}</select><select value={priority} onChange={e => setPriority(e.target.value as LocalPriority)} className="h-10 border bg-white px-3">{priorities.map(p => <option key={p}>{p}</option>)}</select><select value={eventId} onChange={e => setEventId(e.target.value)} className="h-10 border bg-white px-3 md:col-span-2"><option value="">Sem ocorrência vinculada</option>{project.events.map(event => <option key={event.id} value={event.id}>{event.title}</option>)}</select><div className="flex justify-end gap-2 md:col-span-2"><Button type="button" variant="outline" onClick={close}>Cancelar</Button><Button type="submit" className="bg-[#202321] text-white">Salvar ação</Button></div></form></div></div>}
  </div></div>;
}

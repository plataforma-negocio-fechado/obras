import { useMemo, useState } from "react";
import { useLocalProject, type LocalPriority } from "@/localStore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Check, Plus, Search } from "lucide-react";
import { toast } from "sonner";

const priorities: LocalPriority[] = ["Crítica", "Alta", "Média", "Baixa"];
const priorityClass = (p: LocalPriority) => p === "Crítica" ? "bg-[#c95a4a] text-white" : p === "Alta" ? "bg-[#d89b45] text-white" : "bg-[#dedfda] text-[#555b53]";

export default function ActionsPage() {
  const { project, addAction, toggleAction } = useLocalProject();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"Todos" | "Pendentes" | "Concluídas">("Todos");
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [owner, setOwner] = useState("");
  const [due, setDue] = useState("");
  const [frontId, setFrontId] = useState("");
  const [priority, setPriority] = useState<LocalPriority>("Alta");
  const actions = useMemo(() => project.actions.filter(a => {
    const text = `${a.title} ${a.owner} ${a.priority}`.toLowerCase().includes(query.toLowerCase());
    return text && (filter === "Todos" || filter === "Concluídas" ? a.done : !a.done);
  }), [project.actions, query, filter]);
  const save = (e: React.FormEvent) => { e.preventDefault(); if (!title.trim()) return toast.error("Informe a ação"); addAction({ title: title.trim(), owner: owner.trim() || "Não informado", due: due || "A definir", priority, done: false, frontId: frontId || undefined }); setTitle(""); setOwner(""); setDue(""); setOpen(false); toast.success("Ação criada"); };
  return <div className="min-h-screen bg-[#ececea] px-4 py-8 sm:px-8 lg:px-12"><div className="mx-auto max-w-5xl"><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#71756f]">Operação</p><div className="mt-3 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-4xl font-black uppercase tracking-[-0.06em] sm:text-5xl">Plano de ação</h1><p className="mt-3 text-sm text-[#70756e]">Acompanhe tudo que precisa ser feito na obra.</p></div><Button onClick={() => setOpen(v => !v)} className="bg-[#202321] text-white"><Plus className="mr-2 h-4 w-4" />{open ? "Fechar" : "Nova ação"}</Button></div>
  {open && <form onSubmit={save} className="mt-6 grid gap-3 rounded-none bg-[#f6f6f3] p-5 shadow-[4px_4px_0_#d0d1cb] md:grid-cols-2"><Input value={title} onChange={e => setTitle(e.target.value)} className="bg-white md:col-span-2" placeholder="O que precisa ser feito?"/><Input value={owner} onChange={e => setOwner(e.target.value)} className="bg-white" placeholder="Responsável"/><Input type="date" value={due} onChange={e => setDue(e.target.value)} className="bg-white"/><select value={frontId} onChange={e => setFrontId(e.target.value)} className="h-10 border bg-white px-3"><option value="">Frente relacionada</option>{project.fronts.map(f => <option key={f.id} value={f.id}>{f.code} · {f.name}</option>)}</select><select value={priority} onChange={e => setPriority(e.target.value as LocalPriority)} className="h-10 border bg-white px-3">{priorities.map(p => <option key={p}>{p}</option>)}</select><Button type="submit" className="bg-[#202321] text-white">Salvar ação</Button></form>}
  <div className="mt-7 flex flex-wrap gap-2"><Button variant="outline" onClick={() => setFilter("Todos")}>Todas</Button><Button variant="outline" onClick={() => setFilter("Pendentes")}>Pendentes</Button><Button variant="outline" onClick={() => setFilter("Concluídas")}>Concluídas</Button></div><div className="relative mt-5 max-w-md"><Search className="absolute left-3 top-3 h-4 w-4 text-[#858a82]"/><Input value={query} onChange={e => setQuery(e.target.value)} className="bg-white pl-9" placeholder="Buscar ação..."/></div><div className="mt-5 space-y-3">{actions.map(a => <Card key={a.id} className="rounded-none border-0 bg-[#f6f6f3] shadow-[4px_4px_0_#d0d1cb]"><CardContent className="flex gap-3 p-5"><Button size="icon" variant="outline" onClick={() => toggleAction(a.id)}><Check className={`h-4 w-4 ${a.done ? "text-[#789249]" : ""}`}/></Button><div className="flex-1"><div className="flex justify-between gap-3"><h2 className={a.done ? "font-black line-through text-[#858a82]" : "font-black"}>{a.title}</h2><Badge className={`rounded-none ${priorityClass(a.priority)}`}>{a.priority}</Badge></div><p className="mt-2 text-xs text-[#70756e]">{a.owner} · {a.due === "A definir" ? "Sem prazo" : new Date(`${a.due}T12:00:00`).toLocaleDateString("pt-BR")}</p></div></CardContent></Card>)}{actions.length === 0 && <Card className="rounded-none border-0 bg-[#f6f6f3]"><CardContent className="p-5 text-sm text-[#70756e]">Nenhuma ação encontrada.</CardContent></Card>}</div></div></div>;
}

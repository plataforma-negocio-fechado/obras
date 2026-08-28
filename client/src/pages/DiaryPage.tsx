import { useMemo, useState } from "react";
import { useLocalProject, type LocalDiary } from "@/localStore";
import { compressImageFile } from "@/imageCompression";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, FileImage, Pencil, Plus, Save, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";

const Kicker = ({ children }: { children: React.ReactNode }) => <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#71756f]">{children}</p>;
const today = () => new Date().toISOString().slice(0, 10);
const formatDate = (value: string, withTime = false) => new Date(value).toLocaleString("pt-BR", withTime ? { dateStyle: "short", timeStyle: "short" } : { dateStyle: "medium" });

export default function DiaryPage() {
  const { project, addDiary, updateDiary, deleteDiary } = useLocalProject();
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<LocalDiary | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [date, setDate] = useState(today);
  const [frontId, setFrontId] = useState(project.fronts[0]?.id ?? "");
  const [service, setService] = useState(""); const [summary, setSummary] = useState(""); const [occurrence, setOccurrence] = useState("");
  const [weather, setWeather] = useState(""); const [workforce, setWorkforce] = useState("0"); const [hours, setHours] = useState("0"); const [production, setProduction] = useState("0");
  const [evidence, setEvidence] = useState<File | null>(null);
  const front = project.fronts.find((item) => item.id === frontId) ?? project.fronts[0];
  const diaries = useMemo(() => project.diaries.filter((item) => {
    const f = project.fronts.find((x) => x.id === item.frontId);
    return `${item.service} ${item.summary} ${item.occurrence} ${item.weather} ${f?.name ?? ""} ${f?.code ?? ""}`.toLowerCase().includes(query.toLowerCase());
  }), [project.diaries, project.fronts, query]);

  const reset = () => { setEditingId(null); setSelected(null); setDate(today()); setFrontId(project.fronts[0]?.id ?? ""); setService(""); setSummary(""); setOccurrence(""); setWeather(""); setWorkforce("0"); setHours("0"); setProduction("0"); setEvidence(null); };
  const openNew = () => { reset(); setShowForm(true); };
  const openEdit = (diary: LocalDiary) => { setSelected(null); setEditingId(diary.id); setDate(diary.date.slice(0,10)); setFrontId(diary.frontId); setService(diary.service); setSummary(diary.summary); setOccurrence(diary.occurrence); setWeather(diary.weather); setWorkforce(String(diary.workforce)); setHours(String(diary.hours)); setProduction(String(diary.production)); setEvidence(null); setShowForm(true); };
  const save = async (event: React.FormEvent) => {
    event.preventDefault(); if (!summary.trim()) return toast.error("Descreva o que aconteceu no dia"); if (!frontId) return toast.error("Selecione uma frente de serviço");
    let evidenceDataUrl: string | undefined; let evidenceType: string | undefined;
    if (evidence) { try { const photo = await compressImageFile(evidence); evidenceDataUrl = photo.dataUrl; evidenceType = photo.type; } catch { toast.error("Não foi possível anexar a imagem"); return; } }
    const data = { date: new Date(`${date}T12:00:00`).toISOString(), frontId, service: service.trim() || front?.name || "Serviço não informado", summary: summary.trim(), occurrence: occurrence.trim(), weather: weather.trim() || "Não informado", workforce: Math.max(0, Number(workforce)||0), hours: Math.max(0, Number(hours)||0), production: Math.max(0, Number(production)||0), evidenceName: evidence?.name, evidenceDataUrl, evidenceType };
    if (editingId) { updateDiary(editingId, data); toast.success("Diário atualizado"); } else { addDiary(data); toast.success("Diário salvo"); }
    setShowForm(false); reset();
  };
  const remove = (diary: LocalDiary) => { if (window.confirm("Tem certeza que deseja excluir este diário? A produção registrada também será removida da frente.")) { deleteDiary(diary.id); setSelected(null); toast.success("Diário excluído"); } };

  if (showForm) return <div className="min-h-screen bg-[#ececea] px-4 py-8 sm:px-8 lg:px-12"><div className="mx-auto max-w-5xl"><Button variant="ghost" onClick={() => { setShowForm(false); reset(); }} className="mb-5 -ml-2"><ArrowLeft className="mr-2 h-4 w-4"/>Voltar aos diários</Button><div className="flex items-end justify-between gap-4"><div><Kicker>{editingId ? "Editar registro" : "Novo registro"}</Kicker><h1 className="mt-2 text-4xl font-black uppercase tracking-[-0.06em]">{editingId ? "Editar diário" : "Novo diário"}</h1></div></div><form onSubmit={save} className="mt-8"><Card className="rounded-none border-0 bg-[#f6f6f3] shadow-[6px_6px_0_#d0d1cb]"><CardContent className="grid gap-5 p-6 sm:grid-cols-2">
    <div><Kicker>Data</Kicker><Input type="date" value={date} onChange={e=>setDate(e.target.value)} className="mt-2 bg-white"/></div>
    <div><Kicker>Frente de serviço</Kicker><select value={frontId} onChange={e=>{setFrontId(e.target.value);setService("")}} className="mt-2 h-10 w-full border border-black/10 bg-white px-3"><option value="">Selecione</option>{project.fronts.map(f=><option key={f.id} value={f.id}>{f.code} · {f.name}</option>)}</select></div>
    <div className="sm:col-span-2"><Kicker>Serviço executado</Kicker><Input list="diary-services" value={service} onChange={e=>setService(e.target.value)} placeholder="Ex.: escavação, assentamento, reaterro..." className="mt-2 bg-white"/><datalist id="diary-services">{front?.services.map(s=><option key={s} value={s}/>)}</datalist></div>
    <div className="sm:col-span-2"><Kicker>Atividade principal *</Kicker><Textarea value={summary} onChange={e=>setSummary(e.target.value)} placeholder="Descreva o que aconteceu no dia..." className="mt-2 min-h-28 bg-white"/></div>
    <div><Kicker>Condições / clima</Kicker><Input value={weather} onChange={e=>setWeather(e.target.value)} placeholder="Ex.: nublado, solo saturado" className="mt-2 bg-white"/></div>
    <div><Kicker>Equipe no campo</Kicker><Input type="number" min="0" value={workforce} onChange={e=>setWorkforce(e.target.value)} className="mt-2 bg-white"/></div>
    <div><Kicker>Horas trabalhadas</Kicker><Input type="number" min="0" step="0.5" value={hours} onChange={e=>setHours(e.target.value)} className="mt-2 bg-white"/></div>
    <div><Kicker>Produção · {front?.unit ?? "un"}</Kicker><Input type="number" min="0" step="0.01" value={production} onChange={e=>setProduction(e.target.value)} className="mt-2 bg-white"/></div>
    <div className="sm:col-span-2"><Kicker>Ocorrência de campo</Kicker><Textarea value={occurrence} onChange={e=>setOccurrence(e.target.value)} placeholder="Impedimentos, decisões ou observações..." className="mt-2 min-h-24 bg-white"/></div>
    <div className="sm:col-span-2"><Kicker>Evidência fotográfica</Kicker><div className="mt-2 flex flex-wrap items-center gap-3"><label className="inline-flex h-11 cursor-pointer items-center gap-2 border border-black/10 bg-white px-4 text-xs font-bold uppercase tracking-[0.1em] hover:bg-[#f0f1ed]"><FileImage className="h-4 w-4"/><span className="max-w-[240px] truncate">{evidence?.name ?? "Escolher imagem da galeria"}</span><input aria-label="Escolher imagem da galeria" type="file" accept="image/*" className="hidden" onChange={e=>setEvidence(e.target.files?.[0] ?? null)}/></label>{evidence&&<Button type="button" variant="ghost" onClick={()=>setEvidence(null)} className="text-[#b84f42]"><X className="mr-1 h-4 w-4"/>Remover</Button>}<span className="text-xs text-[#70756e]">No celular, o seletor de imagens abre a galeria; a câmera fica disponível pelo próprio seletor quando oferecida pelo aparelho.</span></div></div>
    <div className="sm:col-span-2 flex justify-end gap-2"><Button type="button" variant="outline" onClick={()=>{setShowForm(false);reset()}}>Cancelar</Button><Button type="submit" className="bg-[#202321] text-white"><Save className="mr-2 h-4 w-4"/>{editingId?"Atualizar diário":"Salvar diário"}</Button></div>
  </CardContent></Card></form></div></div>;

  return <div className="min-h-screen bg-[#ececea] px-4 py-8 sm:px-8 lg:px-12"><div className="mx-auto max-w-5xl"><Kicker>Projeto Piloto · Jardim Planalto</Kicker><div className="mt-3 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-5xl font-black uppercase tracking-[-0.08em]">Diário de obra</h1><p className="mt-3 max-w-2xl text-sm text-[#70756e]">Consulte os registros da obra. Crie um novo diário somente quando precisar lançar uma atividade.</p></div><Badge className="rounded-none bg-[#202321] px-3 py-2 text-white">{project.diaries.length} registros</Badge></div><div className="mt-7 flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-[#858a82]"/><Input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar diário..." className="h-11 bg-white pl-9"/></div><Button onClick={openNew} className="h-11 bg-[#202321] text-white"><Plus className="mr-2 h-4 w-4"/>Novo diário</Button></div><div className="mt-6 space-y-3">{diaries.map(item=>{const f=project.fronts.find(x=>x.id===item.frontId);return <Card key={item.id} className="rounded-none border-0 bg-[#f6f6f3] shadow-[4px_4px_0_#d0d1cb]"><CardContent className="p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><Kicker>{formatDate(item.date)} · {f?.code ?? "GERAL"}</Kicker><h2 className="mt-2 text-lg font-black uppercase">{item.service}</h2><p className="mt-2 line-clamp-2 text-sm text-[#555b53]">{item.summary}</p><div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-[0.1em] text-[#858a82]"><span className="bg-[#e8e9e4] px-2 py-1">{item.workforce} pessoas</span><span className="bg-[#e8e9e4] px-2 py-1">{item.hours}h</span><span className="bg-[#e8e9e4] px-2 py-1">+{item.production} {f?.unit ?? "un"}</span>{item.evidenceDataUrl&&<span className="bg-[#e5efd0] px-2 py-1 text-[#789249]">Com foto</span>}</div></div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={()=>setSelected(item)}>Ver detalhes</Button><Button size="sm" variant="outline" onClick={()=>openEdit(item)}><Pencil className="mr-1 h-3.5 w-3.5"/>Editar</Button><Button size="sm" variant="ghost" onClick={()=>remove(item)} className="text-[#b84f42]"><Trash2 className="mr-1 h-3.5 w-3.5"/>Excluir</Button></div></div></CardContent></Card>})}{diaries.length===0&&<Card className="rounded-none border-0 bg-[#f6f6f3]"><CardContent className="p-6 text-sm text-[#70756e]">{project.diaries.length===0?"Nenhum diário registrado ainda. Clique em “Novo diário” para começar.":"Nenhum diário corresponde à busca."}</CardContent></Card>}</div></div></div>;
}

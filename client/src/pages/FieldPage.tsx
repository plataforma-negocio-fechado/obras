import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, ImagePlus, Mic, Pencil, Send, Sparkles, Square, Trash2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { usePilotLocation } from "@/pilotRouting";
import { suggestFieldRecords, type FieldCandidate } from "@/fieldIntelligence";
import { addMemoryEvent, type MemoryEvidence } from "@/operationalMemory";

type FieldEntry = {
  id: string;
  createdAt: string;
  text: string;
  audio?: { name: string; dataUrl: string };
  images: { name: string; dataUrl: string }[];
  candidates: FieldCandidate[];
  source: "ia" | "local";
};

const STORAGE_KEY = "obras-field-lab-entries";
const typeLabel: Record<FieldCandidate["type"], string> = { custo: "Custo", material: "Material", maquina: "Máquina", equipe: "Equipe", ocorrencia: "Ocorrência", acao: "Ação", diario: "Diário" };

function makeId(prefix: string) { if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `${prefix}-${crypto.randomUUID()}`; return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }
function readEntries(): FieldEntry[] { try { const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"); return Array.isArray(value) ? value : []; } catch { return []; } }
function fileToDataUrl(file: File) { return new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file); }); }
function formatDate(value: string) { return new Date(value).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }); }

export default function FieldPage() {
  const [, navigate] = usePilotLocation();
  const [text, setText] = useState("");
  const [images, setImages] = useState<{ name: string; dataUrl: string }[]>([]);
  const [audio, setAudio] = useState<{ name: string; dataUrl: string } | null>(null);
  const [entries, setEntries] = useState<FieldEntry[]>(readEntries);
  const [candidates, setCandidates] = useState<FieldCandidate[]>([]);
  const [source, setSource] = useState<"ia" | "local" | null>(null);
  const [organizing, setOrganizing] = useState(false);
  const [recording, setRecording] = useState(false);
  const [editing, setEditing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(entries)); }, [entries]);

  const reset = () => { setText(""); setImages([]); setAudio(null); setCandidates([]); setSource(null); setEditing(false); };

  const addImages = async (files: FileList | null) => {
    if (!files?.length) return;
    const selected = Array.from(files).slice(0, 8);
    try { const converted = await Promise.all(selected.map(async (file) => ({ name: file.name, dataUrl: await fileToDataUrl(file) }))); setImages((current) => [...current, ...converted].slice(0, 8)); toast.success(`${converted.length} foto(s) adicionada(s)`); } catch { toast.error("Não foi possível carregar a imagem"); }
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") { toast.error("Seu navegador não permite gravação de áudio"); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => { if (event.data.size) chunksRef.current.push(event.data); };
      recorder.onstop = async () => { stream.getTracks().forEach((track) => track.stop()); const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" }); const file = new File([blob], `audio-${Date.now()}.webm`, { type: blob.type }); setAudio({ name: file.name, dataUrl: await fileToDataUrl(file) }); toast.success("Áudio salvo como evidência"); };
      recorder.start(); setRecording(true);
    } catch { toast.error("Não foi possível acessar o microfone"); }
  };
  const stopRecording = () => { mediaRecorderRef.current?.stop(); setRecording(false); };

  const organize = async () => {
    if (!text.trim()) { toast.error("Escreva a informação para a IA organizar"); return; }
    setOrganizing(true); setEditing(false);
    try {
      const response = await fetch("/api/field/organize", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: text.trim() }) });
      if (!response.ok) throw new Error("API indisponível");
      const payload = await response.json() as { candidates?: FieldCandidate[] };
      if (!Array.isArray(payload.candidates)) throw new Error("Resposta inválida");
      setCandidates(payload.candidates); setSource("ia"); toast.success("IA organizou a informação. Revise antes de confirmar.");
    } catch {
      const local = suggestFieldRecords(text); setCandidates(local); setSource("local");
      if (local.length) toast.success("Motor local organizou a informação. Revise antes de confirmar."); else toast.info("Não encontrei informações estruturáveis.");
    } finally { setOrganizing(false); }
  };

  const updateCandidate = (index: number, key: string, value: string) => setCandidates((current) => current.map((candidate, i) => i === index ? { ...candidate, fields: { ...candidate.fields, [key]: value } } : candidate));

  const confirm = () => {
    if (!candidates.length && !text.trim() && !audio && !images.length) { toast.error("Adicione uma informação primeiro"); return; }
    const primary = candidates[0];
    const title = primary?.title || "Registro de campo";
    const summary = primary?.summary || text.trim() || "Entrada de campo com evidências.";
    const evidence: MemoryEvidence[] = [];
    if (text.trim()) evidence.push({ id: makeId("evidence"), type: "texto", name: "Relato original", dataUrl: undefined });
    if (audio) evidence.push({ id: makeId("evidence"), type: "audio", name: audio.name, dataUrl: audio.dataUrl });
    images.forEach((image) => evidence.push({ id: makeId("evidence"), type: "foto", name: image.name, dataUrl: image.dataUrl }));
    addMemoryEvent({ type: primary?.type === "maquina" ? "máquina" : primary?.type ?? "diário", title, summary, source: "campo", confirmed: true, evidence, metadata: primary?.fields as Record<string, string | number | undefined> | undefined });
    setEntries((current) => [{ id: makeId("field"), createdAt: new Date().toISOString(), text: text.trim(), audio: audio ?? undefined, images, candidates, source: source ?? "local" }, ...current]);
    toast.success("Evento confirmado e incorporado à memória da obra");
    reset();
  };

  const revise = (entry: FieldEntry) => { setText(entry.text); setImages(entry.images); setAudio(entry.audio ?? null); setCandidates(entry.candidates); setSource(entry.source); setEditing(true); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const remove = (id: string) => setEntries((current) => current.filter((entry) => entry.id !== id));

  return <main className="min-h-screen bg-brand-cream px-4 py-5 sm:px-7 lg:px-10 lg:py-8"><div className="mx-auto max-w-5xl">
    <header className="mb-6 flex items-center justify-between gap-4 border-b border-black/10 pb-5"><div className="flex items-center gap-3"><Button variant="outline" size="icon" onClick={() => navigate("/hoje")}><ArrowLeft className="h-4 w-4" /></Button><div><p className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-[#737a7b]">Campo · entrada operacional</p><h1 className="mt-1 font-display text-4xl font-semibold leading-none text-brand-navy">Como foi o dia?</h1></div></div><Button variant="outline" onClick={() => navigate("/hoje")}>Voltar à obra</Button></header>

    <Card className="rounded-[1.1rem] border border-brand bg-white shadow-[5px_5px_0_#d7d0c4]"><CardContent className="p-5 sm:p-7">
      <Textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="Escreva o que aconteceu na obra... Ex.: Recebemos quatro cargas de brita, executamos 150 m e a PC trabalhou junto com o sapinho." className="min-h-[170px] border-brand/20 bg-[#F5F1E9]/50 text-sm leading-6" />
      <div className="mt-4 flex flex-wrap gap-2">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-brand/15 bg-[#F5F1E9] px-4 py-2.5 text-xs font-bold text-brand-navy"><ImagePlus className="h-4 w-4" /> Foto<input type="file" accept="image/*" multiple className="hidden" onChange={(event) => { void addImages(event.target.files); event.currentTarget.value = ""; }} /></label>
        {recording ? <Button onClick={stopRecording} className="bg-[#B34A43] text-white"><Square className="mr-2 h-4 w-4" />Parar áudio</Button> : <Button variant="outline" onClick={() => void startRecording()}><Mic className="mr-2 h-4 w-4" />Áudio</Button>}
        <Button variant="outline" onClick={reset}><RotateCcw className="mr-2 h-4 w-4" />Limpar</Button>
        <Button onClick={() => void organize()} disabled={organizing || !text.trim()} className="ml-auto bg-brand-navy text-white hover:bg-[#123d57]"><Sparkles className="mr-2 h-4 w-4" />{organizing ? "Organizando..." : "Organizar informação"}</Button>
      </div>
      {(audio || images.length > 0) && <div className="mt-4 flex flex-wrap gap-2 text-xs text-[#737a7b]">{audio && <span className="rounded-full bg-[#F5F1E9] px-3 py-1">🎙 {audio.name}</span>}{images.map((image) => <span key={image.name + image.dataUrl.slice(-10)} className="rounded-full bg-[#F5F1E9] px-3 py-1">📷 {image.name}</span>)}</div>}
    </CardContent></Card>

    {candidates.length > 0 && <Card className="mt-5 rounded-[1.1rem] border border-brand bg-white shadow-[5px_5px_0_#d7d0c4]"><CardContent className="p-5 sm:p-7"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-[#737a7b]">{source === "ia" ? "IA" : "Motor local"} · proposta</p><h2 className="mt-1 font-display text-3xl font-semibold text-brand-navy">Evento identificado</h2><p className="mt-1 text-xs text-[#737a7b]">A confirmação abaixo é o ponto em que a informação entra na memória operacional.</p></div><Button variant="outline" onClick={() => setEditing(!editing)}><Pencil className="mr-2 h-4 w-4" />{editing ? "Concluir edição" : "Editar"}</Button></div>
      <div className="mt-5 space-y-3">{candidates.map((candidate, index) => <div key={`${candidate.type}-${index}`} className="rounded-lg border border-black/10 bg-[#F5F1E9]/50 p-4"><div className="flex items-center gap-2"><span className="rounded-full bg-brand-navy px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">{typeLabel[candidate.type]}</span><span className="text-[10px] text-[#737a7b]">{Math.round(candidate.confidence * 100)}% confiança</span></div><h3 className="mt-2 text-sm font-bold text-brand-navy">{candidate.title}</h3><p className="mt-1 text-xs leading-5 text-[#737a7b]">{candidate.summary}</p>{editing && Object.entries(candidate.fields).map(([key, value]) => <label key={key} className="mt-3 block text-[10px] font-bold uppercase tracking-wide text-[#737a7b]">{key}<input className="mt-1 h-9 w-full rounded-md border border-brand/15 bg-white px-3 text-xs" value={String(value ?? "")} onChange={(event) => updateCandidate(index, key, event.target.value)} /></label>)}</div>)}</div>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end"><Button variant="outline" onClick={() => { setCandidates([]); setEditing(false); }}>Descartar proposta</Button><Button onClick={confirm} className="bg-[#6F8E3E] text-white hover:bg-[#5f7b35]"><Check className="mr-2 h-4 w-4" />Confirmar e registrar evento</Button></div>
    </CardContent></Card>}

    <section className="mt-8"><div className="mb-3 flex items-end justify-between"><div><p className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-[#737a7b]">Memória de campo</p><h2 className="mt-1 font-display text-3xl font-semibold text-brand-navy">Entradas recentes</h2></div><span className="text-xs text-[#737a7b]">{entries.length} registro(s)</span></div>{entries.length ? <div className="space-y-3">{entries.slice(0, 10).map((entry) => <Card key={entry.id} className="border-brand bg-white"><CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap gap-2 text-[10px] text-[#737a7b]"><span>{formatDate(entry.createdAt)}</span><span>·</span><span>{entry.source === "ia" ? "IA" : "local"}</span><span>·</span><span>{entry.candidates.length} candidato(s)</span></div><p className="mt-2 line-clamp-3 text-sm leading-6 text-brand-navy">{entry.text || "Entrada baseada em evidência sem texto"}</p></div><div className="flex shrink-0 gap-2"><Button variant="outline" size="sm" onClick={() => revise(entry)}><Pencil className="mr-1 h-3.5 w-3.5" />Revisar</Button><Button variant="ghost" size="sm" onClick={() => remove(entry.id)}><Trash2 className="h-3.5 w-3.5" /></Button></div></CardContent></Card>)}</div> : <Card className="border-brand bg-white"><CardContent className="p-7 text-center text-sm text-[#737a7b]">Ainda não há entradas de campo. Registre uma situação real para começar a construir a memória da obra.</CardContent></Card>}</section>
  </div></main>;
}

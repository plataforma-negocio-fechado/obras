import { useEffect, useRef, useState } from "react";
import { useLocalProject } from "@/localStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Camera, ImagePlus, Mic, Square, Trash2, Send, Clock, Sparkles, Check, Pencil, Wifi } from "lucide-react";
import { toast } from "sonner";
import { usePilotLocation } from "@/pilotRouting";
import { suggestFieldRecords, type FieldCandidate } from "@/fieldIntelligence";

type FieldEntry = {
  id: string;
  projectId: string;
  createdAt: string;
  text: string;
  audioName?: string;
  audioDataUrl?: string;
  images: { name: string; dataUrl: string }[];
  status: "pendente" | "organizado";
  candidates?: FieldCandidate[];
  aiSource?: "ia" | "local";
};

const FIELD_PROJECT_ID = "local-project";
const storageKey = (projectId: string) => `obras-field-entries:${projectId}`;
const readEntries = (projectId: string): FieldEntry[] => {
  try { return JSON.parse(localStorage.getItem(storageKey(projectId)) ?? "[]"); } catch { return []; }
};
const fileToDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file);
});

const typeLabel: Record<FieldCandidate["type"], string> = {
  custo: "Custo", material: "Material", maquina: "Máquina", equipe: "Equipe", ocorrencia: "Ocorrência", acao: "Ação", diario: "Diário",
};

async function organizeWithAi(text: string): Promise<{ candidates: FieldCandidate[]; source: "ia" | "local" }> {
  try {
    const response = await fetch("/api/field/organize", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
    if (!response.ok) throw new Error("API de IA indisponível");
    const payload = await response.json() as { candidates?: FieldCandidate[] };
    if (!Array.isArray(payload.candidates)) throw new Error("Resposta inválida da IA");
    return { candidates: payload.candidates, source: "ia" };
  } catch {
    return { candidates: suggestFieldRecords(text), source: "local" };
  }
}

export default function FieldPage() {
  const { project } = useLocalProject();
  const [, navigate] = usePilotLocation();
  const [text, setText] = useState("");
  const [images, setImages] = useState<{ name: string; dataUrl: string }[]>([]);
  const [audio, setAudio] = useState<{ name: string; dataUrl: string } | null>(null);
  const [entries, setEntries] = useState<FieldEntry[]>(() => readEntries(FIELD_PROJECT_ID));
  const [recording, setRecording] = useState(false);
  const [organizing, setOrganizing] = useState(false);
  const [candidates, setCandidates] = useState<FieldCandidate[]>([]);
  const [candidateSource, setCandidateSource] = useState<"ia" | "local" | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => { setEntries(readEntries(FIELD_PROJECT_ID)); }, [project.name]);
  const persist = (next: FieldEntry[]) => { setEntries(next); localStorage.setItem(storageKey(FIELD_PROJECT_ID), JSON.stringify(next)); };
  const addImages = async (files: FileList | null) => {
    if (!files?.length) return;
    try {
      const selected = Array.from(files).slice(0, 8);
      const converted = await Promise.all(selected.map(async (file) => ({ name: file.name, dataUrl: await fileToDataUrl(file) })));
      setImages((current) => [...current, ...converted].slice(0, 8));
    } catch { toast.error("Não foi possível carregar uma das imagens"); }
  };
  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") { toast.error("Seu navegador não permite gravação de áudio. Use “Anexar áudio”."); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); chunksRef.current = [];
      const recorder = new MediaRecorder(stream); mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => { if (event.data.size) chunksRef.current.push(event.data); };
      recorder.onstop = async () => { stream.getTracks().forEach((track) => track.stop()); const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" }); const file = new File([blob], `audio-${new Date().toISOString().replace(/[:.]/g, "-")}.webm`, { type: blob.type }); setAudio({ name: file.name, dataUrl: await fileToDataUrl(file) }); };
      recorder.start(); setRecording(true);
    } catch { toast.error("Não foi possível acessar o microfone"); }
  };
  const stopRecording = () => { mediaRecorderRef.current?.stop(); setRecording(false); };

  const organizeText = async () => {
    if (!text.trim()) return;
    setOrganizing(true);
    const result = await organizeWithAi(text);
    setCandidates(result.candidates);
    setCandidateSource(result.source);
    setOrganizing(false);
    if (result.candidates.length) toast.success(result.source === "ia" ? "IA organizou a informação para revisão" : "Organização local preparada para revisão");
    else toast.info("Não encontrei informações estruturáveis nessa mensagem");
  };

  const sendEntry = async () => {
    if (!text.trim() && !audio && images.length === 0) { toast.error("Adicione um áudio, texto ou foto antes de enviar"); return; }
    let detected = candidates;
    let source = candidateSource;
    if (text.trim() && detected.length === 0) {
      setOrganizing(true);
      const result = await organizeWithAi(text);
      detected = result.candidates;
      source = result.source;
      setOrganizing(false);
    }
    const entry: FieldEntry = { id: crypto.randomUUID(), projectId: FIELD_PROJECT_ID, createdAt: new Date().toISOString(), text: text.trim(), audioName: audio?.name, audioDataUrl: audio?.dataUrl, images, status: detected.length ? "pendente" : "organizado", candidates: detected, aiSource: source ?? undefined };
    persist([entry, ...entries]); setCandidates(detected); setCandidateSource(source); setText(""); setImages([]); setAudio(null);
    toast.success(detected.length ? "Registro recebido. Revise a organização abaixo." : "Registro enviado para a gestão");
  };

  const confirmEntry = (id: string) => {
    persist(entries.map((entry) => entry.id === id ? { ...entry, status: "organizado" } : entry));
    toast.success("Informação confirmada e organizada");
  };
  const removeEntry = (id: string) => persist(entries.filter((entry) => entry.id !== id));

  return <div className="min-h-screen bg-[#F5F1E9] px-4 py-6 sm:px-8">
    <div className="mx-auto max-w-xl">
      <div className="mb-5 flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate("/hoje")} className="-ml-2 text-[#0B3047]"><ArrowLeft className="mr-2 h-4 w-4" />Sair do campo</Button>
        <Badge className="rounded-none bg-[#0B3047] px-3 py-2 text-white">Campo</Badge>
      </div>
      <Kicker>Projeto · {project.name}</Kicker>
      <h1 className="mt-2 text-4xl font-black uppercase tracking-[-0.07em] text-[#0B3047]">Meu dia de obra</h1>
      <p className="mt-3 text-sm leading-6 text-[#617080]">Jogue aqui tudo que acontece na obra. O Negócio Fechado organiza.</p>

      <Card className="mt-6 rounded-none border border-[#d8d2c5] bg-white shadow-[6px_6px_0_#0B3047]">
        <CardContent className="p-5">
          <div className="flex flex-col gap-3">
            <Textarea value={text} onChange={(event) => { setText(event.target.value); setCandidates([]); setCandidateSource(null); }} placeholder="Ex.: Hoje abasteci a PC em R$ 2.900,05 e a patrol chegou na obra..." className="min-h-32 resize-none bg-[#F5F1E9] text-base text-[#0B3047]" />
            <div className="grid grid-cols-2 gap-3">
              <Button type="button" onClick={recording ? stopRecording : startRecording} className={recording ? "h-14 bg-[#b84f42] text-white" : "h-14 bg-[#0B3047] text-white"}>{recording ? <><Square className="mr-2 h-5 w-5" />Parar áudio</> : <><Mic className="mr-2 h-5 w-5" />Gravar áudio</>}</Button>
              <label className="inline-flex h-14 cursor-pointer items-center justify-center gap-2 border border-[#d8d2c5] bg-white px-4 text-sm font-bold text-[#0B3047] hover:bg-[#F5F1E9]"><ImagePlus className="h-5 w-5" />Fotos<input type="file" accept="image/*" multiple className="hidden" onChange={(event) => addImages(event.target.files)} /></label>
            </div>
            <label className="flex cursor-pointer items-center gap-2 border border-[#d8d2c5] bg-white px-4 py-3 text-xs font-bold uppercase tracking-[0.08em] text-[#617080]"><Camera className="h-4 w-4" />Anexar áudio existente<input type="file" accept="audio/*" className="hidden" onChange={async (event) => { const file = event.target.files?.[0]; if (file) setAudio({ name: file.name, dataUrl: await fileToDataUrl(file) }); }} /></label>
            {audio && <div className="flex items-center justify-between bg-[#F5F1E9] px-3 py-2 text-xs text-[#0B3047]"><span className="truncate">🎙️ {audio.name}</span><Button type="button" size="sm" variant="ghost" onClick={() => setAudio(null)}><Trash2 className="h-4 w-4" /></Button></div>}
            {images.length > 0 && <div className="grid grid-cols-4 gap-2">{images.map((image, index) => <div key={`${image.name}-${index}`} className="relative aspect-square overflow-hidden bg-white"><img src={image.dataUrl} alt={image.name} className="h-full w-full object-cover" /><button type="button" onClick={() => setImages((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white" aria-label="Remover foto"><Trash2 className="h-3 w-3" /></button></div>)}</div>}
            {text.trim() && <Button type="button" onClick={() => void organizeText()} disabled={organizing} variant="outline" className="h-12 border-[#F15A24] text-[#F15A24] hover:bg-[#F5F1E9]"><Sparkles className="mr-2 h-4 w-4" />{organizing ? "Organizando..." : "Organizar informação"}</Button>}
            <Button type="button" onClick={() => void sendEntry()} disabled={organizing} className="mt-1 h-14 bg-[#F15A24] text-base font-bold text-white hover:bg-[#d94e1d]"><Send className="mr-2 h-5 w-5" />Enviar para o Campo</Button>
          </div>
        </CardContent>
      </Card>

      {candidates.length > 0 && <Card className="mt-6 rounded-none border border-[#d8d2c5] bg-white">
        <CardContent className="p-5">
          <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2 text-[#0B3047]"><Sparkles className="h-4 w-4 text-[#F15A24]" /><Kicker>Organização sugerida</Kicker></div>{candidateSource === "ia" ? <span className="inline-flex items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-[0.08em] text-[#0B3047]"><Wifi className="h-3 w-3" />IA</span> : <span className="font-mono text-[9px] font-bold uppercase tracking-[0.08em] text-[#617080]">Modo local</span>}</div>
          <p className="mt-2 text-sm text-[#617080]">O sistema ainda não grava nada. Estas são sugestões para você revisar.</p>
          <div className="mt-4 space-y-3">{candidates.map((candidate, index) => <div key={`${candidate.type}-${index}`} className="border border-[#d8d2c5] p-4">
            <div className="flex items-center justify-between gap-3"><Badge className="rounded-none bg-[#0B3047] text-white">{typeLabel[candidate.type]}</Badge><span className="font-mono text-[10px] text-[#617080]">{Math.round(candidate.confidence * 100)}% confiança</span></div>
            <h3 className="mt-3 font-bold text-[#0B3047]">{candidate.title}</h3><p className="mt-1 text-sm leading-6 text-[#617080]">{candidate.summary}</p>
            <div className="mt-3 flex flex-wrap gap-2">{Object.entries(candidate.fields).map(([key, value]) => <span key={key} className="bg-[#F5F1E9] px-2 py-1 font-mono text-[10px] text-[#0B3047]">{key}: {value}</span>)}</div>
          </div>)}</div>
        </CardContent>
      </Card>}

      <div className="mt-8"><Kicker>Enviados recentemente</Kicker><div className="mt-3 space-y-3">
        {entries.length === 0 && <Card className="rounded-none border border-[#d8d2c5] bg-white"><CardContent className="p-5 text-sm text-[#617080]">Você ainda não enviou nenhum registro.</CardContent></Card>}
        {entries.slice(0, 10).map((entry) => <Card key={entry.id} className="rounded-none border border-[#d8d2c5] bg-white"><CardContent className="p-4">
          <div className="flex items-start justify-between gap-3"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#617080]"><Clock className="h-3.5 w-3.5" />{new Date(entry.createdAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}<span>·</span><span>{entry.status === "pendente" ? "Aguardando revisão" : "Organizado"}</span>{entry.aiSource === "ia" && <span>· IA</span>}</div>{entry.text && <p className="mt-2 text-sm leading-6 text-[#0B3047]">{entry.text}</p>}<div className="mt-2 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-[0.1em] text-[#617080]">{entry.audioName && <span className="bg-[#F5F1E9] px-2 py-1">🎙️ Áudio</span>}{entry.images.length > 0 && <span className="bg-[#F5F1E9] px-2 py-1">📷 {entry.images.length} foto(s)</span>}</div>
          {entry.status === "pendente" && entry.candidates && entry.candidates.length > 0 && <div className="mt-4 border-t border-[#d8d2c5] pt-3"><div className="flex flex-wrap gap-2">{entry.candidates.map((candidate, index) => <span key={`${candidate.type}-${index}`} className="bg-[#F5F1E9] px-2 py-1 text-[10px] font-bold uppercase text-[#0B3047]">{typeLabel[candidate.type]} · {candidate.title}</span>)}</div><div className="mt-3 flex gap-2"><Button type="button" size="sm" onClick={() => confirmEntry(entry.id)} className="bg-[#0B3047] text-white"><Check className="mr-1 h-3.5 w-3.5" />Confirmar</Button><Button type="button" size="sm" variant="outline" onClick={() => { setText(entry.text); setCandidates(entry.candidates ?? []); setCandidateSource(entry.aiSource ?? "local"); }} className="border-[#d8d2c5] text-[#0B3047]"><Pencil className="mr-1 h-3.5 w-3.5" />Revisar</Button></div></div>}
          </div><Button type="button" size="sm" variant="ghost" onClick={() => removeEntry(entry.id)} className="shrink-0 text-[#b84f42]"><Trash2 className="h-4 w-4" /></Button></div>
        </CardContent></Card>)}
      </div></div>
    </div>
  </div>;
}

function Kicker({ children }: { children: React.ReactNode }) { return <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#617080]">{children}</p>; }

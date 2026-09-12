import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Camera, ImagePlus, Mic, Square, Trash2, Send, Clock, Sparkles, Check, Pencil, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { usePilotLocation } from "@/pilotRouting";
import { suggestFieldRecords, type FieldCandidate } from "@/fieldIntelligence";

type FieldEntry = {
  id: string;
  createdAt: string;
  text: string;
  audioName?: string;
  audioDataUrl?: string;
  images: { name: string; dataUrl: string }[];
  status: "pendente" | "organizado";
  candidates?: FieldCandidate[];
  aiSource?: "ia" | "local";
};

const STORAGE_KEY = "obras-field-lab-entries";

const typeLabel: Record<FieldCandidate["type"], string> = {
  custo: "Custo",
  material: "Material",
  maquina: "Máquina",
  equipe: "Equipe",
  ocorrencia: "Ocorrência",
  acao: "Ação",
  diario: "Diário",
};

const typeTone: Record<FieldCandidate["type"], string> = {
  custo: "bg-[#0B3047] text-white",
  material: "bg-[#0B3047] text-white",
  maquina: "bg-[#F15A24] text-white",
  equipe: "bg-[#6F8E3E] text-white",
  ocorrencia: "bg-[#B34A43] text-white",
  acao: "bg-[#7A6B4D] text-white",
  diario: "bg-[#697278] text-white",
};

function makeId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function readEntries(): FieldEntry[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function confidenceLabel(value: number) {
  return `${Math.round(value * 100)}% confiança`;
}

/**
 * Campo em modo laboratório.
 *
 * Esta fase valida o motor: entrada livre -> interpretação -> candidatos ->
 * revisão -> confirmação. Nada é enviado para custos, materiais, máquinas,
 * equipe, diário, ações ou ocorrências do módulo Obras.
 */
export default function FieldPage() {
  const [, navigate] = usePilotLocation();
  const [text, setText] = useState("");
  const [images, setImages] = useState<{ name: string; dataUrl: string }[]>([]);
  const [audio, setAudio] = useState<{ name: string; dataUrl: string } | null>(null);
  const [entries, setEntries] = useState<FieldEntry[]>(readEntries);
  const [candidates, setCandidates] = useState<FieldCandidate[]>([]);
  const [candidateSource, setCandidateSource] = useState<"ia" | "local" | null>(null);
  const [organizing, setOrganizing] = useState(false);
  const [recording, setRecording] = useState(false);
  const [editing, setEditing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  const resetComposer = () => {
    setText("");
    setImages([]);
    setAudio(null);
    setCandidates([]);
    setCandidateSource(null);
    setEditing(false);
  };

  const addImages = async (files: FileList | null) => {
    if (!files?.length) return;
    try {
      const selected = Array.from(files).slice(0, 8);
      const converted = await Promise.all(
        selected.map(async (file) => ({ name: file.name, dataUrl: await fileToDataUrl(file) })),
      );
      setImages((current) => [...current, ...converted].slice(0, 8));
      toast.success(`${converted.length} foto${converted.length > 1 ? "s" : ""} adicionada${converted.length > 1 ? "s" : ""}`);
    } catch {
      toast.error("Não foi possível carregar uma das imagens");
    }
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      toast.error("Seu navegador não permite gravação de áudio");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const file = new File(
          [blob],
          `audio-${new Date().toISOString().replace(/[:.]/g, "-")}.webm`,
          { type: blob.type },
        );
        setAudio({ name: file.name, dataUrl: await fileToDataUrl(file) });
        toast.success("Áudio recebido. Nesta fase ele fica como evidência local.");
      };
      recorder.start();
      setRecording(true);
    } catch {
      toast.error("Não foi possível acessar o microfone");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const organize = async () => {
    if (!text.trim()) {
      toast.error("Escreva a informação do campo para testar a organização");
      return;
    }
    setOrganizing(true);
    setEditing(false);

    // O backend de IA continua como primeira opção quando estiver disponível.
    // No GitHub Pages, o motor local assume sem exigir servidor ou chave no navegador.
    try {
      const response = await fetch("/api/field/organize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
      });
      if (!response.ok) throw new Error("API indisponível");
      const payload = await response.json() as { candidates?: FieldCandidate[] };
      if (!Array.isArray(payload.candidates)) throw new Error("Resposta inválida");
      setCandidates(payload.candidates);
      setCandidateSource("ia");
      toast.success("IA organizou a informação. Revise antes de confirmar.");
    } catch {
      const local = suggestFieldRecords(text);
      setCandidates(local);
      setCandidateSource("local");
      if (local.length) toast.success("Motor local organizou a informação. Revise antes de confirmar.");
      else toast.info("Não encontrei informações estruturáveis nessa mensagem");
    } finally {
      setOrganizing(false);
    }
  };

  const saveCurrentEntry = (status: FieldEntry["status"]) => {
    if (!text.trim() && !audio && images.length === 0) return null;
    const entry: FieldEntry = {
      id: makeId("field"),
      createdAt: new Date().toISOString(),
      text: text.trim(),
      audioName: audio?.name,
      audioDataUrl: audio?.dataUrl,
      images,
      status,
      candidates,
      aiSource: candidateSource ?? undefined,
    };
    setEntries((current) => [entry, ...current]);
    return entry.id;
  };

  const sendForOrganization = () => {
    if (!text.trim() && !audio && images.length === 0) {
      toast.error("Adicione texto, áudio ou foto antes de enviar");
      return;
    }
    if (!text.trim()) {
      const id = saveCurrentEntry("organizado");
      if (id) toast.success("Evidência salva no laboratório local");
      resetComposer();
      return;
    }
    if (!candidates.length) {
      void organize();
      return;
    }
    const id = saveCurrentEntry("pendente");
    if (id) toast.success("Informação preparada para revisão");
  };

  const confirmOrganization = () => {
    if (!candidates.length) return;
    const id = saveCurrentEntry("organizado");
    if (id) {
      toast.success("Organização confirmada — mantida apenas no laboratório local");
      resetComposer();
    }
  };

  const reviseEntry = (entry: FieldEntry) => {
    setText(entry.text);
    setImages(entry.images);
    setAudio(entry.audioName && entry.audioDataUrl ? { name: entry.audioName, dataUrl: entry.audioDataUrl } : null);
    setCandidates(entry.candidates ?? []);
    setCandidateSource(entry.aiSource ?? "local");
    setEditing(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteEntry = (id: string) => {
    setEntries((current) => current.filter((entry) => entry.id !== id));
    toast.success("Registro removido");
  };

  const updateCandidateField = (candidateIndex: number, key: string, value: string) => {
    setCandidates((current) => current.map((candidate, index) =>
      index === candidateIndex
        ? { ...candidate, fields: { ...candidate.fields, [key]: value } }
        : candidate,
    ));
  };

  return (
    <div className="min-h-screen bg-[#F5F1E9] px-4 py-5 sm:px-8">
      <div className="mx-auto max-w-3xl space-y-5">
        <header className="flex items-center gap-3 border-b border-[#0B3047]/15 pb-4">
          <Button variant="outline" size="icon" onClick={() => navigate("/obras")} aria-label="Voltar">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.28em] text-[#F15A24]">Negócio Fechado · Obras</p>
            <h1 className="font-serif text-3xl text-[#0B3047] sm:text-4xl">Operação de campo</h1>
          </div>
        </header>

        <Card className="overflow-hidden border-[#0B3047]/15 bg-white shadow-[8px_8px_0_rgba(11,48,71,0.08)]">
          <CardContent className="p-5 sm:p-7">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-[#697278]">Laboratório do Campo</p>
                <h2 className="mt-2 font-serif text-3xl text-[#0B3047]">Jogue aqui o que aconteceu.</h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-[#697278]">
                  Escreva como você falaria na obra. O motor tenta separar a informação em registros úteis para você revisar.
                </p>
              </div>
              <div className="hidden rounded-sm bg-[#F15A24]/10 p-3 sm:block">
                <Sparkles className="h-5 w-5 text-[#F15A24]" />
              </div>
            </div>

            <Textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Ex.: A PC ficou parada por duas horas porque deu problema na bomba de combustível."
              className="min-h-[145px] resize-y border-[#0B3047]/20 bg-[#F5F1E9]/55 text-base leading-7 text-[#0B3047] placeholder:text-[#697278]/70 focus-visible:ring-[#0B3047]"
            />

            {(images.length > 0 || audio) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {images.map((image, index) => (
                  <div key={`${image.name}-${index}`} className="relative overflow-hidden rounded-sm border border-[#0B3047]/15">
                    <img src={image.dataUrl} alt={image.name} className="h-16 w-16 object-cover" />
                    <button
                      type="button"
                      className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-[#B34A43]"
                      onClick={() => setImages((current) => current.filter((_, imageIndex) => imageIndex !== index))}
                      aria-label="Remover foto"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {audio && (
                  <div className="flex items-center gap-2 rounded-sm border border-[#0B3047]/15 bg-[#F5F1E9] px-3 text-sm text-[#0B3047]">
                    <Mic className="h-4 w-4 text-[#F15A24]" />
                    <span className="max-w-[180px] truncate">{audio.name}</span>
                    <button type="button" onClick={() => setAudio(null)} className="text-[#B34A43]" aria-label="Remover áudio">×</button>
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-sm border border-[#0B3047]/15 bg-white px-3 py-2 text-sm font-medium text-[#0B3047] hover:bg-[#F5F1E9]">
                <Camera className="h-4 w-4" /> Foto
                <input type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={(event) => { void addImages(event.target.files); event.currentTarget.value = ""; }} />
              </label>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-sm border border-[#0B3047]/15 bg-white px-3 py-2 text-sm font-medium text-[#0B3047] hover:bg-[#F5F1E9]">
                <ImagePlus className="h-4 w-4" /> Galeria
                <input type="file" accept="image/*" multiple className="hidden" onChange={(event) => { void addImages(event.target.files); event.currentTarget.value = ""; }} />
              </label>
              <Button
                type="button"
                variant="outline"
                onClick={recording ? stopRecording : startRecording}
                className={recording ? "border-[#F15A24] text-[#F15A24]" : "border-[#0B3047]/15 text-[#0B3047]"}
              >
                {recording ? <Square className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}
                {recording ? "Parar" : "Áudio"}
              </Button>
            </div>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                onClick={organize}
                disabled={organizing || !text.trim()}
                className="h-12 flex-1 bg-[#0B3047] text-white hover:bg-[#0B3047]/90"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {organizing ? "Organizando..." : "Organizar informação"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={sendForOrganization}
                disabled={organizing}
                className="h-12 border-[#F15A24] text-[#F15A24] hover:bg-[#F15A24]/10"
              >
                <Send className="mr-2 h-4 w-4" />
                {candidates.length ? "Guardar teste" : "Enviar"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {candidates.length > 0 && (
          <Card className="border-[#0B3047]/15 bg-white shadow-[6px_6px_0_rgba(11,48,71,0.07)]">
            <CardContent className="p-5 sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-[#F15A24]" />
                    <p className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-[#697278]">Organização sugerida</p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#697278]">
                    {candidateSource === "ia" ? "A IA encontrou estes registros. Revise antes de confirmar." : "Modo local: o motor estruturou a mensagem para você testar o comportamento."}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#697278]">
                  {candidateSource === "ia" ? "IA" : "MODO LOCAL"}
                </span>
              </div>

              <div className="mt-5 space-y-4">
                {candidates.map((candidate, candidateIndex) => (
                  <div key={`${candidate.type}-${candidateIndex}`} className="border border-[#0B3047]/15 bg-[#F5F1E9]/30 p-4 sm:p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className={`px-3 py-1 text-sm font-semibold ${typeTone[candidate.type]}`}>{typeLabel[candidate.type]}</span>
                      <span className="font-mono text-xs text-[#697278]">{confidenceLabel(candidate.confidence)}</span>
                    </div>
                    <h3 className="mt-4 text-xl font-semibold text-[#0B3047]">{candidate.title}</h3>
                    <p className="mt-2 text-base leading-7 text-[#697278]">{candidate.summary}</p>

                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      {Object.entries(candidate.fields).map(([key, value]) => (
                        <label key={key} className="block rounded-sm bg-white px-3 py-2">
                          <span className="font-mono text-[11px] text-[#697278]">{key}</span>
                          <input
                            value={value}
                            onChange={(event) => updateCandidateField(candidateIndex, key, event.target.value)}
                            className="mt-1 w-full border-0 bg-transparent p-0 text-sm text-[#0B3047] outline-none"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <Button type="button" onClick={confirmOrganization} className="h-11 flex-1 bg-[#0B3047] text-white hover:bg-[#0B3047]/90">
                  <Check className="mr-2 h-4 w-4" /> Confirmar organização
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditing(!editing)} className="h-11 border-[#0B3047]/20 text-[#0B3047]">
                  <Pencil className="mr-2 h-4 w-4" /> {editing ? "Concluir revisão" : "Revisar campos"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => { setCandidates([]); setCandidateSource(null); }} className="h-11 text-[#697278]">
                  <RotateCcw className="mr-2 h-4 w-4" /> Limpar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <section>
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-[#697278]">Histórico do laboratório</p>
              <h2 className="mt-1 font-serif text-3xl text-[#0B3047]">Testes recentes</h2>
            </div>
            <span className="font-mono text-xs text-[#697278]">{entries.length} registro{entries.length !== 1 ? "s" : ""}</span>
          </div>

          <div className="space-y-3">
            {entries.length === 0 ? (
              <Card className="border-dashed border-[#0B3047]/20 bg-transparent shadow-none">
                <CardContent className="p-7 text-center text-sm text-[#697278]">
                  Ainda não há testes. Comece com uma situação real da obra.
                </CardContent>
              </Card>
            ) : entries.map((entry) => (
              <Card key={entry.id} className="border-[#0B3047]/15 bg-white shadow-[4px_4px_0_rgba(11,48,71,0.05)]">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#697278]">
                      <Clock className="h-4 w-4" />
                      {formatDate(entry.createdAt)}
                      <span>·</span>
                      <span className={entry.status === "organizado" ? "text-[#6F8E3E]" : "text-[#F15A24]"}>
                        {entry.status === "organizado" ? "ORGANIZADO" : "PENDENTE"}
                      </span>
                    </div>
                    <button type="button" onClick={() => deleteEntry(entry.id)} className="text-[#B34A43]" aria-label="Excluir teste">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  {entry.text && <p className="mt-4 whitespace-pre-wrap text-base leading-7 text-[#0B3047]">{entry.text}</p>}
                  {entry.audioName && <p className="mt-3 font-mono text-xs text-[#697278]">🎙 ÁUDIO · {entry.audioName}</p>}
                  {entry.images.length > 0 && <p className="mt-2 font-mono text-xs text-[#697278]">📷 {entry.images.length} foto{entry.images.length > 1 ? "s" : ""}</p>}
                  {entry.candidates?.length ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {entry.candidates.map((candidate, index) => (
                        <span key={`${candidate.type}-${index}`} className="rounded-sm bg-[#F5F1E9] px-2 py-1 font-mono text-[11px] text-[#0B3047]">
                          {typeLabel[candidate.type]}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <Button type="button" variant="ghost" onClick={() => reviseEntry(entry)} className="mt-3 px-0 text-[#0B3047] hover:bg-transparent hover:text-[#F15A24]">
                    Revisar este teste
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <p className="pb-8 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-[#697278]">
          Fase MVP · interpretação e revisão · sem gravação na gestão
        </p>
      </div>
    </div>
  );
}

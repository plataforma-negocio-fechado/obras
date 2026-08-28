import { useMemo, useState } from "react";
import { useLocalProject, type LocalAction, type LocalDiary, type LocalEventStatus, type LocalPriority } from "@/localStore";
import { usePilotLocation } from "@/pilotRouting";
import { compressImageFile } from "@/imageCompression";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowUpRight, Camera, Check, FileImage, Pencil, Plus, Save, Search, SlidersHorizontal, Trash2, X } from "lucide-react";

type Props = { mode: "diario" | "frentes" | "eventos" | "timeline" };
const Kicker = ({ children }: { children: React.ReactNode }) => <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#71756f]">{children}</p>;
const today = () => new Date().toISOString().slice(0, 10);
const priorities: LocalPriority[] = ["Crítica", "Alta", "Média", "Baixa"];
const eventStatuses: LocalEventStatus[] = ["Aberto", "Em tratamento", "Resolvido"];

function formatDate(value: string, withTime = false) {
  return new Date(value).toLocaleString("pt-BR", withTime ? { dateStyle: "short", timeStyle: "short" } : { dateStyle: "short" });
}

function priorityClass(priority: LocalPriority) {
  return priority === "Crítica" ? "bg-[#c95a4a] text-white" : priority === "Alta" ? "bg-[#d89b45] text-white" : "bg-[#dedfda] text-[#555b53]";
}

export default function OperationalPage({ mode }: Props) {
  const { project, addDiary, addEvent, updateDiary, deleteDiary, setEventStatus, addAction, updateAction, toggleAction, addService } = useLocalProject();
  const [, navigate] = usePilotLocation();
  const [date, setDate] = useState(today);
  const [frontId, setFrontId] = useState(project.fronts[0]?.id ?? "");
  const [service, setService] = useState("");
  const [summary, setSummary] = useState("");
  const [occurrence, setOccurrence] = useState("");
  const [weather, setWeather] = useState("");
  const [workforce, setWorkforce] = useState("0");
  const [hours, setHours] = useState("0");
  const [production, setProduction] = useState("0");
  const [evidence, setEvidence] = useState<File | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [serviceDrafts, setServiceDrafts] = useState<Record<string, string>>({});
  const [editingActionId, setEditingActionId] = useState<string | null>(null);
  const [editingDiaryId, setEditingDiaryId] = useState<string | null>(null);
  const [actionOwnerDraft, setActionOwnerDraft] = useState("");
  const [actionDueDraft, setActionDueDraft] = useState("");
  const [actionPriorityDraft, setActionPriorityDraft] = useState<LocalPriority>("Alta");
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventImpact, setEventImpact] = useState("");
  const [eventDecision, setEventDecision] = useState("");
  const [eventPriority, setEventPriority] = useState<LocalPriority>("Alta");
  const [eventFrontId, setEventFrontId] = useState(project.fronts[0]?.id ?? "");
  const [actionTitle, setActionTitle] = useState("");
  const [actionOwner, setActionOwner] = useState("");
  const [actionDue, setActionDue] = useState("");
  const [actionPriority, setActionPriority] = useState<LocalPriority>("Alta");
  const [actionEventId, setActionEventId] = useState("");
  const [actionFrontId, setActionFrontId] = useState(project.fronts[0]?.id ?? "");
  const selectedFront = project.fronts.find((front) => front.id === frontId) ?? project.fronts[0];

  const filteredActions = useMemo(() => project.actions.filter((action) => {
    const matchesQuery = `${action.title} ${action.owner} ${action.priority}`.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = statusFilter === "Todos" || (statusFilter === "Concluídas" ? action.done : !action.done);
    return matchesQuery && matchesStatus;
  }), [project.actions, query, statusFilter]);

  const filteredFronts = useMemo(() => project.fronts.filter((front) => `${front.name} ${front.code} ${front.detail}`.toLowerCase().includes(query.toLowerCase()) && (statusFilter === "Todos" || front.status === statusFilter)), [project.fronts, query, statusFilter]);
  const filteredEvents = useMemo(() => project.events.filter((event) => `${event.title} ${event.description} ${event.impact} ${event.decision}`.toLowerCase().includes(query.toLowerCase()) && (statusFilter === "Todos" || event.status === statusFilter)), [project.events, query, statusFilter]);

  const beginEditDiary = (diary: LocalDiary) => {
  setEditingDiaryId(diary.id);

  setDate(diary.date.slice(0, 10));
  setFrontId(diary.frontId);
  setService(diary.service);
  setSummary(diary.summary);
  setOccurrence(diary.occurrence);
  setWeather(diary.weather);
  setWorkforce(String(diary.workforce));
  setHours(String(diary.hours));
  setProduction(String(diary.production));

  setEvidence(null);

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
};
  
  const saveDiary = async (
  event: React.FormEvent<HTMLFormElement>
) => {
  event.preventDefault();

  if (!summary.trim()) {
    toast.error("Descreva o que aconteceu no dia");
    return;
  }

  if (!frontId) {
    toast.error("Selecione uma frente de serviço");
    return;
  }

  const numericProduction = Math.max(
    0,
    Number(production) || 0
  );

  let evidenceDataUrl: string | undefined;
  let evidenceType: string | undefined;

  if (evidence) {
    try {
      const photo = await compressImageFile(evidence);
      evidenceDataUrl = photo.dataUrl;
      evidenceType = photo.type;
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível anexar a foto"
      );
      return;
    }
  }

  try {
    const diaryData = {
      date: new Date(`${date}T12:00:00`).toISOString(),
      frontId,
      service:
        service.trim() ||
        selectedFront?.name ||
        "Serviço não informado",
      summary: summary.trim(),
      occurrence: occurrence.trim(),
      weather: weather.trim() || "Não informado",
      workforce: Math.max(0, Number(workforce) || 0),
      hours: Math.max(0, Number(hours) || 0),
      production: numericProduction,
      evidenceName: evidence?.name,
      evidenceDataUrl,
      evidenceType,
    };

    if (editingDiaryId) {
      updateDiary(editingDiaryId, diaryData);
      toast.success("Diário atualizado");
    } else {
      addDiary(diaryData);
      toast.success("Diário salvo");
    }

    setEditingDiaryId(null);
    setSummary("");
    setOccurrence("");
    setService("");
    setProduction("0");
    setEvidence(null);
  } catch {
    toast.error(
      "O diário não pôde ser salvo. Tente uma foto menor ou remova o anexo."
    );
  }
};  
  
  const saveEvent = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!eventTitle.trim() || !eventDescription.trim()) { toast.error("Informe o título e a descrição do evento"); return; }
    addEvent({ title: eventTitle.trim(), description: eventDescription.trim(), date: new Date().toISOString(), impact: eventImpact.trim() || "Impacto ainda não informado", decision: eventDecision.trim() || "Decisão pendente", priority: eventPriority, status: "Aberto", frontId: eventFrontId || undefined });
    setEventTitle(""); setEventDescription(""); setEventImpact(""); setEventDecision(""); toast.success("Evento registrado localmente");
  };

  const beginEditAction = (action: LocalAction) => {
    setEditingActionId(action.id);
    setActionOwnerDraft(action.owner === "Não informado" ? "" : action.owner);
    setActionDueDraft(action.due === "A definir" ? "" : action.due);
    setActionPriorityDraft(action.priority);
  };

  const saveActionEdit = (event: React.MouseEvent, action: LocalAction) => {
    event.stopPropagation();
    updateAction(action.id, { owner: actionOwnerDraft.trim() || "Não informado", due: actionDueDraft || "A definir", priority: actionPriorityDraft });
    setEditingActionId(null);
    toast.success("Ação atualizada neste navegador");
  };

  const saveAction = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!actionTitle.trim()) { toast.error("Informe o título da ação"); return; }
    addAction({ title: actionTitle.trim(), owner: actionOwner.trim() || "Não informado", due: actionDue || "A definir", priority: actionPriority, done: false, eventId: actionEventId || undefined, frontId: actionFrontId || undefined });
    setActionTitle(""); setActionOwner(""); setActionDue(""); toast.success("Ação adicionada ao plano");
  };

  if (mode === "diario")
  return (
    <div className="min-h-screen bg-[#ececea] px-4 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-5xl">
        <Kicker>Projeto Piloto · Jardim Planalto</Kicker>

        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-5xl font-black uppercase tracking-[-0.08em]">
              Diário de obra
            </h1>

            <p className="mt-3 max-w-2xl text-sm text-[#70756e]">
              Registre, consulte, altere ou exclua os acontecimentos da obra.
            </p>
          </div>

          <Badge className="rounded-none bg-[#202321] px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-white">
            {project.diaries.length} registros
          </Badge>
        </div>

        <form onSubmit={saveDiary}>
          <Card className="mt-8 rounded-none border-0 bg-[#f6f6f3] shadow-[6px_6px_0_#d0d1cb]">
            <CardContent className="grid gap-5 p-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                {editingDiaryId && (
                  <div className="flex flex-wrap items-center justify-between gap-3 border-l-4 border-l-[#d89b45] bg-[#ececea] p-4">
                    <div>
                      <Kicker>Modo de edição</Kicker>

                      <p className="mt-1 text-sm font-semibold">
                        Você está alterando um diário já registrado.
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingDiaryId(null);
                        setDate(today());
                        setFrontId(project.fronts[0]?.id ?? "");
                        setService("");
                        setSummary("");
                        setOccurrence("");
                        setWeather("");
                        setWorkforce("0");
                        setHours("0");
                        setProduction("0");
                        setEvidence(null);
                      }}
                    >
                      <X className="mr-1 h-4 w-4" />
                      Cancelar edição
                    </Button>
                  </div>
                )}
              </div>

              <div>
                <Kicker>Data do registro</Kicker>

                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-2 border-black/10 bg-white"
                />
              </div>

              <div>
                <Kicker>Frente de serviço</Kicker>

                <select
                  value={frontId}
                  onChange={(e) => {
                    setFrontId(e.target.value);
                    setService("");
                  }}
                  className="mt-2 h-11 w-full border border-black/10 bg-white px-3 text-base sm:h-10 sm:text-sm"
                >
                  <option value="" disabled>
                    Selecione uma frente
                  </option>

                  {project.fronts.map((front) => (
                    <option key={front.id} value={front.id}>
                      {front.code} · {front.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <Kicker>Serviço executado</Kicker>

                <Input
                  list="services-for-diary"
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  placeholder="Ex.: escavação, assentamento, reaterro..."
                  className="mt-2 h-11 border-black/10 bg-white text-base sm:h-10 sm:text-sm"
                />

                <datalist id="services-for-diary">
                  {selectedFront?.services.map((item) => (
                    <option key={item} value={item} />
                  ))}
                </datalist>
              </div>

              <div className="sm:col-span-2">
                <Kicker>Atividade principal *</Kicker>

                <Textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Ex.: executada escavação no trecho DRN-01..."
                  className="mt-2 min-h-32 border-black/10 bg-white text-base sm:min-h-28 sm:text-sm"
                />
              </div>

              <div>
                <Kicker>Condições / clima</Kicker>

                <Input
                  value={weather}
                  onChange={(e) => setWeather(e.target.value)}
                  placeholder="Ex.: tempo nublado, solo saturado"
                  className="mt-2 h-11 border-black/10 bg-white text-base sm:h-10 sm:text-sm"
                />
              </div>

              <div>
                <Kicker>Equipe no campo</Kicker>

                <Input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={workforce}
                  onChange={(e) => setWorkforce(e.target.value)}
                  className="mt-2 h-11 border-black/10 bg-white text-base sm:h-10 sm:text-sm"
                />
              </div>

              <div>
                <Kicker>Horas trabalhadas</Kicker>

                <Input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.5"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  className="mt-2 h-11 border-black/10 bg-white text-base sm:h-10 sm:text-sm"
                />
              </div>

              <div>
                <Kicker>
                  Produção do dia · {selectedFront?.unit ?? "un"}
                </Kicker>

                <Input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={production}
                  onChange={(e) => setProduction(e.target.value)}
                  className="mt-2 h-11 border-black/10 bg-white text-base sm:h-10 sm:text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <Kicker>Ocorrência de campo</Kicker>

                <Textarea
                  value={occurrence}
                  onChange={(e) => setOccurrence(e.target.value)}
                  placeholder="Registre impedimentos, decisões ou observações..."
                  className="mt-2 min-h-28 border-black/10 bg-white text-base sm:min-h-24 sm:text-sm"
                />
              </div>

              <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:flex-wrap sm:items-center">
                <label className="inline-flex h-11 max-w-full cursor-pointer items-center gap-2 border border-black/10 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.1em]">
                  <Camera className="h-4 w-4 shrink-0" />

                  <span className="truncate">
                    {evidence
                      ? evidence.name
                      : "Tirar / anexar foto"}
                  </span>

                  <input
                    aria-label="Evidência fotográfica"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) =>
                      setEvidence(e.target.files?.[0] || null)
                    }
                  />
                </label>

                {evidence && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setEvidence(null)}
                    className="h-11 text-[#b84f42]"
                  >
                    <X className="mr-1 h-4 w-4" />
                    Remover
                  </Button>
                )}

                <Button
                  type="submit"
                  className="h-12 bg-[#202321] text-white sm:ml-auto"
                >
                  <Save className="mr-2 h-4 w-4" />

                  {editingDiaryId
                    ? "Atualizar diário"
                    : "Salvar diário"}
                </Button>
              </div>

              <p className="text-xs leading-5 text-[#70756e] sm:col-span-2">
                <FileImage className="mr-1 inline h-3.5 w-3.5" />

                No celular, o botão de foto prioriza a câmera traseira
                quando o navegador oferecer esse recurso.
              </p>
            </CardContent>
          </Card>
        </form>

        <section className="mt-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <Kicker>Histórico</Kicker>

              <h2 className="mt-1 text-2xl font-black uppercase">
                Diários registrados
              </h2>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-3 h-4 w-4 text-[#858a82]" />

              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar diário..."
                className="border-black/10 bg-white pl-9"
              />
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {project.diaries
              .filter((item) => {
                const front = project.fronts.find(
                  (front) => front.id === item.frontId
                );

                const text = [
                  item.service,
                  item.summary,
                  item.occurrence,
                  item.weather,
                  front?.name,
                  front?.code,
                ]
                  .join(" ")
                  .toLowerCase();

                return text.includes(query.toLowerCase());
              })
              .map((item) => {
                const front = project.fronts.find(
                  (front) => front.id === item.frontId
                );

                return (
                  <Card
                    key={item.id}
                    className="rounded-none border-0 bg-[#f6f6f3] shadow-[4px_4px_0_#d0d1cb]"
                  >
                    <CardContent className="p-5">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <Kicker>
                            {formatDate(item.date)} ·{" "}
                            {front?.code ?? "GERAL"}
                          </Kicker>

                          <h3 className="mt-2 text-lg font-black uppercase">
                            {item.service}
                          </h3>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => beginEditDiary(item)}
                          >
                            <Pencil className="mr-1 h-3.5 w-3.5" />
                            Editar
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const confirmed =
                                window.confirm(
                                  "Tem certeza que deseja excluir este diário? A produção registrada também será removida da frente."
                                );

                              if (!confirmed) return;

                              deleteDiary(item.id);

                              toast.success(
                                "Diário excluído com sucesso"
                              );
                            }}
                            className="text-[#b84f42]"
                          >
                            <Trash2 className="mr-1 h-3.5 w-3.5" />
                            Excluir
                          </Button>
                        </div>
                      </div>

                      <p className="mt-4 text-sm leading-6">
                        {item.summary}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-[0.1em] text-[#858a82]">
                        <span className="bg-[#e8e9e4] px-2 py-1">
                          {item.weather}
                        </span>

                        <span className="bg-[#e8e9e4] px-2 py-1">
                          {item.workforce} pessoas
                        </span>

                        <span className="bg-[#e8e9e4] px-2 py-1">
                          {item.hours}h
                        </span>

                        <span className="bg-[#e8e9e4] px-2 py-1">
                          +{item.production}{" "}
                          {front?.unit ?? "un"}
                        </span>
                      </div>

                      <details className="mt-5 border-t border-black/10 pt-4">
                        <summary className="cursor-pointer text-[10px] font-bold uppercase tracking-[0.12em] text-[#789249]">
                          Ver detalhes
                        </summary>

                        <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                          <div>
                            <Kicker>Data</Kicker>
                            <p className="mt-1">
                              {formatDate(item.date, true)}
                            </p>
                          </div>

                          <div>
                            <Kicker>Frente</Kicker>
                            <p className="mt-1">
                              {front
                                ? `${front.code} · ${front.name}`
                                : "Não informada"}
                            </p>
                          </div>

                          <div>
                            <Kicker>Serviço</Kicker>
                            <p className="mt-1">
                              {item.service}
                            </p>
                          </div>

                          <div>
                            <Kicker>Produção</Kicker>
                            <p className="mt-1">
                              {item.production}{" "}
                              {front?.unit ?? "un"}
                            </p>
                          </div>

                          <div>
                            <Kicker>Equipe</Kicker>
                            <p className="mt-1">
                              {item.workforce} pessoas
                            </p>
                          </div>

                          <div>
                            <Kicker>Horas</Kicker>
                            <p className="mt-1">
                              {item.hours} horas
                            </p>
                          </div>

                          <div>
                            <Kicker>Clima</Kicker>
                            <p className="mt-1">
                              {item.weather}
                            </p>
                          </div>

                          {item.occurrence && (
                            <div className="sm:col-span-2">
                              <Kicker>Ocorrência</Kicker>
                              <p className="mt-1 whitespace-pre-wrap">
                                {item.occurrence}
                              </p>
                            </div>
                          )}

                          {item.evidenceDataUrl && (
                            <div className="sm:col-span-2">
                              <Kicker>Evidência</Kicker>

                              <a
                                href={item.evidenceDataUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-2 inline-flex items-center gap-2 font-semibold text-[#789249] hover:underline"
                              >
                                <FileImage className="h-4 w-4" />
                                Ver foto anexada
                              </a>
                            </div>
                          )}
                        </div>
                      </details>
                    </CardContent>
                  </Card>
                );
              })}

            {project.diaries.filter((item) => {
              const front = project.fronts.find(
                (front) => front.id === item.frontId
              );

              return [
                item.service,
                item.summary,
                item.occurrence,
                item.weather,
                front?.name,
                front?.code,
              ]
                .join(" ")
                .toLowerCase()
                .includes(query.toLowerCase());
            }).length === 0 && (
              <Card className="rounded-none border-0 bg-[#f6f6f3]">
                <CardContent className="p-5 text-sm text-[#70756e]">
                  {project.diaries.length === 0
                    ? "Nenhum diário registrado ainda. Faça o primeiro lançamento acima."
                    : "Nenhum diário corresponde à busca."}
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

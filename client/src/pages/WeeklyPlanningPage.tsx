import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocalProject, type LocalWeeklyTarget } from "@/localStore";
import { usePilotLocation } from "@/pilotRouting";

function mondayOf(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  return d.toISOString().slice(0, 10);
}

function addDays(value: string, days: number) {
  const d = new Date(`${value}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export default function WeeklyPlanningPage() {
  const { project, upsertWeeklyTarget, deleteWeeklyTarget } = useLocalProject();
  const [, navigate] = usePilotLocation();
  const [weekStart, setWeekStart] = useState(mondayOf());
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [frontId, setFrontId] = useState(project.fronts[0]?.id ?? "");
  const [planned, setPlanned] = useState("");
  const [note, setNote] = useState("");

  const weekEnd = addDays(weekStart, 6);
  const targets = useMemo(() => project.weeklyTargets.filter((item) => item.weekEnd === weekEnd), [project.weeklyTargets, weekEnd]);

  const resetForm = () => {
    setEditingId(null);
    setFrontId(project.fronts[0]?.id ?? "");
    setPlanned("");
    setNote("");
  };

  const openEdit = (target: LocalWeeklyTarget) => {
    setEditingId(target.id);
    setFrontId(target.frontId);
    setPlanned(String(target.planned));
    setNote(target.note);
    setShowForm(true);
  };

  const save = () => {
    const value = Number(planned);
    if (!frontId || !Number.isFinite(value) || value <= 0) return;
    upsertWeeklyTarget({ frontId, weekEnd, planned: value, note: note.trim() });
    setShowForm(false);
    resetForm();
  };

  const getExecuted = (target: LocalWeeklyTarget) => project.diaries
    .filter((diary) => diary.frontId === target.frontId && diary.date.slice(0, 10) >= addDays(weekEnd, -6) && diary.date.slice(0, 10) <= weekEnd)
    .reduce((sum, diary) => sum + (Number(diary.production) || 0), 0);

  return <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-[10px] uppercase tracking-[0.18em] text-[#858a82]">Planejamento</p>
        <h1 className="text-3xl font-semibold tracking-tight">Planejamento semanal</h1>
        <p className="mt-1 text-sm text-[#70756e]">Defina as metas da semana e acompanhe a execução.</p>
      </div>
      <div className="flex gap-2"><Button variant="outline" onClick={() => navigate("/hoje")}>Hoje</Button><Button onClick={() => { resetForm(); setShowForm(true); }}>+ Nova meta</Button></div>
    </div>

    <Card className="rounded-none border-0 bg-[#f6f6f3] shadow-[4px_4px_0_#d0d1cb]"><CardContent className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between"><div><p className="text-[10px] uppercase tracking-[0.14em] text-[#858a82]">Semana</p><p className="text-lg font-medium">{formatDate(weekStart)} — {formatDate(weekEnd)}</p></div><Input className="max-w-[190px] bg-white" type="date" value={weekStart} onChange={(e) => setWeekStart(mondayOf(new Date(`${e.target.value}T12:00:00`)))} /></CardContent></Card>

    {showForm && <Card className="rounded-none border-0 bg-white shadow-[4px_4px_0_#d0d1cb]"><CardContent className="space-y-4 p-5"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">{editingId ? "Alterar meta" : "Nova meta semanal"}</h2><Button variant="ghost" onClick={() => { setShowForm(false); resetForm(); }}>Fechar</Button></div><div className="grid gap-4 md:grid-cols-2"><div><Label>Frente</Label><select className="mt-1 h-10 w-full border bg-white px-3 text-sm" value={frontId} onChange={(e) => setFrontId(e.target.value)}>{project.fronts.map((front) => <option key={front.id} value={front.id}>{front.name}</option>)}</select></div><div><Label>Meta / quantidade planejada</Label><Input className="mt-1" type="number" min="0" value={planned} onChange={(e) => setPlanned(e.target.value)} placeholder="Ex.: 330" /></div><div className="md:col-span-2"><Label>Observação (opcional)</Label><Input className="mt-1" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex.: concluir trecho triplo até sexta" /></div></div><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>Cancelar</Button><Button onClick={save}>Salvar planejamento</Button></div></CardContent></Card>}

    <div className="space-y-4">{targets.map((target) => { const front = project.fronts.find((item) => item.id === target.frontId); const executed = getExecuted(target); const pct = target.planned > 0 ? Math.min(100, Math.round((executed / target.planned) * 100)) : 0; return <Card key={target.id} className="rounded-none border-0 bg-[#f6f6f3] shadow-[4px_4px_0_#d0d1cb]"><CardContent className="p-5"><div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"><div><p className="text-[10px] uppercase tracking-[0.14em] text-[#858a82]">{front?.name ?? "Frente"}</p><h2 className="mt-1 text-lg font-semibold">Meta semanal: {target.planned} {front?.unit ?? "un"}</h2><p className="mt-1 text-sm text-[#70756e]">Executado: {executed} {front?.unit ?? "un"} · Faltam: {Math.max(0, target.planned - executed)} {front?.unit ?? "un"}</p>{target.note && <p className="mt-2 text-sm text-[#70756e]">{target.note}</p>}</div><div className="flex gap-2"><Button variant="outline" onClick={() => openEdit(target)}>Alterar</Button><Button variant="ghost" onClick={() => deleteWeeklyTarget(target.id)}>Excluir</Button></div></div><div className="mt-4 h-3 w-full bg-[#dedfd9]"><div className="h-3 bg-[#8da65a]" style={{ width: `${pct}%` }} /></div><div className="mt-2 flex justify-between text-[10px] uppercase tracking-[0.12em] text-[#858a82]"><span>{pct}% da meta</span><span>{target.weekEnd}</span></div></CardContent></Card>; })}{targets.length === 0 && !showForm && <Card className="rounded-none border-0 bg-[#f6f6f3]"><CardContent className="p-8 text-center text-sm text-[#70756e]">Nenhuma meta definida para esta semana.<div className="mt-4"><Button onClick={() => { resetForm(); setShowForm(true); }}>+ Criar primeira meta</Button></div></CardContent></Card>}</div>
  </div>;
}

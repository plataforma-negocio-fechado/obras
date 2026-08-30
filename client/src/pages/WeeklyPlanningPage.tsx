import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePilot } from "@/lib/pilotStore";
import { usePilotLocation } from "@/lib/pilotRouting";
import { formatDate } from "@/lib/format";

function mondayOf(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

function addDays(value: string, days: number) {
  const d = new Date(`${value}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function WeeklyPlanningPage() {
  const { project, addWeeklyPlan, updateWeeklyPlan, deleteWeeklyPlan } = usePilot();
  const [, navigate] = usePilotLocation();
  const [weekStart, setWeekStart] = useState(mondayOf());
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [frontId, setFrontId] = useState(project.fronts[0]?.id ?? "");
  const [goal, setGoal] = useState("");
  const [plannedQuantity, setPlannedQuantity] = useState("");
  const [unit, setUnit] = useState("m");
  const [responsible, setResponsible] = useState("");
  const [notes, setNotes] = useState("");

  const weekEnd = addDays(weekStart, 6);
  const plans = useMemo(() => (project.weeklyPlans ?? []).filter((p) => p.weekStart === weekStart), [project.weeklyPlans, weekStart]);

  const getExecuted = (plan: any) => project.diaries
    .filter((d: any) => d.frontId === plan.frontId && d.date >= plan.weekStart && d.date <= plan.weekEnd)
    .reduce((sum: number, d: any) => sum + (Number(d.production) || 0), 0);

  function resetForm() {
    setEditingId(null); setFrontId(project.fronts[0]?.id ?? ""); setGoal(""); setPlannedQuantity(""); setUnit("m"); setResponsible(""); setNotes("");
  }

  function openEdit(plan: any) {
    setEditingId(plan.id); setWeekStart(plan.weekStart); setFrontId(plan.frontId); setGoal(plan.goal); setPlannedQuantity(String(plan.plannedQuantity)); setUnit(plan.unit); setResponsible(plan.responsible ?? ""); setNotes(plan.notes ?? ""); setShowForm(true);
  }

  function save() {
    if (!frontId || !goal.trim() || !plannedQuantity) return;
    const data = { weekStart, weekEnd, frontId, goal: goal.trim(), plannedQuantity: Number(plannedQuantity), unit, responsible: responsible.trim(), notes: notes.trim() };
    if (editingId) updateWeeklyPlan(editingId, data); else addWeeklyPlan(data);
    setShowForm(false); resetForm();
  }

  return <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div><p className="text-[10px] uppercase tracking-[0.18em] text-[#858a82]">Planejamento</p><h1 className="text-3xl font-semibold tracking-tight">Planejamento semanal</h1><p className="mt-1 text-sm text-[#70756e]">Defina poucas metas e acompanhe o que foi executado.</p></div>
      <div className="flex gap-2"><Button variant="outline" onClick={() => navigate("/")}>Hoje</Button><Button onClick={() => { resetForm(); setShowForm(true); }}>+ Nova meta</Button></div>
    </div>

    <Card className="rounded-none border-0 bg-[#f6f6f3] shadow-[4px_4px_0_#d0d1cb]"><CardContent className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between"><div><p className="text-[10px] uppercase tracking-[0.14em] text-[#858a82]">Semana</p><p className="text-lg font-medium">{formatDate(weekStart, true)} — {formatDate(weekEnd, true)}</p></div><Input className="max-w-[190px] bg-white" type="date" value={weekStart} onChange={(e) => setWeekStart(mondayOf(new Date(`${e.target.value}T12:00:00`)))} /></CardContent></Card>

    {showForm && <Card className="rounded-none border-0 bg-white shadow-[4px_4px_0_#d0d1cb]"><CardContent className="space-y-4 p-5"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">{editingId ? "Alterar meta" : "Nova meta semanal"}</h2><Button variant="ghost" onClick={() => { setShowForm(false); resetForm(); }}>Fechar</Button></div><div className="grid gap-4 md:grid-cols-2"><div><Label>Frente</Label><select className="mt-1 h-10 w-full border bg-white px-3 text-sm" value={frontId} onChange={(e) => setFrontId(e.target.value)}>{project.fronts.map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}</select></div><div><Label>Meta</Label><Input className="mt-1" value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Ex.: Executar drenagem tripla" /></div><div><Label>Quantidade planejada</Label><Input className="mt-1" type="number" min="0" value={plannedQuantity} onChange={(e) => setPlannedQuantity(e.target.value)} /></div><div><Label>Unidade</Label><Input className="mt-1" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="m, m², m³, un..." /></div><div><Label>Responsável (opcional)</Label><Input className="mt-1" value={responsible} onChange={(e) => setResponsible(e.target.value)} /></div><div><Label>Observação (opcional)</Label><Input className="mt-1" value={notes} onChange={(e) => setNotes(e.target.value)} /></div></div><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>Cancelar</Button><Button onClick={save}>Salvar planejamento</Button></div></CardContent></Card>}

    <div className="space-y-4">{plans.map((plan: any) => { const front = project.fronts.find((f: any) => f.id === plan.frontId); const executed = getExecuted(plan); const pct = plan.plannedQuantity > 0 ? Math.min(100, Math.round((executed / plan.plannedQuantity) * 100)) : 0; return <Card key={plan.id} className="rounded-none border-0 bg-[#f6f6f3] shadow-[4px_4px_0_#d0d1cb]"><CardContent className="p-5"><div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"><div><p className="text-[10px] uppercase tracking-[0.14em] text-[#858a82]">{front?.name ?? "Frente"}</p><h2 className="mt-1 text-lg font-semibold">{plan.goal}</h2><p className="mt-1 text-sm text-[#70756e]">Meta: {plan.plannedQuantity} {plan.unit} · Executado: {executed} {plan.unit}</p>{plan.responsible && <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-[#858a82]">Responsável: {plan.responsible}</p>}</div><div className="flex gap-2"><Button variant="outline" onClick={() => openEdit(plan)}>Alterar</Button><Button variant="ghost" onClick={() => deleteWeeklyPlan(plan.id)}>Excluir</Button></div></div><div className="mt-4 h-3 w-full bg-[#dedfd9]"><div className="h-3 bg-[#8da65a]" style={{ width: `${pct}%` }} /></div><div className="mt-2 flex justify-between text-[10px] uppercase tracking-[0.12em] text-[#858a82]"><span>{pct}% da meta</span><span>{Math.max(0, plan.plannedQuantity - executed)} {plan.unit} restantes</span></div>{plan.notes && <p className="mt-3 border-t pt-3 text-sm text-[#70756e]">{plan.notes}</p>}</CardContent></Card> })}{plans.length === 0 && !showForm && <Card className="rounded-none border-0 bg-[#f6f6f3]"><CardContent className="p-8 text-center text-sm text-[#70756e]">Nenhuma meta definida para esta semana.<div className="mt-4"><Button onClick={() => { resetForm(); setShowForm(true); }}>+ Criar primeira meta</Button></div></CardContent></Card>}</div>
  </div>;
}

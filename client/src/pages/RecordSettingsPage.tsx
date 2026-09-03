import { Check, Settings2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { RECORD_CATEGORIES, RECORD_DISPLAYS, loadRecordPreferences, saveRecordPreferences, type RecordCategory, type RecordDisplay } from "@/recordPreferences";

export default function RecordSettingsPage() {
  const [preferences, setPreferences] = useState(loadRecordPreferences);
  const setDisplay = (category: RecordCategory, display: RecordDisplay) => setPreferences((current) => ({ ...current, [category]: display }));
  const save = () => { saveRecordPreferences(preferences); toast.success("Preferências dos registros salvas neste dispositivo"); };

  return <main className="min-h-screen bg-[#f8f5ed] px-5 py-8 text-[#102e46] md:px-10 md:py-12"><div className="mx-auto max-w-5xl">
    <header className="border-b border-[#d8d2c5] pb-7"><p className="font-mono text-[10px] font-bold uppercase tracking-[.2em] text-[#d96b32]">Negócio Fechado · Configuração</p><h1 className="mt-3 font-display text-5xl font-semibold tracking-tight">Registros</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[#617080]">Organize os registros da obra por categoria e defina como cada tipo deve aparecer na interface.</p></header>
    <div className="mt-8 grid gap-5"><Card className="rounded-2xl border-[#d8d2c5] bg-[#fffdf8] shadow-none"><CardContent className="p-6 md:p-8"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center bg-[#102e46] text-white"><Settings2 className="h-5 w-5" /></div><div><h2 className="font-display text-2xl font-semibold">Categorias e visualização</h2><p className="text-xs text-[#617080]">A preferência fica salva localmente e já deixa a estrutura pronta para sincronização por conta.</p></div></div><div className="mt-7 space-y-3">{RECORD_CATEGORIES.map((category) => <div key={category.id} className="grid gap-4 border border-[#d8d2c5] p-4 md:grid-cols-[1fr_auto] md:items-center"><div><p className="text-sm font-bold">{category.label}</p><p className="mt-1 text-xs leading-5 text-[#617080]">{category.description}</p></div><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{RECORD_DISPLAYS.map((display) => <button key={display.id} type="button" onClick={() => setDisplay(category.id, display.id)} className={`inline-flex min-w-[78px] items-center justify-center gap-1.5 border px-3 py-2 text-xs font-semibold ${preferences[category.id] === display.id ? "border-[#102e46] bg-[#102e46] text-white" : "border-[#d8d2c5] bg-[#f8f5ed] text-[#617080] hover:border-[#102e46] hover:text-[#102e46]"}`}>{preferences[category.id] === display.id && <Check className="h-3.5 w-3.5" />}{display.label}</button>)}</div></div>)}</div><div className="mt-7 flex justify-end"><Button onClick={save} className="bg-[#d96b32] text-white hover:bg-[#bd5725]">Salvar preferências</Button></div></CardContent></Card></div>
  </div></main>;
}

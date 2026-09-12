import { Building2, ChevronRight, Plus, Search, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLocalProject } from "@/localStore";
import { usePilotLocation } from "@/pilotRouting";
import { useEffect, useState } from "react";

const CONTEXT_KEY = "nf_access_context_v2";

type Context = { type: "autonomo" | "empresa"; plan: string; role?: "gestor" | "engenheiro" | "encarregado"; companyName?: string };

function readContext(): Context {
  try {
    const raw = localStorage.getItem(CONTEXT_KEY);
    if (raw) return JSON.parse(raw) as Context;
  } catch {
    // fallback abaixo
  }
  return { type: "autonomo", plan: "Autônomo" };
}

export default function StartPage() {
  const { project } = useLocalProject();
  const [, navigate] = usePilotLocation();
  const [context, setContext] = useState<Context>(() => readContext());
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onStorage = () => setContext(readContext());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const role = context.role;
  const canCreate = context.type === "autonomo" || role === "gestor";
  const title = context.type === "empresa" && role === "gestor" ? "Todas as obras" : "Minhas obras";
  const matches = !query.trim() || `${project.name} ${project.location}`.toLowerCase().includes(query.trim().toLowerCase());

  return (
    <main className="min-h-screen bg-brand-cream px-5 py-7 text-brand-navy md:px-10 md:py-10">
      <div className="mx-auto w-full max-w-6xl">
        <header className="flex flex-col gap-5 border-b border-black/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <img src={`${import.meta.env.BASE_URL}icon.svg`} alt="Negócio Fechado" className="h-14 w-14 object-contain" />
            <div>
              <p className="font-display text-2xl font-semibold tracking-tight">Obras</p>
              <p className="mt-1 font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-[#687178]">Negócio Fechado · {context.type === "empresa" ? context.companyName || "Minha empresa" : "Espaço pessoal"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#687178]"><UserRound className="h-4 w-4" />{role ? labelRole(role) : "Autônomo"}</div>
        </header>

        <section className="mt-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-brand-orange">Gestão operacional</p>
            <h1 className="mt-2 font-display text-5xl font-semibold leading-none tracking-tight">{title}</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#687178]">Entre em uma obra para acompanhar o que está acontecendo, registrar informações e consultar a memória operacional.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/campo")} className="rounded-lg border-brand">Ir para Campo</Button>
            {canCreate && <Button onClick={() => navigate("/cadastro")} className="rounded-lg bg-brand-navy text-white hover:bg-[#123d57]"><Plus className="mr-2 h-4 w-4" />Nova obra</Button>}
          </div>
        </section>

        <div className="relative mt-7 max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b9295]" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar obra" className="h-11 rounded-lg border-brand bg-white pl-9" /></div>

        <section className="mt-7 grid gap-5 lg:grid-cols-2">
          {matches ? (
            <Card className="rounded-[1.35rem] border-brand bg-white shadow-[6px_6px_0_#d7d0c4]">
              <CardContent className="p-6 sm:p-7">
                <div className="flex items-start justify-between">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#ede8de] text-brand-navy"><Building2 className="h-5 w-5" /></div>
                  <span className="rounded-full bg-[#e8f0ea] px-3 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#3f654e]">Em andamento</span>
                </div>
                <h2 className="mt-7 font-display text-3xl font-semibold leading-none">{project.name}</h2>
                <p className="mt-2 text-sm text-[#687178]">{project.location}</p>
                <p className="mt-4 text-sm leading-6 text-[#687178]">{project.description}</p>

                <div className="mt-6 grid grid-cols-3 gap-2">
                  <Metric label="Eventos" value="4" />
                  <Metric label="Ocorrências" value="2" />
                  <Metric label="Evidências" value="3" />
                </div>

                <Button onClick={() => navigate("/hoje")} className="mt-6 h-12 w-full rounded-lg bg-brand-navy text-white hover:bg-[#123d57]">Abrir obra <ChevronRight className="ml-1 h-4 w-4" /></Button>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-[1.35rem] border border-dashed border-brand bg-white/50 p-10 text-center text-sm text-[#687178]">Nenhuma obra encontrada.</div>
          )}

          {canCreate && (
            <button type="button" onClick={() => navigate("/cadastro")} className="min-h-[330px] rounded-[1.35rem] border border-dashed border-brand p-8 text-center transition hover:border-brand-orange hover:bg-white">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-brand text-brand-navy"><Plus className="h-5 w-5" /></span>
              <span className="mt-5 block font-display text-2xl font-semibold">Adicionar nova obra</span>
              <span className="mx-auto mt-2 block max-w-xs text-xs leading-5 text-[#687178]">Cada obra terá seu próprio contexto, eventos, evidências, produção e histórico.</span>
            </button>
          )}
        </section>

        <section className="mt-10 grid gap-4 sm:grid-cols-3">
          <QuickLink title="Campo" text="Capturar informação" onClick={() => navigate("/campo")} />
          <QuickLink title="Evidências" text="Fotos, áudios e documentos" onClick={() => navigate("/evidencias")} />
          <QuickLink title="Diário" text="Histórico operacional" onClick={() => navigate("/diario")} />
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-brand-cream p-3"><p className="font-mono text-[8px] font-bold uppercase tracking-[0.14em] text-[#7b8285]">{label}</p><p className="mt-1 font-display text-xl font-semibold">{value}</p></div>;
}

function QuickLink({ title, text, onClick }: { title: string; text: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="rounded-xl border border-brand bg-white p-5 text-left transition hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#d7d0c4]"><p className="font-semibold">{title}</p><p className="mt-1 text-xs text-[#687178]">{text}</p></button>;
}

function labelRole(role: NonNullable<Context["role"]>) {
  if (role === "gestor") return "Gestor";
  if (role === "engenheiro") return "Engenheiro";
  return "Encarregado";
}

import { useMemo } from "react";
import { AlertTriangle, ArrowUpRight, CalendarDays, Check, ClipboardCheck, CircleDot, PackageCheck, Users, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useLocalProject } from "@/localStore";
import { getOperationalAttention } from "@/operationalInsights";
import { usePilotLocation } from "@/pilotRouting";
import InstallAppButton from "@/components/InstallAppButton";

const Kicker = ({ children }: { children: React.ReactNode }) => (
  <p className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-[#737a7b]">{children}</p>
);

const dateLabel = (value: string) => new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

type MetricTone = "green" | "amber" | "red";

const Metric = ({ label, value, detail, icon, tone = "green" }: { label: string; value: string; detail: string; icon: React.ReactNode; tone?: MetricTone }) => {
  const toneClass = tone === "red"
    ? "bg-[#f4d8d4] text-[#b84f42]"
    : tone === "amber"
      ? "bg-[#f1dfc5] text-[#b67b2c]"
      : "bg-[#e5efd0] text-[#789249]";

  return (
    <Card className="rounded-[1rem] border border-brand bg-white shadow-[4px_4px_0_#d7d0c4]">
      <CardContent className="relative p-4 sm:p-5">
        <div className={`absolute right-4 top-4 grid h-8 w-8 place-items-center ${toneClass}`}>{icon}</div>
        <Kicker>{label}</Kicker>
        <p className="mt-3 text-4xl font-semibold tracking-[-0.06em] text-brand-navy">{value}</p>
        <p className="mt-1 text-xs text-[#737a7b]">{detail}</p>
      </CardContent>
    </Card>
  );
};

export default function Home() {
  const [, navigate] = usePilotLocation();
  const { project } = useLocalProject();
  const today = new Date().toISOString().slice(0, 10);
  const pendingActions = project.actions.filter((action) => !action.done);
  const openEvents = project.events.filter((event) => event.status !== "Resolvido");
  const todayEntries = project.diaries.filter((diary) => diary.date.slice(0, 10) === today);
  const attentionItems = useMemo(() => getOperationalAttention(project).slice(0, 3), [project]);
  const activeFronts = project.fronts.filter((front) => front.status === "Atenção" || (front.progress > 0 && front.progress < 100)).slice(0, 3);

  return (
    <main className="min-h-screen bg-brand-cream px-4 py-6 sm:px-7 lg:px-10 lg:py-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-7 border-b border-black/10 pb-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Kicker>Operação de campo</Kicker>
              <h1 className="mt-2 font-display text-5xl font-semibold leading-[0.88] tracking-tight text-brand-navy sm:text-6xl">
                {project.name}
              </h1>
              <p className="mt-3 text-sm text-[#737a7b]">
                {project.description}<span className="mx-2">·</span><span className="font-semibold text-[#789249]">{project.status}</span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              <InstallAppButton />
              <Button type="button" variant="outline" className="h-11 rounded-lg border-brand bg-white text-xs font-semibold uppercase tracking-[0.12em] text-brand-navy" onClick={() => navigate("/acoes")}>
                <CircleDot className="mr-2 h-4 w-4" />Ações
              </Button>
              <Button type="button" className="col-span-2 h-12 rounded-lg bg-brand-navy text-xs font-semibold uppercase tracking-[0.14em] text-white hover:bg-[#123d57] sm:col-span-1" onClick={() => navigate("/diario")}>
                <ClipboardCheck className="mr-2 h-4 w-4" />Registrar o dia
              </Button>
            </div>
          </div>
        </header>

        <section className="mb-7 grid gap-3 sm:grid-cols-3">
          <Metric label="Registros de hoje" value={String(todayEntries.length).padStart(2, "0")} detail="Diários lançados hoje" icon={<CalendarDays className="h-4 w-4" />} />
          <Metric label="Ações pendentes" value={String(pendingActions.length).padStart(2, "0")} detail="Itens a acompanhar" icon={<CircleDot className="h-4 w-4" />} tone="red" />
          <Metric label="Impedimentos" value={String(openEvents.length).padStart(2, "0")} detail="Eventos em tratamento" icon={<AlertTriangle className="h-4 w-4" />} tone="amber" />
        </section>

        <section className="mb-7">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <Kicker>Comece por aqui</Kicker>
              <h2 className="mt-1 font-display text-3xl font-semibold leading-none text-brand-navy">O que pede atenção</h2>
            </div>
            <p className="text-xs text-[#858b8b]">Leitura dos seus registros</p>
          </div>
          {attentionItems.length ? (
            <div className="grid gap-3 md:grid-cols-3">
              {attentionItems.map((item) => (
                <button key={item.id} type="button" onClick={() => navigate(item.path)} className={`group min-h-32 rounded-[.85rem] border bg-white p-4 text-left shadow-[4px_4px_0_#d7d0c4] transition hover:-translate-y-0.5 ${item.tone === "critical" ? "border-l-4 border-l-[#c95a4a] border-[#e1d8d1]" : item.tone === "warning" ? "border-l-4 border-l-[#d89b45] border-[#e1d8d1]" : "border-l-4 border-l-[#8da65a] border-[#e1d8d1]"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <span className={`grid h-8 min-w-8 place-items-center px-2 text-sm font-semibold ${item.tone === "critical" ? "bg-[#c95a4a] text-white" : item.tone === "warning" ? "bg-[#f1dfc5] text-[#b67b2c]" : "bg-[#e5efd0] text-[#789249]"}`}>{String(item.count).padStart(2, "0")}</span>
                    <ArrowUpRight className="h-4 w-4 text-[#858b8b]" />
                  </div>
                  <h3 className="mt-4 text-xs font-bold uppercase tracking-[0.08em] text-brand-navy">{item.label}</h3>
                  <p className="mt-1.5 text-xs leading-5 text-[#737a7b]">{item.description}</p>
                </button>
              ))}
            </div>
          ) : (
            <Card className="rounded-[.85rem] border border-brand border-l-4 border-l-[#8da65a] bg-white shadow-[4px_4px_0_#d7d0c4]">
              <CardContent className="flex items-center gap-3 p-5"><span className="grid h-9 w-9 place-items-center bg-[#e5efd0] text-[#789249]"><Check className="h-4 w-4" /></span><p className="text-sm font-semibold text-brand-navy">Não há vencimentos, eventos críticos ou frentes ativas sem atualização recente.</p></CardContent>
            </Card>
          )}
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section>
            <div className="mb-3 flex items-end justify-between">
              <div><Kicker>Campo</Kicker><h2 className="mt-1 font-display text-3xl font-semibold leading-none text-brand-navy">Registros recentes</h2></div>
              <Button variant="ghost" className="text-xs font-semibold text-brand-navy" onClick={() => navigate("/diario")}>Abrir diário <ArrowUpRight className="ml-2 h-4 w-4" /></Button>
            </div>
            <Card className="rounded-[1rem] border border-brand bg-white shadow-[4px_4px_0_#d7d0c4]">
              <CardContent className="p-0">
                {project.diaries.length ? (
                  <div className="divide-y divide-black/10">
                    {project.diaries.slice(0, 4).map((diary) => <div key={diary.id} className="p-4 sm:p-5"><Kicker>{dateLabel(diary.date)} · {diary.service}</Kicker><p className="mt-2 text-sm leading-6 text-[#50585a]">{diary.summary}</p></div>)}
                  </div>
                ) : (
                  <div className="p-5"><Kicker>Seu primeiro registro</Kicker><p className="mt-2 text-sm leading-6 text-[#737a7b]">Registre o que aconteceu no campo para começar o histórico da obra.</p><Button onClick={() => navigate("/diario")} className="mt-4 rounded-lg bg-brand-navy text-white">Abrir diário</Button></div>
                )}
              </CardContent>
            </Card>
          </section>

          <section>
            <div className="mb-3 flex items-end justify-between">
              <div><Kicker>Frentes em andamento</Kicker><h2 className="mt-1 font-display text-3xl font-semibold leading-none text-brand-navy">Onde acompanhar</h2></div>
              <Button variant="ghost" className="text-xs font-semibold text-brand-navy" onClick={() => navigate("/frentes")}>Ver frentes <ArrowUpRight className="ml-2 h-4 w-4" /></Button>
            </div>
            <div className="space-y-3">
              {activeFronts.map((front) => <Card key={front.id} className="rounded-[1rem] border border-brand bg-white shadow-[4px_4px_0_#d7d0c4]"><CardContent className="p-4 sm:p-5"><div className="flex items-start justify-between gap-4"><div><Kicker>{front.code} · {front.status}</Kicker><h3 className="mt-2 text-sm font-bold uppercase tracking-[0.06em] text-brand-navy">{front.name}</h3><p className="mt-1.5 text-xs leading-5 text-[#737a7b]">{front.detail}</p></div><span className="text-2xl font-semibold tracking-tight text-brand-navy">{front.progress}%</span></div><Progress value={front.progress} className="mt-4 h-1.5 bg-[#dedbd3]" /></CardContent></Card>)}
              {!activeFronts.length && <Card className="rounded-[1rem] border border-brand bg-white shadow-[4px_4px_0_#d7d0c4]"><CardContent className="p-5 text-sm text-[#737a7b]">Nenhuma frente está marcada como em andamento no momento.</CardContent></Card>}
            </div>
          </section>
        </div>

        <section className="mt-7">
          <div className="mb-3"><Kicker>Controle direto de campo</Kicker><h2 className="mt-1 font-display text-3xl font-semibold leading-none text-brand-navy">Registros que você usa</h2></div>
          <div className="grid gap-3 sm:grid-cols-3">
            <button type="button" onClick={() => navigate("/materiais")} className="text-left">
              <Card className="h-full rounded-[1rem] border border-brand bg-brand-navy text-white shadow-[4px_4px_0_#d7d0c4] transition hover:-translate-y-0.5"><CardContent className="p-5"><PackageCheck className="h-5 w-5 text-[#b8d36a]" /><h3 className="mt-4 text-sm font-bold uppercase tracking-[0.08em]">Materiais</h3><p className="mt-1.5 text-xs leading-5 text-white/65">Registrar recebimentos e destino por trecho.</p></CardContent></Card>
            </button>
            <button type="button" onClick={() => navigate("/equipe")} className="text-left">
              <Card className="h-full rounded-[1rem] border border-brand bg-white shadow-[4px_4px_0_#d7d0c4] transition hover:-translate-y-0.5"><CardContent className="p-5"><Users className="h-5 w-5 text-[#789249]" /><h3 className="mt-4 text-sm font-bold uppercase tracking-[0.08em] text-brand-navy">Equipe</h3><p className="mt-1.5 text-xs leading-5 text-[#737a7b]">Definir frente e situação diária das pessoas.</p></CardContent></Card>
            </button>
            <button type="button" onClick={() => navigate("/maquinas")} className="text-left">
              <Card className="h-full rounded-[1rem] border border-brand bg-white shadow-[4px_4px_0_#d7d0c4] transition hover:-translate-y-0.5"><CardContent className="p-5"><Wrench className="h-5 w-5 text-[#b67b2c]" /><h3 className="mt-4 text-sm font-bold uppercase tracking-[0.08em] text-brand-navy">Máquinas</h3><p className="mt-1.5 text-xs leading-5 text-[#737a7b]">Lançar horímetro, uso, parada ou manutenção.</p></CardContent></Card>
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

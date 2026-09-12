import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  BriefcaseBusiness,
  Building2,
  Check,
  ChevronRight,
  ClipboardList,
  Crown,
  LogIn,
  LogOut,
  UserRound,
  Users,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getCurrentUser, signInWithPassword, signOut, signUpWithPassword } from "@/syncService";
import { toast } from "sonner";
import { usePilotLocation } from "@/pilotRouting";

const iconSrc = `${import.meta.env.BASE_URL}icon.svg`;
const CONTEXT_KEY = "nf_access_context_v1";

type ContextType = "autonomo" | "empresa";
type Role = "gestor" | "engenheiro" | "encarregado";
type Step = "auth" | "context" | "plan" | "role" | "central";

type AccessContext = {
  type: ContextType;
  plan: string;
  role?: Role;
  companyName?: string;
};

function readContext(): AccessContext | null {
  try {
    const raw = localStorage.getItem(CONTEXT_KEY);
    return raw ? (JSON.parse(raw) as AccessContext) : null;
  } catch {
    return null;
  }
}

function saveContext(context: AccessContext) {
  localStorage.setItem(CONTEXT_KEY, JSON.stringify(context));
}

export default function AccessPage() {
  const [, navigate] = usePilotLocation();
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>("auth");
  const [context, setContext] = useState<AccessContext | null>(null);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void getCurrentUser().then((current) => {
      const saved = readContext();
      setUser(current);
      setContext(saved);
      setStep(current ? (saved ? "central" : "context") : "auth");
      setLoading(false);
    });
  }, []);

  const authenticate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");
    if (!email || password.length < 6) {
      toast.error("Informe e-mail e senha com pelo menos 6 caracteres.");
      return;
    }
    setBusy(true);
    try {
      const current = creating
        ? await signUpWithPassword(email, password)
        : await signInWithPassword(email, password);
      if (creating && current && !current.email_confirmed_at) {
        toast.success("Conta criada. Confirme seu e-mail para entrar.");
        return;
      }
      setUser(current);
      setStep(readContext() ? "central" : "context");
      toast.success(creating ? "Conta criada." : "Login realizado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível acessar sua conta.");
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    await signOut();
    setUser(null);
    setContext(null);
    setStep("auth");
    toast.success("Sessão encerrada.");
  };

  const chooseContext = (type: ContextType) => {
    const next: AccessContext = { type, plan: "" };
    setContext(next);
    setStep("plan");
  };

  const choosePlan = (plan: string) => {
    const next = { ...(context as AccessContext), plan };
    setContext(next);
    if (next.type === "empresa") setStep("role");
    else {
      saveContext(next);
      setStep("central");
    }
  };

  const chooseRole = (role: Role) => {
    const next = { ...(context as AccessContext), role, companyName: "Minha empresa" };
    setContext(next);
    saveContext(next);
    setStep("central");
  };

  if (loading) return <Loading />;
  if (!user) return <AuthScreen creating={creating} setCreating={setCreating} busy={busy} onSubmit={authenticate} />;
  if (step === "context") return <ContextScreen onSelect={chooseContext} />;
  if (step === "plan") return <PlanScreen context={context!} onSelect={choosePlan} />;
  if (step === "role") return <RoleScreen onSelect={chooseRole} />;

  return <CentralScreen user={user} context={context!} onLogout={() => void logout()} navigate={navigate} />;
}

function Loading() {
  return <div className="grid min-h-screen place-items-center bg-brand-cream"><img src={iconSrc} alt="Negócio Fechado" className="h-16 w-16 animate-pulse" /></div>;
}

function Shell({ children, eyebrow = "Negócio Fechado" }: { children: ReactNode; eyebrow?: string }) {
  return (
    <main className="min-h-screen bg-brand-cream px-5 py-8 text-brand-navy sm:py-12">
      <div className="mx-auto w-full max-w-5xl">
        <header className="text-center">
          <img src={iconSrc} alt="Negócio Fechado" className="mx-auto h-14 w-14 rounded-xl object-contain" />
          <p className="mt-4 font-mono text-[9px] font-bold uppercase tracking-[0.24em] text-brand-orange">{eyebrow}</p>
        </header>
        {children}
      </div>
    </main>
  );
}

function AuthScreen({ creating, setCreating, busy, onSubmit }: { creating: boolean; setCreating: (value: boolean) => void; busy: boolean; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <Shell>
      <div className="mx-auto mt-6 max-w-md">
        <Card className="rounded-[1.35rem] border-brand bg-white shadow-[7px_7px_0_#d7d0c4]">
          <CardContent className="p-6 sm:p-7">
            <p className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[#687178]">Acesso central</p>
            <h1 className="mt-3 font-display text-[2.4rem] font-semibold leading-none">{creating ? "Crie sua conta" : "Entre na sua conta"}</h1>
            <p className="mt-3 text-sm leading-6 text-[#687178]">Uma conta para sua identidade profissional e para os ambientes de obras que você participa.</p>
            <form onSubmit={onSubmit} className="mt-6 space-y-3">
              <Input name="email" type="email" placeholder="Seu e-mail" autoComplete="email" className="h-12 rounded-lg border-brand bg-brand-cream px-4" />
              <Input name="password" type="password" placeholder="Senha (mínimo 6 caracteres)" autoComplete={creating ? "new-password" : "current-password"} className="h-12 rounded-lg border-brand bg-brand-cream px-4" />
              <Button disabled={busy} className="h-12 w-full rounded-lg bg-brand-navy font-semibold text-white hover:bg-[#123d57]">
                <LogIn className="mr-2 h-4 w-4" />{busy ? "Processando..." : creating ? "Criar conta" : "Entrar"}
              </Button>
            </form>
            <button type="button" onClick={() => setCreating(!creating)} className="mt-4 w-full text-sm font-medium underline-offset-4 hover:text-brand-orange hover:underline">
              {creating ? "Já tenho uma conta" : "Ainda não tenho conta"}
            </button>
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}

function ContextScreen({ onSelect }: { onSelect: (type: ContextType) => void }) {
  return (
    <Shell>
      <div className="mx-auto mt-8 max-w-3xl text-center">
        <p className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-brand-orange">Primeiro acesso</p>
        <h1 className="mt-2 font-display text-5xl font-semibold tracking-tight">Como você vai usar?</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#687178]">Escolha o contexto. O acesso e a experiência serão adaptados ao seu uso.</p>
      </div>
      <div className="mx-auto mt-8 grid max-w-3xl gap-5 md:grid-cols-2">
        <ChoiceCard icon={<UserRound />} title="Autônomo" text="Quero gerenciar minhas próprias obras e manter meu perfil profissional." onClick={() => onSelect("autonomo")} />
        <ChoiceCard icon={<Building2 />} title="Empresa" text="Quero trabalhar em obras de uma empresa com usuários e permissões." onClick={() => onSelect("empresa")} />
      </div>
    </Shell>
  );
}

function PlanScreen({ context, onSelect }: { context: AccessContext; onSelect: (plan: string) => void }) {
  const plans = context.type === "autonomo"
    ? [{ name: "Autônomo", price: "Essencial", description: "Perfil, obras, Campo e gestão operacional.", features: ["Perfil profissional", "Obras", "Campo", "Diário e evidências"] }]
    : [{ name: "Empresa", price: "Profissional", description: "Gestão de obras com equipe e permissões por função.", features: ["Obras da empresa", "Campo", "Usuários e funções", "Gestão operacional"] }];
  return (
    <Shell>
      <div className="mx-auto mt-8 max-w-3xl text-center">
        <p className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-brand-orange">Plano</p>
        <h1 className="mt-2 font-display text-5xl font-semibold tracking-tight">Escolha seu ambiente</h1>
        <p className="mt-3 text-sm text-[#687178]">Nesta primeira versão, o plano é configurado no ambiente. A cobrança será conectada depois.</p>
      </div>
      <div className="mx-auto mt-8 max-w-md">
        {plans.map((plan) => (
          <Card key={plan.name} className="rounded-[1.35rem] border-brand bg-white shadow-[7px_7px_0_#d7d0c4]">
            <CardContent className="p-7">
              <div className="flex items-start justify-between"><div className="grid h-11 w-11 place-items-center bg-[#ede8de] text-brand-navy"><Crown className="h-5 w-5" /></div><span className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-brand-orange">{plan.price}</span></div>
              <h2 className="mt-6 font-display text-3xl font-semibold">{plan.name}</h2>
              <p className="mt-2 text-sm leading-6 text-[#687178]">{plan.description}</p>
              <div className="mt-5 space-y-2">{plan.features.map((feature) => <div key={feature} className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-brand-orange" />{feature}</div>)}</div>
              <Button onClick={() => onSelect(plan.name)} className="mt-7 h-11 w-full rounded-lg bg-brand-navy text-white hover:bg-[#123d57]">Continuar <ChevronRight className="ml-1 h-4 w-4" /></Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </Shell>
  );
}

function RoleScreen({ onSelect }: { onSelect: (role: Role) => void }) {
  return (
    <Shell>
      <div className="mx-auto mt-8 max-w-3xl text-center">
        <p className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-brand-orange">Empresa</p>
        <h1 className="mt-2 font-display text-5xl font-semibold tracking-tight">Qual é sua função?</h1>
        <p className="mt-3 text-sm text-[#687178]">Isso define quais áreas aparecerão no seu acesso central.</p>
      </div>
      <div className="mx-auto mt-8 grid max-w-4xl gap-4 md:grid-cols-3">
        <ChoiceCard icon={<Crown />} title="Gestor" text="Visão de todas as obras, usuários e indicadores." onClick={() => onSelect("gestor")} />
        <ChoiceCard icon={<BriefcaseBusiness />} title="Engenheiro" text="Obras atribuídas, gestão operacional e Campo." onClick={() => onSelect("engenheiro")} />
        <ChoiceCard icon={<Wrench />} title="Encarregado" text="Campo e registros operacionais da obra atribuída." onClick={() => onSelect("encarregado")} />
      </div>
    </Shell>
  );
}

function CentralScreen({ user, context, onLogout, navigate }: { user: { email?: string }; context: AccessContext; onLogout: () => void; navigate: (path: string) => void }) {
  const role = context.role;
  const isAutonomo = context.type === "autonomo";
  const canWorks = isAutonomo || role === "gestor" || role === "engenheiro";
  const canField = isAutonomo || role === "gestor" || role === "engenheiro" || role === "encarregado";
  const subtitle = isAutonomo ? "Autônomo" : `${context.companyName || "Minha empresa"} · ${labelRole(role)}`;

  return (
    <Shell>
      <div className="mt-8 flex flex-col gap-4 rounded-[1.35rem] border border-brand bg-white p-5 shadow-[5px_5px_0_#d7d0c4] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-orange text-white"><UserRound className="h-5 w-5" /></div><div><p className="text-sm font-bold">{user.email || "Usuário"}</p><p className="mt-0.5 text-xs text-[#687178]">{subtitle} · Plano {context.plan}</p></div></div>
        <Button variant="outline" onClick={onLogout} className="rounded-lg border-brand"><LogOut className="mr-2 h-4 w-4" />Sair</Button>
      </div>

      <div className="mt-8"><p className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-brand-orange">Acesso central</p><h1 className="mt-2 font-display text-5xl font-semibold tracking-tight">Seu ambiente</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[#687178]">A mesma conta. Módulos diferentes conforme seu contexto e sua função.</p></div>

      <div className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isAutonomo && <AccessCard icon={<UserRound />} title="Meu perfil" text="Sua identidade profissional, experiência e portfólio." onClick={() => navigate("/meu-perfil")} />}
        {canWorks && <AccessCard icon={<Building2 />} title={role === "gestor" ? "Todas as obras" : "Minhas obras"} text={role === "gestor" ? "Visão geral da empresa e acesso individual a cada obra." : "Dashboard, registros, produção, custos e histórico."} onClick={() => navigate("/obras")} />}
        {canField && <AccessCard icon={<ClipboardList />} title="Campo" text="Registre áudio, texto, fotos e documentos. Transforme informação em eventos da obra." onClick={() => navigate("/campo")} />}
        {role === "gestor" && <AccessCard icon={<Users />} title="Equipe e acessos" text="Gerencie usuários, funções e permissões da empresa." onClick={() => toast.info("Gestão de usuários será conectada ao backend na próxima etapa.")} />}
      </div>

      <div className="mt-8 rounded-xl border border-dashed border-brand bg-white/60 p-5 text-sm leading-6 text-[#687178]"><strong className="text-brand-navy">Regra do produto:</strong> Campo e Obras trabalham sobre a mesma memória operacional. O Campo é a entrada; o evento da obra é o registro central.</div>
    </Shell>
  );
}

function ChoiceCard({ icon, title, text, onClick }: { icon: ReactNode; title: string; text: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="group text-left"><Card className="h-full rounded-[1.25rem] border-brand bg-white shadow-[5px_5px_0_#d7d0c4] transition group-hover:-translate-y-0.5 group-hover:shadow-[7px_7px_0_#d7d0c4]"><CardContent className="p-6"><div className="grid h-11 w-11 place-items-center bg-[#ede8de] text-brand-navy">{icon}</div><h2 className="mt-6 font-display text-2xl font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-[#687178]">{text}</p><span className="mt-5 inline-flex items-center text-xs font-bold uppercase tracking-[0.14em] text-brand-orange">Continuar <ChevronRight className="ml-1 h-4 w-4" /></span></CardContent></Card></button>;
}

function AccessCard({ icon, title, text, onClick }: { icon: ReactNode; title: string; text: string; onClick: () => void }) {
  return <Card className="group rounded-[1.25rem] border-brand bg-white shadow-[4px_4px_0_#d7d0c4] transition hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#d7d0c4]"><CardContent className="p-6"><div className="grid h-11 w-11 place-items-center bg-[#ede8de] text-brand-navy">{icon}</div><h2 className="mt-5 font-display text-2xl font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-[#687178]">{text}</p><Button onClick={onClick} className="mt-5 h-10 w-full rounded-lg bg-brand-navy text-white hover:bg-[#123d57]">Abrir <ChevronRight className="ml-1 h-4 w-4" /></Button></CardContent></Card>;
}

function labelRole(role?: Role) {
  if (role === "gestor") return "Gestor";
  if (role === "engenheiro") return "Engenheiro";
  if (role === "encarregado") return "Encarregado";
  return "Usuário";
}

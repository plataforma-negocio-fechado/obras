import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  BarChart3,
  BriefcaseBusiness,
  Building2,
  Check,
  ChevronRight,
  ClipboardList,
  Crown,
  FileText,
  LogIn,
  LogOut,
  Settings2,
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
const CONTEXT_KEY = "nf_access_context_v2";
const DEMO_USER_KEY = "nf_demo_user_v1";

type ContextType = "autonomo" | "empresa";
type Role = "gestor" | "engenheiro" | "encarregado";
type Step = "auth" | "context" | "plan" | "role" | "central";

type AccessContext = {
  type: ContextType;
  plan: string;
  role?: Role;
  companyName?: string;
};

type AccessUser = { email?: string };

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

function readDemoUser(): AccessUser | null {
  try {
    const raw = localStorage.getItem(DEMO_USER_KEY);
    return raw ? (JSON.parse(raw) as AccessUser) : null;
  } catch {
    return null;
  }
}

function saveDemoUser(email: string) {
  localStorage.setItem(DEMO_USER_KEY, JSON.stringify({ email }));
}

export default function AccessPage() {
  const [, navigate] = usePilotLocation();
  const [user, setUser] = useState<AccessUser | null>(null);
  const [context, setContext] = useState<AccessContext | null>(null);
  const [step, setStep] = useState<Step>("auth");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void getCurrentUser().then((current) => {
      const localUser = current ?? readDemoUser();
      const saved = readContext();
      setUser(localUser);
      setContext(saved);
      setStep(localUser ? (saved ? "central" : "context") : "auth");
      setLoading(false);
    });
  }, []);

  const authenticate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim().toLowerCase();
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
      const saved = readContext();
      setContext(saved);
      setStep(saved ? "central" : "context");
      toast.success(creating ? "Conta criada." : "Login realizado.");
    } catch (error) {
      // Permite que a interface completa seja explorada mesmo sem backend de autenticação configurado.
      saveDemoUser(email);
      setUser({ email });
      const saved = readContext();
      setContext(saved);
      setStep(saved ? "central" : "context");
      toast.info("Ambiente local ativado para teste. A conta real será usada quando o serviço de autenticação estiver disponível.");
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    try {
      await signOut();
    } catch {
      // Sessão local continua podendo ser encerrada mesmo sem Supabase.
    }
    localStorage.removeItem(DEMO_USER_KEY);
    localStorage.removeItem(CONTEXT_KEY);
    setUser(null);
    setContext(null);
    setStep("auth");
    toast.success("Sessão encerrada.");
  };

  const chooseContext = (type: ContextType) => {
    setContext({ type, plan: "" });
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

  const resetEnvironment = () => {
    localStorage.removeItem(CONTEXT_KEY);
    setContext(null);
    setStep("context");
  };

  if (loading) return <Loading />;
  if (!user) return <AuthScreen creating={creating} setCreating={setCreating} busy={busy} onSubmit={authenticate} />;
  if (step === "context") return <ContextScreen onSelect={chooseContext} />;
  if (step === "plan") return <PlanScreen context={context!} onSelect={choosePlan} />;
  if (step === "role") return <RoleScreen onSelect={chooseRole} />;

  return (
    <CentralScreen
      user={user}
      context={context!}
      onLogout={() => void logout()}
      onReset={resetEnvironment}
      navigate={navigate}
    />
  );
}

function Loading() {
  return (
    <div className="grid min-h-screen place-items-center bg-brand-cream">
      <img src={iconSrc} alt="Negócio Fechado" className="h-16 w-16 animate-pulse" />
    </div>
  );
}

function Shell({ children, eyebrow = "Negócio Fechado" }: { children: ReactNode; eyebrow?: string }) {
  return (
    <main className="min-h-screen bg-brand-cream px-5 py-8 text-brand-navy sm:py-12">
      <div className="mx-auto w-full max-w-6xl">
        <header className="text-center">
          <img src={iconSrc} alt="Negócio Fechado" className="mx-auto h-14 w-14 rounded-xl object-contain" />
          <p className="mt-4 font-mono text-[9px] font-bold uppercase tracking-[0.24em] text-brand-orange">{eyebrow}</p>
        </header>
        {children}
      </div>
    </main>
  );
}

function AuthScreen({
  creating,
  setCreating,
  busy,
  onSubmit,
}: {
  creating: boolean;
  setCreating: (value: boolean) => void;
  busy: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Shell>
      <div className="mx-auto mt-10 grid max-w-5xl items-center gap-10 lg:grid-cols-[1.05fr_.75fr]">
        <div className="hidden lg:block">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-brand-orange">Informação pra quem decide.</p>
          <h1 className="mt-4 max-w-2xl font-display text-6xl font-semibold leading-[0.92] tracking-tight">A memória operacional da sua obra.</h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-[#687178]">Campo, obras, evidências, produção e gestão em um único ambiente. A comunicação continua simples; a informação deixa de se perder.</p>
        </div>
        <Card className="rounded-[1.35rem] border-brand bg-white shadow-[7px_7px_0_#d7d0c4]">
          <CardContent className="p-6 sm:p-8">
            <p className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[#687178]">Acesso central</p>
            <h1 className="mt-3 font-display text-[2.5rem] font-semibold leading-none">{creating ? "Crie sua conta" : "Entre na sua conta"}</h1>
            <p className="mt-3 text-sm leading-6 text-[#687178]">Uma conta para sua identidade e para os ambientes de obras dos quais você participa.</p>
            <form onSubmit={onSubmit} className="mt-6 space-y-3">
              <Input name="email" type="email" placeholder="Seu e-mail" autoComplete="email" className="h-12 rounded-lg border-brand bg-brand-cream px-4" />
              <Input name="password" type="password" placeholder="Senha (mínimo 6 caracteres)" autoComplete={creating ? "new-password" : "current-password"} className="h-12 rounded-lg border-brand bg-brand-cream px-4" />
              <Button disabled={busy} className="h-12 w-full rounded-lg bg-brand-navy font-semibold text-white hover:bg-[#123d57]">
                <LogIn className="mr-2 h-4 w-4" />
                {busy ? "Processando..." : creating ? "Criar conta" : "Entrar"}
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
      <div className="mx-auto mt-10 max-w-3xl text-center">
        <p className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-brand-orange">Primeiro acesso</p>
        <h1 className="mt-2 font-display text-5xl font-semibold tracking-tight">Como você vai usar?</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#687178]">Primeiro definimos o contexto. Depois o plano e, se for empresa, a função do usuário.</p>
      </div>
      <div className="mx-auto mt-10 grid max-w-4xl gap-5 md:grid-cols-2">
        <ChoiceCard icon={<UserRound />} title="Autônomo" text="Gerencio minhas próprias obras, meu perfil profissional e meu Campo." onClick={() => onSelect("autonomo")} />
        <ChoiceCard icon={<Building2 />} title="Empresa" text="Minha equipe trabalha em obras com usuários, funções e permissões." onClick={() => onSelect("empresa")} />
      </div>
    </Shell>
  );
}

function PlanScreen({ context, onSelect }: { context: AccessContext; onSelect: (plan: string) => void }) {
  const plan = context.type === "autonomo"
    ? { name: "Autônomo", label: "Essencial", description: "Tudo para organizar suas obras sem montar uma estrutura empresarial.", features: ["Perfil profissional", "Obras", "Campo", "Diário e evidências", "Gestão operacional"] }
    : { name: "Empresa", label: "Profissional", description: "Gestão de obras com equipe, permissões e visão operacional.", features: ["Obras da empresa", "Campo", "Usuários e funções", "Gestão operacional", "Indicadores"] };

  return (
    <Shell>
      <div className="mx-auto mt-10 max-w-3xl text-center">
        <p className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-brand-orange">Plano</p>
        <h1 className="mt-2 font-display text-5xl font-semibold tracking-tight">Seu ambiente de trabalho</h1>
        <p className="mt-3 text-sm text-[#687178]">O catálogo comercial será conectado depois. Agora vamos fazer a experiência do produto funcionar.</p>
      </div>
      <div className="mx-auto mt-10 max-w-md">
        <Card className="rounded-[1.35rem] border-brand bg-white shadow-[7px_7px_0_#d7d0c4]">
          <CardContent className="p-7">
            <div className="flex items-start justify-between">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#ede8de] text-brand-navy"><Crown className="h-5 w-5" /></div>
              <span className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-brand-orange">{plan.label}</span>
            </div>
            <h2 className="mt-6 font-display text-3xl font-semibold">{plan.name}</h2>
            <p className="mt-2 text-sm leading-6 text-[#687178]">{plan.description}</p>
            <div className="mt-5 space-y-2">{plan.features.map((feature) => <div key={feature} className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-brand-orange" />{feature}</div>)}</div>
            <Button onClick={() => onSelect(plan.name)} className="mt-7 h-11 w-full rounded-lg bg-brand-navy text-white hover:bg-[#123d57]">Continuar <ChevronRight className="ml-1 h-4 w-4" /></Button>
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}

function RoleScreen({ onSelect }: { onSelect: (role: Role) => void }) {
  return (
    <Shell>
      <div className="mx-auto mt-10 max-w-3xl text-center">
        <p className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-brand-orange">Empresa</p>
        <h1 className="mt-2 font-display text-5xl font-semibold tracking-tight">Qual é sua função?</h1>
        <p className="mt-3 text-sm text-[#687178]">Cargo não é plano. A função define o que este usuário pode fazer dentro da empresa.</p>
      </div>
      <div className="mx-auto mt-10 grid max-w-5xl gap-4 md:grid-cols-3">
        <ChoiceCard icon={<Crown />} title="Gestor" text="Todas as obras, visão geral, equipe, indicadores e configurações." onClick={() => onSelect("gestor")} />
        <ChoiceCard icon={<BriefcaseBusiness />} title="Engenheiro" text="Obras atribuídas, dashboard operacional e Campo." onClick={() => onSelect("engenheiro")} />
        <ChoiceCard icon={<Wrench />} title="Encarregado" text="Campo e registros operacionais das obras atribuídas." onClick={() => onSelect("encarregado")} />
      </div>
    </Shell>
  );
}

function CentralScreen({
  user,
  context,
  onLogout,
  onReset,
  navigate,
}: {
  user: AccessUser;
  context: AccessContext;
  onLogout: () => void;
  onReset: () => void;
  navigate: (path: string) => void;
}) {
  const isAutonomo = context.type === "autonomo";
  const role = context.role;
  const roleLabel = role ? labelRole(role) : "Autônomo";
  const subtitle = isAutonomo ? "Espaço pessoal" : `${context.companyName || "Minha empresa"} · ${roleLabel}`;

  const cards = isAutonomo
    ? [
        { icon: <UserRound />, title: "Meu perfil", text: "Identidade profissional, experiência e portfólio.", path: "/meu-perfil" },
        { icon: <Building2 />, title: "Minhas obras", text: "Acesse seus dashboards, registros, produção e histórico.", path: "/obras" },
        { icon: <ClipboardList />, title: "Campo", text: "Registre áudio, texto, foto e documento e transforme em eventos.", path: "/campo" },
      ]
    : role === "gestor"
      ? [
          { icon: <BarChart3 />, title: "Visão geral", text: "Acompanhe todas as obras, produção, custos e pontos de atenção.", path: "/hoje" },
          { icon: <Building2 />, title: "Todas as obras", text: "Entre em qualquer obra da empresa e veja sua operação.", path: "/obras" },
          { icon: <ClipboardList />, title: "Campo", text: "Consulte e registre informações operacionais.", path: "/campo" },
          { icon: <Users />, title: "Equipe", text: "Usuários, funções e participação nas obras.", path: "/equipe" },
          { icon: <Settings2 />, title: "Configurações", text: "Preferências e configurações do ambiente.", path: "/preferencias" },
        ]
      : role === "engenheiro"
        ? [
            { icon: <Building2 />, title: "Minhas obras", text: "Dashboard, edição, produção, custos, materiais e histórico.", path: "/obras" },
            { icon: <ClipboardList />, title: "Campo", text: "Capture e organize informações das obras atribuídas.", path: "/campo" },
            { icon: <FileText />, title: "Diário", text: "Acompanhe e edite os registros operacionais.", path: "/diario" },
          ]
        : [
            { icon: <ClipboardList />, title: "Campo", text: "Envie informações da obra por áudio, texto, foto ou documento.", path: "/campo" },
            { icon: <Building2 />, title: "Minha obra", text: "Consulte a obra atribuída e o histórico disponível para sua função.", path: "/obras" },
          ];

  return (
    <Shell eyebrow="Acesso Central">
      <div className="mt-8 flex flex-col gap-4 rounded-[1.35rem] border border-brand bg-white p-5 shadow-[5px_5px_0_#d7d0c4] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-orange text-white"><UserRound className="h-5 w-5" /></div>
          <div><p className="text-sm font-bold">{user.email || "Usuário"}</p><p className="mt-0.5 text-xs text-[#687178]">{subtitle} · Plano {context.plan}</p></div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onReset} className="rounded-lg border-brand">Trocar ambiente</Button>
          <Button variant="outline" onClick={onLogout} className="rounded-lg border-brand"><LogOut className="mr-2 h-4 w-4" />Sair</Button>
        </div>
      </div>

      <div className="mt-10">
        <p className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-brand-orange">Acesso central</p>
        <h1 className="mt-2 font-display text-5xl font-semibold tracking-tight">Seu ambiente</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#687178]">Uma única conta. A experiência muda conforme o contexto, a função e as obras às quais você tem acesso.</p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => <AccessCard key={card.title} icon={card.icon} title={card.title} text={card.text} onClick={() => navigate(card.path)} />)}
      </div>

      {!isAutonomo && (
        <div className="mt-8 rounded-[1.35rem] border border-brand bg-[#102e46] p-6 text-white shadow-[5px_5px_0_#d7d0c4]">
          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[#f08a55]">Arquitetura</p>
          <h2 className="mt-2 font-display text-3xl font-semibold">Pessoa → Empresa → Função → Obra</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/75">A permissão não fica presa ao plano. O gestor enxerga a empresa; o engenheiro opera suas obras; o encarregado trabalha principalmente pelo Campo.</p>
        </div>
      )}
    </Shell>
  );
}

function ChoiceCard({ icon, title, text, onClick }: { icon: ReactNode; title: string; text: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="group text-left">
      <Card className="h-full rounded-[1.35rem] border-brand bg-white transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-[7px_7px_0_#d7d0c4]">
        <CardContent className="p-7">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#ede8de] text-brand-navy">{icon}</div>
          <h2 className="mt-6 font-display text-3xl font-semibold">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-[#687178]">{text}</p>
          <div className="mt-6 flex items-center text-xs font-bold text-brand-orange">Continuar <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" /></div>
        </CardContent>
      </Card>
    </button>
  );
}

function AccessCard({ icon, title, text, onClick }: { icon: ReactNode; title: string; text: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="group text-left">
      <Card className="h-full rounded-[1.25rem] border-brand bg-white transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-[6px_6px_0_#d7d0c4]">
        <CardContent className="p-6">
          <div className="flex items-start justify-between"><div className="grid h-11 w-11 place-items-center rounded-xl bg-[#ede8de] text-brand-navy">{icon}</div><ChevronRight className="h-5 w-5 text-[#9ba1a5] transition-transform group-hover:translate-x-1 group-hover:text-brand-orange" /></div>
          <h2 className="mt-6 font-display text-2xl font-semibold">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-[#687178]">{text}</p>
        </CardContent>
      </Card>
    </button>
  );
}

function labelRole(role?: Role) {
  if (role === "gestor") return "Gestor";
  if (role === "engenheiro") return "Engenheiro";
  if (role === "encarregado") return "Encarregado";
  return "Usuário";
}

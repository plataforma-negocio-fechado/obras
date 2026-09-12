import { useEffect, useState, type FormEvent } from "react";
import { Building2, Cloud, Loader2, LogIn, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getCurrentUser, signInWithPassword, signUpWithPassword } from "@/syncService";
import { supabase } from "@/supabaseClient";
import { useLocalProject } from "@/localStore";
import { usePilotLocation } from "@/pilotRouting";
import { resolveStartMode } from "@/startFlow";

const BRAND = "Negócio Fechado";

function BrandMark({ small = false }: { small?: boolean }) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}icon.svg`}
      alt="Negócio Fechado"
      className={`block object-contain ${small ? "h-14 w-14" : "h-[72px] w-[72px]"}`}
    />
  );
}

function BrandLockup({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex flex-col items-center text-center">
      <BrandMark small={compact} />
      <p className={`${compact ? "mt-4 text-2xl" : "mt-5 text-3xl"} font-display font-semibold tracking-tight text-brand-navy`}>
        Módulo · Obras
      </p>
      <p className="mt-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.24em] text-[#687178]">
        {BRAND}
      </p>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-brand-cream px-5">
      <div className="flex flex-col items-center gap-6">
        <BrandLockup />
        <Loader2 className="h-5 w-5 animate-spin text-brand-orange" />
      </div>
    </div>
  );
}

function LoginScreen({ onContinue }: { onContinue: () => void }) {
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim() || password.length < 6) {
      toast.error("Informe um e-mail e uma senha com pelo menos 6 caracteres.");
      return;
    }
    setBusy(true);
    try {
      const user = creating
        ? await signUpWithPassword(email.trim(), password)
        : await signInWithPassword(email.trim(), password);
      if (creating && user && !user.email_confirmed_at) {
        toast.success("Conta criada. Confirme seu e-mail para entrar.");
      } else {
        toast.success("Acesso sincronizado.");
        onContinue();
      }
      setPassword("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível acessar o ambiente sincronizado.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-brand-cream px-5 py-8 text-brand-navy sm:py-12">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-lg flex-col justify-center">
        <BrandLockup compact />

        <Card className="mt-8 rounded-[1.35rem] border-brand bg-white shadow-[7px_7px_0_#d7d0c4]">
          <CardContent className="p-6 sm:p-7">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center bg-[#ede8de] text-brand-orange">
                <Cloud className="h-4 w-4" />
              </span>
              <p className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[#687178]">
                Ambiente sincronizado
              </p>
            </div>

            <div className="mt-4">
              <h1 className="font-display text-[2rem] font-semibold leading-none text-brand-navy">
                {creating ? "Criar acesso" : "Entrar na sua obra"}
              </h1>
              <p className="mt-2 text-sm leading-6 text-[#687178]">
                Use a mesma conta no celular e no computador para manter suas obras e registros disponíveis nos dois aparelhos.
              </p>
            </div>

            <form onSubmit={submit} className="mt-6 space-y-3">
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Seu e-mail"
                autoComplete="email"
                className="h-12 rounded-lg border-brand bg-brand-cream px-4 text-sm"
              />
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Senha (mínimo 6 caracteres)"
                autoComplete={creating ? "new-password" : "current-password"}
                className="h-12 rounded-lg border-brand bg-brand-cream px-4 text-sm"
              />
              <Button
                type="submit"
                disabled={busy}
                className="h-12 w-full rounded-lg bg-brand-navy text-sm font-semibold text-white hover:bg-[#123d57]"
              >
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
                {creating ? "Criar conta" : "Entrar"}
              </Button>
              <button
                type="button"
                className="w-full pt-1 text-sm font-medium text-brand-navy underline-offset-4 hover:text-brand-orange hover:underline"
                onClick={() => setCreating((value) => !value)}
              >
                {creating ? "Já tenho uma conta" : "Ainda não tenho conta"}
              </button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={onContinue}
            className="text-sm font-medium text-[#687178] underline-offset-4 hover:text-brand-navy hover:underline"
          >
            Continuar sem sincronização
          </button>
          <p className="mx-auto mt-2 max-w-sm text-[11px] leading-5 text-[#8a908e]">
            Os registros ficam somente neste dispositivo. Você poderá ativar a sincronização depois em Preferências.
          </p>
        </div>
      </div>
    </main>
  );
}

function WorksScreen() {
  const { project } = useLocalProject();
  const [, setLocation] = usePilotLocation();

  return (
    <main className="min-h-screen bg-brand-cream px-5 py-7 md:px-10 md:py-10">
      <div className="mx-auto w-full max-w-5xl">
        <header className="flex items-center gap-4 border-b border-black/10 pb-5">
          <BrandMark small />
          <div>
            <p className="font-display text-2xl font-semibold tracking-tight text-brand-navy">Módulo · Obras</p>
            <p className="mt-1 font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-[#687178]">{BRAND}</p>
          </div>
        </header>

        <section className="mt-10 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-brand-orange">Ambiente sincronizado</p>
            <h1 className="mt-2 font-display text-5xl font-semibold leading-none tracking-tight text-brand-navy">Suas obras</h1>
          </div>
          <p className="text-xs text-[#687178]">Selecione uma obra para continuar</p>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2">
          <Card className="rounded-[1.25rem] border-brand bg-white shadow-[5px_5px_0_#d7d0c4] transition-all hover:-translate-y-0.5 hover:shadow-[7px_7px_0_#d7d0c4]">
            <CardContent className="p-6 sm:p-7">
              <div className="flex items-start justify-between">
                <div className="grid h-11 w-11 place-items-center bg-[#ede8de] text-brand-navy">
                  <Building2 className="h-5 w-5" />
                </div>
                <span className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-brand-orange">Ativa</span>
              </div>
              <h2 className="mt-6 font-display text-3xl font-semibold leading-none text-brand-navy">{project.name}</h2>
              <p className="mt-2 text-sm text-[#687178]">{project.location} · {project.status}</p>
              <p className="mt-3 text-xs leading-5 text-[#687178]">{project.description}</p>
              <Button onClick={() => setLocation("/hoje")} className="mt-5 h-11 w-full rounded-lg bg-brand-navy text-sm font-semibold text-white hover:bg-[#123d57]">
                Abrir obra
              </Button>
            </CardContent>
          </Card>

          <button
            type="button"
            onClick={() => toast.info("A criação de novas obras será liberada em uma próxima etapa.")}
            className="flex min-h-[220px] flex-col items-center justify-center rounded-[1.25rem] border border-dashed border-brand bg-transparent p-6 text-center transition hover:border-brand-orange hover:bg-white"
          >
            <span className="grid h-11 w-11 place-items-center rounded-full border border-brand text-brand-navy">
              <Plus className="h-5 w-5" />
            </span>
            <span className="mt-4 font-display text-2xl font-semibold text-brand-navy">Adicionar nova obra</span>
            <span className="mt-1.5 max-w-[240px] text-xs leading-5 text-[#687178]">Prepare o próximo espaço de trabalho sem misturar os registros desta obra.</span>
          </button>
        </section>
      </div>
    </main>
  );
}

export default function StartPage() {
  const [phase, setPhase] = useState<"loading" | "login" | "works">("loading");

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      void getCurrentUser()
        .then(() => { if (active) setPhase("login"); })
        .catch(() => { if (active) setPhase("login"); });
    }, 500);
    const { data } = supabase.auth.onAuthStateChange(() => {
      /* A entrada continua no login; a seleção só abre após confirmação do usuário. */
    });
    return () => {
      active = false;
      clearTimeout(timer);
      data.subscription.unsubscribe();
    };
  }, []);

  const mode = resolveStartMode(phase === "loading", phase === "works");
  if (mode === "loading") return <LoadingScreen />;
  if (mode === "login") return <LoginScreen onContinue={() => setPhase("works")} />;
  return <WorksScreen />;
}

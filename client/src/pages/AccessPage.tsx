import { useEffect, useState, type FormEvent } from "react";
import { BriefcaseBusiness, Building2, Loader2, LogIn, LogOut, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getCurrentUser, signInWithPassword, signOut } from "@/syncService";
import { toast } from "sonner";
import { usePilotLocation } from "@/pilotRouting";

const iconSrc = `${import.meta.env.BASE_URL}icon.svg`;

export default function AccessPage() {
  const [, navigate] = usePilotLocation();
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => { void getCurrentUser().then((current) => { setUser(current); setLoading(false); }); }, []);

  const login = async (event: FormEvent) => {
    event.preventDefault();
    if (!email.trim() || password.length < 6) { toast.error("Informe e-mail e senha com pelo menos 6 caracteres."); return; }
    setBusy(true);
    try { const current = await signInWithPassword(email.trim(), password); setUser(current); setPassword(""); toast.success("Login realizado."); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível entrar."); }
    finally { setBusy(false); }
  };

  const logout = async () => { await signOut(); setUser(null); toast.success("Sessão encerrada."); };

  if (loading) return <div className="grid min-h-screen place-items-center bg-brand-cream"><Loader2 className="h-6 w-6 animate-spin text-brand-orange" /></div>;

  return (
    <main className="min-h-screen bg-brand-cream px-5 py-8 text-brand-navy sm:py-12">
      <div className="mx-auto max-w-4xl">
        <header className="text-center">
          <img src={iconSrc} alt="Negócio Fechado" className="mx-auto h-16 w-16 rounded-xl object-contain" />
          <p className="mt-4 font-mono text-[9px] font-bold uppercase tracking-[0.24em] text-brand-orange">Negócio Fechado</p>
          <h1 className="mt-2 font-display text-5xl font-semibold tracking-tight text-brand-navy">Acesso central</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#687178]">Um único acesso para sua identidade profissional e para o ambiente de gestão de obras.</p>
        </header>

        {!user ? (
          <Card className="mx-auto mt-8 max-w-md rounded-[1.25rem] border-brand bg-white shadow-[7px_7px_0_#d7d0c4]">
            <CardContent className="p-6 sm:p-7">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center bg-[#ede8de] text-brand-orange"><LogIn className="h-4 w-4" /></span>
                <p className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[#687178]">Ambiente sincronizado</p>
              </div>
              <h2 className="mt-4 font-display text-[2rem] font-semibold leading-none text-brand-navy">Entrar na sua conta</h2>
              <p className="mt-2 text-sm leading-6 text-[#687178]">A mesma conta mantém seu perfil e suas obras disponíveis no celular e no computador.</p>
              <form onSubmit={login} className="mt-6 space-y-3">
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Seu e-mail" autoComplete="email" className="h-12 rounded-lg border-brand bg-brand-cream px-4 text-sm" />
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Sua senha" autoComplete="current-password" className="h-12 rounded-lg border-brand bg-brand-cream px-4 text-sm" />
                <Button disabled={busy} className="h-12 w-full rounded-lg bg-brand-navy text-sm font-semibold text-white hover:bg-[#123d57]">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}Entrar</Button>
              </form>
              <button type="button" onClick={() => navigate("/obras")} className="mt-5 w-full text-sm font-medium text-[#687178] underline-offset-4 hover:text-brand-navy hover:underline">Continuar sem sincronização</button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mt-8 flex items-center justify-between gap-3 rounded-xl border border-brand bg-white p-4 shadow-[4px_4px_0_#d7d0c4]">
              <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-lg bg-brand-orange text-white"><UserRound className="h-5 w-5" /></div><div><p className="text-sm font-bold text-brand-navy">{user.email || "Usuário conectado"}</p><p className="text-xs text-[#687178]">Acesso autenticado</p></div></div>
              <Button variant="outline" className="rounded-lg border-brand" onClick={() => void logout()}><LogOut className="h-4 w-4" />Sair</Button>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <AccessCard icon={<UserRound />} title="Meu perfil profissional" text="Editar identidade, experiência, competências e portfólio." onClick={() => navigate("/meu-perfil")} />
              <AccessCard icon={<Building2 />} title="Gestão de obras" text="Entrar no ambiente operacional, diário, campo, equipe, materiais e relatórios." onClick={() => navigate("/obras")} />
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function AccessCard({ icon, title, text, onClick }: { icon: React.ReactNode; title: string; text: string; onClick: () => void }) {
  return (
    <Card className="group rounded-[1.25rem] border-brand bg-white shadow-[4px_4px_0_#d7d0c4] transition hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#d7d0c4]">
      <CardContent className="p-6 sm:p-7">
        <div className="grid h-11 w-11 place-items-center bg-[#ede8de] text-brand-navy">{icon}</div>
        <h2 className="mt-6 font-display text-3xl font-semibold leading-none text-brand-navy">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-[#687178]">{text}</p>
        <Button onClick={onClick} className="mt-6 h-11 w-full rounded-lg bg-brand-navy text-white hover:bg-[#123d57]"><BriefcaseBusiness className="h-4 w-4" />Abrir</Button>
      </CardContent>
    </Card>
  );
}

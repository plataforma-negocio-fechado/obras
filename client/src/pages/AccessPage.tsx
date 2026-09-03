import { useEffect, useState, type FormEvent } from "react";
import { BriefcaseBusiness, Building2, Loader2, LogIn, LogOut, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getCurrentUser, signInWithPassword, signOut } from "@/syncService";
import { toast } from "sonner";
import { usePilotLocation } from "@/pilotRouting";

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

  if (loading) return <div className="grid min-h-screen place-items-center bg-[#f8f5ed]"><Loader2 className="h-6 w-6 animate-spin text-[#d96b32]" /></div>;

  return <main className="min-h-screen bg-[#f8f5ed] px-5 py-10 text-[#102e46] md:px-10 md:py-16"><div className="mx-auto max-w-4xl">
    <header className="text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center bg-[#102e46] font-display text-3xl font-semibold text-white">NF</div><p className="mt-5 font-mono text-[10px] font-bold uppercase tracking-[.2em] text-[#d96b32]">Negócio Fechado</p><h1 className="mt-2 font-display text-5xl font-semibold tracking-tight">Acesso central</h1><p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#617080]">Um único acesso para sua identidade profissional e para o ambiente de gestão de obras.</p></header>
    {!user ? <Card className="mx-auto mt-10 max-w-md rounded-2xl border-[#d8d2c5] bg-[#fffdf8] shadow-[8px_8px_0_#d8d2c5]"><CardContent className="p-7"><div className="flex items-center gap-2"><LogIn className="h-4 w-4 text-[#d96b32]"/><p className="font-mono text-[10px] font-bold uppercase tracking-[.18em]">Entrar</p></div><form onSubmit={login} className="mt-5 space-y-3"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail" autoComplete="email"/><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Senha" autoComplete="current-password"/><Button disabled={busy} className="h-11 w-full bg-[#102e46] text-white hover:bg-[#183e5a]">{busy ? <Loader2 className="h-4 w-4 animate-spin"/> : <LogIn className="h-4 w-4"/>}Entrar</Button></form><button type="button" onClick={() => navigate("/obras")} className="mt-5 w-full text-xs text-[#617080] underline-offset-4 hover:text-[#102e46] hover:underline">Acessar somente neste dispositivo</button></CardContent></Card> : <><div className="mt-10 flex items-center justify-between gap-3 border border-[#d8d2c5] bg-[#fffdf8] p-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d96b32] text-white"><UserRound className="h-5 w-5"/></div><div><p className="text-sm font-bold">{user.email || "Usuário conectado"}</p><p className="text-xs text-[#617080]">Acesso autenticado</p></div></div><Button variant="outline" onClick={() => void logout()}><LogOut className="h-4 w-4"/>Sair</Button></div><div className="mt-6 grid gap-5 md:grid-cols-2"><AccessCard icon={<UserRound/>} title="Meu perfil profissional" text="Editar identidade, experiência, competências e portfólio." onClick={() => navigate("/meu-perfil")} /><AccessCard icon={<Building2/>} title="Gestão de obras" text="Entrar no ambiente operacional, diário, campo, equipe, materiais e relatórios." onClick={() => navigate("/obras")} /></div></>}
  </div></main>;
}

function AccessCard({ icon, title, text, onClick }: { icon: React.ReactNode; title: string; text: string; onClick: () => void }) { return <Card className="group rounded-2xl border-[#d8d2c5] bg-[#fffdf8] shadow-none transition hover:-translate-y-1 hover:shadow-[7px_7px_0_#d96b32]"><CardContent className="p-7"><div className="flex h-12 w-12 items-center justify-center bg-[#f0ece3] text-[#102e46]">{icon}</div><h2 className="mt-7 font-display text-3xl font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-[#617080]">{text}</p><Button onClick={onClick} className="mt-7 h-11 w-full bg-[#102e46] text-white hover:bg-[#183e5a]"><BriefcaseBusiness className="h-4 w-4"/>Abrir</Button></CardContent></Card>; }

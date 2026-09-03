import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/useMobile";
import { usePilotLocation } from "@/pilotRouting";
import { useLocalProject } from "@/localStore";
import { Bell, Building2, ClipboardCheck, Download, Image, LayoutDashboard, PackageCheck, PanelLeft, Settings2, Target, Users, Wrench, X, CalendarDays } from "lucide-react";
import { useState } from "react";

const groups = [
  { title: "Operação", items: [
    { icon: LayoutDashboard, label: "Hoje", path: "/hoje" },
    { icon: ClipboardCheck, label: "Diário de obra", path: "/diario" },
    { icon: Building2, label: "Frentes de serviço", path: "/frentes" },
    { icon: Bell, label: "Ocorrências", path: "/ocorrencias" },
    { icon: Target, label: "Plano de ação", path: "/acoes" },
  ]},
  { title: "Planejamento", items: [
    { icon: CalendarDays, label: "Planejamento semanal", path: "/planejamento" },
    { icon: ClipboardCheck, label: "Relatório semanal", path: "/relatorio" },
    { icon: LayoutDashboard, label: "Linha do tempo", path: "/timeline" },
  ]},
  { title: "Recursos", items: [
    { icon: Users, label: "Equipe", path: "/equipe" },
    { icon: Wrench, label: "Máquinas", path: "/maquinas" },
    { icon: PackageCheck, label: "Materiais", path: "/materiais" },
    { icon: Image, label: "Evidências", path: "/evidencias" },
  ]},
  { title: "Administração", items: [
    { icon: Building2, label: "Cadastro da obra", path: "/cadastro" },
    { icon: Download, label: "Dados e backup", path: "/dados" },
  ]},
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location, navigate] = usePilotLocation();
  const { project } = useLocalProject();
  const [collapsed, setCollapsed] = useState(false); const [mobileOpen, setMobileOpen] = useState(false); const isMobile = useIsMobile();
  const go = (path: string) => { navigate(path); setMobileOpen(false); };
  return <div className="min-h-screen bg-brand-cream text-brand-navy">
    {isMobile && mobileOpen && <button aria-label="Fechar menu" className="fixed inset-0 z-40 bg-brand-navy/35" onClick={() => setMobileOpen(false)} />}
    <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col overflow-y-auto bg-brand-navy text-brand-cream transition-all duration-200 ${collapsed ? "w-[76px]" : "w-[252px]"} ${isMobile ? (mobileOpen ? "translate-x-0" : "-translate-x-full") : "translate-x-0"}`}>
      <div className="flex h-24 shrink-0 items-center justify-between border-b border-white/10 px-5">
        {!collapsed && <div><p className="font-display text-xl font-semibold leading-none tracking-[-0.03em]">NEGÓCIO <span className="text-brand-orange">FECHADO</span></p><p className="mt-2 font-mono text-[9px] uppercase tracking-[0.2em] text-white/45">Módulo · Obras</p></div>}
        <button onClick={() => setCollapsed(!collapsed)} className="grid h-9 w-9 place-items-center rounded-md text-white/60 hover:bg-white/10 hover:text-white" aria-label="Recolher navegação"><PanelLeft className="h-4 w-4" /></button>
      </div>
      <nav className="flex-1 px-4 py-5">{groups.map(group => <div key={group.title} className="mb-5"><p className={`mb-2 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-white/35 ${collapsed ? "text-center" : ""}`}>{collapsed ? "///" : group.title}</p>{group.items.map(item => { const active = location === item.path; return <button key={item.path} onClick={() => go(item.path)} className={`mb-1 flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition ${active ? "bg-brand-orange font-bold text-white" : "text-white/60 hover:bg-white/10 hover:text-white"}`}><item.icon className="h-[18px] w-[18px] shrink-0"/><span className={collapsed ? "sr-only" : ""}>{item.label}</span></button>; })}</div>)}</nav>
      <div className="mt-auto shrink-0 border-t border-white/10 p-4">{!collapsed && <div className="mb-4 rounded-md border border-white/10 bg-white/5 p-3"><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/35">Obra ativa</p><p className="mt-1 text-sm font-semibold">{project.name}</p><p className="mt-1 text-[11px] text-white/45">{project.location} · {project.status}</p></div>}<div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}><Avatar className="h-9 w-9 border border-white/15"><AvatarFallback className="bg-brand-orange text-xs font-black text-white">NF</AvatarFallback></Avatar>{!collapsed && <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">Negócio Fechado</p><p className="truncate font-mono text-[9px] uppercase tracking-[0.08em] text-white/40">Gestão de obras</p></div>}</div>{!collapsed && <div className="mt-3"><Button variant="ghost" size="sm" onClick={() => go("/preferencias")} className="h-8 w-full justify-start px-2 text-[11px] text-white/50 hover:bg-white/10 hover:text-white"><Settings2 className="mr-2 h-3.5 w-3.5"/>Preferências</Button></div>}</div>
    </aside>
    <main className={`${collapsed && !isMobile ? "pl-[76px]" : "pl-[252px]"} transition-all duration-200 ${isMobile ? "!pl-0" : ""}`}>{isMobile && <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-brand bg-brand-cream/95 px-4 backdrop-blur"><button onClick={() => setMobileOpen(true)} className="grid h-9 w-9 place-items-center rounded-md bg-brand-navy text-white" aria-label="Abrir menu"><PanelLeft className="h-4 w-4"/></button><span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-brand-navy">Negócio Fechado · Obras</span><X className="h-4 w-4 opacity-0"/></header>}{children}</main>
  </div>;
}

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/useMobile";
import { usePilotLocation } from "@/pilotRouting";
import { useLocalProject } from "@/localStore";
import { Bell, Building2, ClipboardCheck, Download, LayoutDashboard, PackageCheck, PanelLeft, Settings2, Users, Wrench, X } from "lucide-react";
import { useState } from "react";

const menuItems = [
  { icon: LayoutDashboard, label: "Hoje", path: "/hoje" },
  { icon: ClipboardCheck, label: "Diário de obra", path: "/diario" },
  { icon: PackageCheck, label: "Materiais", path: "/materiais" },
  { icon: Users, label: "Equipe", path: "/equipe" },
  { icon: Wrench, label: "Máquinas", path: "/maquinas" },
  { icon: Building2, label: "Frentes", path: "/frentes" },
  { icon: Bell, label: "Ações", path: "/eventos" },
  { icon: Download, label: "Backup", path: "/dados" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location, navigate] = usePilotLocation();
  const { project } = useLocalProject();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useIsMobile();
  const go = (path: string) => { navigate(path); setMobileOpen(false); };

  return <div className="min-h-screen bg-[#ececea] text-[#222522]">
    {isMobile && mobileOpen && <button aria-label="Fechar menu" className="fixed inset-0 z-40 bg-black/30" onClick={() => setMobileOpen(false)} />}
    <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-[#202321] text-[#f3f3ef] transition-all duration-200 ${collapsed ? "w-[76px]" : "w-[252px]"} ${isMobile ? (mobileOpen ? "translate-x-0" : "-translate-x-full") : "translate-x-0"}`}>
      <div className="flex h-24 items-center justify-between border-b border-white/10 px-5">
        {!collapsed && <div><p className="font-black uppercase tracking-[-0.05em] text-xl leading-none">MÓDULO<span className="text-[#b8d36a]">:</span> OBRAS</p><p className="mt-2 text-[9px] uppercase tracking-[0.24em] text-white/45">Plataforma Negócio Fechado</p></div>}
        <button onClick={() => setCollapsed(!collapsed)} className="grid h-9 w-9 place-items-center rounded-md text-white/60 hover:bg-white/10 hover:text-white" aria-label="Recolher navegação"><PanelLeft className="h-4 w-4" /></button>
      </div>
      <div className="px-4 pt-7">
        <p className={`mb-3 text-[9px] font-bold uppercase tracking-[0.2em] text-white/35 ${collapsed ? "text-center" : ""}`}>{collapsed ? "///" : "Operação"}</p>
        {menuItems.map((item) => {
          const active = location === item.path;
          return <button key={item.path} onClick={() => go(item.path)} className={`mb-1 flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm transition ${active ? "bg-[#b8d36a] font-bold text-[#202321]" : "text-white/60 hover:bg-white/10 hover:text-white"}`}><item.icon className="h-[18px] w-[18px] shrink-0" /><span className={collapsed ? "sr-only" : ""}>{item.label}</span></button>;
        })}
      </div>
      <div className="mt-auto border-t border-white/10 p-4">
        {!collapsed && <div className="mb-4 rounded-md bg-white/5 p-3"><p className="text-[9px] uppercase tracking-[0.18em] text-white/35">Obra ativa</p><p className="mt-1 text-sm font-semibold">{project.name}</p><p className="mt-1 text-[11px] text-white/45">{project.location} · {project.status}</p></div>}
        <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}><Avatar className="h-9 w-9 border border-white/15"><AvatarFallback className="bg-[#b8d36a] text-xs font-black text-[#202321]">MO</AvatarFallback></Avatar>{!collapsed && <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">Módulo: Obras</p><p className="truncate text-[10px] text-white/40">Plataforma Negócio Fechado</p></div>}</div>
        {!collapsed && <div className="mt-3 flex gap-1"><Button variant="ghost" size="sm" onClick={() => go("/preferencias")} className="h-8 flex-1 justify-start px-2 text-[11px] text-white/50 hover:bg-white/10 hover:text-white"><Settings2 className="mr-2 h-3.5 w-3.5" />Preferências</Button></div>}
      </div>
    </aside>
    <main className={`${collapsed && !isMobile ? "pl-[76px]" : "pl-[252px]"} transition-all duration-200 ${isMobile ? "!pl-0" : ""}`}>
      {isMobile && <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-black/10 bg-[#ececea]/95 px-4 backdrop-blur"><button onClick={() => setMobileOpen(true)} className="grid h-9 w-9 place-items-center rounded-md bg-[#202321] text-white" aria-label="Abrir menu"><PanelLeft className="h-4 w-4" /></button><span className="text-xs font-black uppercase tracking-[0.18em]">MÓDULO: OBRAS</span><X className="h-4 w-4 opacity-0" /></header>}
      {children}
    </main>
  </div>;
}

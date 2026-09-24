import { BriefcaseBusiness, Linkedin, MapPin, Phone, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const profile = {
  name: "João Pereira",
  initials: "JP",
  title: "Engenheiro Civil",
  location: "João Pessoa/PB",
  crea: "CREA-PB · PERFIL DEMONSTRATIVO",
  headline: "Obras residenciais • Planejamento • Orçamento",
  summary: "Perfil fictício criado exclusivamente para validar a experiência de entrega do Perfil Negócio Fechado a um segundo profissional. Os dados, projetos e contatos abaixo são demonstrativos.",
  phone: "(83) 99999-0000",
  email: "joao.pereira@example.com",
  linkedin: "",
  skills: ["Planejamento de obras", "Orçamento", "Gestão de equipes", "Revit / BIM", "AutoCAD", "Medições"],
  projects: [
    { title: "Residencial Atlântico", location: "João Pessoa/PB", role: "Acompanhamento executivo, planejamento semanal e medições.", result: "Projeto demonstrativo" },
    { title: "Reforma Comercial Centro", location: "João Pessoa/PB", role: "Orçamento, compatibilização e acompanhamento da execução.", result: "Projeto demonstrativo" },
    { title: "Residência Unifamiliar", location: "Cabedelo/PB", role: "Planejamento, orçamento e acompanhamento técnico.", result: "Projeto demonstrativo" },
  ],
};

export default function DemoProfessionalProfilePage() {
  const share = async () => {
    const url = window.location.href;
    if (navigator.share) return navigator.share({ title: `${profile.name} — Perfil Negócio Fechado`, url });
    await navigator.clipboard?.writeText(url);
    window.alert("Link copiado.");
  };

  return <main className="min-h-screen bg-[#f8f5ed] text-[#102e46]">
    <div className="bg-[#102e46] px-5 py-2 text-center font-mono text-[10px] uppercase tracking-[.16em] text-[#dce5eb]">Negócio Fechado · Perfil profissional demonstrativo</div>
    <header className="border-b border-[#d8d2c5] bg-[#fffdf8]">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 md:px-8">
        <strong className="font-display text-xl">NEGÓCIO FECHADO</strong>
        <Button variant="outline" onClick={() => void share()} className="rounded-full"><Share2 className="mr-2 h-4 w-4"/>Compartilhar</Button>
      </div>
    </header>
    <section className="border-b border-[#d8d2c5] bg-[#fffdf8]">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 md:grid-cols-[1.2fr_.8fr] md:px-8 md:py-20">
        <div>
          <div className="mb-6 flex items-center gap-4"><div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#102e46] font-display text-3xl font-semibold text-white">{profile.initials}</div><p className="font-mono text-[10px] font-bold uppercase tracking-[.17em] text-[#d96b32]">{profile.crea}</p></div>
          <h1 className="font-display text-6xl font-semibold leading-[.9] tracking-[-.06em] md:text-8xl">{profile.name}</h1>
          <p className="mt-4 text-2xl font-semibold">{profile.title}</p>
          <p className="mt-2 max-w-2xl text-lg text-[#617080]">{profile.headline}</p>
          <p className="mt-6 flex items-center gap-2 text-sm text-[#617080]"><MapPin className="h-4 w-4 text-[#d96b32]"/>{profile.location}</p>
        </div>
        <div className="flex min-h-72 items-end rounded-3xl bg-gradient-to-br from-[#d3e2e6] via-[#d9d2c4] to-[#8d543e] p-7 shadow-xl"><div className="bg-[#102e46] p-5 text-white"><p className="font-mono text-[9px] uppercase tracking-[.18em] text-[#f4ae77]">PORTFÓLIO PROFISSIONAL</p><p className="mt-2 font-display text-3xl font-semibold">Projeto • Gestão • Resultado</p></div></div>
      </div>
    </section>
    <div className="mx-auto max-w-6xl px-5 py-14 md:px-8">
      <section><p className="font-mono text-[9px] font-bold uppercase tracking-[.2em] text-[#d96b32]">Sobre</p><h2 className="mt-2 font-display text-4xl font-semibold">Quem sou</h2><p className="mt-6 max-w-3xl leading-8 text-[#617080]">{profile.summary}</p></section>
      <section className="mt-14"><p className="font-mono text-[9px] font-bold uppercase tracking-[.2em] text-[#d96b32]">Competências</p><div className="mt-5 flex flex-wrap gap-2">{profile.skills.map(x=><span key={x} className="border border-[#d8d2c5] bg-[#fffdf8] px-3 py-2 text-xs font-semibold">{x}</span>)}</div></section>
      <section className="mt-16"><p className="font-mono text-[9px] font-bold uppercase tracking-[.2em] text-[#d96b32]">Portfólio</p><h2 className="mt-2 font-display text-4xl font-semibold">Projetos em destaque</h2><div className="mt-8 grid gap-6 md:grid-cols-3">{profile.projects.map(p=><Card key={p.title} className="rounded-2xl border-[#d8d2c5] bg-[#fffdf8] shadow-none"><CardContent className="p-7"><BriefcaseBusiness className="h-5 w-5 text-[#d96b32]"/><h3 className="mt-8 font-display text-2xl font-semibold">{p.title}</h3><p className="mt-2 font-mono text-[9px] font-bold uppercase tracking-[.14em] text-[#d96b32]">{p.location}</p><p className="mt-5 text-sm leading-6 text-[#617080]">{p.role}</p><p className="mt-5 border-l-2 border-[#d96b32] pl-3 text-xs font-semibold">{p.result}</p></CardContent></Card>)}</div></section>
      <section className="mt-16 rounded-2xl bg-[#102e46] p-8 text-white"><p className="font-mono text-[9px] uppercase tracking-[.2em] text-[#f4ae77]">Contato profissional</p><p className="mt-5 flex items-center gap-3"><Phone className="h-4 w-4"/>{profile.phone}</p><p className="mt-3 text-sm text-white/70">{profile.email}</p><p className="mt-6 text-xs text-white/60">Dados de contato fictícios — perfil criado apenas para demonstração.</p></section>
    </div>
    <footer className="border-t border-[#d8d2c5] bg-[#fffdf8] px-5 py-10 text-center font-mono text-[9px] font-bold uppercase tracking-[.18em] text-[#617080]">{profile.name} · {profile.title} · Negócio Fechado</footer>
  </main>;
}

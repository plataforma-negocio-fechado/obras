import { ArrowUpRight, BriefcaseBusiness, CheckCircle2, Download, ExternalLink, Mail, MapPin, Pencil, Phone, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { loadProfile, type ProfessionalProfile } from "@/profileStore";

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfessionalProfile>(() => loadProfile());

  useEffect(() => {
    const reload = () => setProfile(loadProfile());
    window.addEventListener("profile-updated", reload);
    return () => window.removeEventListener("profile-updated", reload);
  }, []);

  const shareProfile = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: `${profile.name} — ${profile.title}`, text: profile.headline, url });
      return;
    }
    await navigator.clipboard?.writeText(url);
  };

  return (
    <main className="min-h-screen bg-[#f6f6f3] text-[#202321]">
      <header className="border-b border-black/10 bg-[#202321] text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 md:px-8">
          <div><p className="text-sm font-black tracking-tight">NEGÓCIO FECHADO</p><p className="mt-1 text-[9px] font-bold uppercase tracking-[0.24em] text-[#b8d36a]">Perfil profissional</p></div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => (window.location.hash = "/perfil/editar")} className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"><Pencil className="mr-2 h-4 w-4" /> Editar perfil</Button>
            <Button variant="outline" onClick={shareProfile} className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"><Share2 className="mr-2 h-4 w-4" /> Compartilhar</Button>
          </div>
        </div>
      </header>

      <section className="border-b border-black/10 bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 md:grid-cols-[1fr_auto] md:items-center md:px-8 md:py-14">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#789249]"><span className="inline-flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Perfil profissional</span><span>•</span><span>{profile.crea}</span></div>
            <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">{profile.name}</h1>
            <p className="mt-2 text-xl font-semibold md:text-2xl">{profile.title}</p>
            <p className="mt-2 text-sm font-bold text-[#596b36]">{profile.headline}</p>
            <div className="mt-5 flex flex-wrap gap-4 text-sm text-[#71756f]"><span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4" /> {profile.location}</span><span className="inline-flex items-center gap-2"><Phone className="h-4 w-4" /> {profile.phone}</span></div>
            <div className="mt-7 flex flex-wrap gap-3"><Button onClick={() => window.location.href = `mailto:${profile.email}`} className="bg-[#202321] text-white hover:bg-[#303430]"><Mail className="mr-2 h-4 w-4" /> Entrar em contato</Button><Button variant="outline" onClick={() => window.print()} className="border-black/15"><Download className="mr-2 h-4 w-4" /> Imprimir perfil</Button></div>
          </div>
          <div className="flex h-36 w-36 items-center justify-center bg-[#202321] text-6xl font-black text-[#b8d36a] md:h-44 md:w-44">DS</div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 py-8 md:px-8 md:py-12">
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{profile.highlights.map((item) => <Card key={item.label} className="rounded-none border-0 bg-white shadow-[4px_4px_0_#d0d1cb]"><CardContent className="p-5"><p className="text-2xl font-black">{item.value}</p><p className="mt-2 text-[10px] font-bold uppercase leading-4 tracking-[0.12em] text-[#71756f]">{item.label}</p></CardContent></Card>)}</section>

        <section className="mt-12 grid gap-10 lg:grid-cols-[1.4fr_.8fr]"><div><SectionTitle eyebrow="Sobre" title="Quem sou" /><p className="mt-5 max-w-3xl text-base leading-8 text-[#555a54]">{profile.summary}</p></div><div><SectionTitle eyebrow="Competências" title="O que faço" /><div className="mt-5 flex flex-wrap gap-2">{profile.skills.map((skill) => <span key={skill} className="border border-black/10 bg-white px-3 py-2 text-xs font-semibold">{skill}</span>)}</div></div></section>

        <section className="mt-14"><SectionTitle eyebrow="Portfólio" title="Projetos em destaque" /><div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{profile.projects.map((project) => <Card key={project.title} className="group rounded-none border-0 bg-white shadow-[4px_4px_0_#d0d1cb] transition hover:-translate-y-1 hover:shadow-[5px_5px_0_#b8d36a]"><CardContent className="p-6"><div className="flex items-center justify-between"><BriefcaseBusiness className="h-5 w-5 text-[#789249]" /><ArrowUpRight className="h-4 w-4 text-[#aaa]" /></div><h3 className="mt-7 text-lg font-black">{project.title}</h3><p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-[#789249]">{project.location}</p><p className="mt-4 text-sm leading-6 text-[#666b65]">{project.role}</p>{project.result && <p className="mt-4 border-l-2 border-[#b8d36a] pl-3 text-xs font-bold text-[#202321]">{project.result}</p>}</CardContent></Card>)}</div></section>

        <section className="mt-14"><SectionTitle eyebrow="Experiência" title="Trajetória profissional" /><div className="mt-6 space-y-5">{profile.experience.map((item) => <Card key={item.company} className="rounded-none border-0 bg-white shadow-[4px_4px_0_#d0d1cb]"><CardContent className="p-6 md:grid md:grid-cols-[170px_1fr] md:gap-7"><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#789249]">{item.period}</p><div><h3 className="text-lg font-black">{item.company}</h3><p className="mt-1 text-sm font-semibold text-[#555a54]">{item.role}</p><ul className="mt-4 space-y-2 text-sm leading-6 text-[#666b65]">{item.bullets.map((bullet) => <li key={bullet} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#789249]" />{bullet}</li>)}</ul></div></CardContent></Card>)}</div></section>

        <section className="mt-14 grid gap-5 md:grid-cols-2"><Card className="rounded-none border-0 bg-[#202321] text-white shadow-[5px_5px_0_#b8d36a]"><CardContent className="p-7"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b8d36a]">Formação</p><h3 className="mt-3 text-xl font-black">Engenharia Civil — UFCG</h3><p className="mt-1 text-sm text-white/70">Graduado em 2021</p><h3 className="mt-6 text-xl font-black">Construction Management — Columbia University</h3><p className="mt-1 text-sm text-white/70">Especialização em Gerenciamento de Construções</p></CardContent></Card><Card className="rounded-none border-0 bg-white shadow-[4px_4px_0_#d0d1cb]"><CardContent className="p-7"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#789249]">Contato profissional</p><a className="mt-5 flex items-center gap-3 text-sm font-semibold hover:underline" href={`mailto:${profile.email}`}><Mail className="h-4 w-4" /> {profile.email}</a><a className="mt-4 flex items-center gap-3 text-sm font-semibold hover:underline" href={`tel:${profile.phone.replace(/\D/g, "")}`}><Phone className="h-4 w-4" /> {profile.phone}</a><p className="mt-4 flex items-center gap-3 text-sm text-[#666b65]"><MapPin className="h-4 w-4" /> {profile.location}</p><p className="mt-4 flex items-center gap-2 text-xs font-bold text-[#596b36]"><ExternalLink className="h-4 w-4" /> Perfil público no Negócio Fechado</p></CardContent></Card></section>
      </div>
      <footer className="border-t border-black/10 bg-white px-5 py-8 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-[#71756f]">Negócio Fechado · Perfil profissional</footer>
    </main>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) { return <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#789249]">{eyebrow}</p><h2 className="mt-2 text-2xl font-black tracking-tight md:text-3xl">{title}</h2></div>; }

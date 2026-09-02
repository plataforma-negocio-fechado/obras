import { ArrowUpRight, BriefcaseBusiness, CheckCircle2, Download, ExternalLink, Mail, MapPin, Phone, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const profile = {
  name: "Diego Silva",
  title: "Engenheiro Civil",
  location: "Patos/PB",
  headline: "Gestão de Obras • Loteamentos • Licitações",
  summary:
    "Engenheiro Civil graduado pela UFCG e especialista em Gerenciamento de Construções (Construction Management) pela Columbia University (New York). Atua em engenharia de custos, orçamentação, análise de editais, planejamento e projetos de obras urbanas e de infraestrutura.",
  phone: "(83) 99608-8942",
  email: "engenharia.diegosilva@gmail.com",
  crea: "CREA-PB nº 162015408-0",
};

const skills = [
  "Gestão e planejamento de obras",
  "Licitações públicas",
  "Engenharia de custos e orçamento",
  "Loteamentos",
  "Terraplanagem e drenagem",
  "Projetos estruturais",
  "Compatibilização de projetos",
  "Pavimentação",
];

const highlights = [
  { value: "30", label: "licitações vitoriosas" },
  { value: "+R$400 mi", label: "em contratos e atas movimentados" },
  { value: "60+", label: "projetos estruturais" },
  { value: "15", label: "contratos de sinalização gerenciados" },
];

const projects = [
  {
    title: "Loteamento Jardim Planalto",
    location: "Remígio/PB",
    role: "Análise de viabilidade, projeto de terraplanagem e projeto de drenagem",
  },
  {
    title: "Complexo de Saúde Eisenhower Segundo",
    location: "Patos/PB",
    role: "Projeto estrutural, combate a incêndio, orçamento e assessoria para aprovação",
    result: "Obra de aproximadamente R$ 10 milhões",
  },
  {
    title: "Mercado Público",
    location: "São Bento/PB",
    role: "Projeto estrutural de sistema misto metálico + concreto armado",
  },
  {
    title: "Pavimentação Asfáltica",
    location: "São Bento/PB",
    role: "Projeto executivo de pavimentação asfáltica em TSD para contrato entre a Construtora Niemaia e a CODEVASF",
  },
  {
    title: "Abatedouro Público",
    location: "Várzea/PB",
    role: "Desenvolvimento de projeto completo e orçamento, com exceção dos projetos elétricos e hidrossanitários",
  },
];

const experience = [
  {
    period: "Jul/2024 — atual",
    company: "Construtora NIEMAIA — Pavimentação Asfáltica",
    role: "Consultoria em engenharia e licitações",
    bullets: [
      "Participação direta em 30 licitações de pavimentação vencidas nos últimos 2 anos.",
      "Responsável pelo setor de sinalização horizontal e vertical, com gestão de 15 contratos em 25 cidades.",
      "Atuação em convênios, medições, regularização junto ao CREA e elaboração de projetos executivos e as built.",
    ],
  },
  {
    period: "Jul/2023 — Jun/2024",
    company: "JSD Engenharia e Consultoria",
    role: "Sócio",
    bullets: [
      "Mais de 30 projetos de combate a incêndio para escolas da Prefeitura de Patos/PB, aprovados pelo CBMPB.",
      "Projetos estruturais, arquitetônicos e orçamentários para clientes privados e públicos.",
      "Licenciamento ambiental e compatibilização de projetos multidisciplinares.",
    ],
  },
  {
    period: "Out/2020 — Jun/2023",
    company: "JM Marques — Escritório de Engenharia e Projetos",
    role: "Engenheiro Civil / Estagiário",
    bullets: [
      "Projetos estruturais, combate a incêndio e orçamento para empreendimentos de grande porte.",
      "Participação em compatibilização, planejamento e orçamentação de obras.",
    ],
  },
];

export default function ProfilePage() {
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
          <div>
            <p className="text-sm font-black tracking-tight">NEGÓCIO FECHADO</p>
            <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.24em] text-[#b8d36a]">Perfil profissional</p>
          </div>
          <Button variant="outline" onClick={shareProfile} className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white">
            <Share2 className="mr-2 h-4 w-4" /> Compartilhar
          </Button>
        </div>
      </header>

      <section className="border-b border-black/10 bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 md:grid-cols-[1fr_auto] md:items-center md:px-8 md:py-14">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#789249]">
              <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Perfil profissional</span>
              <span>•</span>
              <span>{profile.crea}</span>
            </div>
            <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">{profile.name}</h1>
            <p className="mt-2 text-xl font-semibold md:text-2xl">{profile.title}</p>
            <p className="mt-2 text-sm font-bold text-[#596b36]">{profile.headline}</p>
            <div className="mt-5 flex flex-wrap gap-4 text-sm text-[#71756f]">
              <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4" /> {profile.location}</span>
              <span className="inline-flex items-center gap-2"><Phone className="h-4 w-4" /> {profile.phone}</span>
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button onClick={() => window.location.href = `mailto:${profile.email}`} className="bg-[#202321] text-white hover:bg-[#303430]"><Mail className="mr-2 h-4 w-4" /> Entrar em contato</Button>
              <Button variant="outline" onClick={() => window.print()} className="border-black/15"><Download className="mr-2 h-4 w-4" /> Imprimir perfil</Button>
            </div>
          </div>
          <div className="flex h-36 w-36 items-center justify-center bg-[#202321] text-6xl font-black text-[#b8d36a] md:h-44 md:w-44">DS</div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 py-8 md:px-8 md:py-12">
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {highlights.map((item) => (
            <Card key={item.label} className="rounded-none border-0 bg-white shadow-[4px_4px_0_#d0d1cb]">
              <CardContent className="p-5">
                <p className="text-2xl font-black">{item.value}</p>
                <p className="mt-2 text-[10px] font-bold uppercase leading-4 tracking-[0.12em] text-[#71756f]">{item.label}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="mt-12 grid gap-10 lg:grid-cols-[1.4fr_.8fr]">
          <div>
            <SectionTitle eyebrow="Sobre" title="Quem sou" />
            <p className="mt-5 max-w-3xl text-base leading-8 text-[#555a54]">{profile.summary}</p>
          </div>
          <div>
            <SectionTitle eyebrow="Competências" title="O que faço" />
            <div className="mt-5 flex flex-wrap gap-2">
              {skills.map((skill) => <span key={skill} className="border border-black/10 bg-white px-3 py-2 text-xs font-semibold">{skill}</span>)}
            </div>
          </div>
        </section>

        <section className="mt-14">
          <SectionTitle eyebrow="Portfólio" title="Projetos em destaque" />
          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Card key={project.title} className="group rounded-none border-0 bg-white shadow-[4px_4px_0_#d0d1cb] transition hover:-translate-y-1 hover:shadow-[5px_5px_0_#b8d36a]">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between"><BriefcaseBusiness className="h-5 w-5 text-[#789249]" /><ArrowUpRight className="h-4 w-4 text-[#aaa] transition group-hover:text-[#202321]" /></div>
                  <h3 className="mt-7 text-lg font-black">{project.title}</h3>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-[#789249]">{project.location}</p>
                  <p className="mt-4 text-sm leading-6 text-[#666b65]">{project.role}</p>
                  {project.result && <p className="mt-4 border-l-2 border-[#b8d36a] pl-3 text-xs font-bold text-[#202321]">{project.result}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-14">
          <SectionTitle eyebrow="Experiência" title="Trajetória profissional" />
          <div className="mt-6 space-y-5">
            {experience.map((item) => (
              <Card key={item.company} className="rounded-none border-0 bg-white shadow-[4px_4px_0_#d0d1cb]">
                <CardContent className="p-6 md:grid md:grid-cols-[170px_1fr] md:gap-7">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#789249]">{item.period}</p>
                  <div><h3 className="text-lg font-black">{item.company}</h3><p className="mt-1 text-sm font-semibold text-[#555a54]">{item.role}</p><ul className="mt-4 space-y-2 text-sm leading-6 text-[#666b65]">{item.bullets.map((bullet) => <li key={bullet} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#789249]" />{bullet}</li>)}</ul></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-14 grid gap-5 md:grid-cols-2">
          <Card className="rounded-none border-0 bg-[#202321] text-white shadow-[5px_5px_0_#b8d36a]">
            <CardContent className="p-7">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b8d36a]">Formação</p>
              <h3 className="mt-3 text-xl font-black">Engenharia Civil — UFCG</h3>
              <p className="mt-1 text-sm text-white/70">Graduado em 2021</p>
              <h3 className="mt-6 text-xl font-black">Construction Management — Columbia University</h3>
              <p className="mt-1 text-sm text-white/70">Especialização em Gerenciamento de Construções</p>
            </CardContent>
          </Card>
          <Card className="rounded-none border-0 bg-white shadow-[4px_4px_0_#d0d1cb]">
            <CardContent className="p-7">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#789249]">Contato profissional</p>
              <a className="mt-5 flex items-center gap-3 text-sm font-semibold hover:underline" href={`mailto:${profile.email}`}><Mail className="h-4 w-4" /> {profile.email}</a>
              <a className="mt-4 flex items-center gap-3 text-sm font-semibold hover:underline" href={`tel:${profile.phone.replace(/\D/g, "")}`}><Phone className="h-4 w-4" /> {profile.phone}</a>
              <p className="mt-4 flex items-center gap-3 text-sm text-[#666b65]"><MapPin className="h-4 w-4" /> {profile.location}</p>
              <p className="mt-4 flex items-center gap-2 text-xs font-bold text-[#596b36]"><ExternalLink className="h-4 w-4" /> Perfil público no Negócio Fechado</p>
            </CardContent>
          </Card>
        </section>
      </div>

      <footer className="border-t border-black/10 bg-white px-5 py-8 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-[#71756f]">
        Negócio Fechado · Perfil profissional
      </footer>
    </main>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#789249]">{eyebrow}</p><h2 className="mt-2 text-2xl font-black tracking-tight md:text-3xl">{title}</h2></div>;
}

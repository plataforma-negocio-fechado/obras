import { Download, Printer, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProfessionalProfile } from "@/data/professionalProfiles";

export default function ProfileKitPage({ profile }: { profile: ProfessionalProfile }) {
  const url = `${window.location.origin}${window.location.pathname}#/perfil/${profile.slug}`;
  const qr = `https://quickchart.io/qr?size=500&margin=2&text=${encodeURIComponent(url)}`;
  return <main className="min-h-screen bg-[#e9e5dc] p-5 text-[#102e46] md:p-10">
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div><p className="font-mono text-[10px] uppercase tracking-[.18em] text-[#d96b32]">Negócio Fechado · Kit de entrega</p><h1 className="mt-1 font-display text-3xl font-semibold">{profile.name}</h1></div>
        <Button onClick={() => window.print()}><Printer className="mr-2 h-4 w-4"/>Imprimir / salvar PDF</Button>
      </div>
      <section className="overflow-hidden rounded-3xl bg-[#fffdf8] shadow-xl print:rounded-none print:shadow-none">
        <div className="grid min-h-[680px] md:grid-cols-[1.15fr_.85fr]">
          <div className="flex flex-col justify-between bg-[#102e46] p-10 text-white md:p-16">
            <div><p className="font-mono text-[10px] uppercase tracking-[.22em] text-[#f4ae77]">NEGÓCIO FECHADO</p><p className="mt-2 text-sm text-white/60">Informação pra quem decide.</p></div>
            <div><p className="font-mono text-[10px] uppercase tracking-[.18em] text-[#f4ae77]">PERFIL PROFISSIONAL</p><h2 className="mt-5 font-display text-6xl font-semibold leading-[.9] tracking-[-.05em] md:text-7xl">{profile.name}</h2><p className="mt-5 text-xl">{profile.title}</p><p className="mt-2 text-sm text-white/65">{profile.location}</p></div>
            <p className="max-w-sm text-sm leading-6 text-white/65">Apresente seu currículo e, pelo QR Code, abra seu portfólio profissional completo.</p>
          </div>
          <div className="flex flex-col items-center justify-center bg-[#f8f5ed] p-10 text-center md:p-16">
            <div className="mb-5 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[.18em] text-[#d96b32]"><QrCode className="h-4 w-4"/>Meu portfólio</div>
            <img src={qr} alt={`QR Code do perfil de ${profile.name}`} className="h-64 w-64 rounded-xl bg-white p-3 shadow-sm"/>
            <p className="mt-6 max-w-sm break-all text-xs text-[#617080]">{url}</p>
            <a href={url} className="mt-5 inline-flex rounded-full bg-[#d96b32] px-6 py-3 text-sm font-bold text-white">Abrir perfil</a>
          </div>
        </div>
      </section>
      <div className="mt-5 flex items-center gap-2 text-xs text-[#617080] print:hidden"><Download className="h-4 w-4"/>Use “Imprimir / salvar PDF” para gerar uma versão pronta para enviar ou colocar no currículo.</div>
    </div>
  </main>;
}

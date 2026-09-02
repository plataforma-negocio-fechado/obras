import { ArrowLeft, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { loadProfile, resetProfile, saveProfile, type ProfessionalProfile } from "@/profileStore";

export default function ProfileEditPage() {
  const [profile, setProfile] = useState<ProfessionalProfile>(() => loadProfile());
  const [saved, setSaved] = useState(false);

  const update = <K extends keyof ProfessionalProfile>(key: K, value: ProfessionalProfile[K]) => {
    setProfile((current) => ({ ...current, [key]: value }));
    setSaved(false);
  };

  const save = () => {
    saveProfile(profile);
    setSaved(true);
  };

  const restore = () => {
    resetProfile();
    setProfile(loadProfile());
    setSaved(false);
  };

  return (
    <main className="min-h-screen bg-[#f6f6f3] text-[#202321]">
      <header className="sticky top-0 z-10 border-b border-black/10 bg-[#202321] text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-5 py-4 md:px-8">
          <Button variant="ghost" onClick={() => (window.location.hash = "/perfil/diego-silva")} className="text-white hover:bg-white/10 hover:text-white">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao perfil
          </Button>
          <div className="flex items-center gap-2">
            <Button onClick={restore} variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white">
              <RotateCcw className="mr-2 h-4 w-4" /> Restaurar
            </Button>
            <Button onClick={save} className="bg-[#b8d36a] text-[#202321] hover:bg-[#c7e47a]">
              <Save className="mr-2 h-4 w-4" /> Salvar
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 py-8 md:px-8 md:py-12">
        <div className="mb-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#789249]">Negócio Fechado</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">Editar meu perfil</h1>
          <p className="mt-2 text-sm text-[#666b65]">Atualize as informações que aparecerão no seu perfil profissional público.</p>
          {saved && <p className="mt-3 text-sm font-bold text-[#596b36]">✓ Perfil salvo com sucesso.</p>}
        </div>

        <div className="space-y-6">
          <Card className="rounded-none border-0 bg-white shadow-[4px_4px_0_#d0d1cb]">
            <CardContent className="p-6">
              <SectionTitle title="Informações principais" />
              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <Field label="Nome" value={profile.name} onChange={(v) => update("name", v)} />
                <Field label="Título profissional" value={profile.title} onChange={(v) => update("title", v)} />
                <Field label="Localização" value={profile.location} onChange={(v) => update("location", v)} />
                <Field label="CREA" value={profile.crea} onChange={(v) => update("crea", v)} />
                <Field label="Telefone" value={profile.phone} onChange={(v) => update("phone", v)} />
                <Field label="E-mail" value={profile.email} onChange={(v) => update("email", v)} />
                <div className="md:col-span-2"><Field label="Headline" value={profile.headline} onChange={(v) => update("headline", v)} /></div>
                <div className="md:col-span-2">
                  <Label>Resumo profissional</Label>
                  <Textarea value={profile.summary} onChange={(e) => update("summary", e.target.value)} className="mt-2 min-h-32" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-none border-0 bg-white shadow-[4px_4px_0_#d0d1cb]">
            <CardContent className="p-6">
              <SectionTitle title="Competências" />
              <p className="mt-2 text-xs text-[#71756f]">Uma competência por linha.</p>
              <Textarea value={profile.skills.join("\n")} onChange={(e) => update("skills", lines(e.target.value))} className="mt-4 min-h-40" />
            </CardContent>
          </Card>

          <Card className="rounded-none border-0 bg-white shadow-[4px_4px_0_#d0d1cb]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-3">
                <SectionTitle title="Projetos do portfólio" />
                <Button variant="outline" onClick={() => update("projects", [...profile.projects, { title: "Novo projeto", location: "", role: "" }])}>
                  <Plus className="mr-2 h-4 w-4" /> Adicionar projeto
                </Button>
              </div>
              <div className="mt-6 space-y-5">
                {profile.projects.map((project, index) => (
                  <Card key={`${project.title}-${index}`} className="rounded-none border border-black/10 shadow-none">
                    <CardContent className="p-5">
                      <div className="flex justify-end">
                        <Button variant="ghost" size="icon" onClick={() => update("projects", profile.projects.filter((_, i) => i !== index))} aria-label="Remover projeto"><Trash2 className="h-4 w-4 text-red-600" /></Button>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <Field label="Projeto" value={project.title} onChange={(v) => updateProject(profile, update, index, { title: v })} />
                        <Field label="Localização" value={project.location} onChange={(v) => updateProject(profile, update, index, { location: v })} />
                        <div className="md:col-span-2"><Field label="Atuação / descrição" value={project.role} onChange={(v) => updateProject(profile, update, index, { role: v })} /></div>
                        <div className="md:col-span-2"><Field label="Resultado / destaque (opcional)" value={project.result ?? ""} onChange={(v) => updateProject(profile, update, index, { result: v })} /></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-none border-0 bg-white shadow-[4px_4px_0_#d0d1cb]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-3">
                <SectionTitle title="Experiência profissional" />
                <Button variant="outline" onClick={() => update("experience", [...profile.experience, { period: "", company: "", role: "", bullets: [""] }])}>
                  <Plus className="mr-2 h-4 w-4" /> Adicionar experiência
                </Button>
              </div>
              <div className="mt-6 space-y-5">
                {profile.experience.map((item, index) => (
                  <Card key={`${item.company}-${index}`} className="rounded-none border border-black/10 shadow-none">
                    <CardContent className="p-5">
                      <div className="flex justify-end"><Button variant="ghost" size="icon" onClick={() => update("experience", profile.experience.filter((_, i) => i !== index))} aria-label="Remover experiência"><Trash2 className="h-4 w-4 text-red-600" /></Button></div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <Field label="Período" value={item.period} onChange={(v) => updateExperience(profile, update, index, { period: v })} />
                        <Field label="Empresa" value={item.company} onChange={(v) => updateExperience(profile, update, index, { company: v })} />
                        <div className="md:col-span-2"><Field label="Cargo / função" value={item.role} onChange={(v) => updateExperience(profile, update, index, { role: v })} /></div>
                        <div className="md:col-span-2">
                          <Label>Principais atividades e resultados</Label>
                          <Textarea value={item.bullets.join("\n")} onChange={(e) => updateExperience(profile, update, index, { bullets: lines(e.target.value) })} className="mt-2 min-h-32" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-wrap justify-end gap-3 pb-10">
            <Button variant="outline" onClick={() => (window.location.hash = "/perfil/diego-silva")}><ArrowLeft className="mr-2 h-4 w-4" /> Cancelar</Button>
            <Button onClick={save} className="bg-[#202321] text-white hover:bg-[#303430]"><Save className="mr-2 h-4 w-4" /> Salvar alterações</Button>
          </div>
        </div>
      </div>
    </main>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <div><Label>{label}</Label><Input value={value} onChange={(e) => onChange(e.target.value)} className="mt-2" /></div>;
}

function SectionTitle({ title }: { title: string }) {
  return <div><h2 className="text-xl font-black">{title}</h2></div>;
}

function lines(value: string) {
  return value.split("\n").map((line) => line.trim()).filter(Boolean);
}

function updateProject(profile: ProfessionalProfile, update: <K extends keyof ProfessionalProfile>(key: K, value: ProfessionalProfile[K]) => void, index: number, patch: Partial<ProfessionalProfile["projects"][number]>) {
  update("projects", profile.projects.map((item, i) => i === index ? { ...item, ...patch } : item));
}

function updateExperience(profile: ProfessionalProfile, update: <K extends keyof ProfessionalProfile>(key: K, value: ProfessionalProfile[K]) => void, index: number, patch: Partial<ProfessionalProfile["experience"][number]>) {
  update("experience", profile.experience.map((item, i) => i === index ? { ...item, ...patch } : item));
}

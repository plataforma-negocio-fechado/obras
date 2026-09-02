import { ArrowLeft, ImagePlus, Plus, RotateCcw, Save, Trash2, Upload, X } from "lucide-react";
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
    try {
      saveProfile(profile);
      setSaved(true);
    } catch {
      setSaved(false);
      window.alert("Não foi possível salvar. Algumas imagens podem estar grandes demais para o armazenamento local do navegador.");
    }
  };

  const restore = () => {
    resetProfile();
    setProfile(loadProfile());
    setSaved(false);
  };

  const setImage = async (key: "avatarUrl" | "coverImageUrl", file: File) => {
    update(key, await resizeImage(file, key === "avatarUrl" ? 700 : 1400));
  };

  const addProjectImages = async (index: number, files: FileList | null) => {
    if (!files?.length) return;
    const newImages = await Promise.all(Array.from(files).map((file) => resizeImage(file, 1200)));
    update("projects", profile.projects.map((project, i) => i === index ? { ...project, images: [...(project.images ?? []), ...newImages] } : project));
  };

  const removeProjectImage = (projectIndex: number, imageIndex: number) => {
    update("projects", profile.projects.map((project, i) => i === projectIndex ? { ...project, images: (project.images ?? []).filter((_, j) => j !== imageIndex) } : project));
  };

  return (
    <main className="min-h-screen bg-[#f6f6f3] text-[#202321]">
      <header className="sticky top-0 z-10 border-b border-black/10 bg-[#202321] text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-5 py-4 md:px-8">
          <Button variant="ghost" onClick={() => (window.location.hash = "/perfil/diego-silva")} className="text-white hover:bg-white/10 hover:text-white"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao perfil</Button>
          <div className="flex items-center gap-2">
            <Button onClick={restore} variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"><RotateCcw className="mr-2 h-4 w-4" /> Restaurar</Button>
            <Button onClick={save} className="bg-[#b8d36a] text-[#202321] hover:bg-[#c7e47a]"><Save className="mr-2 h-4 w-4" /> Salvar</Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 py-8 md:px-8 md:py-12">
        <div className="mb-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#789249]">Negócio Fechado · Área do profissional</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">Meu perfil</h1>
          <p className="mt-2 max-w-2xl text-sm text-[#666b65]">Aqui você administra o que será exibido publicamente. Esta tela já está organizada como a futura área de edição de uma conta profissional.</p>
          {saved && <p className="mt-3 text-sm font-bold text-[#596b36]">✓ Perfil salvo com sucesso.</p>}
        </div>

        <div className="space-y-6">
          <Card className="rounded-none border-0 bg-white shadow-[4px_4px_0_#d0d1cb]">
            <CardContent className="p-6">
              <SectionTitle title="Identidade visual" />
              <p className="mt-2 text-xs text-[#71756f]">Foto profissional e imagem de capa. No futuro, esses arquivos serão vinculados à conta do usuário em um armazenamento de mídia.</p>
              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <ImageUploader label="Foto de perfil" value={profile.avatarUrl} aspect="square" onChange={(file) => setImage("avatarUrl", file)} onRemove={() => update("avatarUrl", undefined)} />
                <ImageUploader label="Imagem de capa" value={profile.coverImageUrl} aspect="wide" onChange={(file) => setImage("coverImageUrl", file)} onRemove={() => update("coverImageUrl", undefined)} />
              </div>
            </CardContent>
          </Card>

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
                <div className="md:col-span-2"><Label>Resumo profissional</Label><Textarea value={profile.summary} onChange={(e) => update("summary", e.target.value)} className="mt-2 min-h-32" /></div>
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
              <div className="flex items-center justify-between gap-3"><SectionTitle title="Projetos do portfólio" /><Button variant="outline" onClick={() => update("projects", [...profile.projects, { title: "Novo projeto", location: "", role: "", images: [] }])}><Plus className="mr-2 h-4 w-4" /> Adicionar projeto</Button></div>
              <p className="mt-2 text-xs text-[#71756f]">Cada projeto pode ter várias fotos. Isso prepara o portfólio para, no futuro, receber galerias reais por usuário.</p>
              <div className="mt-6 space-y-5">
                {profile.projects.map((project, index) => (
                  <Card key={`${project.title}-${index}`} className="rounded-none border border-black/10 shadow-none">
                    <CardContent className="p-5">
                      <div className="flex justify-end"><Button variant="ghost" size="icon" onClick={() => update("projects", profile.projects.filter((_, i) => i !== index))} aria-label="Remover projeto"><Trash2 className="h-4 w-4 text-red-600" /></Button></div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <Field label="Projeto" value={project.title} onChange={(v) => updateProject(profile, update, index, { title: v })} />
                        <Field label="Localização" value={project.location} onChange={(v) => updateProject(profile, update, index, { location: v })} />
                        <div className="md:col-span-2"><Field label="Atuação / descrição" value={project.role} onChange={(v) => updateProject(profile, update, index, { role: v })} /></div>
                        <div className="md:col-span-2"><Field label="Resultado / destaque (opcional)" value={project.result ?? ""} onChange={(v) => updateProject(profile, update, index, { result: v })} /></div>
                        <div className="md:col-span-2">
                          <div className="flex flex-wrap items-center justify-between gap-3"><div><Label>Fotos do projeto</Label><p className="mt-1 text-xs text-[#71756f]">JPG, PNG ou WebP. As imagens são reduzidas automaticamente.</p></div><label className="inline-flex cursor-pointer items-center rounded-md border border-black/10 px-3 py-2 text-xs font-bold hover:bg-black/[.03]"><ImagePlus className="mr-2 h-4 w-4" /> Adicionar fotos<input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { void addProjectImages(index, e.target.files); e.currentTarget.value = ""; }} /></label></div>
                          {(project.images ?? []).length > 0 && <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3"><ImageGrid images={project.images ?? []} onRemove={(imageIndex) => removeProjectImage(index, imageIndex)} /></div>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-none border-0 bg-white shadow-[4px_4px_0_#d0d1cb]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-3"><SectionTitle title="Experiência profissional" /><Button variant="outline" onClick={() => update("experience", [...profile.experience, { period: "", company: "", role: "", bullets: [""] }])}><Plus className="mr-2 h-4 w-4" /> Adicionar experiência</Button></div>
              <div className="mt-6 space-y-5">
                {profile.experience.map((item, index) => (
                  <Card key={`${item.company}-${index}`} className="rounded-none border border-black/10 shadow-none"><CardContent className="p-5"><div className="flex justify-end"><Button variant="ghost" size="icon" onClick={() => update("experience", profile.experience.filter((_, i) => i !== index))} aria-label="Remover experiência"><Trash2 className="h-4 w-4 text-red-600" /></Button></div><div className="grid gap-4 md:grid-cols-2"><Field label="Período" value={item.period} onChange={(v) => updateExperience(profile, update, index, { period: v })} /><Field label="Empresa" value={item.company} onChange={(v) => updateExperience(profile, update, index, { company: v })} /><div className="md:col-span-2"><Field label="Cargo / função" value={item.role} onChange={(v) => updateExperience(profile, update, index, { role: v })} /></div><div className="md:col-span-2"><Label>Principais atividades e resultados</Label><Textarea value={item.bullets.join("\n")} onChange={(e) => updateExperience(profile, update, index, { bullets: lines(e.target.value) })} className="mt-2 min-h-32" /></div></div></CardContent></Card>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-wrap justify-end gap-3 pb-10"><Button variant="outline" onClick={() => (window.location.hash = "/perfil/diego-silva")}><ArrowLeft className="mr-2 h-4 w-4" /> Cancelar</Button><Button onClick={save} className="bg-[#202321] text-white hover:bg-[#303430]"><Save className="mr-2 h-4 w-4" /> Salvar alterações</Button></div>
        </div>
      </div>
    </main>
  );
}

function ImageUploader({ label, value, aspect, onChange, onRemove }: { label: string; value?: string; aspect: "square" | "wide"; onChange: (file: File) => void; onRemove: () => void }) {
  return <div><Label>{label}</Label><div className={`relative mt-2 overflow-hidden border border-dashed border-black/15 bg-[#f6f6f3] ${aspect === "square" ? "aspect-square max-w-[220px]" : "aspect-[16/7]"}`}>{value ? <><img src={value} alt="" className="h-full w-full object-cover" /><button type="button" onClick={onRemove} className="absolute right-2 top-2 rounded-full bg-black/70 p-2 text-white" aria-label={`Remover ${label}`}><X className="h-4 w-4" /></button></> : <label className="flex h-full cursor-pointer flex-col items-center justify-center gap-2 text-center text-xs text-[#71756f]"><Upload className="h-6 w-6" /><span className="font-bold text-[#202321]">Escolher imagem</span><span>Otimizada automaticamente</span><input type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) onChange(file); e.currentTarget.value = ""; }} /></label>}</div></div>;
}

function ImageGrid({ images, onRemove }: { images: string[]; onRemove: (index: number) => void }) {
  return <>{images.map((image, index) => <div key={`${image.slice(0, 20)}-${index}`} className="group relative aspect-[4/3] overflow-hidden bg-[#f0ece3]"><img src={image} alt="" className="h-full w-full object-cover" /><button type="button" onClick={() => onRemove(index)} className="absolute right-2 top-2 rounded-full bg-black/70 p-1.5 text-white opacity-0 transition group-hover:opacity-100" aria-label="Remover foto"><X className="h-3.5 w-3.5" /></button></div>)}</>;
}

async function resizeImage(file: File, maxSize: number): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Arquivo inválido");
  const source = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(source.width, source.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(source.width * scale));
  canvas.height = Math.max(1, Math.round(source.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponível");
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  source.close();
  return canvas.toDataURL("image/jpeg", 0.78);
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <div><Label>{label}</Label><Input value={value} onChange={(e) => onChange(e.target.value)} className="mt-2" /></div>; }
function SectionTitle({ title }: { title: string }) { return <div><h2 className="text-xl font-black">{title}</h2></div>; }
function lines(value: string) { return value.split("\n").map((line) => line.trim()).filter(Boolean); }
function updateProject(profile: ProfessionalProfile, update: <K extends keyof ProfessionalProfile>(key: K, value: ProfessionalProfile[K]) => void, index: number, patch: Partial<ProfessionalProfile["projects"][number]>) { update("projects", profile.projects.map((item, i) => i === index ? { ...item, ...patch } : item)); }
function updateExperience(profile: ProfessionalProfile, update: <K extends keyof ProfessionalProfile>(key: K, value: ProfessionalProfile[K]) => void, index: number, patch: Partial<ProfessionalProfile["experience"][number]>) { update("experience", profile.experience.map((item, i) => i === index ? { ...item, ...patch } : item)); }

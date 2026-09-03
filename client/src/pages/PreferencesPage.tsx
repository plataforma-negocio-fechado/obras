import { useEffect, useState, type FormEvent } from "react";
import { Download, MapPin, Save, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useLocalProject } from "@/localStore";
import { usePilotLocation } from "@/pilotRouting";
import SyncPanel from "@/components/SyncPanel";

const Kicker = ({ children }: { children: React.ReactNode }) => <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#71756f]">{children}</p>;

export default function PreferencesPage() {
  const { project, syncStatus, syncNow, updateProject } = useLocalProject();
  const [, navigate] = usePilotLocation();
  const [name, setName] = useState(project.name);
  const [location, setLocation] = useState(project.location);
  const [status, setStatus] = useState(project.status);
  const [description, setDescription] = useState(project.description);

  useEffect(() => { setName(project.name); setLocation(project.location); setStatus(project.status); setDescription(project.description); }, [project.name, project.location, project.status, project.description]);
  const save = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!name.trim() || !location.trim() || !description.trim()) { toast.error("Informe o nome, a localização e uma descrição curta da obra."); return; } updateProject({ name: name.trim(), location: location.trim(), status, description: description.trim() }); toast.success("Dados da obra atualizados neste navegador"); };

  return <div className="min-h-screen bg-[#ececea] px-4 py-8 sm:px-8 lg:px-12"><div className="mx-auto max-w-4xl">
    <header className="border-b border-black/10 pb-6"><Kicker>Configuração essencial</Kicker><h1 className="mt-3 text-5xl font-black uppercase tracking-[-0.08em]">Preferências</h1><p className="mt-3 max-w-2xl text-sm text-[#70756e]">Apenas os dados que identificam a obra e o aplicativo.</p></header>
    <div className="mt-8 grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
      <Card className="rounded-none border-0 bg-[#f6f6f3] shadow-[5px_5px_0_#d0d1cb]"><CardContent className="p-6"><div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-[#789249]" /><Kicker>Dados da obra</Kicker></div><form onSubmit={save} className="mt-5 space-y-4"><div><label className="text-xs font-bold">Nome da obra *</label><Input value={name} onChange={(event) => setName(event.target.value)} className="mt-2 h-11 border-black/10 bg-white" /></div><div><label className="text-xs font-bold">Cidade / UF *</label><Input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Ex.: Remígio/PB" className="mt-2 h-11 border-black/10 bg-white" /></div><div><label className="text-xs font-bold">Situação</label><select value={status} onChange={(event) => setStatus(event.target.value)} className="mt-2 h-11 w-full border border-black/10 bg-white px-3 text-sm"><option>Em execução</option><option>Planejada</option><option>Concluída</option><option>Paralisada</option></select></div><div><label className="text-xs font-bold">Descrição curta *</label><Textarea value={description} onChange={(event) => setDescription(event.target.value)} className="mt-2 min-h-24 border-black/10 bg-white" /></div><Button type="submit" className="h-12 w-full bg-[#202321] text-white"><Save className="mr-2 h-4 w-4" />Salvar alterações</Button></form></CardContent></Card>
      <div className="space-y-5"><SyncPanel syncStatus={syncStatus} syncNow={syncNow} /><Card className="rounded-none border-0 bg-[#202321] text-white shadow-[5px_5px_0_#c7c9c2]"><CardContent className="p-6"><Settings2 className="h-5 w-5 text-[#b8d36a]" /><Kicker>Sistema</Kicker><h2 className="mt-3 text-2xl font-black uppercase leading-tight">Plataforma Negócio Fechado</h2><p className="mt-2 text-sm text-white/65">Módulo: Obras</p><p className="mt-5 text-xs leading-5 text-white/55">O ambiente operacional pode evoluir para outros módulos sem misturar os dados.</p></CardContent></Card><Card className="rounded-none border-0 bg-[#f6f6f3] shadow-[5px_5px_0_#d0d1cb]"><CardContent className="p-6"><Kicker>Registros</Kicker><h2 className="mt-3 text-xl font-black">Categorias e visualização</h2><p className="mt-2 text-xs leading-5 text-[#70756e]">Defina como Diário, Ocorrências, Ações, Produção, Materiais, Equipe e Máquinas serão organizados e exibidos.</p><Button type="button" variant="outline" onClick={() => navigate("/configuracao-registros")} className="mt-4 border-black/15 bg-white">Configurar registros</Button></CardContent></Card><Card className="rounded-none border-l-4 border-l-[#d89b45] bg-[#f6f6f3] shadow-[5px_5px_0_#d0d1cb]"><CardContent className="p-6"><Download className="h-5 w-5 text-[#b67b2c]" /><Kicker>Seus dados</Kicker><p className="mt-3 text-sm leading-6 text-[#70756e]">A plataforma continua guardando seus dados neste navegador. Faça um backup antes de trocar de aparelho ou limpar o navegador.</p><Button type="button" variant="outline" onClick={() => navigate("/dados")} className="mt-4 border-black/15 bg-white">Abrir backup</Button></CardContent></Card></div>
    </div>
  </div></div>;
}

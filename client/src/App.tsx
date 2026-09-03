import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import DashboardLayout from "@/components/DashboardLayout";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import OperationalExtrasPage from "@/pages/OperationalExtrasPage";
import DiaryPage from "@/pages/DiaryPage";
import ActionsPage from "@/pages/ActionsPage";
import OccurrencesPage from "@/pages/OccurrencesPage";
import SetupPage from "@/pages/SetupPage";
import NotFound from "@/pages/NotFound";
import BackupPage from "@/pages/BackupPage";
import WeeklyReportPage from "@/pages/WeeklyReportPage";
import WeeklyPlanningPage from "@/pages/WeeklyPlanningPage";
import EvidenceGalleryPage from "@/pages/EvidenceGalleryPage";
import MaterialsPage from "@/pages/MaterialsPage";
import TeamPage from "@/pages/TeamPage";
import MachinesPage from "@/pages/MachinesPage";
import PreferencesPage from "@/pages/PreferencesPage";
import RecordSettingsPage from "@/pages/RecordSettingsPage";
import StartPage from "@/pages/StartPage";
import FieldPage from "@/pages/FieldPage";
import ProfilePage from "@/pages/ProfilePage";
import ProfileEditPage from "@/pages/ProfileEditPage";
import AccessPage from "@/pages/AccessPage";
import { usePilotLocation } from "@/pilotRouting";

function ProfileEditorActions() {
  const publicUrl = `${window.location.origin}${window.location.pathname}#/perfil/diego-silva`;
  const share = async () => {
    if (navigator.share) { await navigator.share({ title: "Meu perfil profissional · Negócio Fechado", url: publicUrl }); return; }
    await navigator.clipboard?.writeText(publicUrl);
    window.alert("Link público copiado.");
  };
  return <div className="fixed bottom-4 right-4 z-30 flex gap-2 rounded-xl border border-[#d8d2c5] bg-[#fffdf8]/95 p-2 shadow-xl backdrop-blur"><button type="button" onClick={() => (window.location.hash = "/perfil/diego-silva")} className="rounded-lg border border-[#d8d2c5] px-3 py-2 text-xs font-bold text-[#102e46]">Visualizar portal</button><button type="button" onClick={() => void share()} className="rounded-lg bg-[#d96b32] px-3 py-2 text-xs font-bold text-white">Compartilhar portal</button></div>;
}

function AppRouter() {
  const [path] = usePilotLocation();
  if (path === "/") return <ProfilePage />;
  if (path === "/acesso") return <AccessPage />;
  if (path === "/obras") return <StartPage />;
  if (path === "/campo") return <FieldPage />;
  if (path === "/meu-perfil") return <><ProfileEditPage /><ProfileEditorActions /></>;
  if (path === "/perfil/editar") return <><ProfileEditPage /><ProfileEditorActions /></>;
  if (path === "/perfil" || path === "/perfil/diego-silva") return <ProfilePage />;
  const content =
    path === "/hoje" ? <Home /> :
    path === "/diario" ? <DiaryPage /> :
    path === "/frentes" ? <OperationalExtrasPage mode="frentes" /> :
    path === "/ocorrencias" ? <OccurrencesPage /> :
    path === "/acoes" ? <ActionsPage /> :
    path === "/planejamento" ? <WeeklyPlanningPage /> :
    path === "/timeline" ? <OperationalExtrasPage mode="timeline" /> :
    path === "/cadastro" ? <SetupPage /> :
    path === "/dados" ? <BackupPage /> :
    path === "/relatorio" ? <WeeklyReportPage /> :
    path === "/evidencias" ? <EvidenceGalleryPage /> :
    path === "/materiais" ? <MaterialsPage /> :
    path === "/equipe" ? <TeamPage /> :
    path === "/maquinas" ? <MachinesPage /> :
    path === "/preferencias" ? <PreferencesPage /> :
    path === "/configuracao-registros" ? <RecordSettingsPage /> :
    <NotFound />;
  return <DashboardLayout>{content}</DashboardLayout>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster /><AppRouter /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}

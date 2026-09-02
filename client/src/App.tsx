import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import DashboardLayout from "@/components/DashboardLayout";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import OperationalPage from "@/pages/OperationalPage";
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
import StartPage from "@/pages/StartPage";
import FieldPage from "@/pages/FieldPage";
import ProfilePage from "@/pages/ProfilePage";
import { usePilotLocation } from "@/pilotRouting";

function AppRouter() {
  const [path] = usePilotLocation();
  if (path === "/") return <StartPage />;
  if (path === "/campo") return <FieldPage />;
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
    <NotFound />;
  return <DashboardLayout>{content}</DashboardLayout>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster /><AppRouter /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { SalaProvider, useSalaContext } from "@/hooks/useSalaContext";
import AppLayout from "@/components/layout/AppLayout";
import SalaSelector from "@/pages/SalaSelector";
import Dashboard from "@/pages/Dashboard";
import LancarXP from "@/pages/LancarXP";
import RankingEquipes from "@/pages/RankingEquipes";
import RankingIndividual from "@/pages/RankingIndividual";
import Salas from "@/pages/Salas";
import Equipes from "@/pages/Equipes";
import Alunos from "@/pages/Alunos";
import Atividades from "@/pages/Atividades";
import Historico from "@/pages/Historico";
import Fases from "@/pages/Fases";
import Transferencias from "@/pages/Transferencias";
import Loja from "@/pages/Loja";
import Ocorrencias from "@/pages/Ocorrencias";
import PoderAlunos from "@/pages/PoderAlunos";
import TVMode from "@/pages/TVMode";
import Auth from "@/pages/Auth";
import AlunoLogin from "@/pages/AlunoLogin";
import AlunoDashboard from "@/pages/AlunoDashboard";
import LeaderLogin from "@/pages/LeaderLogin";
import LeaderDashboard from "@/pages/LeaderDashboard";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function SalaGate({ children }: { children: React.ReactNode }) {
  const { salaSelected } = useSalaContext();
  if (!salaSelected) return <SalaSelector />;
  return <>{children}</>;
}

const AppRoutes = () => (
  <Routes>
    <Route path="/auth" element={<Auth />} />
    <Route path="/aluno-login" element={<AlunoLogin />} />
    <Route path="/aluno" element={<AlunoDashboard />} />
    <Route path="/lider-login" element={<LeaderLogin />} />
    <Route path="/lider" element={<LeaderDashboard />} />
    <Route path="/tv" element={<ProtectedRoute><TVMode /></ProtectedRoute>} />
    <Route path="/salas" element={<ProtectedRoute><AppLayout><Salas /></AppLayout></ProtectedRoute>} />
    <Route path="/" element={<ProtectedRoute><SalaGate><AppLayout><Dashboard /></AppLayout></SalaGate></ProtectedRoute>} />
    <Route path="/lancar-xp" element={<ProtectedRoute><SalaGate><AppLayout><LancarXP /></AppLayout></SalaGate></ProtectedRoute>} />
    <Route path="/ranking-equipes" element={<ProtectedRoute><SalaGate><AppLayout><RankingEquipes /></AppLayout></SalaGate></ProtectedRoute>} />
    <Route path="/ranking-individual" element={<ProtectedRoute><SalaGate><AppLayout><RankingIndividual /></AppLayout></SalaGate></ProtectedRoute>} />
    <Route path="/equipes" element={<ProtectedRoute><SalaGate><AppLayout><Equipes /></AppLayout></SalaGate></ProtectedRoute>} />
    <Route path="/alunos" element={<ProtectedRoute><SalaGate><AppLayout><Alunos /></AppLayout></SalaGate></ProtectedRoute>} />
    <Route path="/atividades" element={<ProtectedRoute><AppLayout><Atividades /></AppLayout></ProtectedRoute>} />
    <Route path="/historico" element={<ProtectedRoute><SalaGate><AppLayout><Historico /></AppLayout></SalaGate></ProtectedRoute>} />
    <Route path="/fases" element={<ProtectedRoute><AppLayout><Fases /></AppLayout></ProtectedRoute>} />
    <Route path="/transferencias" element={<ProtectedRoute><SalaGate><AppLayout><Transferencias /></AppLayout></SalaGate></ProtectedRoute>} />
    <Route path="/loja" element={<ProtectedRoute><AppLayout><Loja /></AppLayout></ProtectedRoute>} />
    <Route path="/ocorrencias" element={<ProtectedRoute><SalaGate><AppLayout><Ocorrencias /></AppLayout></SalaGate></ProtectedRoute>} />
    <Route path="/poder-alunos" element={<ProtectedRoute><SalaGate><AppLayout><PoderAlunos /></AppLayout></SalaGate></ProtectedRoute>} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <SalaProvider>
            <AppRoutes />
          </SalaProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

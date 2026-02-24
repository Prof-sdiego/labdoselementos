import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/layout/AppLayout";
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
import TVMode from "@/pages/TVMode";
import Auth from "@/pages/Auth";
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

const AppRoutes = () => (
  <Routes>
    <Route path="/auth" element={<Auth />} />
    <Route path="/lider-login" element={<LeaderLogin />} />
    <Route path="/lider" element={<LeaderDashboard />} />
    <Route path="/tv" element={<ProtectedRoute><TVMode /></ProtectedRoute>} />
    <Route path="/" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
    <Route path="/lancar-xp" element={<ProtectedRoute><AppLayout><LancarXP /></AppLayout></ProtectedRoute>} />
    <Route path="/ranking-equipes" element={<ProtectedRoute><AppLayout><RankingEquipes /></AppLayout></ProtectedRoute>} />
    <Route path="/ranking-individual" element={<ProtectedRoute><AppLayout><RankingIndividual /></AppLayout></ProtectedRoute>} />
    <Route path="/salas" element={<ProtectedRoute><AppLayout><Salas /></AppLayout></ProtectedRoute>} />
    <Route path="/equipes" element={<ProtectedRoute><AppLayout><Equipes /></AppLayout></ProtectedRoute>} />
    <Route path="/alunos" element={<ProtectedRoute><AppLayout><Alunos /></AppLayout></ProtectedRoute>} />
    <Route path="/atividades" element={<ProtectedRoute><AppLayout><Atividades /></AppLayout></ProtectedRoute>} />
    <Route path="/historico" element={<ProtectedRoute><AppLayout><Historico /></AppLayout></ProtectedRoute>} />
    <Route path="/fases" element={<ProtectedRoute><AppLayout><Fases /></AppLayout></ProtectedRoute>} />
    <Route path="/transferencias" element={<ProtectedRoute><AppLayout><Transferencias /></AppLayout></ProtectedRoute>} />
    <Route path="/loja" element={<ProtectedRoute><AppLayout><Loja /></AppLayout></ProtectedRoute>} />
    <Route path="/ocorrencias" element={<ProtectedRoute><AppLayout><Ocorrencias /></AppLayout></ProtectedRoute>} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
<BrowserRouter basename="/labdoselementos">
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

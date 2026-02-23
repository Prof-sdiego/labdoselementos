import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import TVMode from "@/pages/TVMode";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/lancar-xp" element={<LancarXP />} />
            <Route path="/ranking-equipes" element={<RankingEquipes />} />
            <Route path="/ranking-individual" element={<RankingIndividual />} />
            <Route path="/salas" element={<Salas />} />
            <Route path="/equipes" element={<Equipes />} />
            <Route path="/alunos" element={<Alunos />} />
            <Route path="/atividades" element={<Atividades />} />
            <Route path="/historico" element={<Historico />} />
            <Route path="/fases" element={<Fases />} />
            <Route path="/transferencias" element={<Transferencias />} />
            <Route path="/tv" element={<TVMode />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

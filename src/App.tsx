import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";
import Overview from "./pages/Overview";
import RiskInbox from "./pages/RiskInbox";
import TrustGraph from "./pages/TrustGraph";
import EntityDetail from "./pages/EntityDetail";
import Entities from "./pages/Entities";
import PolicySimulator from "./pages/PolicySimulator";
import SettingsPage from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/risk-inbox" element={<RiskInbox />} />
            <Route path="/trust-graph" element={<TrustGraph />} />
            <Route path="/entity/:id" element={<EntityDetail />} />
            <Route path="/entities" element={<Entities />} />
            <Route path="/policy-simulator" element={<PolicySimulator />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

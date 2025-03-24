import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/context/AppContext";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import NewRequest from "@/pages/NewRequest";
import AllocateTasks from "@/pages/AllocateTasks";
import Reports from "@/pages/Reports";
import Metrics from "@/pages/Metrics";
import Settings from "@/pages/Settings";
import NotFound from "./pages/NotFound";

// Load Framer Motion
import { AnimatePresence } from "framer-motion";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AnimatePresence mode="wait">
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/new-request" element={<NewRequest />} />
                <Route path="/allocate" element={<AllocateTasks />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/metrics" element={<Metrics />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Layout>
          </AnimatePresence>
        </BrowserRouter>
      </TooltipProvider>
    </AppProvider>
  </QueryClientProvider>
);

export default App;

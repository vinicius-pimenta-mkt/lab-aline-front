import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Services from "./pages/Services";
import NewService from "./pages/NewService";
import ServiceDetail from "./pages/ServiceDetail";
import Reports from "./pages/Reports";
import Partners from "./pages/Partners";
import TsbDashboard from "./pages/TsbDashboard";
import TsbLogin from "./pages/TsbLogin"; // <-- Importação do Login TSB
import DashboardLayout from "./components/DashboardLayout";
import { useEffect, useState } from "react";

// Proteção do Laboratório (Usa o 'token' normal)
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const [, setLocation] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsAuthenticated(true);
    } else {
      setLocation("/login");
    }
    setLoading(false);
  }, [setLocation]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  return isAuthenticated ? <Component /> : null;
}

// Proteção Exclusiva da Clínica TSB (Usa o 'tsb_token')
function TsbProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const [, setLocation] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("tsb_token");
    if (token) {
      setIsAuthenticated(true);
    } else {
      setLocation("/tsb/login");
    }
    setLoading(false);
  }, [setLocation]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-teal-600 font-bold">Carregando Clinic...</div>;
  }

  return isAuthenticated ? <Component /> : null;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/tsb/login" component={TsbLogin} /> {/* <-- Rota do Login TSB */}
      
      <Route path="/dashboard">
        {() => (
          <DashboardLayout>
            <ProtectedRoute component={Dashboard} />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/services">
        {() => (
          <DashboardLayout>
            <ProtectedRoute component={Services} />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/services/new">
        {() => (
          <DashboardLayout>
            <ProtectedRoute component={NewService} />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/services/:id">
        {() => (
          <DashboardLayout>
            <ProtectedRoute component={ServiceDetail} />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/reports">
        {() => (
          <DashboardLayout>
            <ProtectedRoute component={Reports} />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/partners">
        {() => (
          <DashboardLayout>
            <ProtectedRoute component={Partners} />
          </DashboardLayout>
        )}
      </Route>

      {/* <-- MICRO-SISTEMA TSB ISOLADO (Com Proteção Exclusiva) --> */}
      <Route path="/tsb">
        {() => (
          <TsbProtectedRoute component={TsbDashboard} />
        )}
      </Route>

      <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

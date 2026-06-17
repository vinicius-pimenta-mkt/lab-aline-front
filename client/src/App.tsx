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
import Partners from "./pages/Partners"; // <-- Importação adicionada aqui
import DashboardLayout from "./components/DashboardLayout";
import { useEffect, useState } from "react";

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

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
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
      
      {/* <-- NOVA ROTA ADICIONADA AQUI --> */}
      <Route path="/partners">
        {() => (
          <DashboardLayout>
            <ProtectedRoute component={Partners} />
          </DashboardLayout>
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

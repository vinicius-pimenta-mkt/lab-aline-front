import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Menu, X, LogOut, Home, FileText, Plus, BarChart3, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isDesktop, setIsDesktop] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    let wasDesktop = window.innerWidth >= 768;
    setIsDesktop(wasDesktop);
    setSidebarOpen(wasDesktop);

    const checkScreenSize = () => {
      const isNowDesktop = window.innerWidth >= 768;
      // Impede que o scroll no celular (que esconde a barra de endereço) quebre o layout
      if (isNowDesktop !== wasDesktop) {
        setIsDesktop(isNowDesktop);
        setSidebarOpen(isNowDesktop);
        wasDesktop = isNowDesktop;
      }
    };

    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    toast.success("Logout realizado com sucesso");
    setLocation("/login");
  };

  const menuItems = [
    { label: "DASHBOARD", icon: Home, href: "/dashboard" },
    { label: "SERVIÇOS", icon: FileText, href: "/services" },
    { label: "NOVO SERVIÇO", icon: Plus, href: "/services/new" },
    { label: "RELATÓRIOS", icon: BarChart3, href: "/reports" },
    { label: "PARCEIROS", icon: Users, href: "/partners" },
  ];

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const handleNavigate = (href: string) => {
    setLocation(href);
    if (!isDesktop) {
      setSidebarOpen(false);
    }
  };

  return (
    // Trocado min-h-screen por h-[100dvh] para travar o layout no celular perfeitamente
    <div className="h-[100dvh] w-full bg-neutral-950 flex overflow-hidden relative">
      
      {/* ========================================== */}
      {/* IMAGEM DE FUNDO GLOBAL DO SISTEMA          */}
      {/* ========================================== */}
      <img 
        src="/alinefundo.png" 
        alt="Fundo do Sistema" 
        className="absolute inset-0 w-full h-full object-cover z-0 opacity-30 pointer-events-none" 
      />
      <div className="absolute inset-0 bg-neutral-950/80 z-0 pointer-events-none" />

      {/* Sombra de fundo escura de sobreposição (exclusiva para telemóvel com menu aberto) */}
      {!isDesktop && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-40 backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Menu Lateral (Sidebar) com fundo translúcido para mesclar com o fundo */}
      <div
        className={`fixed inset-y-0 left-0 h-[100dvh] z-50 bg-neutral-900/90 backdrop-blur-md border-r border-neutral-800/50 flex flex-col transition-all duration-300 md:relative md:translate-x-0
          ${sidebarOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0 w-64 md:w-20"}
        `}
      >
        <div className="p-4 border-b border-neutral-800/50 flex items-center justify-between h-16 shrink-0">
          <div className="flex items-center gap-1.5 overflow-hidden">
            <img 
              src="/logoaline.png" 
              alt="Logo Aline Antunes" 
              className="w-10 h-10 object-contain shrink-0" 
            />
            {(isDesktop ? sidebarOpen : true) && (
              <span className="font-black text-white tracking-wider text-xs truncate uppercase">
                Aline Antunes
              </span>
            )}
          </div>
          
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 hover:bg-neutral-800/50 rounded-lg transition-colors text-neutral-400"
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <p className={`text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-4 px-2 ${isDesktop && !sidebarOpen ? 'hidden' : 'block'}`}>
            Menu Principal
          </p>
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.href}
                onClick={() => handleNavigate(item.href)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold text-neutral-300 hover:bg-[#DEAE60]/10 hover:text-[#DEAE60] transition-colors group"
              >
                <item.icon className="w-5 h-5 text-[#DEAE60] shrink-0" />
                {(isDesktop ? sidebarOpen : true) && <span className="truncate">{item.label}</span>}
              </button>
            ))}
          </nav>
        </div>

        <div className="border-t border-neutral-800/50 p-4 space-y-3 shrink-0">
          {(isDesktop ? sidebarOpen : true) && (
            <div className="px-3 py-2 bg-neutral-950/40 border border-neutral-800/60 rounded-lg">
              <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider">Usuário</p>
              <p className="text-xs font-bold text-white mt-0.5 truncate">{user.username || "Admin"}</p>
            </div>
          )}
          <Button
            onClick={handleLogout}
            className="w-full bg-[#DEAE60] hover:bg-[#DEAE60]/90 text-neutral-950 font-black rounded-lg flex items-center justify-center gap-2 h-10 text-xs uppercase tracking-tight"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {(isDesktop ? sidebarOpen : true) && "Sair"}
          </Button>
        </div>
      </div>

      {/* Contentor Central (Z-10 para ficar por cima do fundo) */}
      <div className="flex-1 flex flex-col h-[100dvh] overflow-hidden relative z-10">
        
        {/* Barra Superior Mobile - COM A LOGO RESTAURADA */}
        {!isDesktop && (
          <div className="bg-neutral-900/90 backdrop-blur-md border-b border-neutral-800/50 px-4 h-16 flex items-center justify-between z-30 shrink-0">
            <div className="flex items-center gap-2.5">
              <img 
                src="/logoaline.png" 
                alt="Logo" 
                className="w-8 h-8 object-contain shrink-0" 
              />
              <h1 className="font-black text-white tracking-wider text-sm uppercase">Aline Antunes</h1>
            </div>
            
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 bg-neutral-800/40 hover:bg-neutral-800/80 rounded-xl transition-colors border border-neutral-800/50 text-[#DEAE60]"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className="flex-1 overflow-auto bg-transparent">
          {children}
        </div>
      </div>

    </div>
  );
}

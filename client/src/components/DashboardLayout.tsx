import { useState } from "react";
import { useLocation } from "wouter";
import { Menu, X, LogOut, Home, FileText, Plus, BarChart3, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [, setLocation] = useLocation();

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
    { label: "CONFIGURAÇÕES", icon: Settings, href: "/settings" },
  ];

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const handleNavigate = (href: string) => {
    setLocation(href);
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-neutral-900 border-r border-neutral-800 transition-all duration-300 flex flex-col fixed h-screen z-40 md:relative`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#DEAE60] rounded-lg flex items-center justify-center font-bold text-neutral-950 text-sm">
              AA
            </div>
            {sidebarOpen && <span className="font-bold text-white text-sm">ALINE</span>}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 hover:bg-neutral-800 rounded transition-colors md:hidden"
          >
            {sidebarOpen ? (
              <X className="w-4 h-4 text-neutral-400" />
            ) : (
              <Menu className="w-4 h-4 text-neutral-400" />
            )}
          </button>
        </div>

        {/* Menu Principal */}
        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4 px-2">
            {sidebarOpen ? "Menu Principal" : ""}
          </p>
          <nav className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.href}
                onClick={() => handleNavigate(item.href)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold text-neutral-300 hover:bg-[#DEAE60]/10 hover:text-[#DEAE60] transition-colors group"
              >
                <item.icon className="w-5 h-5 text-[#DEAE60]" />
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            ))}
          </nav>
        </div>

        {/* User Info & Logout */}
        <div className="border-t border-neutral-800 p-4 space-y-3">
          {sidebarOpen && (
            <div className="px-2 py-2 bg-neutral-800/50 rounded-lg">
              <p className="text-xs font-bold text-neutral-400">USUÁRIO</p>
              <p className="text-sm font-bold text-white mt-1">{user.username || "Admin"}</p>
            </div>
          )}
          <Button
            onClick={handleLogout}
            className="w-full bg-[#DEAE60] hover:bg-[#DEAE60]/90 text-neutral-950 font-bold rounded-lg flex items-center justify-center gap-2 h-10"
          >
            <LogOut className="w-4 h-4" />
            {sidebarOpen && "SAIR"}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar - Mobile */}
        <div className="bg-neutral-900 border-b border-neutral-800 p-4 flex items-center justify-between md:hidden">
          <h1 className="font-bold text-white">Aline Antunes</h1>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
          >
            {sidebarOpen ? (
              <X className="w-5 h-5 text-neutral-400" />
            ) : (
              <Menu className="w-5 h-5 text-neutral-400" />
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-neutral-950">
          {children}
        </div>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

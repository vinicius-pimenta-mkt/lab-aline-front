import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import api from "../lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Lock } from "lucide-react";

export default function TsbLogin() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Bloco corrigido e fechado corretamente!
  useEffect(() => {
    document.title = "Login | Clinic TSB";
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await api.post("/tsb/login", { username, password });
      
      localStorage.setItem("tsb_token", response.data.token);
      localStorage.setItem("tsb_user", JSON.stringify(response.data.user));
      
      toast.success("Bem-vinda à Clínica TSB!");
      setLocation("/tsb");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center bg-cover bg-center bg-fixed p-4 font-sans"
      style={{ backgroundImage: "url('/fundoalinetsb.jpg')" }}
    >
      {/* Overlay translúcido para leitura */}
      <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-0"></div>

      <div className="w-full max-w-md bg-white border border-neutral-100 rounded-3xl shadow-2xl shadow-teal-900/10 p-8 relative z-10">
        <div className="flex flex-col items-center mb-8">
          {/* Logo da Aline inserida aqui */}
          <img 
            src="/logoaline.png" 
            alt="Logo Aline Antunes" 
            className="w-20 h-20 object-contain mb-2" 
          />
          <h1 className="text-2xl font-black text-teal-700 uppercase tracking-tighter">Clinic TSB</h1>
          <p className="text-neutral-500 text-sm mt-1">Acesso exclusivo Profilaxia</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Usuário</label>
            <Input 
              required 
              value={username} 
              onChange={(e) => setUsername(e.target.value)}
              className="h-12 bg-neutral-50 text-neutral-900 border-neutral-200 focus-visible:ring-teal-500" 
              placeholder="Digite seu usuário"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Senha</label>
            <Input 
              required 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 bg-neutral-50 text-neutral-900 border-neutral-200 focus-visible:ring-teal-500" 
              placeholder="••••••"
            />
          </div>
          
          <Button 
            type="submit" 
            disabled={loading} 
            className="w-full h-12 bg-teal-500 hover:bg-teal-600 text-white font-black uppercase tracking-wider rounded-xl mt-4 shadow-md shadow-teal-500/20"
          >
            {loading ? "Autenticando..." : "Entrar no Sistema"}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-neutral-100 flex items-center justify-center gap-2 text-xs text-neutral-400">
            <Lock className="w-3 h-3" />
            <span>Acesso Seguro Restrito</span>
        </div>
      </div>
    </div>
  );
}

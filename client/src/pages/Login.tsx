import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Smile } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Simulação de login - será integrado com backend
      if (username && password) {
        // Armazenar token/sessão
        localStorage.setItem("user", JSON.stringify({ username }));
        toast.success("Login realizado com sucesso!");
        setLocation("/dashboard");
      } else {
        setError("Preencha todos os campos");
      }
    } catch (err) {
      setError("Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center relative p-4 sm:p-6 bg-neutral-950">
      <img 
        src="https://i.postimg.cc/bN7dfZw5/okkg.png" 
        className="absolute inset-0 w-full h-full object-cover z-0 opacity-40" 
        alt="Fundo" 
      />
      <div className="fixed inset-0 bg-neutral-950/40 backdrop-blur-[3px] z-10" />

      <Card className="w-full max-w-[400px] shadow-2xl z-20 bg-neutral-900/90 border-[0.5px] border-neutral-800 backdrop-blur-md overflow-hidden rounded-xl">
        <div className="text-center space-y-4 pt-8 pb-4 px-6 sm:px-8">
          <div className="flex justify-center mb-2">
            <div className="p-3 w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center bg-[#DEAE60]/10 rounded-full border-2 border-[#DEAE60]/30">
              <span className="text-3xl sm:text-4xl font-black text-[#DEAE60]">A</span>
            </div>
          </div>
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-black text-white uppercase flex items-center justify-center gap-2 tracking-tight">
              <Smile className="h-5 w-5 text-[#DEAE60]" />
              Aline Antunes
            </h1>
            <p className="text-xs font-bold text-[#DEAE60] uppercase tracking-widest">Prótese Odontológica</p>
            <p className="text-xs font-bold text-[#DEAE60] uppercase tracking-widest">Painel Administrativo</p>
          </div>
        </div>

        <div className="px-6 sm:px-8 pb-10">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">
                Usuário
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Digite seu usuário"
                required
                className="w-full h-11 bg-neutral-950 border-0 rounded-md text-white placeholder:text-neutral-600 focus-visible:ring-1 focus-visible:ring-[#DEAE60] transition-all"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                required
                className="w-full h-11 bg-neutral-950 border-0 rounded-md text-white placeholder:text-neutral-600 focus-visible:ring-1 focus-visible:ring-[#DEAE60] transition-all"
              />
            </div>

            {error && (
              <Alert variant="destructive" className="bg-red-950/30 border border-red-900/30 text-red-400 rounded-xl py-3">
                <AlertDescription className="text-xs font-bold text-center">{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full h-11 bg-[#DEAE60] hover:bg-[#DEAE60]/90 text-neutral-950 font-black rounded-xl shadow-xl uppercase tracking-tighter transition-all active:scale-[0.98]"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-neutral-950/30 border-t-neutral-950 rounded-full animate-spin" />
                  <span>Entrando...</span>
                </div>
              ) : (
                "Entrar no Painel"
              )}
            </Button>
          </form>

          {/* Credenciais de Teste */}
          <div className="mt-6 p-4 bg-neutral-800/50 rounded-lg text-sm text-neutral-400 border border-neutral-700/50">
            <p className="font-bold text-[#DEAE60] mb-2">Credenciais de Teste:</p>
            <p className="text-xs">Usuário: <span className="font-mono text-white">admin</span></p>
            <p className="text-xs">Senha: <span className="font-mono text-white">123456</span></p>
          </div>
        </div>
      </Card>

      {/* Footer */}
      <p className="absolute bottom-4 text-center text-neutral-600 text-xs z-20">
        © 2024 Aline Antunes Prótese Odontológica. Todos os direitos reservados.
      </p>
    </div>
  );
}

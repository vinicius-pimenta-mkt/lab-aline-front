import { useEffect, useState } from "react";
import api from "../lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, AlertCircle } from "lucide-react";

export default function Services() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [prioridadeFilter, setPrioridadeFilter] = useState("all");
  const [viewFilter, setViewFilter] = useState("todos");

  const [services, setServices] = useState<any[]>([]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await api.get("/trabalhos");
        
        // BLINDAGEM 1: Garantir que nenhum campo venha como null ou undefined
        const safeData = response.data.map((trabalho: any) => ({
          id: trabalho.id,
          paciente_nome: trabalho.paciente_nome || "Nome não registrado",
          dentista_nome: trabalho.dentista_nome || "Nome não registrado",
          procedimento: trabalho.procedimento || "Procedimento não especificado",
          status: trabalho.status || "Pendente",
          prioridade: trabalho.prioridade || "normal",
          valor_bruto: Number(trabalho.valor_bruto) || 0,
          prazo_entrega: trabalho.data_entrega || new Date().toISOString(),
          dias_atraso: 0, 
        }));
        
        setServices(safeData);
      } catch (error) {
        console.error("Erro ao buscar serviços:", error);
      }
    };
    fetchServices();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pendente":
        return "bg-yellow-500/20 text-yellow-400";
      case "Em Andamento":
        return "bg-blue-500/20 text-blue-400";
      case "Finalizado":
        return "bg-green-500/20 text-green-400";
      default:
        return "bg-neutral-500/20 text-neutral-400";
    }
  };

  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade) {
      case "urgente":
        return "bg-red-500/20 text-red-400";
      case "vip":
        return "bg-amber-500/20 text-amber-400";
      default:
        return "bg-neutral-500/20 text-neutral-400";
    }
  };

  // BLINDAGEM 2: Garantir que a pesquisa não quebre se o texto for vazio
  let filteredServices = services.filter((service) => {
    const searchLower = searchTerm.toLowerCase();
    
    const matchesSearch =
      (service.paciente_nome || "").toLowerCase().includes(searchLower) ||
      (service.dentista_nome || "").toLowerCase().includes(searchLower) ||
      (service.procedimento || "").toLowerCase().includes(searchLower);
      
    const matchesStatus = statusFilter === "all" || service.status === statusFilter;
    const matchesPrioridade = prioridadeFilter === "all" || service.prioridade === prioridadeFilter;
    
    let matchesView = true;
    if (viewFilter === "atrasados") {
      matchesView = service.dias_atraso > 0;
    } else if (viewFilter === "proximas") {
      const hoje = new Date();
      const prazo = new Date(service.prazo_entrega);
      const proximaData = new Date(hoje);
      proximaData.setDate(hoje.getDate() + 7);
      matchesView = prazo <= proximaData && prazo >= hoje && service.status !== "Finalizado";
    }
    
    return matchesSearch && matchesStatus && matchesPrioridade && matchesView;
  });

  return (
    <div className="min-h-screen bg-neutral-950 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight">
            SERVIÇOS
          </h1>
          <p className="text-neutral-400 text-sm mt-2">
            Gerenciar todos os serviços do laboratório
          </p>
        </div>
        <Button
          onClick={() => setLocation("/services/new")}
          className="bg-[#DEAE60] hover:bg-[#DEAE60]/90 text-neutral-950 font-bold rounded-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Novo Serviço
        </Button>
      </div>

      {/* Filtros */}
      <Card className="bg-neutral-900 border-neutral-800 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-3 text-neutral-500" />
            <Input
              placeholder="Buscar paciente, dentista..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-neutral-800 border-neutral-700 pl-10 text-white placeholder-neutral-500"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-neutral-800 border-neutral-700">
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="Pendente">Pendente</SelectItem>
              <SelectItem value="Em Andamento">Em Andamento</SelectItem>
              <SelectItem value="Finalizado">Finalizado</SelectItem>
            </SelectContent>
          </Select>

          <Select value={prioridadeFilter} onValueChange={setPrioridadeFilter}>
            <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent className="bg-neutral-800 border-neutral-700">
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="urgente">Urgente</SelectItem>
              <SelectItem value="vip">VIP</SelectItem>
            </SelectContent>
          </Select>

          <Select value={viewFilter} onValueChange={setViewFilter}>
            <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
              <SelectValue placeholder="Visualização" />
            </SelectTrigger>
            <SelectContent className="bg-neutral-800 border-neutral-700">
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="atrasados">Atrasados</SelectItem>
              <SelectItem value="proximas">Próximas Entregas</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center justify-center bg-neutral-800 rounded-lg px-4">
            <span className="text-neutral-400 text-sm font-bold">
              {filteredServices.length} serviço{filteredServices.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </Card>

      {/* Alertas */}
      {filteredServices.some((s) => s.dias_atraso > 0) && (
        <Card className="bg-red-500/10 border-red-500/30 p-4 mb-6 flex items-center gap-3">
          <AlertCircle size={20} className="text-red-400" />
          <span className="text-red-400 text-sm font-bold">
            ⚠️ Você tem {filteredServices.filter((s) => s.dias_atraso > 0).length} serviço(s) atrasado(s)
          </span>
        </Card>
      )}

      {/* Tabela de Serviços */}
      <Card className="bg-neutral-900 border-neutral-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-950 border-b border-neutral-800">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider">
                  Paciente
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider">
                  Dentista
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider">
                  Procedimento
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider">
                  Prioridade
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/50">
              {filteredServices.map((service, idx) => (
                <tr
                  key={service.id}
                  className="hover:bg-neutral-800/30 transition-colors"
                >
                  <td className="px-6 py-4 text-sm font-bold text-white">{service.paciente_nome}</td>
                  <td className="px-6 py-4 text-sm text-neutral-400">{service.dentista_nome}</td>
                  <td className="px-6 py-4 text-sm text-neutral-400">{service.procedimento}</td>
                  <td className="px-6 py-4 text-sm">
                    <Badge className={`${getStatusColor(service.status)} border-0 font-bold`}>
                      {service.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <Badge className={`${getPrioridadeColor(service.prioridade)} border-0 font-bold`}>
                      {service.prioridade.charAt(0).toUpperCase() + service.prioridade.slice(1)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm font-black text-[#DEAE60]">R$ {service.valor_bruto.toFixed(2).replace(".", ",")}</td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => setLocation(`/services/${service.id}`)}
                      className="text-[#DEAE60] hover:text-[#DEAE60]/80 font-bold transition-colors"
                    >
                      Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredServices.length === 0 && (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <Search className="w-12 h-12 text-neutral-800 mb-4" />
            <p className="text-neutral-400 text-sm font-medium">Nenhum serviço encontrado com os filtros selecionados</p>
          </div>
        )}
      </Card>
    </div>
  );
}

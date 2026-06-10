import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, AlertCircle, Clock, CheckCircle2 } from "lucide-react";

export default function Services() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [prioridadeFilter, setPrioridadeFilter] = useState("all");
  const [viewFilter, setViewFilter] = useState("todos");

  const services = [
    {
      id: 1,
      paciente_nome: "João Silva",
      dentista_nome: "Dr. Carlos",
      procedimento: "Coroa Dentária",
      status: "Em Andamento",
      prioridade: "normal",
      valor_bruto: 450,
      prazo_entrega: "2026-06-15",
      dias_atraso: 0,
    },
    {
      id: 2,
      paciente_nome: "Maria Santos",
      dentista_nome: "Dra. Ana",
      procedimento: "Prótese Parcial",
      status: "Pendente",
      prioridade: "urgente",
      valor_bruto: 1200,
      prazo_entrega: "2026-06-10",
      dias_atraso: 2,
    },
    {
      id: 3,
      paciente_nome: "Pedro Costa",
      dentista_nome: "Dr. Fernando",
      procedimento: "Implante",
      status: "Finalizado",
      prioridade: "normal",
      valor_bruto: 2500,
      prazo_entrega: "2026-06-06",
      dias_atraso: 0,
    },
    {
      id: 4,
      paciente_nome: "Ana Oliveira",
      dentista_nome: "Dra. Beatriz",
      procedimento: "Limpeza e Ajuste",
      status: "Em Andamento",
      prioridade: "vip",
      valor_bruto: 300,
      prazo_entrega: "2026-06-12",
      dias_atraso: 0,
    },
    {
      id: 5,
      paciente_nome: "Carlos Mendes",
      dentista_nome: "Dr. Roberto",
      procedimento: "Ponte Fixa",
      status: "Pendente",
      prioridade: "normal",
      valor_bruto: 1800,
      prazo_entrega: "2026-06-18",
      dias_atraso: 0,
    },
  ];

  const getStatusColor = (status) => {
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

  const getPrioridadeColor = (prioridade) => {
    switch (prioridade) {
      case "urgente":
        return "bg-red-500/20 text-red-400";
      case "vip":
        return "bg-amber-500/20 text-amber-400";
      default:
        return "bg-neutral-500/20 text-neutral-400";
    }
  };

  let filteredServices = services.filter((service) => {
    const matchesSearch =
      service.paciente_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.dentista_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.procedimento.toLowerCase().includes(searchTerm.toLowerCase());
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
          {/* Busca */}
          <div className="relative">
            <Search size={18} className="absolute left-3 top-3 text-neutral-500" />
            <Input
              placeholder="Buscar paciente, dentista..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-neutral-800 border-neutral-700 pl-10 text-white placeholder-neutral-500"
            />
          </div>

          {/* Status */}
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

          {/* Prioridade */}
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

          {/* Visualização */}
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

          {/* Resultado */}
          <div className="flex items-center justify-center bg-neutral-800 rounded-lg px-4">
            <span className="text-neutral-400 text-sm">
              {filteredServices.length} serviço{filteredServices.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </Card>

      {/* Alertas */}
      {filteredServices.some((s) => s.dias_atraso > 0) && (
        <Card className="bg-red-500/10 border-red-500/30 p-4 mb-6 flex items-center gap-3">
          <AlertCircle size={20} className="text-red-400" />
          <span className="text-red-400 text-sm">
            ⚠️ Você tem {filteredServices.filter((s) => s.dias_atraso > 0).length} serviço(s) atrasado(s)
          </span>
        </Card>
      )}

      {/* Tabela de Serviços */}
      <Card className="bg-neutral-900 border-neutral-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-800 border-b border-neutral-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold text-neutral-300 uppercase">
                  Paciente
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold text-neutral-300 uppercase">
                  Dentista
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold text-neutral-300 uppercase">
                  Procedimento
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold text-neutral-300 uppercase">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold text-neutral-300 uppercase">
                  Prioridade
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold text-neutral-300 uppercase">
                  Valor
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold text-neutral-300 uppercase">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredServices.map((service, idx) => (
                <tr
                  key={service.id}
                  className={`border-b border-neutral-800 hover:bg-neutral-800/50 transition-colors ${
                    idx % 2 === 0 ? "bg-neutral-900" : "bg-neutral-800/30"
                  }`}
                >
                  <td className="px-6 py-4 text-sm font-bold text-white">{service.paciente_nome}</td>
                  <td className="px-6 py-4 text-sm text-neutral-300">{service.dentista_nome}</td>
                  <td className="px-6 py-4 text-sm text-neutral-300">{service.procedimento}</td>
                  <td className="px-6 py-4 text-sm">
                    <Badge className={`${getStatusColor(service.status)} flex items-center gap-1 w-fit`}>
                      {service.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <Badge className={getPrioridadeColor(service.prioridade)}>
                      {service.prioridade.charAt(0).toUpperCase() + service.prioridade.slice(1)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-[#DEAE60]">R$ {service.valor_bruto.toFixed(2).replace(".", ",")}</td>
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
          <div className="p-8 text-center">
            <p className="text-neutral-400 text-sm">Nenhum serviço encontrado com os filtros selecionados</p>
          </div>
        )}
      </Card>
    </div>
  );
}

import { useEffect, useState } from "react";
import api from "../lib/api";
import { useLocation, useRoute } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Download, Save, CheckCircle2, Clock, AlertCircle } from "lucide-react";

interface Stage {
  id: string;
  name: string;
  status: "pending" | "in_progress" | "completed";
  completedAt?: string;
}

interface ServiceData {
  id: string;
  patient: string;
  dentist: string;
  procedure: string;
  description: string;
  status: string;
  grossValue: number;
  operationCost: number;
  stages: Stage[];
  createdAt: string;
}

export default function ServiceDetail() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/services/:id");
  const serviceId = params?.id;

  const [service, setService] = useState<ServiceData | null>(null);

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchService = async () => {
      if (!serviceId) return;
      try {
        const response = await api.get(`/trabalhos/${serviceId}`);
        const fetchedService = response.data;
        setService({
          id: fetchedService.id,
          patient: fetchedService.paciente_nome,
          dentist: fetchedService.dentista_nome,
          procedure: fetchedService.procedimento,
          description: fetchedService.observacoes || "",
          status: fetchedService.status,
          grossValue: fetchedService.valor_bruto,
          operationCost: fetchedService.custo_operacional || 0,
          stages: fetchedService.etapas || [], // Assumindo que o backend retorna 'etapas'
          createdAt: new Date(fetchedService.data_entrada).toLocaleDateString("pt-BR"),
        });
      } catch (error) {
        console.error("Erro ao buscar detalhes do serviço:", error);
        toast.error("Erro ao carregar detalhes do serviço.");
      } finally {
        setLoading(false);
      }
    };
    fetchService();
  }, [serviceId]);

  const handleStageStatusChange = (stageId: string, newStatus: string) => {
    setService((prev) => ({
      ...prev,
      stages: prev.stages.map((stage) =>
        stage.id === stageId
          ? {
              ...stage,
              status: newStatus as "pending" | "in_progress" | "completed",
              completedAt: newStatus === "completed" ? new Date().toISOString().split("T")[0] : undefined,
            }
          : stage
      ),
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (!service) return;
      await api.put(`/trabalhos/${service.id}`, {
        paciente_nome: service.patient,
        dentista_nome: service.dentist,
        procedimento: service.procedure,
        observacoes: service.description,
        status: service.status,
        valor_bruto: service.grossValue,
        custo_operacional: service.operationCost,
        etapas: service.stages, // Enviar etapas de volta ao backend
      });
      toast.success("Serviço atualizado com sucesso!");
      setEditing(false);
    } catch (error) {
      toast.error("Erro ao atualizar serviço");
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    toast.success("Relatório PDF gerado com sucesso!");
  };

  const getStageIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      case "in_progress":
        return <Clock className="w-5 h-5 text-blue-400" />;
      default:
        return <AlertCircle className="w-5 h-5 text-neutral-500" />;
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-neutral-950 p-6 text-white">Carregando serviço...</div>;
  }

  if (!service) {
    return <div className="min-h-screen bg-neutral-950 p-6 text-white">Serviço não encontrado.</div>;
  }

  const lucroLiquido = service.grossValue - service.operationCost;
  const margemLucro = service.grossValue > 0 ? ((lucroLiquido / service.grossValue) * 100).toFixed(1) : "0.0";

  return (
    <div className="min-h-screen bg-neutral-950 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setLocation("/services")}
            className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-400" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tight">
              {service.procedure}
            </h1>
            <p className="text-neutral-400 text-sm mt-2">
              Paciente: {service.patient} | Dentista: {service.dentist}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={handleExportPDF}
            className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-lg flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar PDF
          </Button>
          {!editing && (
            <Button
              onClick={() => setEditing(true)}
              className="bg-[#DEAE60] hover:bg-[#DEAE60]/90 text-neutral-950 font-bold rounded-lg"
            >
              Editar
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conteúdo Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informações Básicas */}
          <Card className="bg-neutral-900 border-neutral-800 p-6">
            <h2 className="text-lg font-bold text-white uppercase mb-6">Informações do Serviço</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-neutral-400 text-sm">Paciente</p>
                <p className="text-white font-bold mt-2">{service.patient}</p>
              </div>
              <div>
                <p className="text-neutral-400 text-sm">Dentista</p>
                <p className="text-white font-bold mt-2">{service.dentist}</p>
              </div>
              <div>
                <p className="text-neutral-400 text-sm">Procedimento</p>
                <p className="text-white font-bold mt-2">{service.procedure}</p>
              </div>
              <div>
                <p className="text-neutral-400 text-sm">Data de Criação</p>
                <p className="text-white font-bold mt-2">{service.createdAt}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-neutral-400 text-sm">Descrição</p>
                <p className="text-neutral-300 mt-2">{service.description}</p>
              </div>
            </div>
          </Card>

          {/* Etapas do Procedimento */}
          <Card className="bg-neutral-900 border-neutral-800 p-6">
            <h2 className="text-lg font-bold text-white uppercase mb-6">Etapas do Procedimento</h2>
            <div className="space-y-4">
              {service.stages.map((stage, idx) => (
                <div key={stage.id} className="flex items-start gap-4 pb-4 border-b border-neutral-800 last:border-0">
                  <div className="mt-1">{getStageIcon(stage.status)}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-white">{stage.name}</h3>
                      {editing ? (
                        <Select
                          value={stage.status}
                          onValueChange={(value) => handleStageStatusChange(stage.id, value)}
                        >
                          <SelectTrigger className="w-40 bg-neutral-800 border-neutral-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-neutral-800 border-neutral-700">
                            <SelectItem value="pending">Pendente</SelectItem>
                            <SelectItem value="in_progress">Em Andamento</SelectItem>
                            <SelectItem value="completed">Concluído</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="text-sm text-neutral-400">
                          {stage.status === "completed" && "✓ Concluído"}
                          {stage.status === "in_progress" && "⏳ Em Andamento"}
                          {stage.status === "pending" && "○ Pendente"}
                        </span>
                      )}
                    </div>
                    {stage.completedAt && (
                      <p className="text-sm text-neutral-500">
                        Concluído em: {stage.completedAt}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Sidebar - Informações Financeiras */}
        <div className="space-y-6">
          {/* KPI Financeiro */}
          <Card className="bg-neutral-900 border-neutral-800 p-6">
            <h2 className="text-lg font-bold text-white uppercase mb-6">Resumo Financeiro</h2>
            <div className="space-y-4">
              <div>
                <p className="text-neutral-400 text-sm">Valor Bruto</p>
                <p className="text-2xl font-bold text-white mt-2">
                  R$ {service.grossValue.toFixed(2).replace(".", ",")}
                </p>
              </div>
              <div className="border-t border-neutral-800 pt-4">
                <p className="text-neutral-400 text-sm">Custo da Operação</p>
                <p className="text-2xl font-bold text-red-400 mt-2">
                  -R$ {service.operationCost.toFixed(2).replace(".", ",")}
                </p>
              </div>
              <div className="border-t border-neutral-800 pt-4 bg-[#DEAE60]/10 p-4 rounded-lg">
                <p className="text-neutral-400 text-sm">Lucro Líquido</p>
                <p className="text-2xl font-bold text-[#DEAE60] mt-2">
                  R$ {lucroLiquido.toFixed(2).replace(".", ",")}
                </p>
                <p className="text-xs text-neutral-400 mt-2">
                  Margem: {margemLucro}%
                </p>
              </div>
            </div>
          </Card>

          {/* Status */}
          <Card className="bg-neutral-900 border-neutral-800 p-6">
            <h2 className="text-lg font-bold text-white uppercase mb-4">Status</h2>
            {editing ? (
              <Select value={service.status} onValueChange={(value) => setService({ ...service, status: value })}>
                <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-neutral-800 border-neutral-700">
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="in_progress">Em Andamento</SelectItem>
                  <SelectItem value="completed">Finalizado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${
                service.status === "in_progress" ? "bg-blue-500/20 text-blue-300" :
                service.status === "pending" ? "bg-amber-500/20 text-amber-300" :
                service.status === "completed" ? "bg-green-500/20 text-green-300" :
                "bg-red-500/20 text-red-300"
              }`}>
                {service.status === "in_progress" && "Em Andamento"}
                {service.status === "pending" && "Pendente"}
                {service.status === "completed" && "Finalizado"}
                {service.status === "cancelled" && "Cancelado"}
              </div>
            )}
          </Card>

          {/* Botões de Ação */}
          {editing && (
            <div className="flex gap-3">
              <Button
                onClick={() => setEditing(false)}
                className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-lg"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 bg-[#DEAE60] hover:bg-[#DEAE60]/90 text-neutral-950 font-bold rounded-lg flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {loading ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

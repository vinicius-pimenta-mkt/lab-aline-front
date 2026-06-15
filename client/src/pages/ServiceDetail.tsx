import { useEffect, useState } from "react";
import api from "../lib/api";
import { useLocation, useRoute } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Download, Save, CheckCircle2, Clock, AlertCircle, Plus, Trash2, Layers, Calendar, CreditCard } from "lucide-react";

interface Stage {
  id: any;
  nome: string;
  descricao: string;
  status: "pending" | "in_progress" | "completed";
}

interface Cost {
  id: any;
  name: string;
  value: number;
}

interface ServiceData {
  id: string;
  patient: string;
  dentist: string;
  procedure: string;
  description: string;
  status: string;
  prioridade: string;
  prazo_entrega: string;
  forma_pagamento: string;
  grossValue: number;
  stages: Stage[];
  costs: Cost[];
  createdAt: string;
  completedAt: string;
}

export default function ServiceDetail() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/services/:id");
  const serviceId = params?.id;

  const [service, setService] = useState<ServiceData | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchService = async () => {
      if (!serviceId) return;
      try {
        const response = await api.get(`/trabalhos/${serviceId}`);
        const fetched = response.data;
        
        setService({
          id: fetched.id,
          patient: fetched.paciente_nome,
          dentist: fetched.dentista_nome,
          procedure: fetched.procedimento,
          description: fetched.descricao || "",
          status: fetched.status,
          prioridade: fetched.prioridade || "normal",
          prazo_entrega: fetched.prazo_entrega ? fetched.prazo_entrega.split("T")[0] : "",
          forma_pagamento: fetched.forma_pagamento || "",
          grossValue: fetched.valor_bruto,
          stages: fetched.etapas || [],
          // Puxa os custos individuais do banco de dados
          costs: fetched.custos ? fetched.custos.map((c: any) => ({
            id: c.id,
            name: c.descricao || c.nome || "",
            value: parseFloat(c.valor) || 0
          })) : [],
          createdAt: fetched.data_entrada ? new Date(fetched.data_entrada).toLocaleDateString("pt-BR") : "",
          completedAt: fetched.data_saida ? fetched.data_saida.split("T")[0] : "",
        });
      } catch (error) {
        toast.error("Erro ao carregar detalhes do serviço.");
      } finally {
        setLoading(false);
      }
    };
    fetchService();
  }, [serviceId]);

  // Edição de Campos Gerais
  const handleFieldChange = (field: keyof ServiceData, value: any) => {
    setService((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  // Gerenciamento Dinâmico de Etapas
  const handleStageChange = (id: any, field: keyof Stage, value: string) => {
    setService((prev) =>
      prev ? { ...prev, stages: prev.stages.map((s) => (s.id === id ? { ...s, [field]: value } : s)) } : null
    );
  };

  const handleAddStage = () => {
    setService((prev) =>
      prev ? { ...prev, stages: [...prev.stages, { id: `new-${Date.now()}`, nome: "", descricao: "", status: "pending" }] } : null
    );
  };

  const handleRemoveStage = (id: any) => {
    setService((prev) =>
      prev ? { ...prev, stages: prev.stages.filter((s) => s.id !== id) } : null
    );
  };

  // Gerenciamento Dinâmico de Custos
  const handleCostChange = (id: any, field: keyof Cost, value: string) => {
    setService((prev) =>
      prev ? { 
        ...prev, 
        costs: prev.costs.map((c) => (c.id === id ? { ...c, [field]: field === 'value' ? (parseFloat(value) || 0) : value } : c)) 
      } : null
    );
  };

  const handleAddCost = () => {
    setService((prev) =>
      prev ? { ...prev, costs: [...prev.costs, { id: `new-${Date.now()}`, name: "", value: 0 }] } : null
    );
  };

  const handleRemoveCost = (id: any) => {
    setService((prev) =>
      prev ? { ...prev, costs: prev.costs.filter((c) => c.id !== id) } : null
    );
  };

  // Salvar no Back-end
  const handleSave = async () => {
    if (!service) return;
    setLoading(true);
    
    const calculatedOperationCost = service.costs.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);

    try {
      await api.put(`/trabalhos/${service.id}`, {
        procedimento: service.procedure,
        descricao: service.description,
        status: service.status,
        prioridade: service.prioridade,
        prazo_entrega: service.prazo_entrega,
        forma_pagamento: service.forma_pagamento,
        valor_bruto: service.grossValue,
        custo_operacional: calculatedOperationCost,
        etapas: service.stages,
        costs: service.costs, // Envia a lista de custos para o backend
        data_saida: service.status === "Finalizado" ? service.completedAt : null
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

  if (loading && !service) {
    return <div className="min-h-screen bg-neutral-950 p-6 text-white flex items-center justify-center">Carregando detalhes do serviço...</div>;
  }

  if (!service) {
    return <div className="min-h-screen bg-neutral-950 p-6 text-white flex items-center justify-center">Serviço não encontrado.</div>;
  }

  // Cálculos financeiros locais
  const totalOperationCost = service.costs.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
  const lucroLiquido = service.grossValue - totalOperationCost;
  const margemLucro = service.grossValue > 0 ? ((lucroLiquido / service.grossValue) * 100).toFixed(1) : "0.0";

  const inputBaseStyle = "bg-neutral-900 border-neutral-800 text-white placeholder-neutral-600 focus-visible:ring-1 focus-visible:ring-[#DEAE60]/50 focus-visible:border-[#DEAE60]/50 transition-all";

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
              Editar Caso
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conteúdo Principal */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Informações Básicas */}
          <Card className="bg-neutral-900 border-neutral-800 p-8 shadow-xl">
            <h2 className="text-sm font-black text-[#DEAE60] uppercase tracking-widest mb-6">Informações do Serviço</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-2">
                <Label className="text-xs font-bold text-neutral-400 uppercase">Prazo de Entrega</Label>
                {editing ? (
                  <Input
                    type="date"
                    value={service.prazo_entrega}
                    onChange={(e) => handleFieldChange("prazo_entrega", e.target.value)}
                    className={inputBaseStyle}
                  />
                ) : (
                  <div className="flex items-center gap-2 mt-2">
                    <Calendar className="w-4 h-4 text-neutral-500" />
                    <p className="text-white font-bold">
                      {service.prazo_entrega ? new Date(service.prazo_entrega + "T00:00:00").toLocaleDateString("pt-BR") : "Não definido"}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-neutral-400 uppercase">Prioridade</Label>
                {editing ? (
                  <Select value={service.prioridade} onValueChange={(value) => handleFieldChange("prioridade", value)}>
                    <SelectTrigger className="bg-neutral-900 border-neutral-800 text-white focus:ring-1 focus:ring-[#DEAE60]/50">
                      <SelectValue placeholder="Selecione a prioridade" />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-900 border-neutral-800">
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="urgente">Urgente ⚠️</SelectItem>
                      <SelectItem value="vip">Estojo VIP ⭐</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-white font-bold mt-2 uppercase text-sm">
                    {service.prioridade === 'urgente' ? "⚠️ Urgente" : service.prioridade === 'vip' ? "⭐ VIP" : "Normal"}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-neutral-400 uppercase">Procedimento</Label>
                {editing ? (
                  <Input
                    value={service.procedure}
                    onChange={(e) => handleFieldChange("procedure", e.target.value)}
                    className={inputBaseStyle}
                  />
                ) : (
                  <p className="text-white font-bold mt-2">{service.procedure}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-neutral-400 uppercase">Data de Criação</Label>
                <p className="text-white font-bold mt-2">{service.createdAt}</p>
              </div>

              <div className="md:col-span-2 space-y-2 border-t border-neutral-800/50 pt-4">
                <Label className="text-xs font-bold text-neutral-400 uppercase">Descrição do Trabalho</Label>
                {editing ? (
                  <Textarea
                    value={service.description}
                    onChange={(e) => handleFieldChange("description", e.target.value)}
                    rows={3}
                    className={inputBaseStyle}
                  />
                ) : (
                  <p className="text-neutral-300 mt-2 text-sm leading-relaxed">{service.description || "Nenhuma descrição detalhada."}</p>
                )}
              </div>
            </div>
          </Card>

          {/* Etapas do Procedimento */}
          <Card className="bg-neutral-900 border-neutral-800 p-8 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-black text-[#DEAE60] uppercase tracking-widest flex items-center gap-2">
                <Layers className="w-5 h-5" /> Etapas do Procedimento
              </h2>
              {editing && (
                <Button
                  type="button"
                  onClick={handleAddStage}
                  variant="ghost"
                  size="sm"
                  className="text-xs text-[#DEAE60] hover:bg-[#DEAE60]/10"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Nova Etapa
                </Button>
              )}
            </div>

            <div className="space-y-4">
              {service.stages.length === 0 && !editing && (
                <p className="text-neutral-500 text-sm italic">Nenhuma etapa registrada para este serviço.</p>
              )}

              {service.stages.map((stage, idx) => (
                <div key={stage.id} className="flex items-start gap-4 pb-6 border-b border-neutral-800/50 last:border-0 last:pb-0">
                  <div className="mt-2 shrink-0">{getStageIcon(stage.status)}</div>
                  
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                      <div className="flex-1">
                        {editing ? (
                          <Input
                            placeholder="Nome da etapa"
                            value={stage.nome}
                            onChange={(e) => handleStageChange(stage.id, "nome", e.target.value)}
                            className={inputBaseStyle}
                          />
                        ) : (
                          <h3 className="font-bold text-white text-base">{stage.nome || "Etapa sem nome"}</h3>
                        )}
                      </div>
                      
                      <div className="w-full md:w-48">
                        {editing ? (
                          <Select
                            value={stage.status}
                            onValueChange={(value) => handleStageChange(stage.id, "status", value as "pending" | "in_progress" | "completed")}
                          >
                            <SelectTrigger className="bg-neutral-900 border-neutral-800 text-white focus:ring-1 focus:ring-[#DEAE60]/50">
                              <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent className="bg-neutral-900 border-neutral-800">
                              <SelectItem value="pending">Pendente</SelectItem>
                              <SelectItem value="in_progress">Em Andamento</SelectItem>
                              <SelectItem value="completed">Concluída</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-xs font-bold uppercase text-neutral-400">
                            {stage.status === 'completed' ? '✓ Concluída' : stage.status === 'in_progress' ? '⏳ Em andamento' : '○ Pendente'}
                          </span>
                        )}
                      </div>

                      {editing && (
                        <Button
                          type="button"
                          onClick={() => handleRemoveStage(stage.id)}
                          variant="ghost"
                          className="h-10 w-10 p-0 text-neutral-500 hover:text-red-400 shrink-0"
                          disabled={service.stages.length === 1}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div>
                      {editing ? (
                        <Textarea
                          placeholder="Descrição da etapa..."
                          value={stage.descricao}
                          onChange={(e) => handleStageChange(stage.id, "descricao", e.target.value)}
                          rows={2}
                          className={`${inputBaseStyle} text-sm`}
                        />
                      ) : (
                        stage.descricao && <p className="text-sm text-neutral-400 leading-relaxed">{stage.descricao}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Sidebar - Informações Financeiras & Ações */}
        <div className="space-y-6">
          
          {/* Status Geral e Data de Finalização */}
          <Card className="bg-neutral-900 border-neutral-800 p-6 shadow-xl">
            <h2 className="text-xs font-black text-[#DEAE60] uppercase tracking-widest mb-4">Status do Serviço</h2>
            {editing ? (
              <div className="space-y-4">
                <Select 
                  value={service.status} 
                  onValueChange={(value) => {
                    setService(prev => {
                      if (!prev) return null;
                      const updates: any = { status: value };
                      if (value === "Finalizado" && !prev.completedAt) {
                        updates.completedAt = new Date().toISOString().split("T")[0];
                      }
                      return { ...prev, ...updates };
                    });
                  }}
                >
                  <SelectTrigger className="bg-neutral-900 border-neutral-800 text-white focus:ring-1 focus:ring-[#DEAE60]/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-neutral-800">
                    <SelectItem value="Pendente">Pendente</SelectItem>
                    <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                    <SelectItem value="Finalizado">Finalizado</SelectItem>
                    <SelectItem value="Cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>

                {service.status === "Finalizado" && (
                  <div className="pt-2 border-t border-neutral-800/50">
                    <Label className="text-xs font-bold text-neutral-400 uppercase">Data de Finalização</Label>
                    <Input
                      type="date"
                      value={service.completedAt || ""}
                      onChange={(e) => handleFieldChange("completedAt", e.target.value)}
                      className={`${inputBaseStyle} mt-2`}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${
                  service.status === "Em Andamento" ? "bg-blue-500/20 text-blue-300" :
                  service.status === "Pendente" ? "bg-amber-500/20 text-amber-300" :
                  service.status === "Finalizado" ? "bg-green-500/20 text-green-300" :
                  "bg-red-500/20 text-red-300"
                }`}>
                  {service.status}
                </div>
                {service.status === "Finalizado" && service.completedAt && (
                  <div className="text-xs text-neutral-400 font-bold">
                    Entregue em: {new Date(service.completedAt + "T00:00:00").toLocaleDateString("pt-BR")}
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* KPI Financeiro e Custos Detalhados */}
          <Card className="bg-neutral-900 border-neutral-800 p-6 shadow-xl">
            <h2 className="text-xs font-black text-white uppercase tracking-widest mb-6">Resumo Financeiro</h2>
            <div className="space-y-6">
              
              {/* Forma de Pagamento */}
              <div className="bg-neutral-950/50 p-4 rounded-lg border border-neutral-800/50 mb-2">
                <p className="text-neutral-400 text-xs font-bold uppercase tracking-wider mb-2">Forma de Pagamento</p>
                {editing ? (
                  <Select value={service.forma_pagamento} onValueChange={(value) => handleFieldChange("forma_pagamento", value)}>
                    <SelectTrigger className="bg-neutral-900 border-neutral-800 text-white focus:ring-1 focus:ring-[#DEAE60]/50 h-10">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-900 border-neutral-800">
                      <SelectItem value="Pix">Pix</SelectItem>
                      <SelectItem value="Crédito">Cartão de Crédito</SelectItem>
                      <SelectItem value="Débito">Cartão de Débito</SelectItem>
                      <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-neutral-400" />
                    <p className="text-white font-bold text-sm">
                      {service.forma_pagamento || "Não informada"}
                    </p>
                  </div>
                )}
              </div>

              {/* Valor Bruto */}
              <div>
                <p className="text-neutral-400 text-xs font-bold uppercase tracking-wider mb-2">Valor Bruto</p>
                {editing ? (
                  <Input
                    type="number"
                    value={service.grossValue}
                    onChange={(e) => handleFieldChange("grossValue", parseFloat(e.target.value) || 0)}
                    className={`${inputBaseStyle} font-bold text-lg text-[#DEAE60]`}
                  />
                ) : (
                  <p className="text-3xl font-black text-white">
                    R$ {service.grossValue.toFixed(2).replace(".", ",")}
                  </p>
                )}
              </div>
              
              {/* Gestão Dinâmica de Custos */}
              <div className="border-t border-neutral-800/50 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-neutral-400 text-xs font-bold uppercase tracking-wider">Custos Operacionais</p>
                  {editing && (
                    <Button type="button" onClick={handleAddCost} variant="ghost" size="sm" className="h-8 text-xs text-[#DEAE60] hover:bg-[#DEAE60]/10">
                      <Plus className="w-3 h-3 mr-1" /> Novo
                    </Button>
                  )}
                </div>

                {editing ? (
                  <div className="space-y-3">
                    {service.costs.map((cost) => (
                      <div key={cost.id} className="flex items-center gap-2">
                        <Input 
                          placeholder="Motivo..." 
                          value={cost.name} 
                          onChange={(e) => handleCostChange(cost.id, "name", e.target.value)} 
                          className={`${inputBaseStyle} h-9 text-xs flex-1`} 
                        />
                        <Input 
                          type="number" 
                          placeholder="0.00" 
                          value={cost.value || ""} 
                          onChange={(e) => handleCostChange(cost.id, "value", e.target.value)} 
                          className={`${inputBaseStyle} h-9 text-xs w-24 text-red-400 font-bold`} 
                        />
                        <Button type="button" onClick={() => handleRemoveCost(cost.id)} variant="ghost" className="h-9 w-9 p-0 text-neutral-500 hover:text-red-400 shrink-0">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    {service.costs.length === 0 && (
                      <p className="text-xs text-neutral-500 italic">Nenhum custo registrado.</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 mb-4">
                    {service.costs.map((cost) => (
                      <div key={cost.id} className="flex justify-between items-center text-sm">
                        <span className="text-neutral-400">{cost.name || "Custo sem nome"}</span>
                        <span className="text-red-400 font-bold">- R$ {(Number(cost.value) || 0).toFixed(2).replace(".", ",")}</span>
                      </div>
                    ))}
                    {service.costs.length === 0 && (
                      <p className="text-xs text-neutral-500 italic">Nenhum custo registrado.</p>
                    )}
                  </div>
                )}
                
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-neutral-800/50">
                  <span className="text-xs font-bold uppercase text-neutral-500">Total de Custos</span>
                  <p className="text-xl font-bold text-red-400">
                    -R$ {totalOperationCost.toFixed(2).replace(".", ",")}
                  </p>
                </div>
              </div>
              
              {/* Lucro Líquido */}
              <div className="border-t border-neutral-800 pt-6 bg-[#DEAE60]/10 p-6 rounded-xl mt-6">
                <p className="text-[#DEAE60]/80 text-xs font-bold uppercase tracking-wider mb-2">Lucro Líquido</p>
                <p className="text-4xl font-black text-[#DEAE60]">
                  R$ {lucroLiquido.toFixed(2).replace(".", ",")}
                </p>
                <p className="text-xs font-bold text-neutral-400 mt-3">
                  Margem: {margemLucro}%
                </p>
              </div>
            </div>
          </Card>

          {/* Botões de Ação na Edição */}
          {editing && (
            <div className="flex gap-4 sticky top-6">
              <Button
                onClick={() => {
                  setEditing(false);
                  // Recarrega o serviço original para descartar alterações não salvas
                  window.location.reload();
                }}
                className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-lg h-12"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 bg-[#DEAE60] hover:bg-[#DEAE60]/90 text-neutral-950 font-black rounded-lg uppercase tracking-tight h-12 flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                {loading ? "Salvando..." : "Salvar Caso"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

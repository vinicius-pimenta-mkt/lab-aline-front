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
import { ArrowLeft, Download, Save, CheckCircle2, Clock, AlertCircle, Plus, Trash2, Layers, Calendar, CreditCard, X } from "lucide-react";

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
  id: string | number;
  patient: string;
  patientPhone: string;
  dentist: string;
  dentistPhone: string;
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

  // Estados para o Modal de Exportação PDF
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedCostsPdf, setSelectedCostsPdf] = useState<any[]>([]);

  useEffect(() => {
    const fetchService = async () => {
      if (!serviceId) return;
      try {
        const response = await api.get(`/trabalhos/${serviceId}`);
        const fetched = response.data;
        
        setService({
          id: fetched.id,
          patient: fetched.paciente_nome || "Não informado",
          patientPhone: fetched.paciente_telefone || fetched.telefone_paciente || "",
          dentist: fetched.dentista_nome || "Não informado",
          dentistPhone: fetched.dentista_telefone || fetched.telefone_dentista || "",
          procedure: fetched.procedimento || "Não especificado",
          description: fetched.descricao || "",
          status: fetched.status,
          prioridade: fetched.prioridade || "normal",
          prazo_entrega: fetched.prazo_entrega ? fetched.prazo_entrega.split("T")[0] : "",
          forma_pagamento: fetched.forma_pagamento || "",
          grossValue: fetched.valor_bruto,
          stages: fetched.etapas || [],
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
        costs: service.costs,
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

  const toggleCostForPdf = (costId: any) => {
    setSelectedCostsPdf(prev => 
      prev.includes(costId) ? prev.filter(id => id !== costId) : [...prev, costId]
    );
  };

  // =========================================================================
  // NOVA FUNÇÃO DE GERAR PDF: Cria um documento invisível limpo idêntico ao modelo
  // =========================================================================
  const triggerPdfPrint = () => {
    setIsExportModalOpen(false);

    if (!service) return;

    // Abre uma janela em branco
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error("O bloqueador de pop-ups impediu a geração do PDF. Permita pop-ups para este site.");
      return;
    }

    const dataEmissao = new Date().toLocaleDateString('pt-BR');
    const totalPdfValue = service.grossValue + service.costs.filter(c => selectedCostsPdf.includes(c.id)).reduce((acc, curr) => acc + Number(curr.value), 0);

    let rowsHtml = `
      <tr>
        <td class="center">01</td>
        <td>${service.procedure.toUpperCase()}</td>
        <td class="right">R$ ${service.grossValue.toFixed(2).replace('.', ',')}</td>
        <td class="right">R$ ${service.grossValue.toFixed(2).replace('.', ',')}</td>
      </tr>
    `;

    service.costs.filter(c => selectedCostsPdf.includes(c.id)).forEach((cost) => {
      rowsHtml += `
        <tr>
          <td class="center">01</td>
          <td>ADICIONAL: ${cost.name.toUpperCase()}</td>
          <td class="right">R$ ${Number(cost.value).toFixed(2).replace('.', ',')}</td>
          <td class="right">R$ ${Number(cost.value).toFixed(2).replace('.', ',')}</td>
        </tr>
      `;
    });

    // Template HTML que imita perfeitamente o PDF modelo (sem fundo preto, sem menus)
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Extrato_${service.id}</title>
        <style>
          @page { margin: 15mm; size: A4 portrait; }
          body { font-family: Arial, sans-serif; color: #000; font-size: 12px; line-height: 1.5; padding: 10px; }
          .header { border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
          .header h1 { font-size: 16px; margin: 0 0 5px 0; font-weight: bold; }
          .header p { margin: 0; }
          .info { margin-bottom: 30px; }
          .info p { margin: 3px 0; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 6px; text-align: left; font-size: 11px; }
          td { padding: 6px; border-bottom: 1px dashed #ccc; font-size: 11px; }
          .center { text-align: center; }
          .right { text-align: right; }
          .summary { width: 250px; float: right; }
          .summary-line { display: flex; justify-content: space-between; padding: 4px 0; }
          .summary-total { display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; border-top: 1px solid #000; padding-top: 6px; margin-top: 4px; }
          .clear { clear: both; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>ALINE ANTUNES PRÓTESE ODONTOLÓGICA</h1>
          <p>Telefone: (31) 99526-3682</p>
          <p>Extrato de Serviços Detalhado</p>
        </div>

        <div class="info">
          <p><strong>Cliente/Dentista:</strong> ${service.dentist.toUpperCase()} ${service.dentistPhone ? ` - ${service.dentistPhone}` : ''}</p>
          <p><strong>Paciente:</strong> ${service.patient.toUpperCase()}</p>
          <p><strong>Lançamento:</strong> ${service.createdAt || dataEmissao} &nbsp;&nbsp;&nbsp; <strong>Ordem:</strong> #${String(service.id).padStart(5, '0')}</p>
        </div>

        <table>
          <thead>
            <tr>
              <th class="center" style="width: 10%;">Qtde</th>
              <th style="width: 50%;">Descrição</th>
              <th class="right" style="width: 20%;">Valor</th>
              <th class="right" style="width: 20%;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="summary">
          <div class="summary-line">
            <span>Débito:</span>
            <span>R$ ${totalPdfValue.toFixed(2).replace('.', ',')}</span>
          </div>
          <div class="summary-total">
            <span>TOTAL:</span>
            <span>R$ ${totalPdfValue.toFixed(2).replace('.', ',')}</span>
          </div>
        </div>

        <div class="clear" style="padding-top: 40px;">
          <p><strong>Forma Prevista de Pagamento:</strong> ${service.forma_pagamento || "Não informada"}</p>
          <p><strong>Data de Emissão:</strong> ${dataEmissao}</p>
        </div>
      </body>
      </html>
    `;

    // Escreve o HTML na janela e aciona a impressão nativa
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();

    // Pequeno atraso para garantir que o navegador processe o HTML antes de chamar a caixa de impressão
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
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
    return <div className="min-h-screen bg-transparent p-6 text-white flex items-center justify-center">Carregando detalhes do serviço...</div>;
  }

  if (!service) {
    return <div className="min-h-screen bg-neutral-950 p-6 text-white flex items-center justify-center">Serviço não encontrado.</div>;
  }

  const totalOperationCost = service.costs.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
  const lucroLiquido = service.grossValue - totalOperationCost;
  const margemLucro = service.grossValue > 0 ? ((lucroLiquido / service.grossValue) * 100).toFixed(1) : "0.0";
  
  const inputBaseStyle = "bg-neutral-900 border-neutral-800 text-white placeholder-neutral-600 focus-visible:ring-1 focus-visible:ring-[#DEAE60]/50 focus-visible:border-[#DEAE60]/50 transition-all";

  return (
    <div className="min-h-screen bg-transparent p-6 relative">
      
      {/* MODAL DE SELEÇÃO PARA EXPORTAÇÃO */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl w-full max-w-md shadow-2xl relative">
            <button 
              onClick={() => setIsExportModalOpen(false)}
              className="absolute top-4 right-4 p-1 text-neutral-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2 flex items-center gap-2">
              <Download className="w-5 h-5 text-[#DEAE60]" /> Exportar Relatório
            </h3>
            <p className="text-sm text-neutral-400 mb-6 leading-relaxed">
              Quais custos operacionais deseja adicionar como <strong>"Custo Extra"</strong> no PDF para o dentista?
            </p>

            <div className="space-y-3 mb-8 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {service.costs.map(cost => (
                <label key={cost.id} className="flex items-center gap-3 p-3 bg-neutral-950/50 border border-neutral-800/80 rounded-lg cursor-pointer hover:bg-neutral-800/50 transition-colors">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 rounded border-neutral-700 bg-neutral-900 text-[#DEAE60] focus:ring-[#DEAE60] focus:ring-offset-neutral-900"
                    checked={selectedCostsPdf.includes(cost.id)} 
                    onChange={() => toggleCostForPdf(cost.id)} 
                  />
                  <div className="flex-1 flex justify-between items-center text-sm">
                    <span className="text-white font-medium">{cost.name || "Sem descrição"}</span>
                    <span className="text-[#DEAE60] font-bold">R$ {Number(cost.value).toFixed(2).replace('.', ',')}</span>
                  </div>
                </label>
              ))}
              {service.costs.length === 0 && (
                <div className="text-center py-6 bg-neutral-950/30 rounded-lg border border-neutral-800/50">
                  <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest">Nenhum custo extra registrado neste serviço.</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button onClick={() => setIsExportModalOpen(false)} className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white">Cancelar</Button>
              <Button onClick={triggerPdfPrint} className="flex-1 bg-[#DEAE60] hover:bg-[#DEAE60]/90 text-neutral-950 font-black uppercase">Gerar PDF</Button>
            </div>
          </div>
        </div>
      )}

      {/* Header da Tela */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => setLocation("/services")} className="p-2 hover:bg-neutral-800 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-neutral-400" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
              {service.procedure}
            </h1>
            <p className="text-neutral-400 text-sm mt-1 sm:mt-2">
              Paciente: {service.patient} | Dentista: {service.dentist}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => setIsExportModalOpen(true)}
            className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-lg flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar PDF</span>
            <span className="sm:hidden">PDF</span>
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
        <div className="lg:col-span-2 space-y-6">
          
          <Card className="bg-neutral-900 border-neutral-800 p-8 shadow-xl">
            <h2 className="text-sm font-black text-[#DEAE60] uppercase tracking-widest mb-6">Informações do Serviço</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-2">
                <Label className="text-xs font-bold text-neutral-400 uppercase">Prazo de Entrega</Label>
                {editing ? (
                  <Input type="date" value={service.prazo_entrega} onChange={(e) => handleFieldChange("prazo_entrega", e.target.value)} className={inputBaseStyle} />
                ) : (
                  <div className="flex items-center gap-2 mt-2">
                    <Calendar className="w-4 h-4 text-neutral-500" />
                    <p className="text-white font-bold">{service.prazo_entrega ? new Date(service.prazo_entrega + "T00:00:00").toLocaleDateString("pt-BR") : "Não definido"}</p>
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
                  <p className="text-white font-bold mt-2 uppercase text-sm">{service.prioridade === 'urgente' ? "⚠️ Urgente" : service.prioridade === 'vip' ? "⭐ VIP" : "Normal"}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-neutral-400 uppercase">Procedimento</Label>
                {editing ? (
                  <Input value={service.procedure} onChange={(e) => handleFieldChange("procedure", e.target.value)} className={inputBaseStyle} />
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
                  <Textarea value={service.description} onChange={(e) => handleFieldChange("description", e.target.value)} rows={3} className={inputBaseStyle} />
                ) : (
                  <p className="text-neutral-300 mt-2 text-sm leading-relaxed">{service.description || "Nenhuma descrição detalhada."}</p>
                )}
              </div>
            </div>
          </Card>

          <Card className="bg-neutral-900 border-neutral-800 p-8 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-black text-[#DEAE60] uppercase tracking-widest flex items-center gap-2">
                <Layers className="w-5 h-5" /> Etapas do Procedimento
              </h2>
              {editing && (
                <Button type="button" onClick={handleAddStage} variant="ghost" size="sm" className="text-xs text-[#DEAE60] hover:bg-[#DEAE60]/10">
                  <Plus className="w-3 h-3 mr-1" /> Nova Etapa
                </Button>
              )}
            </div>

            <div className="space-y-4">
              {service.stages.length === 0 && !editing && <p className="text-neutral-500 text-sm italic">Nenhuma etapa registrada para este serviço.</p>}
              {service.stages.map((stage, idx) => (
                <div key={stage.id} className="flex items-start gap-4 pb-6 border-b border-neutral-800/50 last:border-0 last:pb-0">
                  <div className="mt-2 shrink-0">{getStageIcon(stage.status)}</div>
                  
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                      <div className="flex-1">
                        {editing ? (
                          <Input placeholder="Nome da etapa" value={stage.nome} onChange={(e) => handleStageChange(stage.id, "nome", e.target.value)} className={inputBaseStyle} />
                        ) : (
                          <h3 className="font-bold text-white text-base">{stage.nome || "Etapa sem nome"}</h3>
                        )}
                      </div>
                      
                      <div className="w-full md:w-48">
                        {editing ? (
                          <Select value={stage.status} onValueChange={(value) => handleStageChange(stage.id, "status", value as "pending" | "in_progress" | "completed")}>
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
                        <Button type="button" onClick={() => handleRemoveStage(stage.id)} variant="ghost" className="h-10 w-10 p-0 text-neutral-500 hover:text-red-400 shrink-0" disabled={service.stages.length === 1}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div>
                      {editing ? (
                        <Textarea placeholder="Descrição da etapa..." value={stage.descricao} onChange={(e) => handleStageChange(stage.id, "descricao", e.target.value)} rows={2} className={`${inputBaseStyle} text-sm`} />
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

        <div className="space-y-6">
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
                    <Input type="date" value={service.completedAt || ""} onChange={(e) => handleFieldChange("completedAt", e.target.value)} className={`${inputBaseStyle} mt-2`} />
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

          <Card className="bg-neutral-900 border-neutral-800 p-6 shadow-xl">
            <h2 className="text-xs font-black text-white uppercase tracking-widest mb-6">Resumo Financeiro</h2>
            <div className="space-y-6">
              
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
                    <p className="text-white font-bold text-sm">{service.forma_pagamento || "Não informada"}</p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-neutral-400 text-xs font-bold uppercase tracking-wider mb-2">Valor Bruto</p>
                {editing ? (
                  <Input type="number" value={service.grossValue} onChange={(e) => handleFieldChange("grossValue", parseFloat(e.target.value) || 0)} className={`${inputBaseStyle} font-bold text-lg text-[#DEAE60]`} />
                ) : (
                  <p className="text-3xl font-black text-white">R$ {service.grossValue.toFixed(2).replace(".", ",")}</p>
                )}
              </div>
              
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
                        <Input placeholder="Motivo..." value={cost.name} onChange={(e) => handleCostChange(cost.id, "name", e.target.value)} className={`${inputBaseStyle} h-9 text-xs flex-1`} />
                        <Input type="number" placeholder="0.00" value={cost.value || ""} onChange={(e) => handleCostChange(cost.id, "value", e.target.value)} className={`${inputBaseStyle} h-9 text-xs w-24 text-red-400 font-bold`} />
                        <Button type="button" onClick={() => handleRemoveCost(cost.id)} variant="ghost" className="h-9 w-9 p-0 text-neutral-500 hover:text-red-400 shrink-0">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2 mb-4">
                    {service.costs.map((cost) => (
                      <div key={cost.id} className="flex justify-between items-center text-sm">
                        <span className="text-neutral-400">{cost.name || "Custo sem nome"}</span>
                        <span className="text-red-400 font-bold">- R$ {(Number(cost.value) || 0).toFixed(2).replace(".", ",")}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-neutral-800/50">
                  <span className="text-xs font-bold uppercase text-neutral-500">Total de Custos</span>
                  <p className="text-xl font-bold text-red-400">-R$ {totalOperationCost.toFixed(2).replace(".", ",")}</p>
                </div>
              </div>
              
              <div className="border-t border-neutral-800 pt-6 bg-[#DEAE60]/10 p-6 rounded-xl mt-6">
                <p className="text-[#DEAE60]/80 text-xs font-bold uppercase tracking-wider mb-2">Lucro Líquido</p>
                <p className="text-4xl font-black text-[#DEAE60]">R$ {lucroLiquido.toFixed(2).replace(".", ",")}</p>
                <p className="text-xs font-bold text-neutral-400 mt-3">Margem: {margemLucro}%</p>
              </div>
            </div>
          </Card>

          {editing && (
            <div className="flex gap-4 sticky top-6">
              <Button onClick={() => { setEditing(false); window.location.reload(); }} className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-lg h-12">
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={loading} className="flex-1 bg-[#DEAE60] hover:bg-[#DEAE60]/90 text-neutral-950 font-black rounded-lg uppercase tracking-tight h-12 flex items-center justify-center gap-2">
                <Save className="w-5 h-5" /> {loading ? "Salvando..." : "Salvar Caso"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

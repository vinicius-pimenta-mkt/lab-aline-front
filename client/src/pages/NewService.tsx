import { useState, useEffect } from "react";
import api from "../lib/api";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, Layers, Calendar, AlertCircle } from "lucide-react";

interface Cost {
  id: number;
  name: string;
  value: string;
}

interface DefaultService {
  id: number;
  nome: string;
  valor_padrao: number;
}

interface DentistList {
  id: number;
  nome: string;
  telefone: string;
}

interface ProcedureItem {
  id: number;
  procedure: string;
  grossValue: string;
}

interface ServiceFormData {
  patientName: string;
  patientPhone: string;
  patientNotes: string;
  dentistName: string;
  dentistPhone: string;
  dentistNotes: string;
  description: string;
  paymentMethod: string;
  priority: string;
  dueDate: string;
  status: string;
  completedAt: string;
  costs: Cost[];
}

export default function NewService() {
  const [, setLocation] = useLocation();
  
  const [defaultServices, setDefaultServices] = useState<DefaultService[]>([]);
  const [dentists, setDentists] = useState<DentistList[]>([]);

  // Estado para suportar Múltiplos Procedimentos
  const [procedures, setProcedures] = useState<ProcedureItem[]>([
    { id: Date.now(), procedure: "", grossValue: "" }
  ]);

  const [formData, setFormData] = useState<ServiceFormData>({
    patientName: "",
    patientPhone: "",
    patientNotes: "",
    dentistName: "",
    dentistPhone: "",
    dentistNotes: "",
    description: "",
    paymentMethod: "",
    priority: "normal",
    dueDate: "",
    status: "Pendente",
    completedAt: "",
    costs: [{ id: Date.now(), name: "", value: "" }],
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/servicos-padrao")
      .then((res) => setDefaultServices(res.data || []))
      .catch((err) => console.error("Erro ao carregar tabela de preços:", err));

    api.get("/dentistas")
      .then((res) => setDentists(res.data || []))
      .catch((err) => console.error("Erro ao carregar dentistas:", err));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData((prev) => {
      const updatedData = { ...prev, [name]: value };
      
      // Autopreenchimento do Telefone do Dentista
      if (name === "dentistName") {
        const matchedDentist = dentists.find(
          (d) => d.nome.toLowerCase() === value.toLowerCase().trim()
        );
        if (matchedDentist && matchedDentist.telefone && !prev.dentistPhone) {
          updatedData.dentistPhone = matchedDentist.telefone;
        }
      }
      
      return updatedData;
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Funções para gerir Múltiplos Procedimentos
  const handleAddProcedure = () => {
    setProcedures([...procedures, { id: Date.now(), procedure: "", grossValue: "" }]);
  };

  const handleRemoveProcedure = (id: number) => {
    if (procedures.length === 1) return toast.warning("Pelo menos um serviço é obrigatório.");
    setProcedures(procedures.filter(p => p.id !== id));
  };

  const handleProcedureChange = (id: number, field: "procedure" | "grossValue", value: string) => {
    setProcedures(procedures.map(p => {
      if (p.id !== id) return p;
      if (field === "procedure") {
        const matched = defaultServices.find(s => s.nome.toLowerCase() === value.toLowerCase().trim());
        return { ...p, procedure: value, grossValue: matched ? matched.valor_padrao.toString() : p.grossValue };
      }
      return { ...p, [field]: value };
    }));
  };

  // Gerenciamento de Custos Dinâmicos
  const handleAddCost = () => {
    setFormData((prev) => ({
      ...prev,
      costs: [...prev.costs, { id: Date.now(), name: "", value: "" }],
    }));
  };

  const handleRemoveCost = (idToRemove: number) => {
    setFormData((prev) => ({
      ...prev,
      costs: prev.costs.filter((cost) => cost.id !== idToRemove),
    }));
  };

  const handleCostChange = (id: number, field: keyof Cost, value: string) => {
    setFormData((prev) => ({
      ...prev,
      costs: prev.costs.map((cost) => (cost.id === id ? { ...cost, [field]: value } : cost)),
    }));
  };

  // Cálculos Financeiros (Somando os valores de todos os procedimentos)
  const grossValue = procedures.reduce((acc, curr) => acc + (parseFloat(curr.grossValue) || 0), 0);
  const totalOperationCost = formData.costs.reduce((acc, curr) => acc + (parseFloat(curr.value) || 0), 0);
  const netProfit = grossValue - totalOperationCost;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.patientName || !formData.dentistName || procedures.some(p => !p.procedure.trim()) || !formData.dueDate) {
        toast.error("Preencha todos os campos obrigatórios (*), incluindo o prazo de entrega e os nomes dos serviços.");
        setLoading(false);
        return;
      }

      await api.post("/trabalhos", {
        paciente_nome: formData.patientName,
        paciente_telefone: formData.patientPhone,
        dentista_nome: formData.dentistName,
        procedimento: procedures[0].procedure, // Envia o 1º como fallback
        descricao: formData.description,
        prioridade: formData.priority,
        prazo_entrega: formData.dueDate,
        valor_bruto: grossValue,
        forma_pagamento: formData.paymentMethod,
        custo_operacional: totalOperationCost,
        resumo_trabalho: formData.patientNotes,
        observacoes: formData.dentistNotes,
        costs: formData.costs,
        status: formData.status,
        data_saida: formData.status === "Finalizado" ? formData.completedAt : null,
        proceduresList: procedures // Envia a lista completa de procedimentos pro novo backend!
      });
      
      toast.success("Serviços registados com sucesso!");
      setLocation("/services");
    } catch (error: any) {
      console.error(error.response?.data);
      toast.error(error.response?.data?.error || "Erro ao registar serviço na API");
    } finally {
      setLoading(false);
    }
  };

  const inputBaseStyle = "bg-neutral-900 border-neutral-800 text-white placeholder-neutral-600 focus-visible:ring-1 focus-visible:ring-[#DEAE60]/50 focus-visible:border-[#DEAE60]/50 transition-all";

  return (
    <div className="min-h-screen bg-transparent p-6">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => setLocation("/services")}
          className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-neutral-400" />
        </button>
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight">
            NOVO SERVIÇO
          </h1>
          <p className="text-neutral-400 text-sm mt-2">Agende prazos e configure os serviços</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="bg-neutral-900/50 border-neutral-800 p-8 shadow-xl">
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* Cronograma e Gestão */}
              <div>
                <h2 className="text-sm font-black text-[#DEAE60] uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Prazos, Prioridade & Status
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="dueDate" className="text-xs font-bold text-neutral-400 uppercase">Prazo de Entrega *</Label>
                    <Input id="dueDate" name="dueDate" type="date" value={formData.dueDate} onChange={handleChange} className={inputBaseStyle} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority" className="text-xs font-bold text-neutral-400 uppercase">Prioridade</Label>
                    <Select value={formData.priority} onValueChange={(value) => handleSelectChange("priority", value)}>
                      <SelectTrigger className="bg-neutral-900 border-neutral-800 text-white focus:ring-1 focus:ring-[#DEAE60]/50 h-10">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent className="bg-neutral-900 border-neutral-800">
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="urgente"><span className="flex items-center gap-2 text-red-400"><AlertCircle className="w-4 h-4"/> Urgente</span></SelectItem>
                        <SelectItem value="vip"><span className="flex items-center gap-2 text-amber-400">⭐ Estojo VIP</span></SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-xs font-bold text-neutral-400 uppercase">Status Inicial</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value, completedAt: value === "Finalizado" && !prev.completedAt ? new Date().toISOString().split("T")[0] : prev.completedAt }))}>
                      <SelectTrigger className="bg-neutral-900 border-neutral-800 text-white focus:ring-1 focus:ring-[#DEAE60]/50 h-10">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                        <SelectItem value="Pendente">Pendente</SelectItem>
                        <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                        <SelectItem value="Finalizado">Finalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formData.status === "Finalizado" && (
                  <div className="mt-6 border-t border-neutral-800/50 pt-6 w-full md:w-1/3">
                    <Label htmlFor="completedAt" className="text-xs font-bold text-neutral-400 uppercase text-green-400">Data de Finalização *</Label>
                    <Input id="completedAt" name="completedAt" type="date" value={formData.completedAt} onChange={handleChange} className={`${inputBaseStyle} mt-2 border-green-500/30 focus-visible:ring-green-500/50`} />
                  </div>
                )}
              </div>

              {/* Informações do Paciente */}
              <div className="border-t border-neutral-800/50 pt-8">
                <h2 className="text-sm font-black text-[#DEAE60] uppercase tracking-widest mb-4">Informações do Paciente</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="patientName" className="text-xs font-bold text-neutral-400 uppercase">Nome do Paciente *</Label>
                    <Input id="patientName" name="patientName" placeholder="Ex: João Silva" value={formData.patientName} onChange={handleChange} className={inputBaseStyle} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="patientPhone" className="text-xs font-bold text-neutral-400 uppercase">Telefone do Paciente</Label>
                    <Input id="patientPhone" name="patientPhone" placeholder="Ex: (11) 99999-9999" value={formData.patientPhone} onChange={handleChange} className={inputBaseStyle} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="patientNotes" className="text-xs font-bold text-neutral-400 uppercase">Sobre o Caso (Paciente)</Label>
                    <Textarea id="patientNotes" name="patientNotes" placeholder="Detalhes clínicos, cor do dente, particularidades do dente ou do paciente..." value={formData.patientNotes} onChange={handleChange} rows={2} className={inputBaseStyle} />
                  </div>
                </div>
              </div>

              {/* Informações do Dentista */}
              <div className="border-t border-neutral-800/50 pt-8">
                <h2 className="text-sm font-black text-[#DEAE60] uppercase tracking-widest mb-4">Informações do Dentista / Parceiro</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="dentistName" className="text-xs font-bold text-neutral-400 uppercase">Nome do Parceiro *</Label>
                    <Input id="dentistName" name="dentistName" list="dentist-options" placeholder="Digite para buscar ou cadastrar..." value={formData.dentistName} onChange={handleChange} className={inputBaseStyle} autoComplete="off" />
                    <datalist id="dentist-options">
                      {dentists.map((d) => <option key={d.id} value={d.nome} />)}
                    </datalist>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dentistPhone" className="text-xs font-bold text-neutral-400 uppercase">Telefone do Parceiro</Label>
                    <Input id="dentistPhone" name="dentistPhone" placeholder="Ex: (11) 98888-8888" value={formData.dentistPhone} onChange={handleChange} className={inputBaseStyle} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="dentistNotes" className="text-xs font-bold text-neutral-400 uppercase">Sobre a Solicitação</Label>
                    <Textarea id="dentistNotes" name="dentistNotes" placeholder="Instruções específicas enviadas pelo dentista..." value={formData.dentistNotes} onChange={handleChange} rows={2} className={inputBaseStyle} />
                  </div>
                </div>
              </div>

              {/* MÚLTIPLOS PROCEDIMENTOS */}
              <div className="border-t border-neutral-800/50 pt-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-black text-[#DEAE60] uppercase tracking-widest">Detalhes do Serviço / Procedimentos</h2>
                  <Button type="button" onClick={handleAddProcedure} size="sm" variant="ghost" className="h-8 text-xs text-[#DEAE60] hover:text-[#DEAE60] hover:bg-[#DEAE60]/10">
                    <Plus className="w-3 h-3 mr-1" /> Adicionar Serviço Extra
                  </Button>
                </div>
                
                <div className="space-y-4 mb-6">
                  {procedures.map((p, idx) => (
                    <div key={p.id} className="flex flex-col sm:flex-row items-end gap-3 bg-neutral-950/30 p-4 rounded-xl border border-neutral-800/50">
                      <div className="flex-1 w-full space-y-2">
                        <Label className="text-[10px] font-bold text-neutral-400 uppercase">Procedimento #{idx + 1} *</Label>
                        <Input 
                          list="procedure-options" 
                          placeholder="Digite para buscar ou criar" 
                          value={p.procedure} 
                          onChange={(e) => handleProcedureChange(p.id, "procedure", e.target.value)} 
                          className={inputBaseStyle} 
                          autoComplete="off"
                        />
                      </div>
                      <div className="w-full sm:w-40 space-y-2">
                        <Label className="text-[10px] font-bold text-neutral-400 uppercase">Valor (R$)</Label>
                        <Input 
                          type="number" step="0.01" 
                          value={p.grossValue} 
                          onChange={(e) => handleProcedureChange(p.id, "grossValue", e.target.value)} 
                          className={`${inputBaseStyle} text-[#DEAE60] font-bold`} 
                          placeholder="0.00" 
                        />
                      </div>
                      {procedures.length > 1 && (
                        <Button type="button" variant="ghost" onClick={() => handleRemoveProcedure(p.id)} className="h-10 w-10 p-0 text-neutral-500 hover:text-red-400 border border-neutral-800 shrink-0">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <datalist id="procedure-options">
                    {defaultServices.map((srv) => <option key={srv.id} value={srv.nome} />)}
                  </datalist>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-xs font-bold text-neutral-400 uppercase">Descrição Geral do Trabalho</Label>
                  <Textarea id="description" name="description" placeholder="Descreva os materiais utilizados, detalhes para produção conjunta, etc." value={formData.description} onChange={handleChange} rows={3} className={inputBaseStyle} />
                </div>
              </div>

              {/* Informações Financeiras */}
              <div className="border-t border-neutral-800/50 pt-8">
                <h2 className="text-sm font-black text-[#DEAE60] uppercase tracking-widest mb-4">Financeiro & Custos</h2>
                <div className="space-y-6">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-neutral-400 uppercase">Soma Bruta dos Serviços (R$)</Label>
                      <Input readOnly value={grossValue.toFixed(2).replace(".", ",")} className={`${inputBaseStyle} text-[#DEAE60] font-bold text-lg h-12 bg-neutral-950`} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="paymentMethod" className="text-xs font-bold text-neutral-400 uppercase">Forma de Pagamento</Label>
                      <Select value={formData.paymentMethod} onValueChange={(value) => handleSelectChange("paymentMethod", value)}>
                        <SelectTrigger className="bg-neutral-900 border-neutral-800 text-white focus:ring-1 focus:ring-[#DEAE60]/50 h-12">
                          <SelectValue placeholder="Selecione o pagamento" />
                        </SelectTrigger>
                        <SelectContent className="bg-neutral-900 border-neutral-800">
                          <SelectItem value="Pix">Pix</SelectItem>
                          <SelectItem value="Crédito">Cartão de Crédito</SelectItem>
                          <SelectItem value="Débito">Cartão de Débito</SelectItem>
                          <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4 bg-neutral-950/50 p-6 rounded-xl border border-neutral-800/50">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-xs font-bold text-neutral-400 uppercase">Custos Operacionais</Label>
                      <Button type="button" onClick={handleAddCost} variant="ghost" size="sm" className="h-8 text-xs text-[#DEAE60] hover:text-[#DEAE60] hover:bg-[#DEAE60]/10">
                        <Plus className="w-3 h-3 mr-1" /> Novo Custo
                      </Button>
                    </div>
                    {formData.costs.map((cost) => (
                      <div key={cost.id} className="flex items-start gap-4">
                        <div className="flex-1 space-y-1">
                          <Input placeholder="Refere-se a (ex: Motoboy, Resina)" value={cost.name} onChange={(e) => handleCostChange(cost.id, "name", e.target.value)} className={`${inputBaseStyle} h-10 text-sm`} />
                        </div>
                        <div className="w-1/3 space-y-1">
                          <Input type="number" step="0.01" placeholder="Valor (R$)" value={cost.value} onChange={(e) => handleCostChange(cost.id, "value", e.target.value)} className={`${inputBaseStyle} h-10 text-sm text-red-400 font-bold`} />
                        </div>
                        <Button type="button" onClick={() => handleRemoveCost(cost.id)} variant="ghost" className="h-10 w-10 p-0 text-neutral-500 hover:text-red-400 hover:bg-red-400/10 shrink-0" disabled={formData.costs.length === 1}>
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Botões */}
              <div className="flex gap-4 pt-8 border-t border-neutral-800/50">
                <Button type="button" onClick={() => setLocation("/services")} className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-lg px-8 h-12">
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading} className="flex-1 bg-[#DEAE60] hover:bg-[#DEAE60]/90 text-neutral-950 font-black rounded-lg uppercase tracking-tight h-12">
                  {loading ? "A registar..." : "Registar Serviços"}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Sidebar - Resumo Financeiro */}
        <div className="space-y-6">
          <Card className="bg-neutral-900/80 border-neutral-800 p-6 shadow-xl sticky top-6">
            <h3 className="font-bold text-white uppercase mb-6 flex items-center gap-2">
              <span className="w-2 h-2 bg-[#DEAE60] rounded-full"></span> Resumo Financeiro
            </h3>
            <div className="space-y-6">
              <div>
                <p className="text-neutral-400 text-xs font-bold uppercase tracking-wider mb-2">Valor Bruto ({procedures.length} Serviço{procedures.length > 1 ? 's' : ''})</p>
                <p className="text-3xl font-black text-white">R$ {grossValue.toFixed(2).replace(".", ",")}</p>
              </div>
              <div className="border-t border-neutral-800/50 pt-6">
                <p className="text-neutral-400 text-xs font-bold uppercase tracking-wider mb-2">Custos Totais</p>
                <p className="text-2xl font-bold text-red-400">- R$ {totalOperationCost.toFixed(2).replace(".", ",")}</p>
                {formData.costs.some(c => c.name || c.value) && (
                  <div className="mt-4 space-y-2">
                    {formData.costs.map((cost, idx) => cost.name && (
                      <div key={idx} className="flex justify-between text-xs text-neutral-500 font-medium">
                        <span>{cost.name}</span>
                        <span>R$ {(parseFloat(cost.value) || 0).toFixed(2).replace(".", ",")}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="border-t border-neutral-800 pt-6 bg-[#DEAE60]/10 p-6 rounded-xl mt-6">
                <p className="text-[#DEAE60]/80 text-xs font-bold uppercase tracking-wider mb-2">Lucro Líquido</p>
                <p className={`text-4xl font-black ${netProfit >= 0 ? "text-[#DEAE60]" : "text-red-400"}`}>
                  R$ {netProfit.toFixed(2).replace(".", ",")}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

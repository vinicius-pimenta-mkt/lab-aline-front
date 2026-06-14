import { useState } from "react";
import api from "../lib/api";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

interface Cost {
  id: number;
  name: string;
  value: string;
}

interface ServiceFormData {
  patientName: string;
  patientPhone: string;
  patientNotes: string; // Novo: Sobre o caso
  dentistName: string;
  dentistPhone: string;
  dentistNotes: string; // Novo: Sobre a solicitação
  procedure: string;
  description: string;
  grossValue: string;
  costs: Cost[]; // Novo: Array dinâmico de custos
  status: string;
}

export default function NewService() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState<ServiceFormData>({
    patientName: "",
    patientPhone: "",
    patientNotes: "",
    dentistName: "",
    dentistPhone: "",
    dentistNotes: "",
    procedure: "",
    description: "",
    grossValue: "",
    costs: [{ id: Date.now(), name: "", value: "" }],
    status: "pending",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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

  // Cálculos Financeiros em tempo real
  const grossValue = parseFloat(formData.grossValue) || 0;
  const totalOperationCost = formData.costs.reduce((acc, curr) => acc + (parseFloat(curr.value) || 0), 0);
  const netProfit = grossValue - totalOperationCost;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.patientName || !formData.dentistName || !formData.procedure) {
        toast.error("Preencha todos os campos obrigatórios (*)");
        setLoading(false);
        return;
      }

      // Enviando os dados reais e limpos diretamente para o novo back-end inteligente
      await api.post("/trabalhos", {
        paciente_nome: formData.patientName,
        dentista_nome: formData.dentistName,
        procedimento: formData.procedure,
        descricao: formData.description || "Sem descrição complementar",
        valor_bruto: parseFloat(formData.grossValue) || 0,
        custo_operacional: totalOperationCost, // Envia a soma exata de todos os custos dinâmicos criados
        resumo_trabalho: formData.patientNotes, // Salva o campo "Sobre o caso"
        observacoes: formData.dentistNotes,     // Salva o campo "Sobre a solicitação"
      });
      
      toast.success("Serviço registrado com sucesso!");
      setLocation("/services");
    } catch (error: any) {
      console.error(error.response?.data);
      toast.error(error.response?.data?.error || "Erro ao registrar serviço na API");
    } finally {
      setLoading(false);
    }
  };

  // Estilo padrão para inputs com borda mais fina (ring reduzido e cor ajustada)
  const inputBaseStyle = "bg-neutral-900 border-neutral-800 text-white placeholder-neutral-600 focus-visible:ring-1 focus-visible:ring-[#DEAE60]/50 focus-visible:border-[#DEAE60]/50 transition-all";

  return (
    <div className="min-h-screen bg-neutral-950 p-6">
      {/* Header */}
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
          <p className="text-neutral-400 text-sm mt-2">Registre um novo trabalho no laboratório</p>
        </div>
      </div>

      {/* Formulário */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Seção Principal */}
        <div className="lg:col-span-2">
          <Card className="bg-neutral-900/50 border-neutral-800 p-8 shadow-xl">
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* Informações do Paciente */}
              <div>
                <h2 className="text-sm font-black text-[#DEAE60] uppercase tracking-widest mb-4">Informações do Paciente</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="patientName" className="text-xs font-bold text-neutral-400 uppercase">
                      Nome do Paciente *
                    </Label>
                    <Input
                      id="patientName"
                      name="patientName"
                      placeholder="Ex: João Silva"
                      value={formData.patientName}
                      onChange={handleChange}
                      className={inputBaseStyle}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="patientPhone" className="text-xs font-bold text-neutral-400 uppercase">
                      Telefone do Paciente
                    </Label>
                    <Input
                      id="patientPhone"
                      name="patientPhone"
                      placeholder="Ex: (11) 99999-9999"
                      value={formData.patientPhone}
                      onChange={handleChange}
                      className={inputBaseStyle}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="patientNotes" className="text-xs font-bold text-neutral-400 uppercase">
                      Sobre o Caso (Paciente)
                    </Label>
                    <Textarea
                      id="patientNotes"
                      name="patientNotes"
                      placeholder="Detalhes clínicos, cor do dente, particularidades do paciente..."
                      value={formData.patientNotes}
                      onChange={handleChange}
                      rows={2}
                      className={inputBaseStyle}
                    />
                  </div>
                </div>
              </div>

              {/* Informações do Dentista */}
              <div className="border-t border-neutral-800/50 pt-8">
                <h2 className="text-sm font-black text-[#DEAE60] uppercase tracking-widest mb-4">Informações do Dentista</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dentistName" className="text-xs font-bold text-neutral-400 uppercase">
                      Nome do Dentista *
                    </Label>
                    <Input
                      id="dentistName"
                      name="dentistName"
                      placeholder="Ex: Dr. Carlos"
                      value={formData.dentistName}
                      onChange={handleChange}
                      className={inputBaseStyle}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dentistPhone" className="text-xs font-bold text-neutral-400 uppercase">
                      Telefone do Dentista
                    </Label>
                    <Input
                      id="dentistPhone"
                      name="dentistPhone"
                      placeholder="Ex: (11) 98888-8888"
                      value={formData.dentistPhone}
                      onChange={handleChange}
                      className={inputBaseStyle}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="dentistNotes" className="text-xs font-bold text-neutral-400 uppercase">
                      Sobre a Solicitação
                    </Label>
                    <Textarea
                      id="dentistNotes"
                      name="dentistNotes"
                      placeholder="Instruções específicas enviadas pelo dentista..."
                      value={formData.dentistNotes}
                      onChange={handleChange}
                      rows={2}
                      className={inputBaseStyle}
                    />
                  </div>
                </div>
              </div>

              {/* Detalhes do Procedimento */}
              <div className="border-t border-neutral-800/50 pt-8">
                <h2 className="text-sm font-black text-[#DEAE60] uppercase tracking-widest mb-4">Detalhes do Serviço</h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="procedure" className="text-xs font-bold text-neutral-400 uppercase">
                      Tipo de Procedimento *
                    </Label>
                    <Input
                      id="procedure"
                      name="procedure"
                      list="procedure-options"
                      placeholder="Digite para buscar ou criar um procedimento"
                      value={formData.procedure}
                      onChange={handleChange}
                      className={inputBaseStyle}
                    />
                    <datalist id="procedure-options">
                      <option value="Coroa Unitária" />
                      <option value="Ponte Fixa" />
                      <option value="Prótese Total" />
                      <option value="Prótese Parcial" />
                      <option value="Coroa sobre Implante" />
                      <option value="Placa de Bruxismo" />
                      <option value="Protocolo" />
                    </datalist>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-xs font-bold text-neutral-400 uppercase">
                      Descrição do Trabalho
                    </Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Descreva os materiais utilizados, etapas internas, etc."
                      value={formData.description}
                      onChange={handleChange}
                      rows={3}
                      className={inputBaseStyle}
                    />
                  </div>
                </div>
              </div>

              {/* Informações Financeiras */}
              <div className="border-t border-neutral-800/50 pt-8">
                <h2 className="text-sm font-black text-[#DEAE60] uppercase tracking-widest mb-4">Financeiro & Custos</h2>
                
                <div className="space-y-6">
                  {/* Valor Bruto */}
                  <div className="space-y-2 w-full md:w-1/2">
                    <Label htmlFor="grossValue" className="text-xs font-bold text-neutral-400 uppercase">
                      Valor Cobrado (Bruto - R$)
                    </Label>
                    <Input
                      id="grossValue"
                      name="grossValue"
                      type="number"
                      placeholder="0.00"
                      step="0.01"
                      value={formData.grossValue}
                      onChange={handleChange}
                      className={`${inputBaseStyle} text-[#DEAE60] font-bold text-lg`}
                    />
                  </div>

                  {/* Lista de Custos Dinâmicos */}
                  <div className="space-y-3 bg-neutral-950/50 p-4 rounded-xl border border-neutral-800/50">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-xs font-bold text-neutral-400 uppercase">Custos Operacionais</Label>
                      <Button
                        type="button"
                        onClick={handleAddCost}
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs text-[#DEAE60] hover:text-[#DEAE60] hover:bg-[#DEAE60]/10"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Novo Custo
                      </Button>
                    </div>

                    {formData.costs.map((cost) => (
                      <div key={cost.id} className="flex items-start gap-3">
                        <div className="flex-1 space-y-1">
                          <Input
                            placeholder="Refere-se a (ex: Motoboy, Resina)"
                            value={cost.name}
                            onChange={(e) => handleCostChange(cost.id, "name", e.target.value)}
                            className={`${inputBaseStyle} h-9 text-sm`}
                          />
                        </div>
                        <div className="w-1/3 space-y-1">
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Valor (R$)"
                            value={cost.value}
                            onChange={(e) => handleCostChange(cost.id, "value", e.target.value)}
                            className={`${inputBaseStyle} h-9 text-sm text-red-400`}
                          />
                        </div>
                        <Button
                          type="button"
                          onClick={() => handleRemoveCost(cost.id)}
                          variant="ghost"
                          className="h-9 w-9 p-0 text-neutral-500 hover:text-red-400 hover:bg-red-400/10 shrink-0"
                          disabled={formData.costs.length === 1}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Botões */}
              <div className="flex gap-4 pt-6 border-t border-neutral-800/50">
                <Button
                  type="button"
                  onClick={() => setLocation("/services")}
                  className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-lg px-8"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[#DEAE60] hover:bg-[#DEAE60]/90 text-neutral-950 font-black rounded-lg uppercase tracking-tight"
                >
                  {loading ? "Registrando..." : "Registrar Serviço"}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Sidebar - Resumo */}
        <div className="space-y-6">
          <Card className="bg-neutral-900/80 border-neutral-800 p-6 shadow-xl sticky top-6">
            <h3 className="font-bold text-white uppercase mb-6 flex items-center gap-2">
              <span className="w-2 h-2 bg-[#DEAE60] rounded-full"></span>
              Resumo Financeiro
            </h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-neutral-400 text-xs font-bold uppercase tracking-wider mb-1">Valor Bruto</p>
                <p className="text-2xl font-black text-white">
                  R$ {grossValue.toFixed(2).replace(".", ",")}
                </p>
              </div>
              
              <div className="border-t border-neutral-800/50 pt-4">
                <p className="text-neutral-400 text-xs font-bold uppercase tracking-wider mb-1">Custos Totais</p>
                <p className="text-xl font-bold text-red-400">
                  - R$ {totalOperationCost.toFixed(2).replace(".", ",")}
                </p>
                {formData.costs.some(c => c.name || c.value) && (
                  <div className="mt-2 space-y-1">
                    {formData.costs.map((cost, idx) => cost.name && (
                      <div key={idx} className="flex justify-between text-xs text-neutral-500">
                        <span>{cost.name}</span>
                        <span>R$ {(parseFloat(cost.value) || 0).toFixed(2).replace(".", ",")}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="border-t border-neutral-800 pt-4 bg-[#DEAE60]/10 p-4 rounded-xl mt-4">
                <p className="text-[#DEAE60]/80 text-xs font-bold uppercase tracking-wider mb-1">Lucro Líquido</p>
                <p className={`text-3xl font-black ${netProfit >= 0 ? "text-[#DEAE60]" : "text-red-400"}`}>
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

import { useState } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

interface ServiceFormData {
  patientName: string;
  patientPhone: string;
  dentistName: string;
  dentistPhone: string;
  procedure: string;
  description: string;
  grossValue: string;
  operationCost: string;
  status: string;
}

export default function NewService() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState<ServiceFormData>({
    patientName: "",
    patientPhone: "",
    dentistName: "",
    dentistPhone: "",
    procedure: "",
    description: "",
    grossValue: "",
    operationCost: "",
    status: "pending",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.patientName || !formData.dentistName || !formData.procedure) {
        toast.error("Preencha todos os campos obrigatórios");
        setLoading(false);
        return;
      }

      console.log("Serviço criado:", formData);
      toast.success("Serviço registrado com sucesso!");
      setLocation("/services");
    } catch (error) {
      toast.error("Erro ao registrar serviço");
    } finally {
      setLoading(false);
    }
  };

  const grossValue = parseFloat(formData.grossValue) || 0;
  const operationCost = parseFloat(formData.operationCost) || 0;
  const netProfit = grossValue - operationCost;

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
          <Card className="bg-neutral-900 border-neutral-800 p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Informações do Paciente */}
              <div>
                <h2 className="text-lg font-bold text-white uppercase mb-6">Informações do Paciente</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="patientName" className="font-medium text-neutral-300">
                      Nome do Paciente *
                    </Label>
                    <Input
                      id="patientName"
                      name="patientName"
                      placeholder="Ex: João Silva"
                      value={formData.patientName}
                      onChange={handleChange}
                      className="bg-neutral-800 border-neutral-700 text-white placeholder-neutral-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="patientPhone" className="font-medium text-neutral-300">
                      Telefone do Paciente
                    </Label>
                    <Input
                      id="patientPhone"
                      name="patientPhone"
                      placeholder="Ex: (11) 99999-9999"
                      value={formData.patientPhone}
                      onChange={handleChange}
                      className="bg-neutral-800 border-neutral-700 text-white placeholder-neutral-500"
                    />
                  </div>
                </div>
              </div>

              {/* Informações do Dentista */}
              <div className="border-t border-neutral-800 pt-8">
                <h2 className="text-lg font-bold text-white uppercase mb-6">Informações do Dentista</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="dentistName" className="font-medium text-neutral-300">
                      Nome do Dentista *
                    </Label>
                    <Input
                      id="dentistName"
                      name="dentistName"
                      placeholder="Ex: Dr. Carlos"
                      value={formData.dentistName}
                      onChange={handleChange}
                      className="bg-neutral-800 border-neutral-700 text-white placeholder-neutral-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dentistPhone" className="font-medium text-neutral-300">
                      Telefone do Dentista
                    </Label>
                    <Input
                      id="dentistPhone"
                      name="dentistPhone"
                      placeholder="Ex: (11) 98888-8888"
                      value={formData.dentistPhone}
                      onChange={handleChange}
                      className="bg-neutral-800 border-neutral-700 text-white placeholder-neutral-500"
                    />
                  </div>
                </div>
              </div>

              {/* Detalhes do Procedimento */}
              <div className="border-t border-neutral-800 pt-8">
                <h2 className="text-lg font-bold text-white uppercase mb-6">Detalhes do Procedimento</h2>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="procedure" className="font-medium text-neutral-300">
                      Tipo de Procedimento *
                    </Label>
                    <Select value={formData.procedure} onValueChange={(value) => handleSelectChange("procedure", value)}>
                      <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                        <SelectValue placeholder="Selecione o procedimento" />
                      </SelectTrigger>
                      <SelectContent className="bg-neutral-800 border-neutral-700">
                        <SelectItem value="coroa">Coroa Unitária</SelectItem>
                        <SelectItem value="ponte">Ponte Fixa</SelectItem>
                        <SelectItem value="protese-total">Prótese Total</SelectItem>
                        <SelectItem value="protese-parcial">Prótese Parcial</SelectItem>
                        <SelectItem value="implante">Coroa sobre Implante</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="font-medium text-neutral-300">
                      Descrição do Trabalho
                    </Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Descreva os detalhes do trabalho, materiais utilizados, etc."
                      value={formData.description}
                      onChange={handleChange}
                      rows={4}
                      className="bg-neutral-800 border-neutral-700 text-white placeholder-neutral-500"
                    />
                  </div>
                </div>
              </div>

              {/* Informações Financeiras */}
              <div className="border-t border-neutral-800 pt-8">
                <h2 className="text-lg font-bold text-white uppercase mb-6">Informações Financeiras</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="grossValue" className="font-medium text-neutral-300">
                      Valor Bruto (R$)
                    </Label>
                    <Input
                      id="grossValue"
                      name="grossValue"
                      type="number"
                      placeholder="0.00"
                      step="0.01"
                      value={formData.grossValue}
                      onChange={handleChange}
                      className="bg-neutral-800 border-neutral-700 text-white placeholder-neutral-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="operationCost" className="font-medium text-neutral-300">
                      Custo da Operação (R$)
                    </Label>
                    <Input
                      id="operationCost"
                      name="operationCost"
                      type="number"
                      placeholder="0.00"
                      step="0.01"
                      value={formData.operationCost}
                      onChange={handleChange}
                      className="bg-neutral-800 border-neutral-700 text-white placeholder-neutral-500"
                    />
                  </div>
                </div>
              </div>

              {/* Botões */}
              <div className="flex gap-4 pt-6 border-t border-neutral-800">
                <Button
                  type="button"
                  onClick={() => setLocation("/services")}
                  className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-lg"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-[#DEAE60] hover:bg-[#DEAE60]/90 text-neutral-950 font-bold rounded-lg"
                >
                  {loading ? "Registrando..." : "Registrar Serviço"}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Sidebar - Resumo */}
        <div className="space-y-6">
          <Card className="bg-neutral-900 border-neutral-800 p-6">
            <h3 className="font-bold text-white uppercase mb-6">📋 RESUMO FINANCEIRO</h3>
            <div className="space-y-4">
              <div>
                <p className="text-neutral-400 text-sm">Valor Bruto</p>
                <p className="text-2xl font-bold text-white">
                  R$ {grossValue.toFixed(2).replace(".", ",")}
                </p>
              </div>
              <div className="border-t border-neutral-800 pt-4">
                <p className="text-neutral-400 text-sm">Custo Operacional</p>
                <p className="text-2xl font-bold text-red-400">
                  -R$ {operationCost.toFixed(2).replace(".", ",")}
                </p>
              </div>
              <div className="border-t border-neutral-800 pt-4 bg-[#DEAE60]/10 p-4 rounded-lg">
                <p className="text-neutral-400 text-sm">Lucro Líquido</p>
                <p className={`text-2xl font-bold ${netProfit >= 0 ? "text-[#DEAE60]" : "text-red-400"}`}>
                  R$ {netProfit.toFixed(2).replace(".", ",")}
                </p>
              </div>
            </div>
          </Card>

          <Card className="bg-neutral-900 border-neutral-800 p-6">
            <h3 className="font-bold text-white uppercase mb-4">💡 DICAS</h3>
            <ul className="space-y-3 text-sm text-neutral-400">
              <li className="flex gap-2">
                <span className="text-[#DEAE60]">•</span>
                <span>Preencha todos os campos obrigatórios marcados com *</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[#DEAE60]">•</span>
                <span>O valor bruto é o preço cobrado do dentista</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[#DEAE60]">•</span>
                <span>O custo inclui motoboy, insumos e outros gastos</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[#DEAE60]">•</span>
                <span>O lucro líquido é calculado automaticamente</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

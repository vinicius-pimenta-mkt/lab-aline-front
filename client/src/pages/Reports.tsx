import { useState, useEffect } from "react";
import api from "../lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, CreditCard, PieChart as PieChartIcon } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { toast } from "sonner";

interface CompletedService {
  id: string;
  patient: string;
  dentist: string;
  procedure: string;
  grossValue: number;
  operationCost: number;
  netProfit: number;
  completedAt: string;
  forma_pagamento: string;
}

interface MonthlyData {
  month: string;
  revenue: number;
  cost: number;
  profit: number;
}

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [completedServices, setCompletedServices] = useState<CompletedService[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [costsDistribution, setCostsDistribution] = useState<{name: string, value: number}[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<{name: string, value: number}[]>([]);
  
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState("");

  const formatMonthLabel = (monthStr: string) => {
    if (!monthStr) return "";
    const [year, month] = monthStr.split('-');
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return `${months[parseInt(month) - 1]}/${year}`;
  };

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await api.get("/relatorios/completo");
        const data = response.data;

        setCompletedServices(data.completedServices);
        
        // Formata o mês para o gráfico de barras
        const formattedMonthlyData = data.monthlyData.map((d: any) => ({
          ...d,
          month: formatMonthLabel(d.month)
        }));
        setMonthlyData(formattedMonthlyData);
        
        setCostsDistribution(data.costsDistribution);
        setPaymentMethods(data.paymentMethods);

        setTotalRevenue(data.totals.revenue);
        setTotalCost(data.totals.cost);
        setTotalProfit(data.totals.profit);

      } catch (error) {
        console.error("Erro ao carregar relatórios", error);
        toast.error("Falha ao carregar os dados dos relatórios.");
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value || 0);
  };

  const profitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : "0";

  // Montando os dados da Pizza: O Lucro fica na frente com a cor verde, seguido de cada custo real registrado.
  const pieData = [
    { name: "Lucro Líquido", value: totalProfit, isProfit: true },
    ...costsDistribution.map(c => ({ name: c.name, value: c.value, isProfit: false }))
  ];

  // Cores: Verde vivo para lucro. Paleta de vermelhos, laranjas e amarelos para os custos
  const COST_COLORS = ["#EF4444", "#F97316", "#F59E0B", "#EAB308", "#F43F5E", "#FB923C", "#A8A29E"];

  if (loading) {
    return <div className="min-h-screen bg-neutral-950 p-6 text-white flex items-center justify-center">Analisando relatórios financeiros...</div>;
  }

  return (
    <div className="min-h-screen bg-neutral-950 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight">
            RELATÓRIOS & FLUXO DE CAIXA
          </h1>
          <p className="text-neutral-400 text-sm mt-2">Análise de serviços finalizados e rentabilidade</p>
        </div>
        <Button className="bg-[#DEAE60] hover:bg-[#DEAE60]/90 text-neutral-950 font-bold rounded-lg flex items-center gap-2">
          <Download className="w-4 h-4" />
          Exportar Relatório
        </Button>
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-neutral-900 border-neutral-800 p-6 shadow-xl">
          <p className="text-neutral-400 text-xs font-bold uppercase tracking-widest mb-2">Receita Total</p>
          <p className="text-3xl font-black text-blue-400">{formatCurrency(totalRevenue)}</p>
        </Card>
        <Card className="bg-neutral-900 border-neutral-800 p-6 shadow-xl">
          <p className="text-neutral-400 text-xs font-bold uppercase tracking-widest mb-2">Custo Operacional Total</p>
          <p className="text-3xl font-black text-red-400">{formatCurrency(totalCost)}</p>
        </Card>
        <Card className="bg-neutral-900 border-neutral-800 p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-[#DEAE60]/10 rounded-bl-full z-0" />
          <p className="text-neutral-400 text-xs font-bold uppercase tracking-widest mb-2 relative z-10">Lucro Líquido</p>
          <p className="text-3xl font-black text-[#DEAE60] relative z-10">{formatCurrency(totalProfit)}</p>
        </Card>
        <Card className="bg-neutral-900 border-neutral-800 p-6 shadow-xl">
          <p className="text-neutral-400 text-xs font-bold uppercase tracking-widest mb-2">Margem de Lucro</p>
          <p className="text-3xl font-black text-green-400">{profitMargin}%</p>
        </Card>
      </div>

      {/* Gráficos de Composição Financeira */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* Gráfico de Distribuição Real (Pizza) */}
        <Card className="bg-neutral-900 border-neutral-800 p-6 shadow-xl">
          <h2 className="text-sm font-black text-[#DEAE60] uppercase tracking-widest mb-6 flex items-center gap-2">
            <PieChartIcon className="w-5 h-5"/> Distribuição de Lucro e Custos Detalhados
          </h2>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={100}
                innerRadius={60}
                dataKey="value"
                stroke="#171717"
                strokeWidth={2}
              >
                {pieData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.isProfit ? "#22C55E" : COST_COLORS[(index - 1) % COST_COLORS.length]} 
                  />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => formatCurrency(value as number)}
                contentStyle={{ backgroundColor: "#171717", borderColor: "#262626", color: "#fff", borderRadius: "8px" }} 
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Gráfico de Formas de Pagamento (Barras Horizontais) */}
        <Card className="bg-neutral-900 border-neutral-800 p-6 shadow-xl">
          <h2 className="text-sm font-black text-[#DEAE60] uppercase tracking-widest mb-6 flex items-center gap-2">
            <CreditCard className="w-5 h-5"/> Receita por Forma de Pagamento
          </h2>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={paymentMethods} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" horizontal={true} vertical={false} />
              <XAxis type="number" stroke="#737373" tickFormatter={(value) => `R$ ${value / 1000}k`} />
              <YAxis dataKey="name" type="category" stroke="#a3a3a3" width={100} tick={{fontSize: 12, fontWeight: 'bold'}} />
              <Tooltip 
                formatter={(value) => formatCurrency(value as number)}
                contentStyle={{ backgroundColor: "#171717", borderColor: "#262626", color: "#fff", borderRadius: "8px" }} 
              />
              <Bar dataKey="value" fill="#DEAE60" radius={[0, 4, 4, 0]} barSize={32}>
                {paymentMethods.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.name === 'Pix' ? '#10B981' : entry.name.includes('Crédito') ? '#3B82F6' : '#DEAE60'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Gráfico de Histórico Mensal */}
      <Card className="bg-neutral-900 border-neutral-800 p-6 shadow-xl mb-8">
        <h2 className="text-sm font-black text-[#DEAE60] uppercase tracking-widest mb-6">Histórico Receita vs Custo (Anual)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
            <XAxis dataKey="month" stroke="#737373" tick={{fontSize: 12}} />
            <YAxis stroke="#737373" tickFormatter={(value) => `R$ ${value / 1000}k`} />
            <Tooltip
              contentStyle={{ backgroundColor: "#171717", border: "1px solid #262626", borderRadius: "8px", color: "#fff" }}
              formatter={(value) => formatCurrency(value as number)}
            />
            <Legend wrapperStyle={{ paddingTop: "20px" }}/>
            <Bar dataKey="revenue" fill="#3B82F6" name="Receita" radius={[4, 4, 0, 0]} />
            <Bar dataKey="cost" fill="#EF4444" name="Custo Operacional" radius={[4, 4, 0, 0]} />
            <Bar dataKey="profit" fill="#DEAE60" name="Lucro Líquido" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Tabela de Serviços Finalizados */}
      <Card className="bg-neutral-900 border-neutral-800 overflow-hidden shadow-xl">
        <div className="p-6 border-b border-neutral-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <h2 className="text-sm font-black text-[#DEAE60] uppercase tracking-widest">Extrato de Serviços Finalizados</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-950 border-b border-neutral-800">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider">Paciente</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider">Dentista</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider">Pagamento</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-neutral-500 uppercase tracking-wider">Valor Bruto</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-neutral-500 uppercase tracking-wider">Custo</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-neutral-500 uppercase tracking-wider">Lucro Líquido</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-neutral-500 uppercase tracking-wider">Finalizado em</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/50">
              {completedServices.map((service) => (
                <tr key={service.id} className="hover:bg-neutral-800/30 transition-colors bg-neutral-900/50">
                  <td className="px-6 py-4 text-sm font-bold text-white">{service.patient}</td>
                  <td className="px-6 py-4 text-sm text-neutral-400">{service.dentist}</td>
                  <td className="px-6 py-4 text-sm text-neutral-400">{service.forma_pagamento || "Não informado"}</td>
                  <td className="px-6 py-4 text-sm font-bold text-blue-400 text-right">{formatCurrency(service.grossValue)}</td>
                  <td className="px-6 py-4 text-sm font-bold text-red-400 text-right">-{formatCurrency(service.operationCost)}</td>
                  <td className="px-6 py-4 text-sm font-black text-[#DEAE60] text-right">{formatCurrency(service.netProfit)}</td>
                  <td className="px-6 py-4 text-sm text-neutral-500 text-right">
                    {service.completedAt ? new Date(service.completedAt + "T00:00:00").toLocaleDateString("pt-BR") : "--"}
                  </td>
                </tr>
              ))}
              {completedServices.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-neutral-500 text-sm">
                    Nenhum serviço finalizado registrado no banco de dados ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

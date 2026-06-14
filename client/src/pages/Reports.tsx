import { useState, useEffect } from "react";
import api from "../lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, CreditCard, PieChart as PieChartIcon, CalendarDays } from "lucide-react";
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
  const [periodFilter, setPeriodFilter] = useState("mes"); // Padrão: Mês
  
  const [completedServices, setCompletedServices] = useState<CompletedService[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [costsDistribution, setCostsDistribution] = useState<{name: string, value: number}[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<{name: string, value: number}[]>([]);
  
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);

  const formatMonthLabel = (monthStr: string) => {
    if (!monthStr) return "";
    const [year, month] = monthStr.split('-');
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return `${months[parseInt(month) - 1]}/${year}`;
  };

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        // Envia o período selecionado para a API
        const response = await api.get(`/relatorios/completo?periodo=${periodFilter}`);
        const data = response.data;

        setCompletedServices(data.completedServices);
        setMonthlyData(data.monthlyData.map((d: any) => ({ ...d, month: formatMonthLabel(d.month) })));
        setCostsDistribution(data.costsDistribution);
        setPaymentMethods(data.paymentMethods);
        setTotalRevenue(data.totals.revenue);
        setTotalCost(data.totals.cost);
        setTotalProfit(data.totals.profit);

      } catch (error) {
        toast.error("Falha ao carregar os dados dos relatórios.");
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [periodFilter]); // Recarrega sempre que o filtro mudar

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);
  };

  const profitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : "0";

  const pieData = [
    { name: "Lucro Líquido", value: totalProfit, isProfit: true },
    ...costsDistribution.map(c => ({ name: c.name, value: c.value, isProfit: false }))
  ];
  const COST_COLORS = ["#EF4444", "#F97316", "#F59E0B", "#EAB308", "#F43F5E", "#FB923C", "#A8A29E"];

  return (
    <div className="min-h-screen bg-neutral-950 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight">RELATÓRIOS & CAIXA</h1>
          <p className="text-neutral-400 text-sm mt-2">Análise de serviços finalizados e rentabilidade</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-lg p-1 pr-2">
            <div className="bg-neutral-800 p-2 rounded-md"><CalendarDays className="w-4 h-4 text-[#DEAE60]"/></div>
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="border-0 bg-transparent text-white focus:ring-0 w-36">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                <SelectItem value="hoje">Hoje</SelectItem>
                <SelectItem value="semana">Última Semana</SelectItem>
                <SelectItem value="quinzena">Últimos 15 Dias</SelectItem>
                <SelectItem value="mes">Último Mês</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="bg-[#DEAE60] hover:bg-[#DEAE60]/90 text-neutral-950 font-bold rounded-lg h-10">
            <Download className="w-4 h-4 mr-2" /> Exportar
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-[#DEAE60] font-bold">Carregando relatório do período...</div>
      ) : (
        <>
          {/* KPIs Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="bg-neutral-900 border-neutral-800 p-6 shadow-xl">
              <p className="text-neutral-400 text-xs font-bold uppercase tracking-widest mb-2">Receita Total</p>
              <p className="text-3xl font-black text-blue-400">{formatCurrency(totalRevenue)}</p>
            </Card>
            <Card className="bg-neutral-900 border-neutral-800 p-6 shadow-xl">
              <p className="text-neutral-400 text-xs font-bold uppercase tracking-widest mb-2">Custos Operacionais</p>
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
            <Card className="bg-neutral-900 border-neutral-800 p-6 shadow-xl">
              <h2 className="text-sm font-black text-[#DEAE60] uppercase tracking-widest mb-6 flex items-center gap-2">
                <PieChartIcon className="w-5 h-5"/> Distribuição de Lucro e Custos
              </h2>
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={pieData} cx="50%" cy="50%" labelLine={true}
                    label={({ name, percent }) => percent > 0 ? `${name} (${(percent * 100).toFixed(0)}%)` : ''}
                    outerRadius={100} innerRadius={60} dataKey="value" stroke="#171717" strokeWidth={2}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.isProfit ? "#22C55E" : COST_COLORS[(index - 1) % COST_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value as number)} contentStyle={{ backgroundColor: "#171717", borderColor: "#262626", color: "#fff", borderRadius: "8px" }} />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            <Card className="bg-neutral-900 border-neutral-800 p-6 shadow-xl">
              <h2 className="text-sm font-black text-[#DEAE60] uppercase tracking-widest mb-6 flex items-center gap-2">
                <CreditCard className="w-5 h-5"/> Receita por Forma de Pagamento
              </h2>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={paymentMethods} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" horizontal={true} vertical={false} />
                  <XAxis type="number" stroke="#737373" tickFormatter={(value) => `R$ ${value / 1000}k`} />
                  <YAxis dataKey="name" type="category" stroke="#a3a3a3" width={100} tick={{fontSize: 12, fontWeight: 'bold'}} />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} contentStyle={{ backgroundColor: "#171717", borderColor: "#262626", color: "#fff", borderRadius: "8px" }} />
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
            <h2 className="text-sm font-black text-[#DEAE60] uppercase tracking-widest mb-6">Histórico Receita vs Custo (Últimos 12 Meses)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis dataKey="month" stroke="#737373" tick={{fontSize: 12}} />
                <YAxis stroke="#737373" tickFormatter={(value) => `R$ ${value / 1000}k`} />
                <Tooltip contentStyle={{ backgroundColor: "#171717", border: "1px solid #262626", borderRadius: "8px", color: "#fff" }} formatter={(value) => formatCurrency(value as number)} />
                <Legend wrapperStyle={{ paddingTop: "20px" }}/>
                <Bar dataKey="revenue" fill="#3B82F6" name="Receita" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cost" fill="#EF4444" name="Custo Operacional" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" fill="#DEAE60" name="Lucro Líquido" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Tabela de Serviços Finalizados */}
          <Card className="bg-neutral-900 border-neutral-800 overflow-hidden shadow-xl">
            <div className="p-6 border-b border-neutral-800">
              <h2 className="text-sm font-black text-[#DEAE60] uppercase tracking-widest">Extrato do Período Selecionado</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-950 border-b border-neutral-800">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase">Paciente</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase">Dentista</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase">Pagamento</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-neutral-500 uppercase">Valor Bruto</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-neutral-500 uppercase">Custo</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-neutral-500 uppercase">Lucro Líquido</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-neutral-500 uppercase">Finalizado em</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/50">
                  {completedServices.map((service) => (
                    <tr key={service.id} className="hover:bg-neutral-800/30 bg-neutral-900/50">
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
                        Nenhum serviço finalizado neste período.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

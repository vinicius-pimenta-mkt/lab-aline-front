import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface CompletedService {
  id: string;
  patient: string;
  dentist: string;
  procedure: string;
  grossValue: number;
  operationCost: number;
  netProfit: number;
  completedAt: string;
}

interface MonthlyData {
  month: string;
  revenue: number;
  cost: number;
  profit: number;
}

export default function Reports() {
  const [completedServices, setCompletedServices] = useState<CompletedService[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [selectedMonth, setSelectedMonth] = useState("2024-06");
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);

  useEffect(() => {
    const mockCompletedServices: CompletedService[] = [
      {
        id: "1",
        patient: "Maria Santos",
        dentist: "Dra. Ana",
        procedure: "Coroa Unitária",
        grossValue: 450,
        operationCost: 120,
        netProfit: 330,
        completedAt: "2024-06-06",
      },
      {
        id: "2",
        patient: "Lucas Ferreira",
        dentist: "Dr. Roberto",
        procedure: "Prótese Parcial",
        grossValue: 950,
        operationCost: 280,
        netProfit: 670,
        completedAt: "2024-06-04",
      },
      {
        id: "3",
        patient: "Carla Mendes",
        dentist: "Dra. Beatriz",
        procedure: "Ponte Fixa",
        grossValue: 800,
        operationCost: 250,
        netProfit: 550,
        completedAt: "2024-06-03",
      },
      {
        id: "4",
        patient: "Ricardo Alves",
        dentist: "Dr. Felipe",
        procedure: "Coroa sobre Implante",
        grossValue: 600,
        operationCost: 180,
        netProfit: 420,
        completedAt: "2024-06-02",
      },
      {
        id: "5",
        patient: "Juliana Costa",
        dentist: "Dr. Carlos",
        procedure: "Prótese Total",
        grossValue: 1200,
        operationCost: 350,
        netProfit: 850,
        completedAt: "2024-06-01",
      },
    ];

    const mockMonthlyData: MonthlyData[] = [
      { month: "Janeiro", revenue: 8500, cost: 2400, profit: 6100 },
      { month: "Fevereiro", revenue: 9200, cost: 2600, profit: 6600 },
      { month: "Março", revenue: 8800, cost: 2500, profit: 6300 },
      { month: "Abril", revenue: 10200, cost: 2900, profit: 7300 },
      { month: "Maio", revenue: 9800, cost: 2800, profit: 7000 },
      { month: "Junho", revenue: 5000, cost: 1400, profit: 3600 },
    ];

    setCompletedServices(mockCompletedServices);
    setMonthlyData(mockMonthlyData);

    const total = mockCompletedServices.reduce(
      (acc, service) => ({
        revenue: acc.revenue + service.grossValue,
        cost: acc.cost + service.operationCost,
        profit: acc.profit + service.netProfit,
      }),
      { revenue: 0, cost: 0, profit: 0 }
    );

    setTotalRevenue(total.revenue);
    setTotalCost(total.cost);
    setTotalProfit(total.profit);
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const profitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : "0";

  const pieData = [
    { name: "Lucro", value: totalProfit },
    { name: "Custo", value: totalCost },
  ];

  const COLORS = ["#DEAE60", "#EF4444"];

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

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-neutral-900 border-neutral-800 p-6">
          <p className="text-neutral-400 text-xs font-bold uppercase tracking-widest mb-2">Receita Total</p>
          <p className="text-3xl font-black text-blue-400">{formatCurrency(totalRevenue)}</p>
        </Card>
        <Card className="bg-neutral-900 border-neutral-800 p-6">
          <p className="text-neutral-400 text-xs font-bold uppercase tracking-widest mb-2">Custo Total</p>
          <p className="text-3xl font-black text-red-400">{formatCurrency(totalCost)}</p>
        </Card>
        <Card className="bg-neutral-900 border-neutral-800 p-6">
          <p className="text-neutral-400 text-xs font-bold uppercase tracking-widest mb-2">Lucro Líquido</p>
          <p className="text-3xl font-black text-[#DEAE60]">{formatCurrency(totalProfit)}</p>
        </Card>
        <Card className="bg-neutral-900 border-neutral-800 p-6">
          <p className="text-neutral-400 text-xs font-bold uppercase tracking-widest mb-2">Margem de Lucro</p>
          <p className="text-3xl font-black text-green-400">{profitMargin}%</p>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Gráfico de Barras */}
        <Card className="lg:col-span-2 bg-neutral-900 border-neutral-800 p-6">
          <h2 className="text-lg font-bold text-white uppercase mb-6">Receita vs Custo (Mensal)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
              <XAxis dataKey="month" stroke="#737373" />
              <YAxis stroke="#737373" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#262626",
                  border: "1px solid #404040",
                  borderRadius: "0.5rem",
                  color: "#fff",
                }}
                formatter={(value) => formatCurrency(value as number)}
              />
              <Legend />
              <Bar dataKey="revenue" fill="#3B82F6" name="Receita" radius={[8, 8, 0, 0]} />
              <Bar dataKey="cost" fill="#EF4444" name="Custo" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Gráfico de Pizza */}
        <Card className="bg-neutral-900 border-neutral-800 p-6">
          <h2 className="text-lg font-bold text-white uppercase mb-6">Distribuição</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Tabela de Serviços Finalizados */}
      <Card className="bg-neutral-900 border-neutral-800 overflow-hidden">
        <div className="p-6 border-b border-neutral-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white uppercase">Serviços Finalizados</h2>
          <Input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-40 bg-neutral-800 border-neutral-700 text-white"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-800 border-b border-neutral-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold text-neutral-300 uppercase">Paciente</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-neutral-300 uppercase">Dentista</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-neutral-300 uppercase">Procedimento</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-neutral-300 uppercase">Valor Bruto</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-neutral-300 uppercase">Custo</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-neutral-300 uppercase">Lucro Líquido</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-neutral-300 uppercase">Data</th>
              </tr>
            </thead>
            <tbody>
              {completedServices.map((service, idx) => (
                <tr
                  key={service.id}
                  className={`border-b border-neutral-800 hover:bg-neutral-800/50 transition-colors ${
                    idx % 2 === 0 ? "bg-neutral-900" : "bg-neutral-800/30"
                  }`}
                >
                  <td className="px-6 py-4 text-sm font-bold text-white">{service.patient}</td>
                  <td className="px-6 py-4 text-sm text-neutral-300">{service.dentist}</td>
                  <td className="px-6 py-4 text-sm text-neutral-300">{service.procedure}</td>
                  <td className="px-6 py-4 text-sm font-bold text-blue-400 text-right">
                    {formatCurrency(service.grossValue)}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-red-400 text-right">
                    -{formatCurrency(service.operationCost)}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-[#DEAE60] text-right">
                    {formatCurrency(service.netProfit)}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-300">{service.completedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

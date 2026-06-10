import { Users, DollarSign, CheckCircle, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function Dashboard() {
  const [, setLocation] = useLocation();

  // Dados simulados - será integrado com backend
  const kpis = [
    {
      title: "SERVIÇOS EM ANDAMENTO",
      value: "12",
      icon: Clock,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "RECEITA DO MÊS",
      value: "R$ 8.450,00",
      icon: DollarSign,
      color: "text-green-400",
      bgColor: "bg-green-500/10",
    },
    {
      title: "FINALIZADOS",
      value: "28",
      icon: CheckCircle,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
    },
    {
      title: "LUCRO LÍQUIDO",
      value: "R$ 3.120,50",
      icon: DollarSign,
      color: "text-[#DEAE60]",
      bgColor: "bg-[#DEAE60]/10",
    },
  ];

  const recentServices = [
    {
      id: 1,
      patient: "João Silva",
      dentist: "Dr. Carlos",
      procedure: "Coroa Dentária",
      time: "14:30",
      status: "Em Andamento",
      statusColor: "bg-blue-500/20 text-blue-300",
    },
    {
      id: 2,
      patient: "Maria Santos",
      dentist: "Dra. Ana",
      procedure: "Prótese Parcial",
      time: "15:45",
      status: "Pendente",
      statusColor: "bg-amber-500/20 text-amber-300",
    },
    {
      id: 3,
      patient: "Pedro Costa",
      dentist: "Dr. Fernando",
      procedure: "Implante",
      time: "16:00",
      status: "Pendente",
      statusColor: "bg-amber-500/20 text-amber-300",
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white uppercase tracking-tight">
          PAINEL DE CONTROLE
        </h1>
        <p className="text-neutral-400 text-sm mt-2">
          Gestão Geral | {new Date().toLocaleDateString("pt-BR")}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((kpi, idx) => (
          <Card key={idx} className="bg-neutral-900 border-neutral-800 p-6 relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-20 h-20 ${kpi.bgColor} rounded-full blur-2xl`} />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
                  {kpi.title}
                </p>
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
              <p className="text-3xl font-black text-white">{kpi.value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Próximos Serviços */}
        <div className="lg:col-span-2">
          <Card className="bg-neutral-900 border-neutral-800 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-white uppercase">PRÓXIMOS SERVIÇOS</h2>
              <Button
                onClick={() => setLocation("/services")}
                className="bg-[#DEAE60] hover:bg-[#DEAE60]/90 text-neutral-950 font-bold text-xs px-4 py-2 rounded-lg"
              >
                Ver Todos
              </Button>
            </div>

            <div className="space-y-4">
              {recentServices.map((service) => (
                <div
                  key={service.id}
                  className="flex items-start justify-between p-4 bg-neutral-800/50 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
                  onClick={() => setLocation(`/services/${service.id}`)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-[#DEAE60]/20 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-[#DEAE60]">
                          {service.patient.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm">{service.patient}</p>
                        <p className="text-xs text-neutral-400">{service.dentist}</p>
                      </div>
                    </div>
                    <p className="text-sm text-neutral-300 ml-11">{service.procedure}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-white text-sm">{service.time}</p>
                    <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full mt-2 ${service.statusColor}`}>
                      {service.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <Card className="bg-neutral-900 border-neutral-800 p-6">
            <h2 className="text-xl font-black text-white uppercase mb-6">AÇÕES RÁPIDAS</h2>
            <div className="space-y-3">
              <Button
                onClick={() => setLocation("/services/new")}
                className="w-full bg-[#DEAE60] hover:bg-[#DEAE60]/90 text-neutral-950 font-bold rounded-lg py-6 text-sm"
              >
                + Novo Serviço
              </Button>
              <Button
                onClick={() => setLocation("/services")}
                className="w-full bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-lg py-6 text-sm"
              >
                Ver Serviços
              </Button>
              <Button
                onClick={() => setLocation("/reports")}
                className="w-full bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-lg py-6 text-sm"
              >
                Relatórios
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

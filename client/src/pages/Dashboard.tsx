import { Users, DollarSign, CheckCircle, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import api from "../lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function Dashboard() {
  const [, setLocation] = useLocation();

  const [kpis, setKpis] = useState([
    {
      title: "SERVIÇOS EM ANDAMENTO",
      value: "0",
      icon: Clock,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "RECEITA (ÚLT. 30 DIAS)",
      value: "R$ 0,00",
      icon: DollarSign,
      color: "text-green-400",
      bgColor: "bg-green-500/10",
    },
    {
      title: "FINALIZADOS (ÚLT. 30 DIAS)",
      value: "0",
      icon: CheckCircle,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
    },
    {
      title: "LUCRO (ÚLT. 30 DIAS)",
      value: "R$ 0,00",
      icon: DollarSign,
      color: "text-[#DEAE60]",
      bgColor: "bg-[#DEAE60]/10",
    },
  ]);
  
  const [upcomingServices, setUpcomingServices] = useState<any[]>([]);
  const [completedServices, setCompletedServices] = useState<any[]>([]);

  // Função auxiliar para formatar datas sem erro de fuso horário
  const formatDate = (dateString: string) => {
    if (!dateString) return "--/--/----";
    try {
      const d = new Date(dateString.includes("T") ? dateString : dateString + "T00:00:00");
      return d.toLocaleDateString("pt-BR");
    } catch (e) {
      return dateString;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Busca o resumo forçando o período de 1 mês (30 dias)
        const resumoResponse = await api.get("/relatorios/resumo?periodo=mes");
        const totais = resumoResponse.data?.totais || {};

        // Busca a lista geral de trabalhos
        const trabalhosResponse = await api.get("/trabalhos");
        const allWorks = trabalhosResponse.data || [];

        // Calcula quantos serviços estão abertos no momento
        const andamentoCount = allWorks.filter((t: any) => t.status === "Em Andamento" || t.status === "Pendente").length;

        // Atualiza os KPIs com as proteções anti-erro (|| 0)
        setKpis([
          {
            title: "SERVIÇOS EM ANDAMENTO",
            value: andamentoCount.toString(),
            icon: Clock,
            color: "text-blue-400",
            bgColor: "bg-blue-500/10",
          },
          {
            title: "RECEITA (ÚLT. 30 DIAS)",
            value: `R$ ${(totais.receita || 0).toFixed(2).replace(".", ",")}`,
            icon: DollarSign,
            color: "text-green-400",
            bgColor: "bg-green-500/10",
          },
          {
            title: "FINALIZADOS (ÚLT. 30 DIAS)",
            value: (totais.quantidade || 0).toString(),
            icon: CheckCircle,
            color: "text-emerald-400",
            bgColor: "bg-emerald-500/10",
          },
          {
            title: "LUCRO (ÚLT. 30 DIAS)",
            value: `R$ ${(totais.lucro || 0).toFixed(2).replace(".", ",")}`,
            icon: DollarSign,
            color: "text-[#DEAE60]",
            bgColor: "bg-[#DEAE60]/10",
          },
        ]);

        // Formata os serviços para a listagem
        const formatService = (t: any) => ({
          id: t.id,
          patient: t.paciente_nome || "Sem Nome",
          dentist: t.dentista_nome || "Sem Dentista",
          procedure: t.procedimento,
          // Se for finalizado mostra a data de saída. Se for pendente, mostra prazo_entrega
          time: formatDate(t.status === "Finalizado" ? (t.data_saida || t.data_entrada) : (t.prazo_entrega || t.data_entrada)),
          status: t.status || "Pendente",
          statusColor: t.status === "Em Andamento" ? "bg-blue-500/20 text-blue-300" :
                       t.status === "Pendente" ? "bg-amber-500/20 text-amber-300" :
                       t.status === "Finalizado" ? "bg-green-500/20 text-green-300" :
                       "bg-red-500/20 text-red-300",
        });

        // Filtra os próximos serviços (apenas abertos)
        const upcoming = allWorks
          .filter((t: any) => t.status !== "Finalizado")
          .slice(0, 3)
          .map(formatService);

        // Filtra os serviços finalizados (últimos concluídos)
        const completed = allWorks
          .filter((t: any) => t.status === "Finalizado")
          .slice(0, 3)
          .map(formatService);

        setUpcomingServices(upcoming);
        setCompletedServices(completed);

      } catch (error) {
        console.error("Erro ao buscar dados do dashboard:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-transparent p-6">
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
          <Card key={idx} className="bg-neutral-900 border-neutral-800 p-6 relative overflow-hidden shadow-xl">
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
        
        {/* Listagens de Serviços */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card: Próximos Serviços (Pendentes) */}
          <Card className="bg-neutral-900 border-neutral-800 p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-white uppercase">PRÓXIMOS SERVIÇOS (PRAZOS)</h2>
              <Button
                onClick={() => setLocation("/services")}
                className="bg-[#DEAE60] hover:bg-[#DEAE60]/90 text-neutral-950 font-bold text-xs px-4 py-2 rounded-lg"
              >
                Ver Todos
              </Button>
            </div>

            <div className="space-y-4">
              {upcomingServices.map((service) => (
                <div
                  key={service.id}
                  className="flex items-start justify-between p-4 bg-neutral-800/50 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
                  onClick={() => setLocation(`/services/${service.id}`)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-[#DEAE60]/20 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-[#DEAE60]">
                          {service.patient.charAt(0).toUpperCase()}
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
              {upcomingServices.length === 0 && (
                <p className="text-neutral-500 text-sm text-center py-4">Nenhum serviço pendente no momento.</p>
              )}
            </div>
          </Card>

          {/* NOVO Card: Serviços Finalizados */}
          <Card className="bg-neutral-900 border-neutral-800 p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-white uppercase">ÚLTIMOS SERVIÇOS FINALIZADOS</h2>
            </div>

            <div className="space-y-4">
              {completedServices.map((service) => (
                <div
                  key={service.id}
                  className="flex items-start justify-between p-4 bg-neutral-800/50 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
                  onClick={() => setLocation(`/services/${service.id}`)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-green-400" />
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
              {completedServices.length === 0 && (
                <p className="text-neutral-500 text-sm text-center py-4">Nenhum serviço finalizado recentemente.</p>
              )}
            </div>
          </Card>

        </div>

        {/* Quick Actions */}
        <div>
          <Card className="bg-neutral-900 border-neutral-800 p-6 shadow-xl sticky top-6">
            <h2 className="text-xl font-black text-white uppercase mb-6">AÇÕES RÁPIDAS</h2>
            <div className="space-y-3">
              <Button
                onClick={() => setLocation("/services/new")}
                className="w-full bg-[#DEAE60] hover:bg-[#DEAE60]/90 text-neutral-950 font-bold rounded-lg py-6 text-sm shadow-md"
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

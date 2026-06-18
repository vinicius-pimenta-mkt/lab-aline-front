import { useState, useEffect } from "react";
import api from "../lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Users, Plus, Printer, CalendarDays, Activity, Syringe, Clock, X, ArrowLeft } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useLocation } from "wouter";

interface TsbPatient {
  id: number;
  nome: string;
  telefone: string;
  procedimento: string;
  recorrencia_meses: number;
  data_inicio: string;
  ultimo_atendimento: string;
  proximo_atendimento: string;
}

export default function TsbDashboard() {
  const [, setLocation] = useLocation();
  const [patients, setPatients] = useState<TsbPatient[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Controles
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [periodFilter, setPeriodFilter] = useState("30"); // 7, 15, 30
  
  const [formData, setFormData] = useState({
    nome: "", telefone: "", procedimento: "Limpeza (TSB)", recorrencia_meses: "4", data_inicio: new Date().toISOString().split('T')[0], ultimo_atendimento: new Date().toISOString().split('T')[0], proximo_atendimento: ""
  });

  useEffect(() => { fetchData(); }, []);

  // AUTO-CÁLCULO DO PRÓXIMO ATENDIMENTO
  useEffect(() => {
    if (formData.ultimo_atendimento && formData.recorrencia_meses) {
      const date = new Date(formData.ultimo_atendimento + 'T00:00:00');
      date.setMonth(date.getMonth() + parseInt(formData.recorrencia_meses));
      setFormData(prev => ({ ...prev, proximo_atendimento: date.toISOString().split('T')[0] }));
    }
  }, [formData.ultimo_atendimento, formData.recorrencia_meses]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/tsb");
      setPatients(res.data || []);
    } catch (error) {
      toast.error("Erro ao carregar dados do TSB.");
    } finally { setLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/tsb", { ...formData, recorrencia_meses: parseInt(formData.recorrencia_meses) });
      toast.success("Paciente cadastrado com sucesso!");
      setIsModalOpen(false);
      fetchData();
    } catch (error) { toast.error("Erro ao cadastrar."); }
  };

  // ================= CÁLCULOS DO DASHBOARD =================
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const thirtyDaysAgo = new Date(today); thirtyDaysAgo.setDate(today.getDate() - 30);
  const thirtyDaysFuture = new Date(today); thirtyDaysFuture.setDate(today.getDate() + 30);

  const doneLast30 = patients.filter(p => new Date(p.ultimo_atendimento + 'T00:00:00') >= thirtyDaysAgo).length;
  
  const futureAppointments = patients.filter(p => new Date(p.proximo_atendimento + 'T00:00:00') >= today);
  const next30 = futureAppointments.filter(p => new Date(p.proximo_atendimento + 'T00:00:00') <= thirtyDaysFuture).length;
  
  const next10Patients = [...futureAppointments].sort((a,b) => new Date(a.proximo_atendimento).getTime() - new Date(b.proximo_atendimento).getTime()).slice(0, 10);
  const nextDateStr = next10Patients.length > 0 ? new Date(next10Patients[0].proximo_atendimento + 'T00:00:00').toLocaleDateString('pt-BR') : "--";

  // Filtro de Recentes (Gráfico e Tabela)
  const recentLimitDate = new Date(today);
  recentLimitDate.setDate(today.getDate() - parseInt(periodFilter));
  
  const recentPatients = patients.filter(p => new Date(p.ultimo_atendimento + 'T00:00:00') >= recentLimitDate)
    .sort((a,b) => new Date(b.ultimo_atendimento).getTime() - new Date(a.ultimo_atendimento).getTime());

  // Dados do Gráfico
  const chartData = recentPatients.reduce((acc: any[], p) => {
    const dateStr = new Date(p.ultimo_atendimento + 'T00:00:00').toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'});
    const existing = acc.find(item => item.data === dateStr);
    if (existing) existing.atendimentos += 1;
    else acc.push({ data: dateStr, atendimentos: 1 });
    return acc;
  }, []).reverse();

  // ================= EXPORTAR PDF =================
  const exportarRelatorioTSB = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return toast.error("Permita pop-ups.");

    let rowsHtml = '';
    recentPatients.forEach((p, idx) => {
      rowsHtml += `
        <tr>
          <td class="center">${String(idx + 1).padStart(2, '0')}</td>
          <td>${new Date(p.ultimo_atendimento + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
          <td><strong>${p.nome.toUpperCase()}</strong></td>
          <td>${p.telefone || '-'}</td>
          <td>${p.procedimento}</td>
          <td class="center text-teal">${new Date(p.proximo_atendimento + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
        </tr>
      `;
    });

    const htmlContent = `
      <!DOCTYPE html><html><head><title>Relatorio_TSB_Aline</title>
        <style>
          @page { margin: 15mm; size: A4 portrait; }
          body { font-family: Arial, sans-serif; color: #000; font-size: 12px; line-height: 1.5; padding: 10px; }
          .header { border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; color: #0f766e; }
          .header h1 { font-size: 18px; margin: 0 0 5px 0; font-weight: black; text-transform: uppercase; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 8px; text-align: left; font-size: 11px; }
          td { padding: 8px; border-bottom: 1px dashed #ccc; font-size: 11px; }
          .center { text-align: center; } .text-teal { color: #0f766e; font-weight: bold; }
        </style>
      </head><body>
        <div class="header"><h1>ALINE ANTUNES - CLINIC TSB</h1><p>Relatório de Atendimentos (Últimos ${periodFilter} dias)</p></div>
        <table><thead><tr><th class="center">#</th><th>Data Atend.</th><th>Paciente</th><th>Contato</th><th>Procedimento</th><th class="center">Próximo Agendamento</th></tr></thead>
        <tbody>${rowsHtml || '<tr><td colspan="6" class="center">Nenhum atendimento no período.</td></tr>'}</tbody></table>
      </body></html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
  };

  const inputStyle = "bg-neutral-900 border-neutral-800 text-white focus-visible:ring-teal-500/50";

  if (loading) return <div className="min-h-screen bg-neutral-950 p-6 text-teal-500 text-center py-20 font-bold">Carregando Clinic TSB...</div>;

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-4 md:p-8 font-sans">
      
      {/* MODAL DE CADASTRO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-950 border border-teal-900/50 p-6 rounded-2xl w-full max-w-lg shadow-2xl relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-neutral-500 hover:text-white"><X className="w-5 h-5"/></button>
            <h3 className="text-xl font-black text-teal-400 uppercase mb-6 flex items-center gap-2"><Syringe className="w-5 h-5"/> Registrar Paciente</h3>
            
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2"><Label className="text-teal-500/80 uppercase text-xs font-bold">Nome do Paciente *</Label><Input required value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} className={inputStyle} /></div>
              <div className="space-y-2"><Label className="text-teal-500/80 uppercase text-xs font-bold">Telefone</Label><Input value={formData.telefone} onChange={e => setFormData({...formData, telefone: e.target.value})} className={inputStyle} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label className="text-teal-500/80 uppercase text-xs font-bold">Procedimento</Label><Input value={formData.procedimento} onChange={e => setFormData({...formData, procedimento: e.target.value})} className={inputStyle} /></div>
                <div className="space-y-2"><Label className="text-teal-500/80 uppercase text-xs font-bold">Recorrência (Meses)</Label><Input type="number" required value={formData.recorrencia_meses} onChange={e => setFormData({...formData, recorrencia_meses: e.target.value})} className={inputStyle} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label className="text-teal-500/80 uppercase text-xs font-bold">Data Atendimento *</Label><Input type="date" required value={formData.ultimo_atendimento} onChange={e => setFormData({...formData, ultimo_atendimento: e.target.value})} className={inputStyle} /></div>
                <div className="space-y-2"><Label className="text-teal-500/80 uppercase text-xs font-bold">Próximo Agendado</Label><Input type="date" readOnly value={formData.proximo_atendimento} className={`${inputStyle} text-teal-400 font-bold bg-neutral-900/50`} /></div>
              </div>
              <Button type="submit" className="w-full bg-teal-500 hover:bg-teal-600 text-neutral-950 font-black mt-4">Salvar Cadastro</Button>
            </form>
          </div>
        </div>
      )}

      {/* HEADER DO MICRO-SISTEMA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-neutral-800 pb-6">
        <div>
          <h1 className="text-3xl font-black text-teal-400 uppercase tracking-tighter flex items-center gap-3">
            <Activity className="w-8 h-8"/> ALINE ANTUNES - CLINIC TSB
          </h1>
          <p className="text-neutral-400 text-sm mt-1">Gestão de Profilaxia e Recorrência de Pacientes</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Button variant="outline" onClick={() => setLocation("/dashboard")} className="border-neutral-700 hover:bg-neutral-800"><ArrowLeft className="w-4 h-4 mr-2"/> Laboratório</Button>
          <Button onClick={() => setIsModalOpen(true)} className="bg-teal-500 hover:bg-teal-600 text-neutral-950 font-bold"><Plus className="w-4 h-4 mr-2"/> Novo Paciente</Button>
        </div>
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-neutral-900/50 border-teal-900/30 p-6">
          <p className="text-teal-500/70 text-xs font-bold uppercase mb-2">Feitos (Últimos 30 dias)</p>
          <p className="text-4xl font-black text-white">{doneLast30}</p>
        </Card>
        <Card className="bg-neutral-900/50 border-teal-900/30 p-6">
          <p className="text-teal-500/70 text-xs font-bold uppercase mb-2">Previstos (Próx 30 dias)</p>
          <p className="text-4xl font-black text-teal-400">{next30}</p>
        </Card>
        <Card className="bg-neutral-900/50 border-teal-900/30 p-6 relative overflow-hidden">
          <Clock className="absolute -right-4 -bottom-4 w-24 h-24 text-teal-500/10"/>
          <p className="text-teal-500/70 text-xs font-bold uppercase mb-2 relative z-10">Data Próx. Atendimento</p>
          <p className="text-2xl font-black text-white relative z-10 mt-2">{nextDateStr}</p>
        </Card>
      </div>

      {/* PRÓXIMOS 10 ATENDIMENTOS */}
      <Card className="bg-neutral-900 border-neutral-800 mb-10 overflow-hidden">
        <div className="p-5 border-b border-neutral-800 bg-neutral-950/30"><h2 className="font-black text-white uppercase tracking-wider text-sm flex items-center gap-2"><CalendarDays className="w-4 h-4 text-teal-500"/> Próximos 10 Agendamentos (Fila)</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-neutral-950/80"><tr><th className="p-4 text-xs text-neutral-500 uppercase">Data Limite</th><th className="p-4 text-xs text-neutral-500 uppercase">Paciente</th><th className="p-4 text-xs text-neutral-500 uppercase">Contato</th><th className="p-4 text-xs text-neutral-500 uppercase">Recorrência</th></tr></thead>
            <tbody className="divide-y divide-neutral-800/50">
              {next10Patients.map(p => (
                <tr key={p.id} className="hover:bg-neutral-800/20">
                  <td className="p-4 font-black text-teal-400">{new Date(p.proximo_atendimento + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                  <td className="p-4 font-bold">{p.nome}</td>
                  <td className="p-4 text-neutral-400">{p.telefone || '-'}</td>
                  <td className="p-4 text-neutral-400">{p.recorrencia_meses} Meses</td>
                </tr>
              ))}
              {next10Patients.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-neutral-500">Nenhum paciente agendado para o futuro.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      {/* GRÁFICO E TABELA DE RECENTES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        <Card className="bg-neutral-900 border-neutral-800 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-black text-white uppercase text-sm">Histórico (Atendidos)</h2>
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="w-32 bg-neutral-950 border-neutral-800 h-8 text-xs"><SelectValue/></SelectTrigger>
              <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                <SelectItem value="7">Últimos 7 dias</SelectItem><SelectItem value="15">Últimos 15 dias</SelectItem><SelectItem value="30">Últimos 30 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis dataKey="data" stroke="#737373" tick={{fontSize: 10}} />
                <YAxis stroke="#737373" tick={{fontSize: 10}} allowDecimals={false} />
                <Tooltip cursor={{fill: '#262626'}} contentStyle={{ backgroundColor: "#171717", border: "1px solid #262626", borderRadius: "8px" }} />
                <Bar dataKey="atendimentos" fill="#14b8a6" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800 overflow-hidden flex flex-col">
          <div className="p-5 border-b border-neutral-800 flex justify-between items-center bg-neutral-950/30">
            <h2 className="font-black text-white uppercase text-sm">Listagem do Período</h2>
            <Button onClick={exportarRelatorioTSB} size="sm" className="h-8 bg-neutral-800 hover:bg-neutral-700 text-teal-400"><Printer className="w-3 h-3 mr-2"/> Exportar PDF</Button>
          </div>
          <div className="overflow-y-auto flex-1 h-64 custom-scrollbar">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-950/80 sticky top-0"><tr><th className="p-3 text-neutral-500 uppercase">Data</th><th className="p-3 text-neutral-500 uppercase">Paciente</th><th className="p-3 text-neutral-500 uppercase">Retorno</th></tr></thead>
              <tbody className="divide-y divide-neutral-800/50">
                {recentPatients.map(p => (
                  <tr key={p.id} className="hover:bg-neutral-800/20">
                    <td className="p-3 text-neutral-400">{new Date(p.ultimo_atendimento + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                    <td className="p-3 font-bold">{p.nome}</td>
                    <td className="p-3 font-bold text-teal-500/70">{new Date(p.proximo_atendimento + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* TODOS OS PACIENTES CADASTRADOS */}
      <Card className="bg-neutral-900 border-neutral-800 overflow-hidden">
        <div className="p-5 border-b border-neutral-800 bg-neutral-950/30"><h2 className="font-black text-white uppercase text-sm flex items-center gap-2"><Users className="w-4 h-4 text-teal-500"/> Banco Geral de Pacientes TSB ({patients.length})</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-neutral-950/80"><tr><th className="p-4 text-xs text-neutral-500 uppercase">ID</th><th className="p-4 text-xs text-neutral-500 uppercase">Nome</th><th className="p-4 text-xs text-neutral-500 uppercase">Procedimento</th><th className="p-4 text-xs text-neutral-500 uppercase text-right">Último Feito</th></tr></thead>
            <tbody className="divide-y divide-neutral-800/50">
              {patients.map(p => (
                <tr key={p.id} className="hover:bg-neutral-800/20">
                  <td className="p-4 text-neutral-500">#{p.id}</td>
                  <td className="p-4 font-bold">{p.nome}</td>
                  <td className="p-4 text-neutral-400">{p.procedimento}</td>
                  <td className="p-4 text-right text-neutral-400">{new Date(p.ultimo_atendimento + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

    </div>
  );
}

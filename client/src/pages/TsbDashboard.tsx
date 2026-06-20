import { useState, useEffect } from "react";
import api from "../lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Users, Plus, Printer, CalendarDays, Activity, Syringe, Clock, X, LogOut, Search } from "lucide-react";
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
  
  // Estado do formulário
  const defaultProcedure = "Limpeza Profissional (TSB)";
  const [formData, setFormData] = useState({
    nome: "", telefone: "", procedimento: defaultProcedure, recorrencia_meses: "4", data_inicio: new Date().toISOString().split('T')[0], ultimo_atendimento: new Date().toISOString().split('T')[0], proximo_atendimento: ""
  });

  useEffect(() => { fetchData(); }, []);

  // AUTO-CÁLCULO DO PRÓXIMO ATENDIMENTO (Reativo)
  useEffect(() => {
    if (formData.ultimo_atendimento && formData.recorrencia_meses) {
      try {
        const date = new Date(formData.ultimo_atendimento + 'T00:00:00');
        if (!isNaN(date.getTime())) {
          date.setMonth(date.getMonth() + parseInt(formData.recorrencia_meses) || 0);
          setFormData(prev => ({ ...prev, proximo_atendimento: date.toISOString().split('T')[0] }));
        }
      } catch (e) {
        console.error("Erro ao calcular data:", e);
      }
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
    setLoading(true);
    try {
      await api.post("/tsb", { ...formData, recorrencia_meses: parseInt(formData.recorrencia_meses) });
      toast.success("Paciente cadastrado com sucesso!");
      setIsModalOpen(false);
      // Reseta formulário
      setFormData({
        nome: "", telefone: "", procedimento: defaultProcedure, recorrencia_meses: "4", data_inicio: new Date().toISOString().split('T')[0], ultimo_atendimento: new Date().toISOString().split('T')[0], proximo_atendimento: ""
      });
      fetchData();
    } catch (error) { 
      toast.error("Erro ao cadastrar paciente. Verifique os dados."); 
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("tsb_token");
    localStorage.removeItem("tsb_user");
    toast.success("Sessão encerrada com sucesso.");
    setLocation("/tsb/login");
  };

  // =========================================================================
  // CÁLCULOS DO DASHBOARD 
  // =========================================================================
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const thirtyDaysAgo = new Date(today); thirtyDaysAgo.setDate(today.getDate() - 30);
  const thirtyDaysFuture = new Date(today); thirtyDaysFuture.setDate(today.getDate() + 30);

  // Atendimentos realizados nos últimos 30 dias
  const doneLast30 = patients.filter(p => {
    const ultimo = new Date(p.ultimo_atendimento + 'T00:00:00');
    return ultimo >= thirtyDaysAgo && ultimo <= today;
  }).length;
  
  // Próximos atendimentos
  const futureAppointments = patients.filter(p => new Date(p.proximo_atendimento + 'T00:00:00') >= today);
  
  // Atendimentos previstos para os próximos 30 dias
  const next30 = futureAppointments.filter(p => new Date(p.proximo_atendimento + 'T00:00:00') <= thirtyDaysFuture).length;
  
  // Fila dos próximos 10
  const next10Patients = [...futureAppointments].sort((a,b) => new Date(a.proximo_atendimento).getTime() - new Date(b.proximo_atendimento).getTime()).slice(0, 10);
  
  // Data do próximo atendimento mais imediato
  const nextDateStr = next10Patients.length > 0 ? new Date(next10Patients[0].proximo_atendimento + 'T00:00:00').toLocaleDateString('pt-BR') : "--";

  // Filtro de Histórico Recente (Gráfico e Tabela Direita)
  const recentLimitDate = new Date(today);
  recentLimitDate.setDate(today.getDate() - parseInt(periodFilter));
  
  // Pacientes atendidos recentemente (ordenados por data decrescente)
  const recentPatients = patients.filter(p => new Date(p.ultimo_atendimento + 'T00:00:00') >= recentLimitDate && new Date(p.ultimo_atendimento + 'T00:00:00') <= today)
    .sort((a,b) => new Date(b.ultimo_atendimento).getTime() - new Date(a.ultimo_atendimento).getTime());

  // Dados do Gráfico (Mesma lógica)
  const chartData = [...recentPatients].reverse().reduce((acc: any[], p) => {
    const dateStr = new Date(p.ultimo_atendimento + 'T00:00:00').toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'});
    const existing = acc.find(item => item.data === dateStr);
    if (existing) existing.atendimentos += 1;
    else acc.push({ data: dateStr, atendimentos: 1 });
    return acc;
  }, []);

  // =========================================================================
  // EXPORTAR PDF CLÍNICO
  // =========================================================================
  const exportarRelatorioTSB = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return toast.error("O bloqueador de pop-ups impediu a impressão. Permita pop-ups.");

    let rowsHtml = '';
    recentPatients.forEach((p, idx) => {
      rowsHtml += `
        <tr>
          <td class="center" style="color: #666;">${String(idx + 1).padStart(2, '0')}</td>
          <td class="bold">${new Date(p.ultimo_atendimento + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
          <td><strong>${p.nome.toUpperCase()}</strong></td>
          <td>${p.telefone || '-'}</td>
          <td>${p.procedimento}</td>
          <td class="center text-teal">${new Date(p.proximo_atendimento + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
        </tr>
      `;
    });

    const htmlContent = `
      <!DOCTYPE html><html><head><title>Relatorio_Atendimentos_TSB_Aline_Antunes</title>
        <style>
          @page { margin: 15mm; size: A4 portrait; }
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; font-size: 11px; line-height: 1.5; padding: 10px; }
          .header { border-bottom: 3px solid #14b8a6; padding-bottom: 10px; margin-bottom: 25px; color: #0f766e; display: flex; justify-content: space-between; align-items: center; }
          .header h1 { font-size: 18px; margin: 0; font-weight: 900; text-transform: uppercase; letter-spacing: -0.5px; }
          .header p { margin: 2px 0 0 0; font-size: 12px; color: #666; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background-color: #f0fdfa; border-bottom: 2px solid #14b8a6; color: #0f766e; padding: 10px 8px; text-align: left; font-size: 10px; text-transform: uppercase; font-weight: bold;}
          td { padding: 10px 8px; border-bottom: 1px solid #e5e7eb; font-size: 11px; }
          tr:nth-child(even) { background-color: #f9fafb; }
          .center { text-align: center; } .bold { font-weight: bold; }
          .text-teal { color: #14b8a6; font-weight: bold; font-size: 12px; }
          .footer { text-align: center; margin-top: 40px; font-size: 10px; color: #888; border-top: 1px solid #e5e7eb; padding-top: 10px; }
        </style>
      </head><body>
        <div class="header">
          <div><h1>ALINE ANTUNES - CLINIC TSB</h1><p>Gestão de Profilaxia e Retorno de Pacientes</p></div>
          <div style="text-align: right; font-size: 10px; color: #666;">Emissão: ${new Date().toLocaleDateString('pt-BR')}</div>
        </div>
        <p style="font-size: 12px; margin-bottom: 15px;">Listagem de atendimentos realizados nos <strong>últimos ${periodFilter} dias</strong>:</p>
        <table><thead><tr><th class="center">#</th><th>Data Atend.</th><th>Nome do Paciente</th><th>Telefone</th><th>Procedimento</th><th class="center">Previsão Retorno</th></tr></thead>
        <tbody>${rowsHtml || '<tr><td colspan="6" class="center" style="padding: 20px;">Nenhum atendimento realizado no período selecionado.</td></tr>'}</tbody></table>
        <div class="footer"><p>Aline Antunes Clinic TSB - Relatório gerado eletronicamente.</p></div>
      </body></html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
  };

  // =========================================================================
  // ESTILOS CLAROS (CLINIC LIGHT)
  // =========================================================================
  const inputStyle = "bg-white border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus-visible:ring-teal-500/50 focus-visible:border-teal-500 transition-all";
  const cardStyle = "bg-white border-neutral-100 shadow-lg shadow-neutral-100/50 rounded-2xl overflow-hidden";
  const tableHeaderStyle = "p-4 text-xs font-bold text-neutral-600 uppercase tracking-wider";
  const tableRowStyle = "border-b border-neutral-100 hover:bg-teal-50/50 transition-colors";

  if (loading && patients.length === 0) return <div className="min-h-screen bg-neutral-50 p-6 text-teal-600 text-center py-20 font-bold flex flex-col items-center justify-center gap-4"><Syringe className="w-10 h-10 animate-spin text-teal-500"/> Carregando Clinic TSB...</div>;

  return (
    <div 
      className="min-h-screen w-full bg-cover bg-fixed bg-center font-sans"
      style={{ backgroundImage: 'url(/fundoalinetsb.png)' }}
    >
      <div className="min-h-screen w-full bg-white/85 text-neutral-900 p-4 md:p-8">
      
        {/* MODAL DE CADASTRO */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white border border-neutral-100 p-8 rounded-3xl w-full max-w-lg shadow-2xl shadow-black/10 relative">
              <button onClick={() => setIsModalOpen(false)} className="absolute top-5 right-5 p-1 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-900 transition-colors"><X className="w-5 h-5"/></button>
              <h3 className="text-2xl font-black text-teal-700 uppercase tracking-tighter mb-8 flex items-center gap-3"><Syringe className="w-6 h-6 text-teal-500"/> Registrar Paciente TSB</h3>
              
              <form onSubmit={handleCreate} className="space-y-5">
                <div className="space-y-2"><Label className="text-neutral-600 uppercase text-xs font-bold tracking-wider">Nome Completo *</Label><Input required value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} className={inputStyle} placeholder="Ex: Maria Souza" /></div>
                <div className="space-y-2"><Label className="text-neutral-600 uppercase text-xs font-bold tracking-wider">Telefone de Contato</Label><Input value={formData.telefone} onChange={e => setFormData({...formData, telefone: e.target.value})} className={inputStyle} placeholder="(00) 00000-0000" /></div>
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2"><Label className="text-neutral-600 uppercase text-xs font-bold tracking-wider">Procedimento</Label><Input value={formData.procedimento} onChange={e => setFormData({...formData, procedimento: e.target.value})} className={inputStyle} /></div>
                  <div className="space-y-2"><Label className="text-neutral-600 uppercase text-xs font-bold tracking-wider">Recorrência (Meses)</Label><Input type="number" required value={formData.recorrencia_meses} onChange={e => setFormData({...formData, recorrencia_meses: e.target.value})} className={inputStyle} min="1" /></div>
                </div>
                <div className="grid grid-cols-2 gap-5 pt-2 border-t border-neutral-100 mt-6">
                  <div className="space-y-2"><Label className="text-teal-700 uppercase text-xs font-bold tracking-wider">Data do Atendimento *</Label><Input type="date" required value={formData.ultimo_atendimento} onChange={e => setFormData({...formData, ultimo_atendimento: e.target.value})} className={`${inputStyle} border-teal-200 bg-teal-50/50`} /></div>
                  <div className="space-y-2"><Label className="text-teal-700 uppercase text-xs font-bold tracking-wider">Previsão de Retorno</Label><Input type="date" readOnly value={formData.proximo_atendimento} className={`${inputStyle} text-teal-600 font-bold bg-neutral-100 border-neutral-200 cursor-not-allowed`} /></div>
                </div>
                <Button type="submit" disabled={loading} className="w-full h-12 bg-teal-500 hover:bg-teal-600 text-white font-black text-sm uppercase tracking-wider rounded-xl mt-6 shadow-md shadow-teal-500/20">
                  {loading ? "Salvando..." : "Salvar Cadastro Clínica"}
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* HEADER DO MICRO-SISTEMA */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4 border-b border-neutral-200 pb-8">
          <div className="flex items-center gap-4">
             {/* Logo da Aline aumentada de w-14 para w-24 */}
             <img src="/logoaline.png" alt="Logo Aline Antunes" className="w-22 h-22 object-contain" />
             <div>
                <h1 className="text-3xl font-black text-teal-700 uppercase tracking-tighter flex items-center gap-3">
                  CLINIC TSB
                </h1>
                <p className="text-neutral-600 text-base mt-1">Gestão de Profilaxia e Recorrência - Aline Antunes</p>
             </div>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            {/* BOTÃO DE SAIR NOVO AQUI! */}
            <Button variant="outline" onClick={handleLogout} className="border-neutral-300 text-neutral-700 hover:bg-neutral-100 font-bold rounded-xl h-11"><LogOut className="w-4 h-4 mr-2"/> Sair</Button>
            <Button onClick={() => setIsModalOpen(true)} className="bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-xl h-11 shadow-md shadow-teal-500/20"><Plus className="w-4 h-4 mr-2"/> Novo Paciente</Button>
          </div>
        </div>

        {/* CARDS DE RESUMO */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <Card className={`${cardStyle} p-7`}>
            <p className="text-teal-700 text-xs font-bold uppercase tracking-wider mb-2">Atendidos (Últimos 30 dias)</p>
            <p className="text-5xl font-black text-neutral-950">{doneLast30}</p>
          </Card>
          <Card className={`${cardStyle} p-7`}>
            <p className="text-teal-700 text-xs font-bold uppercase tracking-wider mb-2">Retornos Previstos (Próx 30 dias)</p>
            <p className="text-5xl font-black text-teal-600">{next30}</p>
          </Card>
          <Card className={`${cardStyle} p-7 relative overflow-hidden`}>
            <Clock className="absolute -right-6 -bottom-6 w-32 h-32 text-teal-50"/>
            <p className="text-teal-700 text-xs font-bold uppercase tracking-wider mb-2 relative z-10">Data do Próximo Retorno</p>
            <p className="text-3xl font-black text-neutral-950 relative z-10 mt-3">{nextDateStr}</p>
          </Card>
        </div>

        {/* PRÓXIMOS 10 ATENDIMENTOS */}
        <Card className={`${cardStyle} mb-12`}>
          <div className="p-6 border-b border-neutral-100 bg-neutral-50/50 flex items-center justify-between">
            <h2 className="font-black text-neutral-950 uppercase tracking-wider text-sm flex items-center gap-2.5">
              <CalendarDays className="w-5 h-5 text-teal-500"/> Fila de Retornos Imediatos (Próximos 10)
            </h2>
            <div className="relative w-full max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400"/>
                <Input placeholder="Buscar na fila..." className={`${inputStyle} h-9 pl-9 text-xs rounded-full`} />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-neutral-100/70 border-b border-neutral-100"><tr><th className={tableHeaderStyle}>Data Limite</th><th className={tableHeaderStyle}>Nome do Paciente</th><th className={tableHeaderStyle}>Contato</th><th className={`${tableHeaderStyle} text-center`}>Recorrência</th></tr></thead>
              <tbody>
                {next10Patients.map(p => (
                  <tr key={p.id} className={tableRowStyle}>
                    <td className="p-4 font-black text-teal-600 text-base">{new Date(p.proximo_atendimento + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                    <td className="p-4 font-bold text-neutral-950 text-sm">{p.nome}</td>
                    <td className="p-4 text-neutral-600 text-sm">{p.telefone || '-'}</td>
                    <td className="p-4 text-neutral-600 text-sm text-center bg-neutral-50">{p.recorrencia_meses} Meses</td>
                  </tr>
                ))}
                {next10Patients.length === 0 && <tr><td colSpan={4} className="p-12 text-center text-neutral-500 text-sm">Nenhum paciente com retorno agendado para os próximos dias.</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>

        {/* GRÁFICO E TABELA DE RECENTES */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <Card className={`${cardStyle} p-7`}>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-3">
              <h2 className="font-black text-neutral-950 uppercase text-sm tracking-wider">Volume de Atendimentos (Histórico)</h2>
              <Select value={periodFilter} onValueChange={setPeriodFilter}>
                <SelectTrigger className="w-full sm:w-40 bg-neutral-50 border-neutral-200 h-9 text-xs rounded-full focus:ring-teal-500/30"><SelectValue/></SelectTrigger>
                <SelectContent className="bg-white border-neutral-100 text-neutral-900">
                  <SelectItem value="7">Últimos 7 dias</SelectItem>
                  <SelectItem value="15">Últimos 15 dias</SelectItem>
                  <SelectItem value="30">Últimos 30 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="data" stroke="#a3a3a3" tick={{fontSize: 11, fontWeight: 500}} axisLine={{stroke: '#e5e5e5'}} tickLine={false} />
                  <YAxis stroke="#a3a3a3" tick={{fontSize: 11}} allowDecimals={false} axisLine={{stroke: '#e5e5e5'}} tickLine={false} />
                  <Tooltip cursor={{fill: '#f0fdfa'}} contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", fontSize: '12px', padding: '10px' }} labelStyle={{fontWeight: 'bold', color: '#0f766e', marginBottom: '4px'}} />
                  <Bar dataKey="atendimentos" fill="#14b8a6" radius={[6, 6, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className={`${cardStyle} flex flex-col`}>
            <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
              <h2 className="font-black text-neutral-950 uppercase text-sm tracking-wider">Listagem do Período (Atendidos)</h2>
              <Button onClick={exportarRelatorioTSB} size="sm" className="h-9 bg-teal-50 border border-teal-200 text-teal-700 hover:bg-teal-100 rounded-lg text-xs font-bold"><Printer className="w-3.5 h-3.5 mr-2"/> Exportar PDF</Button>
            </div>
            <div className="overflow-y-auto flex-1 h-72 custom-scrollbar">
              <table className="w-full text-left text-sm">
                <thead className="bg-neutral-100/70 sticky top-0 z-10 border-b border-neutral-100"><tr><th className="p-4 text-xs font-bold text-neutral-600 uppercase tracking-wider">Data Feito</th><th className="p-4 text-xs font-bold text-neutral-600 uppercase tracking-wider">Nome do Paciente</th><th className="p-4 text-xs font-bold text-neutral-600 uppercase tracking-wider">Data Retorno</th></tr></thead>
                <tbody className="divide-y divide-neutral-100">
                  {recentPatients.map(p => (
                    <tr key={p.id} className="hover:bg-teal-50/50">
                      <td className="p-4 text-neutral-700">{new Date(p.ultimo_atendimento + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                      <td className="p-4 font-bold text-neutral-950">{p.nome}</td>
                      <td className="p-4 font-bold text-teal-600 bg-teal-50/50">{new Date(p.proximo_atendimento + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                    </tr>
                  ))}
                  {recentPatients.length === 0 && <tr><td colSpan={3} className="p-10 text-center text-neutral-500 text-sm">Nenhum atendimento realizado no período selecionado.</td></tr>}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* TODOS OS PACIENTES CADASTRADOS */}
        <Card className={`${cardStyle} mb-6`}>
          <div className="p-6 border-b border-neutral-100 bg-neutral-50/50 flex items-center justify-between gap-4">
            <h2 className="font-black text-neutral-950 uppercase text-sm tracking-wider flex items-center gap-2.5"><Users className="w-5 h-5 text-teal-500"/> Banco Geral de Pacientes Clinic TSB ({patients.length})</h2>
            <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400"/>
                <Input placeholder="Buscar paciente por nome..." className={`${inputStyle} h-10 pl-10 text-sm rounded-full`} />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-neutral-100/70 border-b border-neutral-100"><tr><th className={`${tableHeaderStyle} w-20`}>ID</th><th className={tableHeaderStyle}>Nome Completo</th><th className={tableHeaderStyle}>Procedimento Padrão</th><th className={`${tableHeaderStyle} text-right`}>Último Atendimento</th></tr></thead>
              <tbody>
                {patients.sort((a,b) => a.nome.localeCompare(b.nome)).map(p => (
                  <tr key={p.id} className={tableRowStyle}>
                    <td className="p-4 text-neutral-500 text-xs font-mono">#{String(p.id).padStart(4, '0')}</td>
                    <td className="p-4 font-bold text-neutral-950 text-sm">{p.nome}</td>
                    <td className="p-4 text-neutral-700 text-sm">{p.procedimento}</td>
                    <td className="p-4 text-right text-neutral-700 text-sm font-medium bg-neutral-50/50">{new Date(p.ultimo_atendimento + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                  </tr>
                ))}
                 {patients.length === 0 && <tr><td colSpan={4} className="p-12 text-center text-neutral-500 text-sm">Nenhum paciente cadastrado no Clinic TSB ainda.</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
        
        <div className="text-center py-6 text-neutral-400 text-xs border-t border-neutral-100/50 mt-10">
            Aline Antunes Clinic TSB - Sistema de Gestão de Profilaxia © {new Date().getFullYear()}
        </div>

      </div>
    </div>
  );
}

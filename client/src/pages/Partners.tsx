import { useState, useEffect } from "react";
import api from "../lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Users, Plus, Printer, Gift, ChevronDown, ChevronUp, MapPin, Phone, Calendar as CalendarIcon, X } from "lucide-react";

interface Dentist {
  id: number;
  nome: string;
  telefone: string;
  cidade: string;
  aniversario_dia: number;
  aniversario_mes: number;
}

interface Service {
  id: number | string;
  procedimento: string;
  valor_bruto: number;
  data_saida: string;
  forma_pagamento: string;
}

export default function Partners() {
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Controle do Modal de Cadastro
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ nome: "", telefone: "", cidade: "", dia: "", mes: "" });

  // Controle de Acordeão (quem está aberto)
  const [expandedDentist, setExpandedDentist] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dentistsRes, servicesRes] = await Promise.all([
        api.get("/dentistas"),
        api.get("/trabalhos")
      ]);
      setDentists(dentistsRes.data || []);
      
      // Pegamos apenas os finalizados para o extrato mensal
      const completed = (servicesRes.data || []).filter((s: any) => s.status === "Finalizado" && s.data_saida);
      setServices(completed);
    } catch (error) {
      toast.error("Erro ao carregar os dados.");
    } finally {
      setLoading(false);
    }
  };

  const isBirthday = (day: number, month: number) => {
    if (!day || !month) return false;
    const today = new Date();
    return today.getDate() === day && (today.getMonth() + 1) === month;
  };

  const handleCreateDentist = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/dentistas", {
        nome: formData.nome,
        telefone: formData.telefone,
        cidade: formData.cidade,
        aniversario_dia: parseInt(formData.dia) || null,
        aniversario_mes: parseInt(formData.mes) || null
      });
      toast.success("Parceiro cadastrado com sucesso!");
      setIsModalOpen(false);
      setFormData({ nome: "", telefone: "", cidade: "", dia: "", mes: "" });
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Erro ao cadastrar parceiro");
    }
  };

  // Agrupa os serviços finalizados de um dentista específico por Mês/Ano
  const getGroupedServices = (dentistName: string) => {
    const dentistServices = services.filter(s => s.dentista_nome?.toLowerCase() === dentistName.toLowerCase());
    
    const grouped: Record<string, Service[]> = {};
    
    dentistServices.forEach(s => {
      const date = new Date(s.data_saida + "T00:00:00");
      const monthYear = `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
      
      if (!grouped[monthYear]) grouped[monthYear] = [];
      grouped[monthYear].push(s);
    });

    // Ordena os meses do mais recente para o mais antigo
    return Object.entries(grouped).sort((a, b) => {
      const [mA, yA] = a[0].split('/');
      const [mB, yB] = b[0].split('/');
      return new Date(Number(yB), Number(mB) - 1).getTime() - new Date(Number(yA), Number(mA) - 1).getTime();
    });
  };

  // =========================================================================
  // GERAÇÃO DO PDF - Relatório Mensal do Dentista
  // =========================================================================
  const printMonthlyReport = (dentist: Dentist, monthYear: string, monthServices: Service[]) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return toast.error("Permita pop-ups para gerar o PDF.");

    const dataEmissao = new Date().toLocaleDateString('pt-BR');
    const totalMes = monthServices.reduce((acc, curr) => acc + Number(curr.valor_bruto), 0);

    let rowsHtml = '';
    monthServices.forEach((s, idx) => {
      const dataFormatada = new Date(s.data_saida + "T00:00:00").toLocaleDateString('pt-BR');
      rowsHtml += `
        <tr>
          <td class="center">${String(idx + 1).padStart(2, '0')}</td>
          <td>${dataFormatada}</td>
          <td>${s.procedimento.toUpperCase()}</td>
          <td class="center">${s.forma_pagamento || '-'}</td>
          <td class="right">R$ ${Number(s.valor_bruto).toFixed(2).replace('.', ',')}</td>
        </tr>
      `;
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Relatorio_Mensal_${dentist.nome}_${monthYear.replace('/', '-')}</title>
        <style>
          @page { margin: 15mm; size: A4 portrait; }
          body { font-family: Arial, sans-serif; color: #000; font-size: 12px; line-height: 1.5; padding: 10px; }
          .header { border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
          .header h1 { font-size: 16px; margin: 0 0 5px 0; font-weight: bold; }
          .header p { margin: 0; }
          .info { margin-bottom: 30px; background: #f9f9f9; padding: 15px; border: 1px solid #ddd; border-radius: 8px;}
          .info p { margin: 4px 0; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 6px; text-align: left; font-size: 11px; }
          td { padding: 6px; border-bottom: 1px dashed #ccc; font-size: 11px; }
          .center { text-align: center; }
          .right { text-align: right; }
          .summary { width: 250px; float: right; }
          .summary-total { display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; border-top: 2px solid #000; padding-top: 6px; margin-top: 4px; }
          .clear { clear: both; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>ALINE ANTUNES PRÓTESE ODONTOLÓGICA</h1>
          <p>Telefone: (31) 99526-3682</p>
          <p>Relatório de Fechamento Mensal - Parcerias</p>
        </div>

        <div class="info">
          <p><strong>Dentista / Parceiro:</strong> ${dentist.nome.toUpperCase()}</p>
          <p><strong>Telefone:</strong> ${dentist.telefone || "Não cadastrado"}</p>
          <p><strong>Período de Referência:</strong> Mês ${monthYear}</p>
        </div>

        <table>
          <thead>
            <tr>
              <th class="center" style="width: 5%;">#</th>
              <th style="width: 15%;">Data</th>
              <th style="width: 45%;">Procedimento Realizado</th>
              <th class="center" style="width: 15%;">Pagamento</th>
              <th class="right" style="width: 20%;">Valor Cobrado</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="summary">
          <div class="summary-total">
            <span>TOTAL DO MÊS:</span>
            <span>R$ ${totalMes.toFixed(2).replace('.', ',')}</span>
          </div>
        </div>

        <div class="clear" style="padding-top: 40px; text-align: center; font-size: 10px; color: #666;">
          <p>Documento gerado em ${dataEmissao} pelo Sistema de Gestão Aline Antunes.</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
  };

  const inputBaseStyle = "bg-neutral-900 border-neutral-800 text-white placeholder-neutral-600 focus-visible:ring-1 focus-visible:ring-[#DEAE60]/50 transition-all";

  if (loading) return <div className="min-h-screen bg-transparent p-6 text-[#DEAE60] font-bold text-center py-20">Carregando parceiros...</div>;

  return (
    <div className="min-h-screen bg-transparent p-6 relative">
      
      {/* MODAL DE CADASTRO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl w-full max-w-md shadow-2xl relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 p-1 text-neutral-500 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-black text-white uppercase tracking-tight mb-6 flex items-center gap-2">
              <Users className="w-5 h-5 text-[#DEAE60]" /> Novo Parceiro
            </h3>
            
            <form onSubmit={handleCreateDentist} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-neutral-400 uppercase">Nome Completo *</Label>
                <Input required value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} className={inputBaseStyle} placeholder="Ex: Dr. Carlos" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-neutral-400 uppercase">Telefone / WhatsApp</Label>
                <Input value={formData.telefone} onChange={e => setFormData({...formData, telefone: e.target.value})} className={inputBaseStyle} placeholder="(00) 00000-0000" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-neutral-400 uppercase">Cidade / Região</Label>
                <Input value={formData.cidade} onChange={e => setFormData({...formData, cidade: e.target.value})} className={inputBaseStyle} placeholder="Ex: Belo Horizonte" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-neutral-400 uppercase">Dia Nasc.</Label>
                  <Select value={formData.dia} onValueChange={val => setFormData({...formData, dia: val})}>
                    <SelectTrigger className="bg-neutral-900 border-neutral-800 text-white"><SelectValue placeholder="Dia" /></SelectTrigger>
                    <SelectContent className="bg-neutral-900 border-neutral-800 text-white h-48">
                      {Array.from({length: 31}, (_, i) => i + 1).map(d => <SelectItem key={d} value={d.toString()}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-neutral-400 uppercase">Mês Nasc.</Label>
                  <Select value={formData.mes} onValueChange={val => setFormData({...formData, mes: val})}>
                    <SelectTrigger className="bg-neutral-900 border-neutral-800 text-white"><SelectValue placeholder="Mês" /></SelectTrigger>
                    <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                      {["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"].map((m, i) => (
                        <SelectItem key={i+1} value={(i+1).toString()}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="pt-4 flex gap-3">
                <Button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white">Cancelar</Button>
                <Button type="submit" className="flex-1 bg-[#DEAE60] hover:bg-[#DEAE60]/90 text-neutral-950 font-black">Salvar</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HEADER DA TELA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
            Dentistas Parceiros
          </h1>
          <p className="text-neutral-400 text-sm mt-2">Gerencie sua rede de dentistas e exporte fechamentos mensais</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-[#DEAE60] hover:bg-[#DEAE60]/90 text-neutral-950 font-bold rounded-lg h-10">
          <Plus className="w-4 h-4 mr-2" /> Novo Parceiro
        </Button>
      </div>

      {/* LISTA DE PARCEIROS */}
      <div className="space-y-4">
        {dentists.map((dentist) => {
          const birthdayToday = isBirthday(dentist.aniversario_dia, dentist.aniversario_mes);
          const isExpanded = expandedDentist === dentist.id;
          const groupedServices = getGroupedServices(dentist.nome);

          return (
            <Card key={dentist.id} className="bg-neutral-900/80 border-neutral-800 overflow-hidden shadow-xl transition-all">
              
              {/* CABEÇALHO DO DENTISTA (Clicável) */}
              <div 
                onClick={() => setExpandedDentist(isExpanded ? null : dentist.id)}
                className="p-6 cursor-pointer hover:bg-neutral-800/30 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg ${birthdayToday ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-[#DEAE60]/10 text-[#DEAE60] border border-[#DEAE60]/20'}`}>
                    {birthdayToday ? <Gift className="w-6 h-6 animate-pulse" /> : dentist.nome.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                      {dentist.nome}
                      {birthdayToday && <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full uppercase tracking-widest font-bold">Aniversariante</span>}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-neutral-400 font-medium">
                      {dentist.telefone && <span className="flex items-center gap-1"><Phone className="w-3 h-3"/> {dentist.telefone}</span>}
                      {dentist.cidade && <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/> {dentist.cidade}</span>}
                      {dentist.aniversario_dia && <span className="flex items-center gap-1"><CalendarIcon className="w-3 h-3"/> Nasc: {String(dentist.aniversario_dia).padStart(2,'0')}/{String(dentist.aniversario_mes).padStart(2,'0')}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-neutral-500 pl-16 md:pl-0">
                  <span className="text-xs font-bold uppercase tracking-widest bg-neutral-950 px-3 py-1 rounded-md border border-neutral-800">
                    {groupedServices.length} Meses de Movimento
                  </span>
                  {isExpanded ? <ChevronUp className="w-5 h-5 text-[#DEAE60]" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </div>

              {/* CONTEÚDO EXPANDIDO: Histórico Mensal */}
              {isExpanded && (
                <div className="border-t border-neutral-800 bg-neutral-950/50 p-6">
                  {groupedServices.length === 0 ? (
                    <div className="text-center py-8 text-neutral-500 text-sm font-bold uppercase tracking-widest">
                      Nenhum serviço finalizado registrado para este dentista.
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {groupedServices.map(([monthYear, monthServices]) => {
                        const totalMes = monthServices.reduce((acc, curr) => acc + Number(curr.valor_bruto), 0);
                        
                        return (
                          <div key={monthYear} className="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-900">
                            {/* Linha do Mês */}
                            <div className="bg-neutral-800/50 p-4 flex items-center justify-between border-b border-neutral-800">
                              <div>
                                <h4 className="font-black text-white uppercase tracking-widest text-sm flex items-center gap-2">
                                  <CalendarIcon className="w-4 h-4 text-[#DEAE60]"/> Fechamento: {monthYear}
                                </h4>
                                <p className="text-xs text-neutral-400 mt-1">{monthServices.length} serviços concluídos</p>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right hidden sm:block">
                                  <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Total do Mês</p>
                                  <p className="text-lg font-black text-[#DEAE60]">R$ {totalMes.toFixed(2).replace('.', ',')}</p>
                                </div>
                                <Button 
                                  onClick={(e) => { e.stopPropagation(); printMonthlyReport(dentist, monthYear, monthServices); }}
                                  variant="ghost" 
                                  className="text-[#DEAE60] hover:bg-[#DEAE60]/10 hover:text-[#DEAE60] h-10 border border-[#DEAE60]/20"
                                >
                                  <Printer className="w-4 h-4 sm:mr-2" />
                                  <span className="hidden sm:inline uppercase text-xs font-bold tracking-widest">Imprimir</span>
                                </Button>
                              </div>
                            </div>
                            
                            {/* Tabela de Serviços do Mês */}
                            <div className="p-4 overflow-x-auto custom-scrollbar">
                              <table className="w-full text-left min-w-[500px]">
                                <thead>
                                  <tr className="border-b border-neutral-800">
                                    <th className="pb-2 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Data</th>
                                    <th className="pb-2 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Procedimento</th>
                                    <th className="pb-2 text-[10px] font-bold text-neutral-500 uppercase tracking-widest text-right">Valor</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {monthServices.map(service => (
                                    <tr key={service.id} className="border-b border-neutral-800/50 last:border-0">
                                      <td className="py-3 text-xs text-neutral-400">{new Date(service.data_saida + "T00:00:00").toLocaleDateString('pt-BR')}</td>
                                      <td className="py-3 text-xs font-bold text-white uppercase">{service.procedimento}</td>
                                      <td className="py-3 text-xs font-black text-white text-right">R$ {Number(service.valor_bruto).toFixed(2).replace('.', ',')}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}

        {dentists.length === 0 && !loading && (
          <div className="text-center py-20 border border-neutral-800 border-dashed rounded-xl bg-neutral-900/30">
            <Users className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
            <h3 className="text-lg font-black text-white uppercase">Nenhum parceiro cadastrado</h3>
            <p className="text-neutral-500 text-sm mt-2">Clique no botão "Novo Parceiro" para começar sua rede.</p>
          </div>
        )}
      </div>
    </div>
  );
}

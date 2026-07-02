import { useState, useEffect } from "react";
import api from "../lib/api";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Users, Plus, Printer, Gift, ChevronDown, ChevronUp, MapPin, Phone, 
  Calendar as CalendarIcon, X, Bike, Map, Pencil, Trash2, UserCheck, 
  Clock, Receipt, Eye, DollarSign 
} from "lucide-react";

export default function Partners() {
  const [, setLocation] = useLocation();
  const [dentists, setDentists] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [motoboys, setMotoboys] = useState<any[]>([]);
  const [rotas, setRotas] = useState<any[]>([]);
  const [colaboradores, setColaboradores] = useState<any[]>([]);
  const [pontos, setPontos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [expandedDentist, setExpandedDentist] = useState<number | null>(null);
  const [expandedMotoboy, setExpandedMotoboy] = useState<number | null>(null);
  const [expandedColab, setExpandedColab] = useState<number | null>(null);

  // Form states - Dentistas
  const [isDentistModalOpen, setIsDentistModalOpen] = useState(false);
  const [editingDentistId, setEditingDentistId] = useState<number | null>(null);
  const [dentistForm, setDentistForm] = useState({ 
    nome: "", 
    telefone: "", 
    cidade: "", 
    dia: "", 
    mes: "" 
  });

  // Form states - Motoboys
  const [isMotoboyModalOpen, setIsMotoboyModalOpen] = useState(false);
  const [motoboyForm, setMotoboyForm] = useState({ nome: "", telefone: "" });

  const [isRotaModalOpen, setIsRotaModalOpen] = useState(false);
  const [rotaForm, setRotaForm] = useState({ 
    motoboy_id: "", 
    data: "", 
    de_onde: "", 
    para_onde: "", 
    valor: "" 
  });

  // Form states - RH (Colaboradores)
  const [isColabModalOpen, setIsColabModalOpen] = useState(false);
  const [colabForm, setColabForm] = useState({ nome: "", telefone: "", cargo: "" });

  const [isPontoModalOpen, setIsPontoModalOpen] = useState(false);
  const [pontoForm, setPontoForm] = useState({ 
    colaborador_id: "", 
    data: "", 
    entrada: "", 
    saida: "" 
  });

  // Modal Custos Extras Dentista
  const [isExtraCostsModalOpen, setIsExtraCostsModalOpen] = useState(false);
  const [extraCosts, setExtraCosts] = useState<{descricao: string, valor: string}[]>([]);
  const [pdfDentistData, setPdfDentistData] = useState<any>(null);

  // Modal Pagamento Colaborador
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [paymentValue, setPaymentValue] = useState("");

  useEffect(() => { 
    fetchData(); 
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dentistsRes, servicesRes, motoboysRes, rotasRes, colabRes, pontosRes] = await Promise.all([
        api.get("/dentistas"),
        api.get("/trabalhos"),
        api.get("/motoboys").catch(() => ({ data: [] })),
        api.get("/motoboys/rotas").catch(() => ({ data: [] })),
        api.get("/colaboradores").catch(() => ({ data: [] })),
        api.get("/colaboradores/pontos").catch(() => ({ data: [] }))
      ]);
      
      setDentists(dentistsRes.data || []);
      setServices((servicesRes.data || []).filter((s: any) => s.status === "Finalizado" && s.data_saida));
      setMotoboys(motoboysRes.data || []);
      setRotas(rotasRes.data || []);
      setColaboradores(colabRes.data || []);
      setPontos(pontosRes.data || []);
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

  const groupDataByMonth = (dataList: any[], dateField: string) => {
    const grouped: Record<string, any[]> = {};
    dataList.forEach(item => {
      if(!item[dateField]) return;
      const date = new Date(item[dateField] + "T00:00:00");
      const key = `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    });
    
    return Object.entries(grouped).sort((a, b) => {
      const [mA, yA] = a[0].split('/'); 
      const [mB, yB] = b[0].split('/');
      return new Date(Number(yB), Number(mB) - 1).getTime() - new Date(Number(yA), Number(mA) - 1).getTime();
    });
  };

  // ==========================================
  // DENTISTAS (CRIAR, EDITAR, ELIMINAR)
  // ==========================================
  const handleSaveDentist = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      nome: dentistForm.nome, 
      telefone: dentistForm.telefone, 
      cidade: dentistForm.cidade,
      aniversario_dia: parseInt(dentistForm.dia) || null, 
      aniversario_mes: parseInt(dentistForm.mes) || null
    };
    
    try {
      if (editingDentistId) {
        await api.put(`/dentistas/${editingDentistId}`, payload);
      } else {
        await api.post("/dentistas", payload);
      }
      toast.success("Parceiro salvo com sucesso!");
      setIsDentistModalOpen(false);
      setEditingDentistId(null);
      setDentistForm({ nome: "", telefone: "", cidade: "", dia: "", mes: "" });
      fetchData();
    } catch (error: any) { 
      toast.error(error.response?.data?.error || "Erro ao salvar parceiro"); 
    }
  };

  const handleDeleteDentist = async (id: number) => {
    if (!confirm("Tem a certeza que deseja eliminar este dentista?")) return;
    try {
      await api.delete(`/dentistas/${id}`);
      toast.success("Dentista eliminado.");
      fetchData();
    } catch (e) { 
      toast.error("Erro ao eliminar."); 
    }
  };

  const handleDeleteService = async (id: number) => {
    if (!confirm("Tem a certeza que deseja remover este serviço?")) return;
    try {
      await api.delete(`/trabalhos/${id}`);
      toast.success("Serviço removido.");
      fetchData();
    } catch (e) { 
      toast.error("Erro ao remover serviço."); 
    }
  };

  const openDentistPdfModal = (dentist: any, monthYear: string, monthServices: any[]) => {
    setPdfDentistData({ dentist, monthYear, monthServices });
    setExtraCosts([]);
    setIsExtraCostsModalOpen(true);
  };

  const executeDentistPdf = () => {
    const { dentist, monthYear, monthServices } = pdfDentistData;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return toast.error("Permita pop-ups para gerar o PDF.");

    let totalMes = monthServices.reduce((acc: number, curr: any) => acc + Number(curr.valor_bruto), 0);
    let rowsHtml = '';
    
    // Lista de Serviços Padrão
    monthServices.forEach((s: any, idx: number) => {
      const dataFormatada = new Date(s.data_saida + "T00:00:00").toLocaleDateString('pt-BR');
      const valorFormatado = Number(s.valor_bruto).toFixed(2).replace('.', ',');
      
      rowsHtml += `
        <tr>
          <td class="center">${String(idx + 1).padStart(2, '0')}</td>
          <td>${dataFormatada}</td>
          <td>${s.procedimento.toUpperCase()}</td>
          <td class="center">${s.forma_pagamento || '-'}</td>
          <td class="right">R$ ${valorFormatado}</td>
        </tr>
      `;
    });

    // Adiciona os Custos Extras selecionados na tabela
    const validExtras = extraCosts.filter(e => e.descricao && e.valor);
    validExtras.forEach((extra) => {
      const v = Number(extra.valor.replace(',', '.'));
      totalMes += v;
      const valorExtraFormatado = v.toFixed(2).replace('.', ',');
      
      rowsHtml += `
        <tr>
          <td class="center text-neutral-400">-</td>
          <td>-</td>
          <td style="color: #666; font-style: italic;">[Custo Operacional Extra] ${extra.descricao.toUpperCase()}</td>
          <td class="center">-</td>
          <td class="right" style="color: #666;">R$ ${valorExtraFormatado}</td>
        </tr>
      `;
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Relatorio_${dentist.nome}_${monthYear.replace('/', '-')}</title>
        <style>
          @page { margin: 15mm; size: A4 portrait; }
          body { font-family: Arial, sans-serif; font-size: 12px; line-height: 1.5; padding: 10px; }
          .header { border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
          .header h1 { font-size: 16px; margin: 0 0 5px 0; font-weight: bold; }
          .info { margin-bottom: 30px; background: #f9f9f9; padding: 15px; border: 1px solid #ddd; border-radius: 8px;}
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 6px; text-align: left; font-size: 11px; }
          td { padding: 6px; border-bottom: 1px dashed #ccc; font-size: 11px; }
          .center { text-align: center; } .right { text-align: right; }
          .summary { width: 250px; float: right; }
          .summary-total { display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; border-top: 2px solid #000; padding-top: 6px; margin-top: 4px; }
          .clear { clear: both; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>ALINE ANTUNES PRÓTESE ODONTOLÓGICA</h1>
          <p>Relatório de Fechamento Mensal</p>
        </div>
        <div class="info">
          <p><strong>Dentista:</strong> ${dentist.nome.toUpperCase()}</p>
          <p><strong>Período:</strong> Mês ${monthYear}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th class="center" style="width: 5%;">#</th>
              <th style="width: 15%;">Data</th>
              <th style="width: 45%;">Descrição do Serviço / Custo</th>
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
            <span>TOTAL A PAGAR:</span>
            <span>R$ ${totalMes.toFixed(2).replace('.', ',')}</span>
          </div>
        </div>
        <div class="clear" style="padding-top: 40px; text-align: center; font-size: 10px; color: #666;">
          <p>Gerado em ${new Date().toLocaleDateString('pt-BR')} pelo Sistema Aline Antunes.</p>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => { 
      printWindow.print(); 
      printWindow.close(); 
      setIsExtraCostsModalOpen(false); 
    }, 250);
  };

  // ==========================================
  // COLABORADORES (RH & Ponto)
  // ==========================================
  const handleColab = async (e: React.FormEvent) => {
    e.preventDefault();
    try { 
      await api.post("/colaboradores", colabForm); 
      toast.success("Colaborador salvo com sucesso!"); 
      setIsColabModalOpen(false); 
      setColabForm({nome:'', telefone:'', cargo:''}); 
      fetchData(); 
    } catch(e) { 
      toast.error("Erro ao guardar colaborador."); 
    }
  };

  const handlePonto = async (e: React.FormEvent) => {
    e.preventDefault();
    try { 
      await api.post("/colaboradores/pontos", pontoForm); 
      toast.success("Ponto registado com sucesso!"); 
      setIsPontoModalOpen(false); 
      setPontoForm({...pontoForm, data:'', entrada:'', saida:''}); 
      fetchData(); 
    } catch(e) { 
      toast.error("Erro ao registar o ponto."); 
    }
  };

  const handleDeletePonto = async (id: number) => {
    if(!confirm("Tem a certeza que deseja eliminar este registo de ponto?")) return;
    try { 
      await api.delete(`/colaboradores/pontos/${id}`); 
      toast.success("Ponto eliminado"); 
      fetchData(); 
    } catch(e) { 
      toast.error("Erro ao eliminar o ponto."); 
    }
  };

  const calcHoras = (ent: string, sai: string) => {
    if(!ent || !sai) return '-';
    const [h1, m1] = ent.split(':').map(Number);
    const [h2, m2] = sai.split(':').map(Number);
    let diff = (h2*60 + m2) - (h1*60 + m1);
    if(diff < 0) diff += 24*60;
    return `${String(Math.floor(diff/60)).padStart(2,'0')}h${String(diff%60).padStart(2,'0')}m`;
  };

  const printColaboradorPdf = async (colaborador: any, monthYear: string, pontos: any[], isPayment: boolean) => {
    if (isPayment) {
      if (!paymentValue || isNaN(Number(paymentValue.replace(',','.')))) {
        return toast.error("Insira um valor válido.");
      }
      try {
        await api.post("/colaboradores/pagamento", { 
          colaborador_nome: colaborador.nome, 
          valor: Number(paymentValue.replace(',','.')), 
          mes_ref: monthYear 
        });
        toast.success("Custo lançado com sucesso no fluxo financeiro geral!");
        setIsPaymentModalOpen(false);
      } catch(e) { 
        return toast.error("Erro ao lançar custo no sistema."); 
      }
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return toast.error("Permita pop-ups no navegador.");

    let rowsHtml = '';
    pontos.forEach((p: any, idx: number) => {
      rowsHtml += `
        <tr>
          <td class="center">${String(idx + 1).padStart(2, '0')}</td>
          <td>${new Date(p.data + "T00:00:00").toLocaleDateString('pt-BR')}</td>
          <td class="center">${p.entrada || '-'}</td>
          <td class="center">${p.saida || '-'}</td>
          <td class="center">${calcHoras(p.entrada, p.saida)}</td>
        </tr>
      `;
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Espelho_Ponto_${colaborador.nome}</title>
        <style>
          @page { margin: 15mm; size: A4 portrait; }
          body { font-family: Arial, sans-serif; font-size: 12px; line-height: 1.5; padding: 10px; }
          .header { border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; text-align:center;}
          .header h1 { font-size: 16px; margin: 0 0 5px 0; font-weight: bold; text-transform: uppercase;}
          .info { margin-bottom: 30px; background: #f9f9f9; padding: 15px; border: 1px solid #ddd; border-radius: 8px;}
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 6px; text-align: left; font-size: 11px; }
          td { padding: 6px; border-bottom: 1px dashed #ccc; font-size: 11px; }
          .center { text-align: center; } .right { text-align: right; }
          .summary { width: 300px; float: right; background: #f0fdfa; padding: 10px; border: 1px solid #14b8a6; border-radius: 8px;}
        </style>
      </head>
      <body>
        <div class="header">
          <h1>ALINE ANTUNES PRÓTESE ODONTOLÓGICA</h1>
          <p>Espelho de Ponto e Pagamento de Colaborador</p>
        </div>
        <div class="info">
          <p><strong>Nome:</strong> ${colaborador.nome.toUpperCase()}</p>
          <p><strong>Cargo:</strong> ${colaborador.cargo || 'Não definido'}</p>
          <p><strong>Período:</strong> Mês ${monthYear}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th class="center" style="width: 5%;">#</th>
              <th>Data</th>
              <th class="center">Entrada</th>
              <th class="center">Saída</th>
              <th class="center">Horas Trabalhadas</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        ${isPayment ? `
          <div class="summary">
            <div style="display:flex; justify-content:space-between; font-weight:bold; font-size:16px; color:#0f766e;">
              <span>SALÁRIO A PAGAR:</span>
              <span>R$ ${Number(paymentValue.replace(',','.')).toFixed(2).replace('.', ',')}</span>
            </div>
            <p style="font-size:9px; color:#666; margin-top:5px; text-align:center;">Este valor foi registado automaticamente nos custos do sistema.</p>
          </div>
        ` : ''}
      </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => { 
      printWindow.print(); 
      printWindow.close(); 
    }, 250);
  };

  const inputBaseStyle = "bg-neutral-900 border-neutral-800 text-white placeholder-neutral-600 focus-visible:ring-1 focus-visible:ring-[#DEAE60]/50";

  if (loading) return <div className="min-h-screen p-6 text-[#DEAE60] font-bold text-center py-20">Carregando dados...</div>;

  return (
    <div className="min-h-screen bg-transparent p-6 relative pb-20">
      
      {/* ========================================================================= */}
      {/* MODAL CUSTOS EXTRAS PDF */}
      {/* ========================================================================= */}
      {isExtraCostsModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl w-full max-w-lg shadow-2xl relative">
            <button onClick={() => setIsExtraCostsModalOpen(false)} className="absolute top-4 right-4 text-neutral-500 hover:text-white">
              <X className="w-5 h-5"/>
            </button>
            <h3 className="text-xl font-black text-white uppercase mb-4 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-[#DEAE60]"/> Adicionar Custos ao Relatório
            </h3>
            <p className="text-xs text-neutral-400 mb-6">
              Insira materiais extras ou acréscimos para que saiam somados no PDF final deste dentista.
            </p>
            
            <div className="space-y-3 mb-6 max-h-60 overflow-y-auto custom-scrollbar">
              {extraCosts.map((extra, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <Input 
                    value={extra.descricao} 
                    onChange={e => {
                      const n = [...extraCosts]; 
                      n[idx].descricao = e.target.value; 
                      setExtraCosts(n);
                    }} 
                    placeholder="Ex: Resina Extra" 
                    className={inputBaseStyle} 
                  />
                  <Input 
                    type="number" 
                    value={extra.valor} 
                    onChange={e => {
                      const n = [...extraCosts]; 
                      n[idx].valor = e.target.value; 
                      setExtraCosts(n);
                    }} 
                    placeholder="R$ 0,00" 
                    className={`w-32 ${inputBaseStyle}`} 
                  />
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => setExtraCosts(extraCosts.filter((_, i) => i !== idx))} 
                    className="text-red-500 hover:bg-red-500/20"
                  >
                    <Trash2 className="w-4 h-4"/>
                  </Button>
                </div>
              ))}
              <Button 
                type="button" 
                onClick={() => setExtraCosts([...extraCosts, {descricao:'', valor:''}])} 
                variant="outline" 
                className="w-full border-neutral-700 text-neutral-400 border-dashed hover:bg-neutral-800 text-xs"
              >
                <Plus className="w-4 h-4 mr-2"/> Adicionar Linha de Custo
              </Button>
            </div>
            <Button onClick={executeDentistPdf} className="w-full bg-[#DEAE60] text-black font-black">
              Gerar PDF Final
            </Button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL PAGAMENTO COLABORADOR */}
      {/* ========================================================================= */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl w-full max-w-sm shadow-2xl relative">
            <button onClick={() => setIsPaymentModalOpen(false)} className="absolute top-4 right-4 text-neutral-500 hover:text-white">
              <X className="w-5 h-5"/>
            </button>
            <h3 className="text-xl font-black text-white uppercase mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-500"/> Pagar Colaborador
            </h3>
            <p className="text-xs text-neutral-400 mb-6">
              Este valor será deduzido como Custo Operacional no painel de Relatórios da Aline.
            </p>
            <div className="space-y-4 mb-6">
              <div className="space-y-2">
                <Label className="text-xs text-neutral-400 uppercase font-bold">Valor Total a Pagar (R$)</Label>
                <Input 
                  type="number" 
                  step="0.01" 
                  value={paymentValue} 
                  onChange={e => setPaymentValue(e.target.value)} 
                  placeholder="0.00" 
                  className={inputBaseStyle} 
                />
              </div>
            </div>
            <Button 
              onClick={() => printColaboradorPdf(paymentData.colab, paymentData.month, paymentData.pontos, true)} 
              className="w-full bg-green-500 hover:bg-green-600 text-black font-black"
            >
              Confirmar e Gerar PDF
            </Button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NOVO / EDITAR DENTISTA */}
      {/* ========================================================================= */}
      {isDentistModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl w-full max-w-md relative">
            <button 
              onClick={() => { setIsDentistModalOpen(false); setEditingDentistId(null); }} 
              className="absolute top-4 right-4 text-neutral-500"
            >
              <X className="w-5 h-5"/>
            </button>
            <h3 className="text-xl font-black text-white uppercase mb-6 flex items-center gap-2">
              <Users className="w-5 h-5 text-[#DEAE60]" /> 
              {editingDentistId ? "Editar Parceiro" : "Novo Parceiro"}
            </h3>
            
            <form onSubmit={handleSaveDentist} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-neutral-400 uppercase">Nome Completo *</Label>
                <Input 
                  required 
                  value={dentistForm.nome} 
                  onChange={e => setDentistForm({...dentistForm, nome: e.target.value})} 
                  className={inputBaseStyle} 
                  placeholder="Nome" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-neutral-400 uppercase">Telefone</Label>
                <Input 
                  value={dentistForm.telefone} 
                  onChange={e => setDentistForm({...dentistForm, telefone: e.target.value})} 
                  className={inputBaseStyle} 
                  placeholder="Telefone" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-neutral-400 uppercase">Cidade</Label>
                <Input 
                  value={dentistForm.cidade} 
                  onChange={e => setDentistForm({...dentistForm, cidade: e.target.value})} 
                  className={inputBaseStyle} 
                  placeholder="Cidade" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-neutral-400 uppercase">Dia Nasc.</Label>
                  <Select value={dentistForm.dia} onValueChange={v => setDentistForm({...dentistForm, dia: v})}>
                    <SelectTrigger className={inputBaseStyle}>
                      <SelectValue placeholder="Dia"/>
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-900 border-neutral-800 text-white h-48">
                      {Array.from({length:31},(_,i)=>i+1).map(d=>(
                        <SelectItem key={d} value={d.toString()}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-neutral-400 uppercase">Mês Nasc.</Label>
                  <Select value={dentistForm.mes} onValueChange={v => setDentistForm({...dentistForm, mes: v})}>
                    <SelectTrigger className={inputBaseStyle}>
                      <SelectValue placeholder="Mês"/>
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                      {["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"].map((m,i)=>(
                        <SelectItem key={i+1} value={(i+1).toString()}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" className="w-full bg-[#DEAE60] hover:bg-[#DEAE60]/90 text-black font-black mt-4">
                Salvar Parceiro
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NOVO COLABORADOR */}
      {/* ========================================================================= */}
      {isColabModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl w-full max-w-md relative">
            <button onClick={() => setIsColabModalOpen(false)} className="absolute top-4 right-4 text-neutral-500">
              <X className="w-5 h-5"/>
            </button>
            <h3 className="text-xl font-black text-white uppercase mb-6 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-[#DEAE60]"/> Novo Colaborador
            </h3>
            
            <form onSubmit={handleColab} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-neutral-400 uppercase">Nome *</Label>
                <Input required value={colabForm.nome} onChange={e => setColabForm({...colabForm, nome: e.target.value})} className={inputBaseStyle} placeholder="Nome" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-neutral-400 uppercase">Telefone</Label>
                <Input value={colabForm.telefone} onChange={e => setColabForm({...colabForm, telefone: e.target.value})} className={inputBaseStyle} placeholder="Telefone" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-neutral-400 uppercase">Cargo / Função</Label>
                <Input value={colabForm.cargo} onChange={e => setColabForm({...colabForm, cargo: e.target.value})} className={inputBaseStyle} placeholder="Cargo/Função" />
              </div>
              <Button type="submit" className="w-full bg-[#DEAE60] hover:bg-[#DEAE60]/90 text-black font-black mt-4">
                Salvar Colaborador
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: REGISTAR PONTO */}
      {/* ========================================================================= */}
      {isPontoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl w-full max-w-md relative">
            <button onClick={() => setIsPontoModalOpen(false)} className="absolute top-4 right-4 text-neutral-500">
              <X className="w-5 h-5"/>
            </button>
            <h3 className="text-xl font-black text-white uppercase mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#DEAE60]"/> Registar Ponto
            </h3>
            
            <form onSubmit={handlePonto} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-neutral-400 uppercase">Colaborador *</Label>
                <Select required value={pontoForm.colaborador_id} onValueChange={v => setPontoForm({...pontoForm, colaborador_id: v})}>
                  <SelectTrigger className={inputBaseStyle}>
                    <SelectValue placeholder="Selecione o Colaborador"/>
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                    {colaboradores.map(c => (
                      <SelectItem key={c.id} value={c.id.toString()}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-neutral-400 uppercase">Data *</Label>
                <Input required type="date" value={pontoForm.data} onChange={e => setPontoForm({...pontoForm, data: e.target.value})} className={inputBaseStyle} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-neutral-400 uppercase">Entrada</Label>
                  <Input type="time" required value={pontoForm.entrada} onChange={e => setPontoForm({...pontoForm, entrada: e.target.value})} className={inputBaseStyle} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-neutral-400 uppercase">Saída</Label>
                  <Input type="time" value={pontoForm.saida} onChange={e => setPontoForm({...pontoForm, saida: e.target.value})} className={inputBaseStyle} />
                </div>
              </div>
              <Button type="submit" className="w-full bg-[#DEAE60] hover:bg-[#DEAE60]/90 text-black font-black mt-4">
                Guardar Ponto
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. DENTISTAS PARCEIROS (Tabela Principal) */}
      {/* ========================================================================= */}
      <div className="mb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
              <Users className="w-8 h-8 text-[#DEAE60]"/> Dentistas Parceiros
            </h1>
            <p className="text-neutral-400 text-sm mt-1">Gerencie a sua rede de dentistas e exporte os fechos mensais</p>
          </div>
          <Button 
            onClick={() => { 
              setEditingDentistId(null); 
              setDentistForm({nome:'', telefone:'', cidade:'', dia:'', mes:''}); 
              setIsDentistModalOpen(true); 
            }} 
            className="bg-[#DEAE60] hover:bg-[#DEAE60]/90 text-black font-bold h-10 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" /> Cadastrar Parceiro
          </Button>
        </div>

        <div className="space-y-4">
          {dentists.map((dentist) => {
            const birthdayToday = isBirthday(dentist.aniversario_dia, dentist.aniversario_mes);
            const isExpanded = expandedDentist === dentist.id;
            const groupedServices = groupDataByMonth(services.filter(s => s.dentista_nome?.toLowerCase() === dentist.nome.toLowerCase()), 'data_saida');

            return (
              <Card key={dentist.id} className="bg-neutral-900/80 border-neutral-800 shadow-xl transition-all">
                <div onClick={() => setExpandedDentist(isExpanded ? null : dentist.id)} className="p-6 cursor-pointer hover:bg-neutral-800/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center font-black bg-[#DEAE60]/10 text-[#DEAE60]">
                      {birthdayToday ? <Gift className="w-6 h-6 animate-pulse text-red-400"/> : dentist.nome.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white uppercase flex items-center gap-2">
                        {dentist.nome} 
                        {birthdayToday && <span className="text-[10px] bg-red-500 text-white px-2 rounded-full">Aniversário!</span>}
                      </h3>
                      <p className="text-sm text-neutral-400 mt-1">
                        {dentist.telefone || 'Sem telefone'} {dentist.cidade ? `| ${dentist.cidade}` : ''}
                      </p>
                    </div>
                  </div>
                  
                  {/* Botões de Ação do Dentista */}
                  <div className="flex items-center gap-3 self-end md:self-auto w-full md:w-auto justify-end">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={(e) => {
                        e.stopPropagation(); 
                        setDentistForm({
                          nome: dentist.nome, 
                          telefone: dentist.telefone || '', 
                          cidade: dentist.cidade || '', 
                          dia: String(dentist.aniversario_dia || ''), 
                          mes: String(dentist.aniversario_mes || '')
                        }); 
                        setEditingDentistId(dentist.id); 
                        setIsDentistModalOpen(true);
                      }} 
                      className="text-neutral-400 hover:text-white"
                      title="Editar Parceiro"
                    >
                      <Pencil className="w-4 h-4"/>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={(e) => {
                        e.stopPropagation(); 
                        handleDeleteDentist(dentist.id);
                      }} 
                      className="text-neutral-400 hover:text-red-400"
                      title="Eliminar Parceiro"
                    >
                      <Trash2 className="w-4 h-4"/>
                    </Button>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-[#DEAE60]" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="border-t border-neutral-800 bg-neutral-950/50 p-6 space-y-6">
                    {groupedServices.length === 0 ? (
                      <p className="text-neutral-500 text-sm font-bold text-center py-4">Nenhum serviço finalizado para este parceiro.</p>
                    ) : (
                      groupedServices.map(([monthYear, monthServices]) => (
                        <div key={monthYear} className="border border-neutral-800 rounded-xl bg-neutral-900">
                          <div className="bg-neutral-800/50 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-800">
                            <h4 className="font-black text-white uppercase text-sm flex items-center">
                              <CalendarIcon className="w-4 h-4 text-[#DEAE60] mr-2"/> 
                              Fecho: {monthYear}
                            </h4>
                            <Button 
                              onClick={(e) => {
                                e.stopPropagation(); 
                                openDentistPdfModal(dentist, monthYear, monthServices);
                              }} 
                              variant="ghost" 
                              className="text-[#DEAE60] h-9 border border-[#DEAE60]/20 hover:bg-[#DEAE60]/10 w-full sm:w-auto"
                            >
                              <Printer className="w-4 h-4 mr-2" /> Exportar PDF c/ Custos
                            </Button>
                          </div>
                          
                          <div className="p-4 overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left min-w-[500px]">
                              <thead>
                                <tr className="border-b border-neutral-800">
                                  <th className="pb-2 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Data Saída</th>
                                  <th className="pb-2 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Procedimento Realizado</th>
                                  <th className="pb-2 text-[10px] font-bold text-neutral-500 uppercase tracking-widest text-right">Valor Registado</th>
                                  <th className="pb-2 text-[10px] font-bold text-neutral-500 uppercase tracking-widest text-center w-24">Ações</th>
                                </tr>
                              </thead>
                              <tbody>
                                {monthServices.map((s: any) => (
                                  <tr key={s.id} className="border-b border-neutral-800/50 hover:bg-neutral-800/20">
                                    <td className="py-3 text-xs text-neutral-400">
                                      {new Date(s.data_saida + "T00:00:00").toLocaleDateString('pt-BR')}
                                    </td>
                                    <td className="py-3 text-xs font-bold text-white uppercase">{s.procedimento}</td>
                                    <td className="py-3 text-xs font-black text-[#DEAE60] text-right">
                                      R$ {Number(s.valor_bruto).toFixed(2).replace('.', ',')}
                                    </td>
                                    <td className="py-3 text-center space-x-1">
                                      <Button 
                                        size="icon" 
                                        variant="ghost" 
                                        className="w-8 h-8 text-neutral-400 hover:text-white" 
                                        onClick={() => setLocation(`/services/${s.id}`)}
                                        title="Editar Serviço"
                                      >
                                        <Pencil className="w-4 h-4"/>
                                      </Button>
                                      <Button 
                                        size="icon" 
                                        variant="ghost" 
                                        className="w-8 h-8 text-neutral-400 hover:text-red-500 hover:bg-red-500/10" 
                                        onClick={() => handleDeleteService(s.id)}
                                        title="Eliminar Serviço"
                                      >
                                        <Trash2 className="w-4 h-4"/>
                                      </Button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </Card>
            );
          })}
          
          {dentists.length === 0 && (
            <div className="text-center py-12 border border-neutral-800 border-dashed rounded-xl bg-neutral-900/30">
              <Users className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
              <h3 className="text-lg font-black text-white uppercase">Nenhum parceiro cadastrado</h3>
              <p className="text-neutral-500 text-sm mt-2">Clique em "Cadastrar Parceiro" para começar.</p>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. COLABORADORES E PONTO (RH) */}
      {/* ========================================================================= */}
      <div className="border-t border-neutral-800 pt-10 mb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
              <UserCheck className="w-8 h-8 text-[#DEAE60]" /> Controlo de Ponto (RH)
            </h2>
            <p className="text-neutral-400 text-sm mt-1">Gira os horários da equipa, exporte os espelhos e integre os salários.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              variant="outline" 
              onClick={() => setIsColabModalOpen(true)} 
              className="border-neutral-700 text-white font-bold h-10 w-full sm:w-auto"
            >
              Novo Colaborador
            </Button>
            <Button 
              onClick={() => setIsPontoModalOpen(true)} 
              className="bg-[#DEAE60] hover:bg-[#DEAE60]/90 text-black font-bold h-10 w-full sm:w-auto"
            >
              <Clock className="w-4 h-4 mr-2" /> Bater Ponto
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {colaboradores.map((c) => {
            const isExpanded = expandedColab === c.id;
            const myPontos = pontos.filter(p => p.colaborador_id === c.id);
            const groupedPontos = groupDataByMonth(myPontos, 'data');

            return (
              <Card key={c.id} className="bg-neutral-900/80 border-neutral-800 shadow-xl transition-all">
                <div onClick={() => setExpandedColab(isExpanded ? null : c.id)} className="p-6 cursor-pointer hover:bg-neutral-800/30 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center font-black text-xl bg-neutral-800 text-neutral-300 border border-neutral-700">
                      {c.nome.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white uppercase">{c.nome}</h3>
                      <p className="text-sm text-neutral-400">{c.cargo || 'Equipa'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-[#DEAE60]" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="border-t border-neutral-800 bg-neutral-950/50 p-6 space-y-6">
                    {groupedPontos.length === 0 ? (
                      <p className="text-neutral-500 text-sm font-bold text-center py-4">Nenhum ponto registado para este colaborador.</p>
                    ) : (
                      groupedPontos.map(([monthYear, monthPontos]) => (
                        <div key={monthYear} className="border border-neutral-800 rounded-xl bg-neutral-900">
                          <div className="bg-neutral-800/50 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-800">
                            <h4 className="font-black text-white uppercase text-sm flex items-center">
                              <CalendarIcon className="w-4 h-4 text-[#DEAE60] mr-2"/> 
                              Fecho: {monthYear}
                            </h4>
                            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                              <Button 
                                onClick={(e) => {
                                  e.stopPropagation(); 
                                  printColaboradorPdf(c, monthYear, monthPontos, false);
                                }} 
                                variant="ghost" 
                                className="text-neutral-300 h-9 bg-neutral-800 hover:bg-neutral-700 w-full sm:w-auto"
                              >
                                <Eye className="w-4 h-4 mr-2" /> Visualizar Espelho
                              </Button>
                              <Button 
                                onClick={(e) => {
                                  e.stopPropagation(); 
                                  setPaymentValue(''); 
                                  setPaymentData({colab: c, month: monthYear, pontos: monthPontos}); 
                                  setIsPaymentModalOpen(true);
                                }} 
                                variant="ghost" 
                                className="text-green-400 h-9 bg-green-500/10 hover:bg-green-500/20 w-full sm:w-auto"
                              >
                                <DollarSign className="w-4 h-4 mr-2" /> Pagar & Exportar
                              </Button>
                            </div>
                          </div>
                          
                          <div className="p-4 overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left min-w-[500px]">
                              <thead>
                                <tr className="border-b border-neutral-800">
                                  <th className="pb-2 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Data</th>
                                  <th className="pb-2 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Entrada</th>
                                  <th className="pb-2 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Saída</th>
                                  <th className="pb-2 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Horas Cumpridas</th>
                                  <th className="pb-2 w-16"></th>
                                </tr>
                              </thead>
                              <tbody>
                                {monthPontos.map((p: any) => (
                                  <tr key={p.id} className="border-b border-neutral-800/50 hover:bg-neutral-800/20">
                                    <td className="py-3 text-xs text-neutral-400">
                                      {new Date(p.data + "T00:00:00").toLocaleDateString('pt-BR')}
                                    </td>
                                    <td className="py-3 text-xs font-black text-white">{p.entrada || '-'}</td>
                                    <td className="py-3 text-xs font-black text-white">{p.saida || '-'}</td>
                                    <td className="py-3 text-xs text-neutral-400 font-bold">
                                      {calcHoras(p.entrada, p.saida)}
                                    </td>
                                    <td className="py-3 text-center">
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="w-8 h-8 text-neutral-400 hover:text-red-500 hover:bg-red-500/10" 
                                        onClick={() => handleDeletePonto(p.id)}
                                        title="Eliminar Ponto"
                                      >
                                        <Trash2 className="w-4 h-4"/>
                                      </Button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </Card>
            );
          })}
          
          {colaboradores.length === 0 && (
            <div className="text-center py-12 border border-neutral-800 border-dashed rounded-xl bg-neutral-900/30">
              <UserCheck className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
              <h3 className="text-lg font-black text-white uppercase">Nenhuma equipa registada</h3>
              <p className="text-neutral-500 text-sm mt-2">Clique em "Novo Colaborador" para organizar o RH.</p>
            </div>
          )}
        </div>
      </div>

    </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SESSÃO 3: LOGÍSTICA & MOTOBOYS */}
      {/* ========================================================================= */}
      <div className="border-t border-neutral-800 pt-10 mb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
              <Bike className="w-8 h-8 text-[#DEAE60]" /> Motoboys e Logística
            </h2>
            <p className="text-neutral-400 text-sm mt-2">Controle rotas, taxas de entrega e gere extratos de acerto</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" onClick={() => setIsMotoboyModalOpen(true)} className="bg-transparent border-neutral-700 text-white hover:bg-neutral-800 font-bold rounded-lg h-10 w-full sm:w-auto">
              Novo Motoboy
            </Button>
            <Button onClick={() => setIsRotaModalOpen(true)} className="bg-[#DEAE60] hover:bg-[#DEAE60]/90 text-neutral-950 font-bold rounded-lg h-10 w-full sm:w-auto">
              <Map className="w-4 h-4 mr-2" /> Registrar Rota
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {motoboys.map((motoboy) => {
            const isExpanded = expandedMotoboy === motoboy.id;
            const myRotas = rotas.filter(r => r.motoboy_id === motoboy.id);
            const groupedRotas = groupDataByMonth(myRotas, 'data');

            return (
              <Card key={motoboy.id} className="bg-neutral-900/80 border-neutral-800 overflow-hidden shadow-xl transition-all">
                <div onClick={() => setExpandedMotoboy(isExpanded ? null : motoboy.id)} className="p-6 cursor-pointer hover:bg-neutral-800/30 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center font-black text-lg bg-neutral-800 text-neutral-300 border border-neutral-700">
                      {motoboy.nome.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                        {motoboy.nome}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-neutral-400 font-medium">
                        {motoboy.telefone && <span className="flex items-center gap-1"><Phone className="w-3 h-3"/> {motoboy.telefone}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-neutral-500 pl-16 md:pl-0">
                    <span className="text-xs font-bold uppercase tracking-widest bg-neutral-950 px-3 py-1 rounded-md border border-neutral-800">
                      {groupedRotas.length} Meses de Corridas
                    </span>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-[#DEAE60]" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-neutral-800 bg-neutral-950/50 p-6">
                    {groupedRotas.length === 0 ? (
                      <div className="text-center py-8 text-neutral-500 text-sm font-bold uppercase tracking-widest">Nenhuma corrida registrada para este motoboy.</div>
                    ) : (
                      <div className="space-y-6">
                        {groupedRotas.map(([monthYear, monthRotas]) => {
                          const totalMes = monthRotas.reduce((acc, curr) => acc + Number(curr.valor), 0);
                          return (
                            <div key={monthYear} className="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-900">
                              <div className="bg-neutral-800/50 p-4 flex items-center justify-between border-b border-neutral-800">
                                <div>
                                  <h4 className="font-black text-white uppercase tracking-widest text-sm flex items-center gap-2">
                                    <CalendarIcon className="w-4 h-4 text-[#DEAE60]"/> Fechamento: {monthYear}
                                  </h4>
                                  <p className="text-xs text-neutral-400 mt-1">{monthRotas.length} corridas registradas</p>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="text-right hidden sm:block">
                                    <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">A Pagar no Mês</p>
                                    <p className="text-lg font-black text-[#DEAE60]">R$ {totalMes.toFixed(2).replace('.', ',')}</p>
                                  </div>
                                  <Button onClick={(e) => { e.stopPropagation(); printMotoboyReport(motoboy, monthYear, monthRotas); }} variant="ghost" className="text-[#DEAE60] hover:bg-[#DEAE60]/10 hover:text-[#DEAE60] h-10 border border-[#DEAE60]/20">
                                    <Printer className="w-4 h-4 sm:mr-2" />
                                    <span className="hidden sm:inline uppercase text-xs font-bold tracking-widest">Imprimir Acerto</span>
                                  </Button>
                                </div>
                              </div>
                              <div className="p-4 overflow-x-auto custom-scrollbar">
                                <table className="w-full text-left min-w-[500px]">
                                  <thead>
                                    <tr className="border-b border-neutral-800">
                                      <th className="pb-2 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Data</th>
                                      <th className="pb-2 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Origem (De)</th>
                                      <th className="pb-2 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Destino (Para)</th>
                                      <th className="pb-2 text-[10px] font-bold text-neutral-500 uppercase tracking-widest text-right">Valor</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {monthRotas.map((rota: any) => (
                                      <tr key={rota.id} className="border-b border-neutral-800/50 last:border-0">
                                        <td className="py-3 text-xs text-neutral-400">{new Date(rota.data + "T00:00:00").toLocaleDateString('pt-BR')}</td>
                                        <td className="py-3 text-xs font-bold text-white uppercase">{rota.de_onde}</td>
                                        <td className="py-3 text-xs font-bold text-white uppercase">{rota.para_onde}</td>
                                        <td className="py-3 text-xs font-black text-white text-right">R$ {Number(rota.valor).toFixed(2).replace('.', ',')}</td>
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
          
          {motoboys.length === 0 && (
            <div className="text-center py-10 border border-neutral-800 border-dashed rounded-xl bg-neutral-900/30">
              <Bike className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
              <h3 className="text-lg font-black text-white uppercase">Nenhum motoboy cadastrado</h3>
              <p className="text-neutral-500 text-sm mt-2">Clique em "Novo Motoboy" para começar.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

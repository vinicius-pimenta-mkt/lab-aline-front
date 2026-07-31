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

  const [isEditRotaModalOpen, setIsEditRotaModalOpen] = useState(false);
  const [editingRotaId, setEditingRotaId] = useState<number | null>(null);

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
  
  // NOVO: Valor da hora pré-definido como 20
  const [hourlyRate, setHourlyRate] = useState("20");

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
  // DENTISTAS E SERVIÇOS
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

  // ==========================================
  // NOVAS FUNÇÕES: EXCLUIR COLABORADOR E MOTOBOY
  // ==========================================
  const handleDeleteColaborador = async (id: number) => {
    if (!confirm("Tem a certeza que deseja excluir este colaborador? Todo o histórico de ponto será apagado.")) return;
    try {
      await api.delete(`/colaboradores/${id}`);
      toast.success("Colaborador excluído com sucesso!");
      fetchData();
    } catch (e) { 
      toast.error("Erro ao excluir colaborador."); 
    }
  };

  const handleDeleteMotoboy = async (id: number) => {
    if (!confirm("Tem a certeza que deseja excluir este motoboy? Todo o histórico de corridas será apagado.")) return;
    try {
      await api.delete(`/motoboys/${id}`);
      toast.success("Motoboy excluído com sucesso!");
      fetchData();
    } catch (e) { 
      toast.error("Erro ao excluir motoboy."); 
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
    
    monthServices.forEach((s: any, idx: number) => {
      const dataFormatada = new Date(s.data_saida + "T00:00:00").toLocaleDateString('pt-BR');
      const valorFormatado = Number(s.valor_bruto).toFixed(2).replace('.', ',');
      
      const pacNome = s.paciente_nome ? s.paciente_nome.toUpperCase() : 'NÃO INFORMADO';
      const pacTel = s.paciente_telefone ? `<br/><span style="font-size:9px; color:#666;">📞 ${s.paciente_telefone}</span>` : '';
      
      rowsHtml += `
        <tr>
          <td class="center" style="color: #666;">${String(idx + 1).padStart(2, '0')}</td>
          <td>${dataFormatada}</td>
          <td><strong>${pacNome}</strong>${pacTel}</td>
          <td><strong>${s.procedimento.toUpperCase()}</strong></td>
          <td class="center">${s.forma_pagamento || '-'}</td>
          <td class="right" style="font-weight: bold;">R$ ${valorFormatado}</td>
        </tr>
      `;
    });

    const validExtras = extraCosts.filter(e => e.descricao && e.valor);
    validExtras.forEach((extra) => {
      const v = Number(extra.valor.replace(',', '.'));
      totalMes += v;
      const valorExtraFormatado = v.toFixed(2).replace('.', ',');
      
      rowsHtml += `
        <tr>
          <td class="center" style="color: #DEAE60;">•</td>
          <td>-</td>
          <td class="center">-</td>
          <td style="color: #666; font-style: italic;">[Custo Extra] ${extra.descricao.toUpperCase()}</td>
          <td class="center">-</td>
          <td class="right" style="color: #666; font-weight: bold;">R$ ${valorExtraFormatado}</td>
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
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; font-size: 11px; line-height: 1.5; padding: 10px; }
          .header { border-bottom: 2px solid #DEAE60; padding-bottom: 12px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center; }
          .header h1 { font-size: 18px; margin: 0; font-weight: 900; text-transform: uppercase; letter-spacing: -0.5px; color: #fff; }
          .header p { margin: 2px 0 0 0; font-size: 11px; color: #a3a3a3; text-transform: uppercase; tracking-widest: 1px; }
          .logo-area { background: #171717; padding: 15px 20px; border-radius: 10px; display: flex; align-items: center; gap: 15px; }
          .info { margin-bottom: 25px; background: #fafafa; padding: 15px; border: 1px solid #e5e5e7; border-radius: 12px; }
          .info p { margin: 4px 0; font-size: 12px; color: #1f1f23; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background-color: #fafafa; border-top: 1px solid #111; border-bottom: 2px solid #111; padding: 8px; text-align: left; font-size: 10px; text-transform: uppercase; font-weight: bold; color: #555; }
          td { padding: 9px 8px; border-bottom: 1px dashed #e5e5e7; font-size: 11px; }
          tr:hover { background-color: #fcfcfc; }
          .center { text-align: center; } .right { text-align: right; }
          .summary-box { width: 260px; float: right; margin-top: 20px; background: #fff; border-radius: 8px; }
          .summary-total { display: flex; justify-content: space-between; font-weight: 900; font-size: 15px; border-top: 2px solid #111; padding-top: 8px; color: #000; }
          .clear { clear: both; }
          .footer { text-align: center; margin-top: 50px; font-size: 10px; color: #888; border-top: 1px solid #e5e7eb; padding-top: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo-area">
            <img src="/logoaline.png" style="width: 45px; height: 44px; object-fit: contain;" />
            <div>
              <h1>ALINE ANTUNES</h1>
              <p>Prótese Odontológica</p>
            </div>
          </div>
          <div style="text-align: right; font-size: 10px; color: #666; font-weight: bold;">EMISSÃO: ${new Date().toLocaleDateString('pt-BR')}</div>
        </div>
        
        <div class="info">
          <p><strong>DENTISTA PARCEIRO:</strong> ${dentist.nome.toUpperCase()}</p>
          <p><strong>PERÍODO DE FECHAMENTO:</strong> Mês ${monthYear}</p>
        </div>

        <table>
          <thead>
            <tr>
              <th class="center" style="width: 5%;">#</th>
              <th style="width: 12%;">Data Saída</th>
              <th style="width: 28%;">Paciente / Contato</th>
              <th style="width: 30%;">Procedimento Executado</th>
              <th class="center" style="width: 10%;">Pagamento</th>
              <th class="right" style="width: 15%;">Valor</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="summary-box">
          <div class="summary-total">
            <span>TOTAL DO FECHAMENTO:</span>
            <span>R$ ${totalMes.toFixed(2).replace('.', ',')}</span>
          </div>
        </div>
        <div class="clear"></div>

        <div class="footer">
          <p>Relatório emitido eletronicamente • Sistema de Gestão Aline Antunes Prótese Odontológica</p>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); setIsExtraCostsModalOpen(false); }, 250);
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

  // NOVA LÓGICA DE CÁLCULO DE MINUTOS/HORAS REAIS
  const calcTotalMinutes = (ent: string, sai: string) => {
    if(!ent || !sai) return 0;
    const [h1, m1] = ent.split(':').map(Number);
    const [h2, m2] = sai.split(':').map(Number);
    let diff = (h2*60 + m2) - (h1*60 + m1);
    if(diff < 0) diff += 24*60;
    return diff;
  };

  const calcHoras = (ent: string, sai: string) => {
    const diff = calcTotalMinutes(ent, sai);
    if(diff === 0) return '-';
    return `${String(Math.floor(diff/60)).padStart(2,'0')}h${String(diff%60).padStart(2,'0')}m`;
  };

  // ==========================================
  // FUNÇÕES DE MOTOBOYS E ROTAS
  // ==========================================
  const handleSaveMotoboy = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/motoboys", motoboyForm);
      toast.success("Motoboy cadastrado com sucesso!");
      setIsMotoboyModalOpen(false);
      setMotoboyForm({ nome: "", telefone: "" });
      fetchData();
    } catch (e) {
      toast.error("Erro ao salvar motoboy.");
    }
  };

  const handleSaveRota = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/motoboys/rotas", {
        ...rotaForm,
        valor: parseFloat(rotaForm.valor.replace(',', '.'))
      });
      toast.success("Rota registrada com sucesso!");
      setIsRotaModalOpen(false);
      setRotaForm({ motoboy_id: "", data: "", de_onde: "", para_onde: "", valor: "" });
      fetchData();
    } catch (e) {
      toast.error("Erro ao salvar rota.");
    }
  };

  const handleDeleteRota = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir esta corrida?")) return;
    try {
      await api.delete(`/motoboys/rotas/${id}`);
      toast.success("Rota excluída com sucesso!");
      fetchData();
    } catch (e) {
      toast.error("Erro ao excluir rota.");
    }
  };

  const openEditRotaModal = (rota: any) => {
    setEditingRotaId(rota.id);
    setRotaForm({
      motoboy_id: rota.motoboy_id.toString(),
      data: rota.data ? rota.data.split('T')[0] : "",
      de_onde: rota.de_onde,
      para_onde: rota.para_onde,
      valor: rota.valor.toString()
    });
    setIsEditRotaModalOpen(true);
  };

  const handleEditRotaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put(`/motoboys/rotas/${editingRotaId}`, {
        ...rotaForm,
        valor: parseFloat(String(rotaForm.valor).replace(',', '.'))
      });
      toast.success("Rota atualizada com sucesso!");
      setIsEditRotaModalOpen(false);
      setEditingRotaId(null);
      setRotaForm({ motoboy_id: "", data: "", de_onde: "", para_onde: "", valor: "" });
      fetchData();
    } catch (e) {
      toast.error("Erro ao atualizar rota.");
    }
  };

  const printMotoboyReport = (motoboy: any, monthYear: string, rotas: any[]) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return toast.error("Permita pop-ups no navegador.");

    let totalMes = rotas.reduce((acc: number, curr: any) => acc + Number(curr.valor), 0);
    let rowsHtml = '';

    rotas.forEach((r: any, idx: number) => {
      rowsHtml += `
        <tr>
          <td class="center" style="color: #666;">${String(idx + 1).padStart(2, '0')}</td>
          <td>${new Date(r.data + "T00:00:00").toLocaleDateString('pt-BR')}</td>
          <td><strong>${r.de_onde.toUpperCase()}</strong></td>
          <td><strong>${r.para_onde.toUpperCase()}</strong></td>
          <td class="right" style="font-weight: bold;">R$ ${Number(r.valor).toFixed(2).replace('.', ',')}</td>
        </tr>
      `;
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Relatorio_Logistica_${motoboy.nome}_${monthYear.replace('/', '-')}</title>
        <style>
          @page { margin: 15mm; size: A4 portrait; }
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; font-size: 11px; line-height: 1.5; padding: 10px; }
          .header { border-bottom: 2px solid #DEAE60; padding-bottom: 12px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center; }
          .header h1 { font-size: 18px; margin: 0; font-weight: 900; text-transform: uppercase; color: #111; }
          .info { margin-bottom: 25px; background: #fafafa; padding: 15px; border: 1px solid #e5e5e7; border-radius: 12px; }
          .info p { margin: 4px 0; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background-color: #fafafa; border-top: 1px solid #111; border-bottom: 2px solid #111; padding: 8px; text-align: left; font-size: 10px; text-transform: uppercase; font-weight: bold; }
          td { padding: 9px 8px; border-bottom: 1px dashed #e5e5e7; font-size: 11px; }
          .center { text-align: center; } .right { text-align: right; }
          .summary-box { width: 260px; float: right; margin-top: 20px; background: #fff; border-radius: 8px; }
          .summary-total { display: flex; justify-content: space-between; font-weight: 900; font-size: 15px; border-top: 2px solid #111; padding-top: 8px; }
          .clear { clear: both; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>ALINE ANTUNES</h1>
            <p style="margin: 0; color: #666; text-transform: uppercase;">Controle de Logística e Motoboys</p>
          </div>
          <div style="text-align: right; font-size: 10px; color: #666; font-weight: bold;">EMISSÃO: ${new Date().toLocaleDateString('pt-BR')}</div>
        </div>
        <div class="info">
          <p><strong>MOTOBOY:</strong> ${motoboy.nome.toUpperCase()}</p>
          <p><strong>PERÍODO DE FECHAMENTO:</strong> Mês ${monthYear}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th class="center" style="width: 5%;">#</th>
              <th style="width: 15%;">Data</th>
              <th style="width: 30%;">Origem (De)</th>
              <th style="width: 30%;">Destino (Para)</th>
              <th class="right" style="width: 20%;">Valor (R$)</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
        <div class="summary-box">
          <div class="summary-total">
            <span>TOTAL A PAGAR:</span>
            <span>R$ ${totalMes.toFixed(2).replace('.', ',')}</span>
          </div>
        </div>
        <div class="clear"></div>
      </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
  };

  // ==========================================
  // PDF RH & SINCRONIZAÇÃO FINANCEIRA
  // ==========================================
  const printColaboradorPdf = async (colaborador: any, monthYear: string, pontos: any[], isPayment: boolean, calculatedTotal: number = 0) => {
    if (isPayment) {
      if (calculatedTotal <= 0) {
        return toast.error("Não há valor a pagar (verifique as horas batidas ou o valor da hora).");
      }
      try {
        await api.post("/colaboradores/pagamento", { 
          colaborador_nome: colaborador.nome, 
          valor: calculatedTotal, 
          mes_ref: monthYear 
        });
        toast.success("Folha de pagamento lançada nos Relatórios de Custos!");
        setIsPaymentModalOpen(false);
      } catch(e) { 
        return toast.error("Erro ao lançar custo no financeiro."); 
      }
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return toast.error("Permita pop-ups no navegador.");

    let rowsHtml = '';
    pontos.forEach((p: any, idx: number) => {
      rowsHtml += `
        <tr>
          <td class="center" style="color: #666;">${String(idx + 1).padStart(2, '0')}</td>
          <td>${new Date(p.data + "T00:00:00").toLocaleDateString('pt-BR')}</td>
          <td class="center" style="font-weight: bold;">${p.entrada || '-'}</td>
          <td class="center" style="font-weight: bold;">${p.saida || '-'}</td>
          <td class="center" style="color: #555;">${calcHoras(p.entrada, p.saida)}</td>
        </tr>
      `;
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Relatório_Ponto_${colaborador.nome}_${monthYear.replace('/', '-')}</title>
        <style>
          @page { margin: 15mm; size: A4 portrait; }
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; font-size: 11px; line-height: 1.5; padding: 10px; }
          .header { border-bottom: 2px solid #DEAE60; padding-bottom: 12px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center; }
          .header h1 { font-size: 18px; margin: 0; font-weight: 900; text-transform: uppercase; letter-spacing: -0.5px; color: #fff; }
          .header p { margin: 2px 0 0 0; font-size: 11px; color: #a3a3a3; text-transform: uppercase; }
          .logo-area { background: #171717; padding: 15px 20px; border-radius: 10px; display: flex; align-items: center; gap: 15px; }
          .info { margin-bottom: 25px; background: #fafafa; padding: 15px; border: 1px solid #e5e7eb; border-radius: 12px; }
          .info p { margin: 4px 0; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background-color: #fafafa; border-top: 1px solid #111; border-bottom: 2px solid #111; padding: 8px; text-align: left; font-size: 10px; text-transform: uppercase; font-weight: bold; }
          td { padding: 9px 8px; border-bottom: 1px dashed #e5e7eb; font-size: 11px; }
          .center { text-align: center; } .right { text-align: right; }
          .summary-box { width: 300px; float: right; margin-top: 20px; background: #f0fdfa; padding: 12px; border: 1px solid #14b8a6; border-radius: 8px; }
          .summary-total { display: flex; justify-content: space-between; font-weight: 900; font-size: 14px; color: #0f766e; }
          .clear { clear: both; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo-area">
            <img src="/logoaline.png" style="width: 45px; height: 44px;" />
            <div>
              <h1>ALINE ANTUNES</h1>
              <p>Recursos Humanos (RH)</p>
            </div>
          </div>
          <div style="text-align: right; font-size: 10px; color: #666;">FECHAMENTO: ${new Date().toLocaleDateString('pt-BR')}</div>
        </div>
        
        <div class="info">
          <p><strong>COLABORADOR:</strong> ${colaborador.nome.toUpperCase()}</p>
          <p><strong>CARGO/FUNÇÃO:</strong> ${colaborador.cargo || 'Não especificado'}</p>
          <p><strong>PERÍODO DE APURAÇÃO:</strong> Mês ${monthYear}</p>
        </div>

        <table>
          <thead>
            <tr>
              <th class="center" style="width: 5%;">#</th>
              <th style="width: 25%;">Data do Expediente</th>
              <th class="center" style="width: 20%;">Horário Entrada</th>
              <th class="center" style="width: 20%;">Horário Saída</th>
              <th class="center" style="width: 30%;">Total de Horas do Dia</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        ${isPayment ? `
          <div class="summary-box">
            <div class="summary-total">
              <span>SALÁRIO LÍQUIDO A PAGAR:</span>
              <span>R$ ${calculatedTotal.toFixed(2).replace('.', ',')}</span>
            </div>
            <p style="font-size: 9px; color: #666; margin-top: 6px; text-align: center; margin-bottom: 0;">Calculado automaticamente com base em horas trabalhadas. Lançado nas despesas operacionais.</p>
          </div>
        ` : ''}
        <div class="clear"></div>
      </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
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
      {/* MODAL PAGAMENTO COLABORADOR - LÓGICA DE CALCULO AUTOMÁTICO */}
      {/* ========================================================================= */}
      {isPaymentModalOpen && paymentData && (() => {
        const totalMin = paymentData.pontos.reduce((acc: number, p: any) => acc + calcTotalMinutes(p.entrada, p.saida), 0);
        const totalHrs = totalMin / 60;
        const rate = Number(hourlyRate.replace(',', '.')) || 0;
        const totalToPay = totalHrs * rate;

        return (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl w-full max-w-sm shadow-2xl relative">
              <button onClick={() => setIsPaymentModalOpen(false)} className="absolute top-4 right-4 text-neutral-500 hover:text-white">
                <X className="w-5 h-5"/>
              </button>
              <h3 className="text-xl font-black text-white uppercase mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-500"/> Pagar Colaborador
              </h3>
              <p className="text-xs text-neutral-400 mb-6">
                Este valor será calculado automaticamente e deduzido como Custo Operacional nos Relatórios.
              </p>
              
              <div className="space-y-4 mb-6">
                <div className="bg-neutral-950 p-4 rounded-lg border border-neutral-800">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-neutral-500 font-bold uppercase">Total de Horas do Mês</span>
                    <span className="text-sm font-black text-white">{Math.floor(totalMin/60)}h {totalMin%60}m</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-neutral-400 uppercase font-bold">Valor da Hora (R$)</Label>
                  <Input 
                    type="number" 
                    step="0.01" 
                    value={hourlyRate} 
                    onChange={e => setHourlyRate(e.target.value)} 
                    placeholder="20.00" 
                    className={inputBaseStyle} 
                  />
                </div>

                <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/20 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-green-500 font-bold uppercase">Total a Pagar</span>
                    <span className="text-xl font-black text-green-400">R$ {totalToPay.toFixed(2).replace('.', ',')}</span>
                  </div>
                </div>
              </div>

              <Button 
                onClick={() => printColaboradorPdf(paymentData.colab, paymentData.month, paymentData.pontos, true, totalToPay)} 
                className="w-full bg-green-500 hover:bg-green-600 text-black font-black"
              >
                Confirmar e Gerar PDF
              </Button>
            </div>
          </div>
        );
      })()}

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
      {/* MODAL: NOVO MOTOBOY E ROTA */}
      {/* ========================================================================= */}
      {isMotoboyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl w-full max-w-md relative">
            <button onClick={() => setIsMotoboyModalOpen(false)} className="absolute top-4 right-4 text-neutral-500">
              <X className="w-5 h-5"/>
            </button>
            <h3 className="text-xl font-black text-white uppercase mb-6 flex items-center gap-2">
              <Bike className="w-5 h-5 text-[#DEAE60]"/> Novo Motoboy
            </h3>
            <form onSubmit={handleSaveMotoboy} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-neutral-400 uppercase">Nome *</Label>
                <Input required value={motoboyForm.nome} onChange={e => setMotoboyForm({...motoboyForm, nome: e.target.value})} className={inputBaseStyle} placeholder="Nome do Motoboy" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-neutral-400 uppercase">Telefone</Label>
                <Input value={motoboyForm.telefone} onChange={e => setMotoboyForm({...motoboyForm, telefone: e.target.value})} className={inputBaseStyle} placeholder="Telefone" />
              </div>
              <Button type="submit" className="w-full bg-[#DEAE60] hover:bg-[#DEAE60]/90 text-black font-black mt-4">
                Salvar Motoboy
              </Button>
            </form>
          </div>
        </div>
      )}

      {isRotaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl w-full max-w-md relative">
            <button onClick={() => setIsRotaModalOpen(false)} className="absolute top-4 right-4 text-neutral-500">
              <X className="w-5 h-5"/>
            </button>
            <h3 className="text-xl font-black text-white uppercase mb-6 flex items-center gap-2">
              <Map className="w-5 h-5 text-[#DEAE60]"/> Registrar Rota
            </h3>
            <form onSubmit={handleSaveRota} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-neutral-400 uppercase">Motoboy *</Label>
                <Select required value={rotaForm.motoboy_id} onValueChange={v => setRotaForm({...rotaForm, motoboy_id: v})}>
                  <SelectTrigger className={inputBaseStyle}>
                    <SelectValue placeholder="Selecione o Motoboy"/>
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                    {motoboys.map(m => (
                      <SelectItem key={m.id} value={m.id.toString()}>{m.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-neutral-400 uppercase">Data *</Label>
                <Input required type="date" value={rotaForm.data} onChange={e => setRotaForm({...rotaForm, data: e.target.value})} className={inputBaseStyle} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-neutral-400 uppercase">De Onde *</Label>
                  <Input required value={rotaForm.de_onde} onChange={e => setRotaForm({...rotaForm, de_onde: e.target.value})} className={inputBaseStyle} placeholder="Ex: Clínica" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-neutral-400 uppercase">Para Onde *</Label>
                  <Input required value={rotaForm.para_onde} onChange={e => setRotaForm({...rotaForm, para_onde: e.target.value})} className={inputBaseStyle} placeholder="Ex: Laboratório" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-neutral-400 uppercase">Valor da Corrida (R$) *</Label>
                <Input required type="number" step="0.01" value={rotaForm.valor} onChange={e => setRotaForm({...rotaForm, valor: e.target.value})} className={inputBaseStyle} placeholder="0.00" />
              </div>
              <Button type="submit" className="w-full bg-[#DEAE60] hover:bg-[#DEAE60]/90 text-black font-black mt-4">
                Salvar Rota
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDITAR ROTA */}
      {/* ========================================================================= */}
      {isEditRotaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl w-full max-w-md relative shadow-2xl">
            <button onClick={() => { setIsEditRotaModalOpen(false); setEditingRotaId(null); setRotaForm({ motoboy_id: "", data: "", de_onde: "", para_onde: "", valor: "" }); }} className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors">
              <X className="w-5 h-5"/>
            </button>
            <h3 className="text-xl font-black text-white uppercase mb-6 flex items-center gap-2">
              <Pencil className="w-5 h-5 text-[#DEAE60]"/> Editar Corrida
            </h3>
            <form onSubmit={handleEditRotaSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-neutral-400 uppercase">Motoboy *</Label>
                <Select required value={rotaForm.motoboy_id} onValueChange={v => setRotaForm({...rotaForm, motoboy_id: v})}>
                  <SelectTrigger className={inputBaseStyle}>
                    <SelectValue placeholder="Selecione o Motoboy"/>
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                    {motoboys.map(m => (
                      <SelectItem key={m.id} value={m.id.toString()}>{m.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-neutral-400 uppercase">Data *</Label>
                <Input required type="date" value={rotaForm.data} onChange={e => setRotaForm({...rotaForm, data: e.target.value})} className={inputBaseStyle} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-neutral-400 uppercase">De Onde *</Label>
                  <Input required value={rotaForm.de_onde} onChange={e => setRotaForm({...rotaForm, de_onde: e.target.value})} className={inputBaseStyle} placeholder="Ex: Clínica" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-neutral-400 uppercase">Para Onde *</Label>
                  <Input required value={rotaForm.para_onde} onChange={e => setRotaForm({...rotaForm, para_onde: e.target.value})} className={inputBaseStyle} placeholder="Ex: Laboratório" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-neutral-400 uppercase">Valor da Corrida (R$) *</Label>
                <Input required type="number" step="0.01" value={rotaForm.valor} onChange={e => setRotaForm({...rotaForm, valor: e.target.value})} className={inputBaseStyle} placeholder="0.00" />
              </div>
              <Button type="submit" className="w-full bg-[#DEAE60] hover:bg-[#DEAE60]/90 text-black font-black mt-4">
                Atualizar Rota
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
                                  <th className="pb-2 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Paciente / Contato</th>
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
                                    <td className="py-3 text-xs font-bold text-neutral-300 uppercase">
                                      {s.paciente_nome || 'NÃO INFORMADO'}
                                      {s.paciente_telefone && <span className="block text-[10px] text-neutral-500 font-normal mt-0.5">📞 {s.paciente_telefone}</span>}
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
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      onClick={(e) => { e.stopPropagation(); handleDeleteColaborador(c.id); }} 
                      className="w-8 h-8 p-0 text-neutral-500 hover:text-red-500 hover:bg-red-500/10" 
                      title="Excluir Colaborador"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <div className="flex items-center justify-center w-8 h-8">
                      {isExpanded ? <ChevronUp className="w-5 h-5 text-[#DEAE60]" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
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
                                  setHourlyRate("20"); // Reseta para o valor padrão sempre que abrir
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
                  <div className="flex items-center gap-3 text-neutral-500 pl-16 md:pl-0">
                    <span className="hidden sm:inline-block text-xs font-bold uppercase tracking-widest bg-neutral-950 px-3 py-1 rounded-md border border-neutral-800">
                      {groupedRotas.length} Meses
                    </span>
                    <Button 
                      variant="ghost" 
                      onClick={(e) => { e.stopPropagation(); handleDeleteMotoboy(motoboy.id); }} 
                      className="w-8 h-8 p-0 text-neutral-500 hover:text-red-500 hover:bg-red-500/10" 
                      title="Excluir Motoboy"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <div className="flex items-center justify-center w-8 h-8">
                      {isExpanded ? <ChevronUp className="w-5 h-5 text-[#DEAE60]" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
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
                                      <th className="pb-2 text-[10px] font-bold text-neutral-500 uppercase tracking-widest text-center w-24">Ações</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {monthRotas.map((rota: any) => (
                                      <tr key={rota.id} className="border-b border-neutral-800/50 last:border-0 hover:bg-neutral-800/20 transition-colors">
                                        <td className="py-3 text-xs text-neutral-400">{new Date(rota.data + "T00:00:00").toLocaleDateString('pt-BR')}</td>
                                        <td className="py-3 text-xs font-bold text-white uppercase">{rota.de_onde}</td>
                                        <td className="py-3 text-xs font-bold text-white uppercase">{rota.para_onde}</td>
                                        <td className="py-3 text-xs font-black text-white text-right">R$ {Number(rota.valor).toFixed(2).replace('.', ',')}</td>
                                        <td className="py-3 text-center space-x-1">
                                          <Button 
                                            size="icon" 
                                            variant="ghost" 
                                            className="w-8 h-8 text-neutral-400 hover:text-white" 
                                            onClick={(e) => { e.stopPropagation(); openEditRotaModal(rota); }}
                                          >
                                            <Pencil className="w-4 h-4"/>
                                          </Button>
                                          <Button 
                                            size="icon" 
                                            variant="ghost" 
                                            className="w-8 h-8 text-neutral-400 hover:text-red-500 hover:bg-red-500/10" 
                                            onClick={(e) => { e.stopPropagation(); handleDeleteRota(rota.id); }}
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

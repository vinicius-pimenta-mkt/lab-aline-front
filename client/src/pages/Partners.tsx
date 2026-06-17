import { useState, useEffect } from "react";
import api from "../lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Users, Plus, Printer, Gift, ChevronDown, ChevronUp, MapPin, Phone, Calendar as CalendarIcon, X, Bike, Map } from "lucide-react";

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

interface Motoboy {
  id: number;
  nome: string;
  telefone: string;
}

interface Rota {
  id: number;
  motoboy_id: number;
  data: string;
  de_onde: string;
  para_onde: string;
  valor: number;
}

export default function Partners() {
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [motoboys, setMotoboys] = useState<Motoboy[]>([]);
  const [rotas, setRotas] = useState<Rota[]>([]);
  
  const [loading, setLoading] = useState(true);
  
  // Controles de Dentista
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ nome: "", telefone: "", cidade: "", dia: "", mes: "" });
  const [expandedDentist, setExpandedDentist] = useState<number | null>(null);

  // Controles de Motoboy
  const [isMotoboyModalOpen, setIsMotoboyModalOpen] = useState(false);
  const [isRotaModalOpen, setIsRotaModalOpen] = useState(false);
  const [expandedMotoboy, setExpandedMotoboy] = useState<number | null>(null);
  
  const [motoboyForm, setMotoboyForm] = useState({ nome: "", telefone: "" });
  const [rotaForm, setRotaForm] = useState({ motoboy_id: "", data: "", de_onde: "", para_onde: "", valor: "" });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dentistsRes, servicesRes, motoboysRes, rotasRes] = await Promise.all([
        api.get("/dentistas"),
        api.get("/trabalhos"),
        api.get("/motoboys").catch(() => ({ data: [] })),
        api.get("/motoboys/rotas").catch(() => ({ data: [] }))
      ]);
      
      setDentists(dentistsRes.data || []);
      const completed = (servicesRes.data || []).filter((s: any) => s.status === "Finalizado" && s.data_saida);
      setServices(completed);
      
      setMotoboys(motoboysRes.data || []);
      setRotas(rotasRes.data || []);
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

  // ==========================================
  // DENTISTAS
  // ==========================================
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

  const getGroupedServices = (dentistName: string) => {
    const dentistServices = services.filter(s => s.dentista_nome?.toLowerCase() === dentistName.toLowerCase());
    const grouped: Record<string, Service[]> = {};
    dentistServices.forEach(s => {
      const date = new Date(s.data_saida + "T00:00:00");
      const monthYear = `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
      if (!grouped[monthYear]) grouped[monthYear] = [];
      grouped[monthYear].push(s);
    });
    return Object.entries(grouped).sort((a, b) => {
      const [mA, yA] = a[0].split('/');
      const [mB, yB] = b[0].split('/');
      return new Date(Number(yB), Number(mB) - 1).getTime() - new Date(Number(yA), Number(mA) - 1).getTime();
    });
  };

  // ==========================================
  // MOTOBOYS E ROTAS
  // ==========================================
  const handleCreateMotoboy = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/motoboys", motoboyForm);
      toast.success("Motoboy cadastrado!");
      setIsMotoboyModalOpen(false);
      setMotoboyForm({ nome: "", telefone: "" });
      fetchData();
    } catch (error) {
      toast.error("Erro ao cadastrar motoboy");
    }
  };

  const handleCreateRota = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/motoboys/rotas", {
        motoboy_id: rotaForm.motoboy_id,
        data: rotaForm.data,
        de_onde: rotaForm.de_onde,
        para_onde: rotaForm.para_onde,
        valor: parseFloat(rotaForm.valor)
      });
      toast.success("Rota registrada com sucesso!");
      setIsRotaModalOpen(false);
      setRotaForm({ motoboy_id: "", data: "", de_onde: "", para_onde: "", valor: "" });
      fetchData();
    } catch (error) {
      toast.error("Erro ao registrar rota");
    }
  };

  const getGroupedRotas = (motoboyId: number) => {
    const mRotas = rotas.filter(r => r.motoboy_id === motoboyId);
    const grouped: Record<string, Rota[]> = {};
    mRotas.forEach(r => {
      const date = new Date(r.data + "T00:00:00");
      const monthYear = `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
      if (!grouped[monthYear]) grouped[monthYear] = [];
      grouped[monthYear].push(r);
    });
    return Object.entries(grouped).sort((a, b) => {
      const [mA, yA] = a[0].split('/');
      const [mB, yB] = b[0].split('/');
      return new Date(Number(yB), Number(mB) - 1).getTime() - new Date(Number(yA), Number(mA) - 1).getTime();
    });
  };


  // ==========================================
  // IMPRESSÕES DE PDF
  // ==========================================
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
      <!DOCTYPE html><html><head><title>Relatorio_Mensal_${dentist.nome}_${monthYear.replace('/', '-')}</title>
        <style>
          @page { margin: 15mm; size: A4 portrait; }
          body { font-family: Arial, sans-serif; color: #000; font-size: 12px; line-height: 1.5; padding: 10px; }
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
      </head><body>
        <div class="header"><h1>ALINE ANTUNES PRÓTESE ODONTOLÓGICA</h1><p>Telefone: (31) 99526-3682</p><p>Relatório de Fechamento Mensal - Parcerias</p></div>
        <div class="info"><p><strong>Dentista / Parceiro:</strong> ${dentist.nome.toUpperCase()}</p><p><strong>Telefone:</strong> ${dentist.telefone || "Não cadastrado"}</p><p><strong>Período de Referência:</strong> Mês ${monthYear}</p></div>
        <table><thead><tr><th class="center" style="width: 5%;">#</th><th style="width: 15%;">Data</th><th style="width: 45%;">Procedimento Realizado</th><th class="center" style="width: 15%;">Pagamento</th><th class="right" style="width: 20%;">Valor Cobrado</th></tr></thead>
        <tbody>${rowsHtml}</tbody></table>
        <div class="summary"><div class="summary-total"><span>TOTAL DO MÊS:</span><span>R$ ${totalMes.toFixed(2).replace('.', ',')}</span></div></div>
        <div class="clear" style="padding-top: 40px; text-align: center; font-size: 10px; color: #666;"><p>Documento gerado em ${dataEmissao} pelo Sistema de Gestão Aline Antunes.</p></div>
      </body></html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
  };

  const printMotoboyReport = (motoboy: Motoboy, monthYear: string, monthRotas: Rota[]) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return toast.error("Permita pop-ups para gerar o PDF.");

    const dataEmissao = new Date().toLocaleDateString('pt-BR');
    const totalMes = monthRotas.reduce((acc, curr) => acc + Number(curr.valor), 0);

    let rowsHtml = '';
    monthRotas.forEach((r, idx) => {
      const dataFormatada = new Date(r.data + "T00:00:00").toLocaleDateString('pt-BR');
      rowsHtml += `
        <tr>
          <td class="center">${String(idx + 1).padStart(2, '0')}</td>
          <td>${dataFormatada}</td>
          <td>${r.de_onde.toUpperCase()}</td>
          <td>${r.para_onde.toUpperCase()}</td>
          <td class="right">R$ ${Number(r.valor).toFixed(2).replace('.', ',')}</td>
        </tr>
      `;
    });

    const htmlContent = `
      <!DOCTYPE html><html><head><title>Relatorio_Logistica_${motoboy.nome}_${monthYear.replace('/', '-')}</title>
        <style>
          @page { margin: 15mm; size: A4 portrait; }
          body { font-family: Arial, sans-serif; color: #000; font-size: 12px; line-height: 1.5; padding: 10px; }
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
      </head><body>
        <div class="header"><h1>ALINE ANTUNES PRÓTESE ODONTOLÓGICA</h1><p>Telefone: (31) 99526-3682</p><p>Relatório de Acerto Logístico - Motoboys</p></div>
        <div class="info"><p><strong>Motoboy Responsável:</strong> ${motoboy.nome.toUpperCase()}</p><p><strong>Telefone:</strong> ${motoboy.telefone || "Não cadastrado"}</p><p><strong>Período de Referência:</strong> Mês ${monthYear}</p></div>
        <table><thead><tr><th class="center" style="width: 5%;">#</th><th style="width: 15%;">Data</th><th style="width: 30%;">Origem (De)</th><th style="width: 30%;">Destino (Para)</th><th class="right" style="width: 20%;">Custo (R$)</th></tr></thead>
        <tbody>${rowsHtml}</tbody></table>
        <div class="summary"><div class="summary-total"><span>TOTAL A PAGAR:</span><span>R$ ${totalMes.toFixed(2).replace('.', ',')}</span></div></div>
        <div class="clear" style="padding-top: 40px; text-align: center; font-size: 10px; color: #666;"><p>Documento gerado em ${dataEmissao} pelo Sistema de Gestão Aline Antunes.</p></div>
      </body></html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
  };

  const inputBaseStyle = "bg-neutral-900 border-neutral-800 text-white placeholder-neutral-600 focus-visible:ring-1 focus-visible:ring-[#DEAE60]/50 transition-all";

  if (loading) return <div className="min-h-screen bg-transparent p-6 text-[#DEAE60] font-bold text-center py-20">Carregando dados...</div>;

  return (
    <div className="min-h-screen bg-transparent p-6 relative">
      
      {/* ==================================== */}
      {/* MODAL 1: NOVO DENTISTA */}
      {/* ==================================== */}
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

      {/* ==================================== */}
      {/* MODAL 2: NOVO MOTOBOY */}
      {/* ==================================== */}
      {isMotoboyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl w-full max-w-md shadow-2xl relative">
            <button onClick={() => setIsMotoboyModalOpen(false)} className="absolute top-4 right-4 p-1 text-neutral-500 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-black text-white uppercase tracking-tight mb-6 flex items-center gap-2">
              <Bike className="w-5 h-5 text-[#DEAE60]" /> Novo Motoboy
            </h3>
            <form onSubmit={handleCreateMotoboy} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-neutral-400 uppercase">Nome *</Label>
                <Input required value={motoboyForm.nome} onChange={e => setMotoboyForm({...motoboyForm, nome: e.target.value})} className={inputBaseStyle} placeholder="Ex: Roberto Carlos" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-neutral-400 uppercase">Telefone</Label>
                <Input value={motoboyForm.telefone} onChange={e => setMotoboyForm({...motoboyForm, telefone: e.target.value})} className={inputBaseStyle} placeholder="(00) 00000-0000" />
              </div>
              <div className="pt-4 flex gap-3">
                <Button type="button" onClick={() => setIsMotoboyModalOpen(false)} className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white">Cancelar</Button>
                <Button type="submit" className="flex-1 bg-[#DEAE60] hover:bg-[#DEAE60]/90 text-neutral-950 font-black">Salvar</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================== */}
      {/* MODAL 3: NOVA ROTA (CORRIDA) */}
      {/* ==================================== */}
      {isRotaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl w-full max-w-md shadow-2xl relative">
            <button onClick={() => setIsRotaModalOpen(false)} className="absolute top-4 right-4 p-1 text-neutral-500 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-black text-white uppercase tracking-tight mb-6 flex items-center gap-2">
              <Map className="w-5 h-5 text-[#DEAE60]" /> Registrar Corrida
            </h3>
            <form onSubmit={handleCreateRota} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-neutral-400 uppercase">Selecione o Motoboy *</Label>
                <Select value={rotaForm.motoboy_id} onValueChange={val => setRotaForm({...rotaForm, motoboy_id: val})}>
                  <SelectTrigger className="bg-neutral-900 border-neutral-800 text-white h-10"><SelectValue placeholder="Escolha um motoboy" /></SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                    {motoboys.map(m => <SelectItem key={m.id} value={m.id.toString()}>{m.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-neutral-400 uppercase">Data da Corrida *</Label>
                <Input required type="date" value={rotaForm.data} onChange={e => setRotaForm({...rotaForm, data: e.target.value})} className={inputBaseStyle} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-neutral-400 uppercase">De (Origem) *</Label>
                  <Input required value={rotaForm.de_onde} onChange={e => setRotaForm({...rotaForm, de_onde: e.target.value})} className={inputBaseStyle} placeholder="Laboratório" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-neutral-400 uppercase">Para (Destino) *</Label>
                  <Input required value={rotaForm.para_onde} onChange={e => setRotaForm({...rotaForm, para_onde: e.target.value})} className={inputBaseStyle} placeholder="Consultório" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-neutral-400 uppercase">Valor Cobrado (R$) *</Label>
                <Input required type="number" step="0.01" value={rotaForm.valor} onChange={e => setRotaForm({...rotaForm, valor: e.target.value})} className={inputBaseStyle} placeholder="0.00" />
              </div>
              
              <div className="pt-4 flex gap-3">
                <Button type="button" onClick={() => setIsRotaModalOpen(false)} className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white">Cancelar</Button>
                <Button type="submit" className="flex-1 bg-[#DEAE60] hover:bg-[#DEAE60]/90 text-neutral-950 font-black">Salvar</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SESSÃO 1: DENTISTAS PARCEIROS */}
      {/* ========================================================================= */}
      <div className="mb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">Dentistas Parceiros</h1>
            <p className="text-neutral-400 text-sm mt-2">Gerencie sua rede de dentistas e exporte fechamentos mensais</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="bg-[#DEAE60] hover:bg-[#DEAE60]/90 text-neutral-950 font-bold rounded-lg h-10 w-full md:w-auto">
            <Plus className="w-4 h-4 mr-2" /> Novo Parceiro
          </Button>
        </div>

        <div className="space-y-4">
          {dentists.map((dentist) => {
            const birthdayToday = isBirthday(dentist.aniversario_dia, dentist.aniversario_mes);
            const isExpanded = expandedDentist === dentist.id;
            const groupedServices = getGroupedServices(dentist.nome);

            return (
              <Card key={dentist.id} className="bg-neutral-900/80 border-neutral-800 overflow-hidden shadow-xl transition-all">
                <div onClick={() => setExpandedDentist(isExpanded ? null : dentist.id)} className="p-6 cursor-pointer hover:bg-neutral-800/30 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
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

                {isExpanded && (
                  <div className="border-t border-neutral-800 bg-neutral-950/50 p-6">
                    {groupedServices.length === 0 ? (
                      <div className="text-center py-8 text-neutral-500 text-sm font-bold uppercase tracking-widest">Nenhum serviço finalizado registrado para este dentista.</div>
                    ) : (
                      <div className="space-y-6">
                        {groupedServices.map(([monthYear, monthServices]) => {
                          const totalMes = monthServices.reduce((acc, curr) => acc + Number(curr.valor_bruto), 0);
                          return (
                            <div key={monthYear} className="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-900">
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
                                  <Button onClick={(e) => { e.stopPropagation(); printMonthlyReport(dentist, monthYear, monthServices); }} variant="ghost" className="text-[#DEAE60] hover:bg-[#DEAE60]/10 hover:text-[#DEAE60] h-10 border border-[#DEAE60]/20">
                                    <Printer className="w-4 h-4 sm:mr-2" />
                                    <span className="hidden sm:inline uppercase text-xs font-bold tracking-widest">Imprimir</span>
                                  </Button>
                                </div>
                              </div>
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
          {dentists.length === 0 && (
            <div className="text-center py-10 border border-neutral-800 border-dashed rounded-xl bg-neutral-900/30">
              <Users className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
              <h3 className="text-lg font-black text-white uppercase">Nenhum parceiro cadastrado</h3>
            </div>
          )}
        </div>
      </div>


      {/* ========================================================================= */}
      {/* SESSÃO 2: LOGÍSTICA & MOTOBOYS */}
      {/* ========================================================================= */}
      <div className="border-t border-neutral-800 pt-10">
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
            const groupedRotas = getGroupedRotas(motoboy.id);

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
                                    {monthRotas.map(rota => (
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

import { useState, useEffect } from "react";
import api from "../lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Users, Plus, Printer, CalendarDays, Syringe, Clock, X, LogOut, Search, Trash2, RefreshCw, Receipt, Pencil } from "lucide-react";
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [periodFilter, setPeriodFilter] = useState("30"); 
  
  const defaultProcedure = "Limpeza Profissional (TSB)";
  const [formData, setFormData] = useState({
    nome: "", telefone: "", procedimento: defaultProcedure,
    recorrencia_meses: "6", data_inicio: new Date().toISOString().split('T')[0],
    ultimo_atendimento: new Date().toISOString().split('T')[0],
    proximo_atendimento: ""
  });

  // =========================================================================
  // NOVOS ESTADOS DA GESTÃO FINANCEIRA TSB (SOLICITAÇÃO ALINE)
  // =========================================================================
  const [activeTab, setActiveTab] = useState<"recorrencias" | "financas">("recorrencias");
  const [atendimentos, setAtendimentos] = useState<any[]>([]);
  const [filtroFinancas, setFiltroFinancas] = useState("mes");
  const [isAtendimentoModalOpen, setIsAtendimentoModalOpen] = useState(false);
  const [editingAtendimentoId, setEditingAtendimentoId] = useState<number | null>(null);

  const LISTA_PROCEDIMENTOS_PADRAO = [
    { name: "Limpeza", price: 180 },
    { name: "Limpeza protocolo", price: 200 },
    { name: "Radiografia", price: 50 },
    { name: "Clareamento", price: 520 },
    { name: "Emergência", price: 80 }
  ];

  const [atendimentoForm, setAtendimentoForm] = useState({
    paciente_selecionado: "novo",
    paciente_nome: "",
    paciente_telefone: "",
    data: new Date().toISOString().split('T')[0],
    descricao: "",
    procedimentos: LISTA_PROCEDIMENTOS_PADRAO.map(p => ({ name: p.name, checked: false, value: p.price.toString() }))
  });

  // =========================================================================
  // CARGA DE DADOS
  // =========================================================================
  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem("tsb_token");
      const response = await api.get("/tsb", { headers: { Authorization: `Bearer ${token}` } });
      setPatients(response.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAtendimentos = async () => {
    try {
      const token = localStorage.getItem("tsb_token");
      const response = await api.get(`/tsb/atendimentos?periodo=${filtroFinancas}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAtendimentos(response.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchPatients();
    fetchAtendimentos();
  }, [filtroFinancas]);

  // =========================================================================
  // FUNÇÕES DE CRIAÇÃO / PROCESSAMENTO TSB FINANCEIRO
  // =========================================================================
  const handleSelectPacienteMudanca = (val: string) => {
    if (val === "novo") {
      setAtendimentoForm(prev => ({ ...prev, paciente_selecionado: "novo", paciente_nome: "", paciente_telefone: "" }));
    } else {
      const encontrado = patients.find(p => p.id.toString() === val);
      if (encontrado) {
        setAtendimentoForm(prev => ({
          ...prev,
          paciente_selecionado: val,
          paciente_nome: encontrado.nome,
          paciente_telefone: encontrado.telefone
        }));
      }
    }
  };

  const handleCheckboxMudanca = (idx: number, checked: boolean) => {
    const atualizados = [...atendimentoForm.procedimentos];
    atualizados[idx].checked = checked;
    setAtendimentoForm(prev => ({ ...prev, procedimentos: atualizados }));
  };

  const handleValorProcedimentoMudanca = (idx: number, val: string) => {
    const atualizados = [...atendimentoForm.procedimentos];
    atualizados[idx].value = val;
    setAtendimentoForm(prev => ({ ...prev, procedimientos: atualizados }));
  };

  const handleSaveAtendimento = async (e: React.FormEvent) => {
    e.preventDefault();
    const procsSelecionados = atendimentoForm.procedimentos
      .filter(p => p.checked)
      .map(p => ({ name: p.name, value: parseFloat(p.value) || 0 }));

    if (!atendimentoForm.paciente_nome.trim() || !atendimentoForm.data) {
      return toast.error("Preencha o nome do paciente e a data do atendimento.");
    }
    if (procsSelecionados.length === 0) {
      return toast.error("Selecione pelo menos um procedimento realizado.");
    }

    const payload = {
      paciente_nome: atendimentoForm.paciente_nome,
      paciente_telefone: atendimentoForm.paciente_telefone,
      data: atendimentoForm.data,
      descricao: atendimentoForm.descricao,
      procedimentos: procsSelecionados
    };

    try {
      const token = localStorage.getItem("tsb_token");
      if (editingAtendimentoId) {
        await api.put(`/tsb/atendimentos/${editingAtendimentoId}`, payload, { headers: { Authorization: `Bearer ${token}` } });
        toast.success("Atendimento TSB atualizado!");
      } else {
        await api.post("/tsb/atendimentos", payload, { headers: { Authorization: `Bearer ${token}` } });
        toast.success("Atendimento TSB registrado com sucesso!");
      }
      setIsAtendimentoModalOpen(false);
      setEditingAtendimentoId(null);
      setAtendimentoForm({
        paciente_selecionado: "novo", paciente_nome: "", paciente_telefone: "",
        data: new Date().toISOString().split('T')[0], descricao: "",
        procedimentos: LISTA_PROCEDIMENTOS_PADRAO.map(p => ({ name: p.name, checked: false, value: p.price.toString() }))
      });
      fetchAtendimentos();
    } catch (err) {
      toast.error("Erro ao registrar atendimento.");
    }
  };

  const handleEditAtendimento = (at: any) => {
    setEditingAtendimentoId(at.id);
    setAtendimentoForm({
      paciente_selecionado: "editando",
      paciente_nome: at.paciente_nome,
      paciente_telefone: at.paciente_telefone || "",
      data: at.data,
      descricao: at.descricao || "",
      procedimentos: LISTA_PROCEDIMENTOS_PADRAO.map(p => {
        const enc = at.procedimentos.find((pr: any) => pr.name === p.name);
        return {
          name: p.name,
          checked: !!enc,
          value: enc ? enc.value.toString() : p.price.toString()
        };
      })
    });
    setIsAtendimentoModalOpen(true);
  };

  const handleDeleteAtendimento = async (id: number) => {
    if (!confirm("Deseja realmente excluir este histórico de atendimento financeiro?")) return;
    try {
      const token = localStorage.getItem("tsb_token");
      await api.delete(`/tsb/atendimentos/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Atendimento excluído.");
      fetchAtendimentos();
    } catch (err) {
      toast.error("Erro ao excluir.");
    }
  };

  const handlePrintAtendimento = (at: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return toast.error("Permita pop-ups no navegador.");

    let procsHtml = "";
    at.procedimentos.forEach((p: any) => {
      procsHtml += `
        <tr>
          <td><strong>${p.name.toUpperCase()}</strong></td>
          <td style="text-align: right; font-weight: bold;">R$ ${Number(p.value).toFixed(2).replace('.', ',')}</td>
        </tr>
      `;
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Recibo_TSB_${at.id}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #333; font-size: 12px; padding: 25px; line-height: 1.5; }
          .header { border-bottom: 2px solid #0f766e; padding-bottom: 12px; margin-bottom: 25px; }
          .header h1 { font-size: 18px; color: #0f766e; margin: 0; font-weight: 900; }
          .info { margin-bottom: 25px; background: #f0fdfa; padding: 15px; border-radius: 10px; border: 1px solid #ccfbf1; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th { border-bottom: 2px solid #0f766e; text-align: left; padding: 8px; font-weight: bold; background: #f3f4f6; text-transform: uppercase; font-size: 11px; }
          td { padding: 9px 8px; border-bottom: 1px dashed #ccc; }
          .total-box { text-align: right; font-size: 15px; font-weight: 900; margin-top: 25px; color: #0f766e; border-top: 2px solid #0f766e; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>ALINE ANTUNES - CLINIC TSB</h1>
          <p>Extrato e Recibo de Procedimentos Realizados</p>
        </div>
        <div class="info">
          <p><strong>PACIENTE:</strong> ${at.paciente_nome.toUpperCase()}</p>
          <p><strong>CONTATO:</strong> ${at.paciente_telefone || 'Não informado'}</p>
          <p><strong>DATA DO ATENDIMENTO:</strong> ${new Date(at.data + "T00:00:00").toLocaleDateString('pt-BR')}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Procedimento Realizado</th>
              <th style="text-align: right;">Valor</th>
            </tr>
          </thead>
          <tbody>${procsHtml}</tbody>
        </table>
        <div class="total-box">
          VALOR TOTAL DO ATENDIMENTO: R$ ${Number(at.valor_total).toFixed(2).replace('.', ',')}
        </div>
        <div style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 15px;">
          <p><strong>Descrição Detalhada do Caso:</strong></p>
          <p style="background: #fafafa; padding: 10px; border-radius: 6px; border: 1px solid #eee;">${at.descricao || 'Nenhuma observação adicional.'}</p>
        </div>
      </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
  };


  // =========================================================================
  // MÉTODOS ORIGINAIS DE RECORRÊNCIA TSB (MANTIDOS INTEGRALMENTE)
  // =========================================================================
  useEffect(() => {
    if (formData.ultimo_atendimento && formData.recorrencia_meses) {
      const data = new Date(formData.ultimo_atendimento + "T00:00:00");
      data.setMonth(data.getMonth() + parseInt(formData.recorrencia_meses));
      setFormData((prev) => ({ ...prev, proximo_atendimento: data.toISOString().split("T")[0] }));
    }
  }, [formData.ultimo_atendimento, formData.recorrencia_meses]);

  const handleSavePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("tsb_token");
      await api.post("/tsb", formData, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Paciente cadastrado com sucesso no Clinic TSB!");
      setIsModalOpen(false);
      setFormData({
        nome: "", telefone: "", procedimento: defaultProcedure,
        recorrencia_meses: "6", data_inicio: new Date().toISOString().split('T')[0],
        ultimo_atendimento: new Date().toISOString().split('T')[0], proximo_atendimento: ""
      });
      fetchPatients();
    } catch (e) {
      toast.error("Erro ao salvar paciente.");
    }
  };

  const handleRenew = async (patient: TsbPatient) => {
    try {
      const token = localStorage.getItem("tsb_token");
      await api.put(`/tsb/${patient.id}/renovar`, {}, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(`Retorno confirmado para ${patient.nome}!`);
      fetchPatients();
    } catch (e) {
      toast.error("Erro ao renovar retorno.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Deseja realmente remover este paciente do controle de TSB?")) return;
    try {
      const token = localStorage.getItem("tsb_token");
      await api.delete(`/tsb/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Paciente removido com sucesso!");
      fetchPatients();
    } catch (e) {
      toast.error("Erro ao apagar paciente.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("tsb_token");
    setLocation("/tsb-login");
  };

  const chartData = [
    { name: "Total", qtd: patients.length },
    { name: "Próximos 30 dias", qtd: patients.filter(p => {
        const prox = new Date(p.proximo_atendimento + "T00:00:00");
        const limite = new Date(); limite.setDate(limite.getDate() + 30);
        return prox <= limite && prox >= new Date();
      }).length 
    }
  ];

  const inputBaseStyle = "bg-neutral-900 border-neutral-800 text-white placeholder-neutral-600 focus-visible:ring-1 focus-visible:ring-teal-500/50";

  if (loading) return <div className="min-h-screen bg-transparent p-6 text-teal-500 font-bold text-center py-20">Carregando Clinic TSB...</div>;

  return (
    <div className="min-h-screen bg-transparent p-6 pb-24">
      
      {/* ========================================================================= */}
      {/* NOVO MODAL: REGISTRAR ATENDIMENTO FINANCEIRO TSB */}
      {/* ========================================================================= */}
      {isAtendimentoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar relative">
            <button onClick={() => setIsAtendimentoModalOpen(false)} className="absolute top-4 right-4 text-neutral-500 hover:text-white">
              <X className="w-5 h-5"/>
            </button>
            <h3 className="text-xl font-black text-white uppercase mb-6 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-teal-400"/> {editingAtendimentoId ? "Editar Atendimento" : "Registrar Atendimento TSB"}
            </h3>
            
            <form onSubmit={handleSaveAtendimento} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-neutral-400 uppercase">Vincular Cliente Cadastrado</Label>
                <Select value={atendimentoForm.paciente_selecionado} onValueChange={handleSelectPacienteMudanca}>
                  <SelectTrigger className={inputBaseStyle}>
                    <SelectValue placeholder="Selecione ou deixe como Novo Cliente"/>
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                    <SelectItem value="novo">-- NOVO CLIENTE (DIGITAR ABAIXO) --</SelectItem>
                    {patients.map(p => (
                      <SelectItem key={p.id} value={p.id.toString()}>{p.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-neutral-400 uppercase">Nome do Paciente *</Label>
                  <Input required disabled={atendimentoForm.paciente_selecionado !== "novo" && atendimentoForm.paciente_selecionado !== "editando"} value={atendimentoForm.paciente_nome} onChange={e => setAtendimentoForm({...atendimentoForm, paciente_nome: e.target.value})} className={inputBaseStyle} placeholder="Nome" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-neutral-400 uppercase">Telefone</Label>
                  <Input disabled={atendimentoForm.paciente_selecionado !== "novo" && atendimentoForm.paciente_selecionado !== "editando"} value={atendimentoForm.paciente_telefone} onChange={e => setAtendimentoForm({...atendimentoForm, paciente_telefone: e.target.value})} className={inputBaseStyle} placeholder="Telefone" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-neutral-400 uppercase">Data do Atendimento *</Label>
                <Input required type="date" value={atendimentoForm.data} onChange={e => setAtendimentoForm({...atendimentoForm, data: e.target.value})} className={inputBaseStyle} />
              </div>

              <div className="space-y-3 border-t border-neutral-800 pt-4">
                <Label className="text-xs font-bold text-teal-400 uppercase tracking-wider block mb-1">Procedimentos e Valores (Editáveis)</Label>
                {atendimentoForm.procedimentos.map((proc, idx) => (
                  <div key={proc.name} className="flex items-center justify-between gap-4 p-2 bg-neutral-950/40 border border-neutral-800/60 rounded-lg">
                    <label className="flex items-center gap-3 cursor-pointer text-sm font-bold text-white uppercase flex-1">
                      <input type="checkbox" checked={proc.checked} onChange={e => handleCheckboxMudanca(idx, e.target.checked)} className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-teal-600 focus:ring-teal-500" />
                      {proc.name}
                    </label>
                    {proc.checked && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-neutral-500">R$</span>
                        <Input type="number" step="0.01" value={proc.value} onChange={e => handleValorProcedimentoMudanca(idx, e.target.value)} className="w-24 h-8 text-xs text-right font-black text-teal-400 bg-neutral-900 border-neutral-800" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-2 border-t border-neutral-800 pt-4">
                <Label className="text-xs font-bold text-neutral-400 uppercase">Descrição do que foi feito</Label>
                <Textarea value={atendimentoForm.descricao} onChange={e => setAtendimentoForm({...atendimentoForm, descricao: e.target.value})} rows={3} className={inputBaseStyle} placeholder="Descreva os detalhes do atendimento clínico..." />
              </div>

              <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white font-black mt-4 uppercase">
                {editingAtendimentoId ? "Atualizar Registro" : "Confirmar e Registrar"}
              </Button>
            </form>
          </div>
        </div>
      )}


      {/* MODAL ORIGINAL: ADICIONAR PACIENTE RECORRÊNCIA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl w-full max-w-md relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-neutral-500"><X className="w-5 h-5"/></button>
            <h3 className="text-xl font-black text-white uppercase mb-6 flex items-center gap-2"><Users className="w-5 h-5 text-teal-400"/> Novo Paciente Retorno</h3>
            <form onSubmit={handleSavePatient} className="space-y-4">
              <div className="space-y-2"><Label className="text-xs font-bold text-neutral-400 uppercase">Nome Completo *</Label><Input required value={formData.nome} onChange={e=>setFormData({...formData, nome:e.target.value})} className={inputBaseStyle} placeholder="Nome" /></div>
              <div className="space-y-2"><Label className="text-xs font-bold text-neutral-400 uppercase">Telefone</Label><Input value={formData.telefone} onChange={e=>setFormData({...formData, telefone:e.target.value})} className={inputBaseStyle} placeholder="Telefone" /></div>
              <div className="space-y-2"><Label className="text-xs font-bold text-neutral-400 uppercase">Procedimento Vinculado</Label><Input value={formData.procedimento} onChange={e=>setFormData({...formData, procedimento:e.target.value})} className={inputBaseStyle} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-neutral-400 uppercase">Recorrência (Meses)</Label>
                  <Select value={formData.recorrencia_meses} onValueChange={v=>setFormData({...formData, recorrencia_meses:v})}>
                    <SelectTrigger className={inputBaseStyle}><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-neutral-900 border-neutral-800 text-white"><SelectItem value="3">3 Meses</SelectItem><SelectItem value="4">4 Meses</SelectItem><SelectItem value="6">6 Meses (Padrão)</SelectItem><SelectItem value="12">12 Meses</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label className="text-xs font-bold text-neutral-400 uppercase">Último Atendimento *</Label><Input type="date" required value={formData.ultimo_atendimento} onChange={e=>setFormData({...formData, ultimo_atendimento:e.target.value})} className={inputBaseStyle} /></div>
              </div>
              <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white font-black mt-4 uppercase">Salvar Paciente</Button>
            </form>
          </div>
        </div>
      )}

      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
            <Syringe className="w-8 h-8 text-teal-400"/> CLINIC TSB
          </h1>
          <p className="text-neutral-400 text-sm mt-2">Controle de retornos preventivos e faturamento de procedimentos</p>
        </div>
        
        {/* BOTÕES DE CADASTRO E LOGIN */}
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => {
            setEditingAtendimentoId(null);
            setAtendimentoForm({
              paciente_selecionado: "novo", paciente_nome: "", paciente_telefone: "",
              data: new Date().toISOString().split('T')[0], descricao: "",
              procedimentos: LISTA_PROCEDIMENTOS_PADRAO.map(p => ({ name: p.name, checked: false, value: p.price.toString() }))
            });
            setIsAtendimentoModalOpen(true);
          }} className="bg-transparent border border-teal-500/30 hover:bg-teal-500/10 text-teal-400 font-bold h-11">
            <Receipt className="w-4 h-4 mr-2" /> Registrar Atendimento TSB
          </Button>
          <Button onClick={() => setIsModalOpen(true)} className="bg-teal-600 hover:bg-teal-700 text-white font-bold h-11">
            <Plus className="w-4 h-4 mr-2" /> Novo Paciente Retorno
          </Button>
          <Button onClick={handleLogout} variant="ghost" className="text-neutral-500 hover:text-white border border-neutral-800 h-11">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* NAVEGAÇÃO DE ABAS INTELEGENTE */}
      <div className="flex border-b border-neutral-800 mb-8 gap-2">
        <button onClick={() => setActiveTab("recorrencias")} className={`pb-3 px-4 font-black uppercase text-xs tracking-wider border-b-2 transition-colors ${activeTab === "recorrencias" ? "border-teal-500 text-white" : "border-transparent text-neutral-500 hover:text-neutral-300"}`}>
          Pacientes e Recorrências
        </button>
        <button onClick={() => setActiveTab("financas")} className={`pb-3 px-4 font-black uppercase text-xs tracking-wider border-b-2 transition-colors ${activeTab === "financas" ? "border-teal-500 text-white" : "border-transparent text-neutral-500 hover:text-neutral-300"}`}>
          Fechamento Financeiro
        </button>
      </div>

      {/* ========================================================================= */}
      {/* ABA 1: RECORRÊNCIAS E GRÁFICOS ORIGINAIS (INTACTOS) */}
      {/* ========================================================================= */}
      {activeTab === "recorrencias" && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card className="bg-neutral-900 border-neutral-800 p-6 flex items-center justify-between shadow-xl">
              <div><p className="text-neutral-400 text-xs font-bold uppercase tracking-widest">Pacientes Cadastrados</p><p className="text-4xl font-black text-white mt-2">{patients.length}</p></div>
              <div className="bg-teal-500/10 p-4 rounded-xl border border-teal-500/20"><Users className="w-6 h-6 text-teal-400"/></div>
            </Card>
            <Card className="bg-neutral-900 border-neutral-800 p-6 flex items-center justify-between shadow-xl">
              <div>
                <p className="text-neutral-400 text-xs font-bold uppercase tracking-widest">Retornos nos Próximos 30 dias</p>
                <p className="text-4xl font-black text-amber-400 mt-2">
                  {patients.filter(p => {
                    const prox = new Date(p.proximo_atendimento + "T00:00:00");
                    const limite = new Date(); limite.setDate(limite.getDate() + 30);
                    return prox <= limite && prox >= new Date();
                  }).length}
                </p>
              </div>
              <div className="bg-amber-500/10 p-4 rounded-xl border border-amber-500/20"><Clock className="w-6 h-6 text-amber-400"/></div>
            </Card>
            <Card className="bg-neutral-900 border-neutral-800 p-6 shadow-xl flex items-center justify-center">
              <ResponsiveContainer width="100%" height={80}>
                <BarChart data={chartData} layout="vertical"><XAxis type="number" hide/><YAxis dataKey="name" type="category" stroke="#737373" width={100} tick={{fontSize:11}}/><Tooltip contentStyle={{backgroundColor:"#171717",borderColor:"#262626"}}/><Bar dataKey="qtd" fill="#0f766e" radius={[0,4,4,0]}/></BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <Card className="bg-neutral-900 border-neutral-800 overflow-hidden shadow-xl">
            <div className="p-6 border-b border-neutral-800"><h2 className="text-sm font-black text-teal-400 uppercase tracking-widest">Lista de Controle de Prevenção e Retornos</h2></div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-950 border-b border-neutral-800">
                  <tr><th className="p-4 text-left text-xs font-bold text-neutral-500 uppercase">Paciente</th><th className="p-4 text-left text-xs font-bold text-neutral-500 uppercase">Telefone</th><th className="p-4 text-left text-xs font-bold text-neutral-500 uppercase">Próximo Retorno</th><th className="p-4 text-left text-xs font-bold text-neutral-500 uppercase">Procedimento Vinculado</th><th className="p-4 text-left text-xs font-bold text-neutral-500 uppercase bg-neutral-950/40 text-center w-32">Ações</th></tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/50">
                  {patients.map((p) => {
                    const proxDate = new Date(p.proximo_atendimento + "T00:00:00");
                    const isAtrasado = proxDate < new Date();
                    return (
                      <tr key={p.id} className="hover:bg-neutral-800/20 transition-colors">
                        <td className="p-4 text-white font-bold text-sm">{p.nome}</td>
                        <td className="p-4 text-neutral-400 text-sm">{p.telefone || "-"}</td>
                        <td className="p-4 text-sm font-medium">
                          <span className={isAtrasado ? "text-red-400 font-bold" : "text-emerald-400"}>
                            {proxDate.toLocaleDateString('pt-BR')} {isAtrasado && "⚠️"}
                          </span>
                        </td>
                        <td className="p-4 text-neutral-400 text-sm">{p.procedimento}</td>
                        <td className="p-4 text-center space-x-2">
                          <Button onClick={() => handleRenew(p)} size="icon" variant="ghost" className="h-8 w-8 text-teal-600 hover:bg-teal-50" title="Confirmar Retorno do Paciente"><RefreshCw className="w-4 h-4"/></Button>
                          <Button onClick={() => handleDelete(p.id)} size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:bg-red-50" title="Apagar Paciente"><Trash2 className="w-4 h-4"/></Button>
                        </td>
                      </tr>
                    );
                  })}
                  {patients.length === 0 && <tr><td colSpan={5} className="p-12 text-center text-neutral-500 text-sm">Nenhum paciente cadastrado no Clinic TSB ainda.</td></tr>}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* ========================================================================= */}
      {/* ABA 2: FECHAMENTO FINANCEIRO E ATENDIMENTOS TSB (NOVA SOLICITAÇÃO) */}
      {/* ========================================================================= */}
      {activeTab === "financas" && (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-lg p-1 pr-2">
              <div className="bg-neutral-800 p-2 rounded-md"><CalendarDays className="w-4 h-4 text-teal-400"/></div>
              <Select value={filtroFinancas} onValueChange={setFiltroFinancas}>
                <SelectTrigger className="border-0 bg-transparent text-white focus:ring-0 w-44">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                  <SelectItem value="hoje">Hoje</SelectItem>
                  <SelectItem value="ontem">Ontem</SelectItem>
                  <SelectItem value="semana">Última Semana</SelectItem>
                  <SelectItem value="mes">Último Mês (30 dias)</SelectItem>
                  <SelectItem value="3meses">Últimos 3 Meses (90 dias)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Card className="bg-neutral-900/60 border-neutral-800 px-6 py-3 shadow-md">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block">Faturamento do Período</span>
              <span className="text-2xl font-black text-teal-400">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                  atendimentos.reduce((acc, curr) => acc + (curr.valor_total || 0), 0)
                )}
              </span>
            </Card>
          </div>

          <Card className="bg-neutral-900 border-neutral-800 overflow-hidden shadow-xl">
            <div className="p-6 border-b border-neutral-800"><h2 className="text-sm font-black text-teal-400 uppercase tracking-widest">Relatório de Atendimentos Clínicos Efetuados</h2></div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-neutral-950 border-b border-neutral-800">
                  <tr>
                    <th className="p-4 text-xs font-bold text-neutral-500 uppercase">Data</th>
                    <th className="p-4 text-xs font-bold text-neutral-500 uppercase">Paciente</th>
                    <th className="p-4 text-xs font-bold text-neutral-500 uppercase">Procedimentos Realizados</th>
                    <th className="p-4 text-xs font-bold text-neutral-500 uppercase text-right">Valor Total</th>
                    <th className="p-4 text-xs font-bold text-neutral-500 uppercase text-center w-36">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/50">
                  {atendimentos.map((at) => (
                    <tr key={at.id} className="hover:bg-neutral-800/20 transition-colors">
                      <td className="p-4 text-xs text-neutral-400">
                        {new Date(at.data + "T00:00:00").toLocaleDateString('pt-BR')}
                      </td>
                      <td className="p-4 text-sm font-bold text-white uppercase">
                        {at.paciente_nome}
                        {at.paciente_telefone && <span className="block text-[10px] text-neutral-500 font-normal">📞 {at.paciente_telefone}</span>}
                      </td>
                      <td className="p-4 text-xs text-neutral-300">
                        <div className="flex flex-wrap gap-1">
                          {at.procedimentos?.map((p: any) => (
                            <span key={p.name} className="bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800 font-medium">
                              {p.name} (R$ {Number(p.value).toFixed(0)})
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4 text-sm font-black text-teal-400 text-right whitespace-nowrap">
                        R$ {Number(at.valor_total).toFixed(2).replace('.', ',')}
                      </td>
                      <td className="p-4 text-center space-x-1">
                        <Button size="icon" variant="ghost" onClick={() => handlePrintAtendimento(at)} className="w-8 h-8 text-neutral-400 hover:text-white" title="Imprimir Recibo / Extrato"><Printer className="w-4 h-4"/></Button>
                        <Button size="icon" variant="ghost" onClick={() => handleEditAtendimento(at)} className="w-8 h-8 text-neutral-400 hover:text-white" title="Editar Atendimento"><Pencil className="w-4 h-4"/></Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDeleteAtendimento(at)} className="w-8 h-8 text-neutral-400 hover:text-red-500 hover:bg-red-500/10" title="Excluir Atendimento"><Trash2 className="w-4 h-4"/></Button>
                      </td>
                    </tr>
                  ))}
                  {atendimentos.length === 0 && (
                    <tr><td colSpan={5} className="p-12 text-center text-neutral-500 text-sm">Nenhum atendimento financeiro encontrado no período selecionado.</td></tr>
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

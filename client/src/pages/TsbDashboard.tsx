import { useState, useEffect } from "react";
import api from "../lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Users, Plus, Printer, CalendarDays, Syringe, Clock, X, LogOut, Trash2, RefreshCw, Receipt, Pencil, DollarSign } from "lucide-react";
import { useLocation } from "wouter";

interface TsbPatient {
  id: number;
  nome: string;
  telefone: string;
  procedimento: string;
  ultimo_procedimento?: string;
  ultimo_valor?: number;
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
  
  const [isEditPatientModalOpen, setIsEditPatientModalOpen] = useState(false);
  const [editingPatientId, setEditingPatientId] = useState<number | null>(null);

  const defaultProcedure = "Prevenção / Rotina";

  const LISTA_PROCEDIMENTOS_PADRAO = [
    { name: "Limpeza", price: 180 },
    { name: "Limpeza protocolo", price: 200 },
    { name: "Radiografia", price: 50 },
    { name: "Clareamento", price: 520 },
    { name: "Emergência", price: 80 }
  ];

  // =========================================================================
  // ESTADOS DO FORMULÁRIO DE PACIENTE (ABA 1) - AGORA COM PROCEDIMENTOS
  // =========================================================================
  const [patientForm, setPatientForm] = useState({
    nome: "", telefone: "", procedimento: defaultProcedure,
    recorrencia_meses: "6", data_inicio: new Date().toISOString().split('T')[0],
    ultimo_atendimento: new Date().toISOString().split('T')[0],
    proximo_atendimento: "",
    procedimentos: LISTA_PROCEDIMENTOS_PADRAO.map(p => ({ name: p.name, checked: false, value: p.price.toString() })),
    extra_nome: "", extra_valor: ""
  });

  const [activeTab, setActiveTab] = useState<"recorrencias" | "financas">("recorrencias");
  const [atendimentos, setAtendimentos] = useState<any[]>([]);
  const [filtroFinancas, setFiltroFinancas] = useState("mes");
  const [isAtendimentoModalOpen, setIsAtendimentoModalOpen] = useState(false);
  const [editingAtendimentoId, setEditingAtendimentoId] = useState<number | null>(null);

  const [atendimentoForm, setAtendimentoForm] = useState({
    paciente_selecionado: "novo",
    paciente_nome: "",
    paciente_telefone: "",
    data: new Date().toISOString().split('T')[0],
    descricao: "",
    proximo_retorno_meses: "6", 
    procedimentos: LISTA_PROCEDIMENTOS_PADRAO.map(p => ({ name: p.name, checked: false, value: p.price.toString() })),
    extra_nome: "", 
    extra_valor: "" 
  });

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

  // CÁLCULO INTELIGENTE DO PRÓXIMO RETORNO PARA PACIENTES (ABA 1)
  useEffect(() => {
    if (patientForm.ultimo_atendimento && patientForm.recorrencia_meses !== "") {
      const meses = parseInt(patientForm.recorrencia_meses) || 0;
      const data = new Date(patientForm.ultimo_atendimento + "T00:00:00");
      data.setMonth(data.getMonth() + meses);
      setPatientForm((prev) => ({ ...prev, proximo_atendimento: data.toISOString().split("T")[0] }));
    }
  }, [patientForm.ultimo_atendimento, patientForm.recorrencia_meses]);

  const handlePatientCheckbox = (idx: number, checked: boolean) => {
    const atualizados = [...patientForm.procedimentos];
    atualizados[idx].checked = checked;
    setPatientForm(prev => ({ ...prev, procedimentos: atualizados }));
  };

  const handlePatientValorProc = (idx: number, val: string) => {
    const atualizados = [...patientForm.procedimentos];
    atualizados[idx].value = val;
    setPatientForm(prev => ({ ...prev, procedimentos: atualizados }));
  };

  const handleSavePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("tsb_token");
      await api.post("/tsb", { ...patientForm }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Paciente cadastrado com sucesso no Clinic TSB!");
      setIsModalOpen(false);
      setPatientForm({
        nome: "", telefone: "", procedimento: defaultProcedure,
        recorrencia_meses: "6", data_inicio: new Date().toISOString().split('T')[0],
        ultimo_atendimento: new Date().toISOString().split('T')[0], proximo_atendimento: "",
        procedimentos: LISTA_PROCEDIMENTOS_PADRAO.map(p => ({ name: p.name, checked: false, value: p.price.toString() })),
        extra_nome: "", extra_valor: ""
      });
      fetchPatients();
    } catch (e) {
      toast.error("Erro ao salvar paciente.");
    }
  };

  const handleOpenEditPatientModal = (patient: TsbPatient) => {
    setEditingPatientId(patient.id);
    
    // Tentar mapear quais checkboxes estavam marcados baseando-se na string ultimo_procedimento
    const lastProcsStr = patient.ultimo_procedimento || "";
    const mapeadosFixos = LISTA_PROCEDIMENTOS_PADRAO.map(p => {
      const taMarcado = lastProcsStr.includes(p.name);
      return {
        name: p.name,
        checked: taMarcado,
        value: p.price.toString()
      };
    });

    setPatientForm({
      nome: patient.nome,
      telefone: patient.telefone || "",
      procedimento: patient.procedimento || defaultProcedure,
      recorrencia_meses: patient.recorrencia_meses.toString(),
      data_inicio: patient.data_inicio ? patient.data_inicio.split("T")[0] : "",
      ultimo_atendimento: patient.ultimo_atendimento ? patient.ultimo_atendimento.split("T")[0] : "",
      proximo_atendimento: patient.proximo_atendimento ? patient.proximo_atendimento.split("T")[0] : "",
      procedimentos: mapeadosFixos,
      extra_nome: "", extra_valor: ""
    });
    setIsEditPatientModalOpen(true);
  };

  const handleUpdatePatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("tsb_token");
      
      const procsSelecionados = patientForm.procedimentos
        .filter(p => p.checked)
        .map(p => ({ name: p.name, value: parseFloat(p.value) || 0 }));

      if (patientForm.extra_nome.trim()) {
        procsSelecionados.push({
          name: patientForm.extra_nome.trim(),
          value: parseFloat(patientForm.extra_valor) || 0
        });
      }

      const payload = {
        ...patientForm,
        procedimentos_realizados: procsSelecionados
      };

      await api.put(`/tsb/${editingPatientId}`, payload, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Cadastro atualizado e financeiro sincronizado!");
      setIsEditPatientModalOpen(false);
      setEditingPatientId(null);
      setPatientForm({
        nome: "", telefone: "", procedimento: defaultProcedure,
        recorrencia_meses: "6", data_inicio: new Date().toISOString().split('T')[0],
        ultimo_atendimento: new Date().toISOString().split('T')[0], proximo_atendimento: "",
        procedimentos: LISTA_PROCEDIMENTOS_PADRAO.map(p => ({ name: p.name, checked: false, value: p.price.toString() })),
        extra_nome: "", extra_valor: ""
      });
      fetchPatients();
      fetchAtendimentos();
    } catch (err) {
      toast.error("Erro ao atualizar dados do paciente.");
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

  // =========================================================================
  // FUNÇÕES DE ATENDIMENTO FINANCEIRO (Aba 2)
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
    setAtendimentoForm(prev => ({ ...prev, procedimentos: atualizados }));
  };

  const handleSaveAtendimento = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const procsSelecionados = atendimentoForm.procedimentos
      .filter(p => p.checked)
      .map(p => ({ name: p.name, value: parseFloat(p.value) || 0 }));

    if (atendimentoForm.extra_nome.trim()) {
      procsSelecionados.push({
        name: atendimentoForm.extra_nome.trim(),
        value: parseFloat(atendimentoForm.extra_valor) || 0
      });
    }

    if (!atendimentoForm.paciente_nome.trim() || !atendimentoForm.data) {
      return toast.error("Preencha o nome do paciente e a data do atendimento.");
    }
    if (procsSelecionados.length === 0) {
      return toast.error("Selecione ou digite pelo menos um procedimento realizado.");
    }

    const payload = {
      paciente_nome: atendimentoForm.paciente_nome,
      paciente_telefone: atendimentoForm.paciente_telefone,
      data: atendimentoForm.data,
      descricao: atendimentoForm.descricao,
      procedimentos: procsSelecionados,
      proximo_retorno_meses: atendimentoForm.proximo_retorno_meses
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
        data: new Date().toISOString().split('T')[0], descricao: "", proximo_retorno_meses: "6",
        procedimentos: LISTA_PROCEDIMENTOS_PADRAO.map(p => ({ name: p.name, checked: false, value: p.price.toString() })),
        extra_nome: "", extra_valor: ""
      });
      fetchAtendimentos();
      fetchPatients(); 
    } catch (err) {
      toast.error("Erro ao registrar atendimento.");
    }
  };

  const handleEditAtendimento = (at: any) => {
    setEditingAtendimentoId(at.id);
    
    const mapeadosFixos = LISTA_PROCEDIMENTOS_PADRAO.map(p => {
      const enc = at.procedimentos.find((pr: any) => pr.name === p.name);
      return {
        name: p.name,
        checked: !!enc,
        value: enc ? enc.value.toString() : p.price.toString()
      };
    });

    const extraEncontrado = at.procedimentos.find((pr: any) => !LISTA_PROCEDIMENTOS_PADRAO.some(p => p.name === pr.name));

    setAtendimentoForm({
      paciente_selecionado: "editando",
      paciente_nome: at.paciente_nome,
      paciente_telefone: at.paciente_telefone || "",
      data: at.data,
      descricao: at.descricao || "",
      proximo_retorno_meses: "0",
      procedimentos: mapeadosFixos,
      extra_nome: extraEncontrado ? extraEncontrado.name : "",
      extra_valor: extraEncontrado ? extraEncontrado.value.toString() : ""
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
      toast.error("Erro ao excluir. Tente novamente.");
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

  const exportarRelatorioFinanceiroGeral = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return toast.error("Permita pop-ups no navegador.");

    const dataEmissao = new Date().toLocaleDateString('pt-BR');
    const totalPeriodo = atendimentos.reduce((acc, curr) => acc + Number(curr.valor_total), 0);
    let rowsHtml = '';

    atendimentos.forEach((at, idx) => {
      const dataFormatada = new Date(at.data + "T00:00:00").toLocaleDateString('pt-BR');
      const procsTexto = at.procedimentos?.map((p: any) => `${p.name} (R$ ${Number(p.value).toFixed(0)})`).join(', ') || '-';
      
      rowsHtml += `
        <tr>
          <td class="center" style="color:#666;">${String(idx + 1).padStart(2, '0')}</td>
          <td>${dataFormatada}</td>
          <td><strong>${at.paciente_nome.toUpperCase()}</strong></td>
          <td style="color:#444;">${procsTexto}</td>
          <td class="right" style="font-weight: bold; color: #0f766e;">R$ ${Number(at.valor_total).toFixed(2).replace('.', ',')}</td>
        </tr>
      `;
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Relatorio_Financeiro_TSB</title>
        <style>
          @page { margin: 15mm; size: A4 portrait; }
          body { font-family: Arial, sans-serif; color: #333; font-size: 11px; line-height: 1.5; padding: 10px; }
          .header { border-bottom: 2px solid #0f766e; padding-bottom: 12px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center; }
          .header h1 { font-size: 18px; margin: 0; font-weight: 900; color: #0f766e; text-transform: uppercase; }
          .info { margin-bottom: 25px; background: #fafafa; padding: 15px; border: 1px solid #e5e5e7; border-radius: 12px; }
          .info p { margin: 4px 0; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background-color: #fafafa; border-top: 1px solid #111; border-bottom: 2px solid #111; padding: 8px; text-align: left; font-size: 10px; text-transform: uppercase; font-weight: bold; color: #555; }
          td { padding: 9px 8px; border-bottom: 1px dashed #e5e5e7; }
          .center { text-align: center; } .right { text-align: right; }
          .summary-box { width: 260px; float: right; margin-top: 20px; }
          .summary-total { display: flex; justify-content: space-between; font-weight: 900; font-size: 15px; border-top: 2px solid #0f766e; padding-top: 8px; color: #0f766e; }
          .clear { clear: both; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>ALINE ANTUNES - CLINIC TSB</h1>
            <p style="margin: 2px 0 0 0; color: #666; text-transform: uppercase;">Relatório Geral de Faturamento</p>
          </div>
          <div style="text-align: right; font-size: 10px; color: #666; font-weight: bold;">EMISSÃO: ${dataEmissao}</div>
        </div>
        <div class="info">
          <p><strong>FILTRO DE PERÍODO:</strong> MÊS / HISTÓRICO (${filtroFinancas.toUpperCase()})</p>
          <p><strong>QUANTIDADE DE PROCEDIMENTOS DO PERÍODO:</strong> ${atendimentos.length} atendimentos</p>
        </div>
        <table>
          <thead>
            <tr>
              <th class="center" style="width: 5%;">#</th>
              <th style="width: 12%;">Data</th>
              <th style="width: 25%;">Paciente</th>
              <th style="width: 43%;">Procedimentos Compilados</th>
              <th class="right" style="width: 15%;">Valor Total</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colSpan="5" class="center">Nenhum atendimento no período.</td></tr>'}
          </tbody>
        </table>
        <div class="summary-box">
          <div class="summary-total">
            <span>FATURAMENTO TOTAL:</span>
            <span>R$ ${totalPeriodo.toFixed(2).replace('.', ',')}</span>
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

  const inputBaseStyle = "bg-neutral-900 border-neutral-800 text-white placeholder-neutral-600 focus-visible:ring-1 focus-visible:ring-teal-500/50";

  if (loading) return <div className="min-h-screen bg-transparent p-6 text-teal-500 font-bold text-center py-20">Carregando Clinic TSB...</div>;

  return (
    <div className="min-h-screen bg-transparent p-6 pb-24">
      
      {/* MODAL: REGISTRAR / EDITAR ATENDIMENTO FINANCEIRO TSB */}
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-neutral-400 uppercase">Data do Atendimento *</Label>
                  <Input required type="date" value={atendimentoForm.data} onChange={e => setAtendimentoForm({...atendimentoForm, data: e.target.value})} className={inputBaseStyle} />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-teal-400 uppercase">Agendar Próximo Retorno (Meses)</Label>
                  <Input 
                    type="number" 
                    min="0"
                    value={atendimentoForm.proximo_retorno_meses} 
                    onChange={e => setAtendimentoForm({...atendimentoForm, proximo_retorno_meses: e.target.value})} 
                    className={inputBaseStyle} 
                    placeholder="0 para não agendar"
                  />
                </div>
              </div>

              <div className="space-y-3 border-t border-neutral-800 pt-4">
                <Label className="text-xs font-bold text-teal-400 uppercase tracking-wider block mb-1">Procedimentos e Valores Fixos</Label>
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

              <div className="space-y-3 border-t border-neutral-800 pt-4">
                <Label className="text-xs font-bold text-amber-400 uppercase tracking-wider block">Adicionar Serviço Extra Customizado (Opcional)</Label>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <Input value={atendimentoForm.extra_nome} onChange={e => setAtendimentoForm({...atendimentoForm, extra_nome: e.target.value})} className={inputBaseStyle} placeholder="Nome do procedimento extra..." />
                  </div>
                  <div>
                    <Input type="number" step="0.01" value={atendimentoForm.extra_valor} onChange={e => setAtendimentoForm({...atendimentoForm, extra_valor: e.target.value})} className={inputBaseStyle} placeholder="R$ 0,00" />
                  </div>
                </div>
              </div>

              <div className="space-y-2 border-t border-neutral-800 pt-4">
                <Label className="text-xs font-bold text-neutral-400 uppercase">Descrição / Observações do Caso</Label>
                <Textarea value={atendimentoForm.descricao} onChange={e => setAtendimentoForm({...atendimentoForm, descricao: e.target.value})} rows={3} className={inputBaseStyle} placeholder="Descreva os detalhes clínicos do atendimento..." />
              </div>

              <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white font-black mt-4 uppercase">
                {editingAtendimentoId ? "Atualizar Registro" : "Confirmar e Registrar Atendimento"}
              </Button>
            </form>
          </div>
        </div>
      )}


      {/* MODAL ORIGINAL: ADICIONAR PACIENTE RECORRÊNCIA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl w-full max-w-md relative shadow-2xl">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-neutral-500"><X className="w-5 h-5"/></button>
            <h3 className="text-xl font-black text-white uppercase mb-6 flex items-center gap-2"><Users className="w-5 h-5 text-teal-400"/> Novo Paciente Retorno</h3>
            <form onSubmit={handleSavePatient} className="space-y-4">
              <div className="space-y-2"><Label className="text-xs font-bold text-neutral-400 uppercase">Nome Completo *</Label><Input required value={patientForm.nome} onChange={e=>setPatientForm({...patientForm, nome:e.target.value})} className={inputBaseStyle} placeholder="Nome" /></div>
              <div className="space-y-2"><Label className="text-xs font-bold text-neutral-400 uppercase">Telefone</Label><Input value={patientForm.telefone} onChange={e=>setPatientForm({...patientForm, telefone:e.target.value})} className={inputBaseStyle} placeholder="Telefone" /></div>
              
              <div className="space-y-2">
                <Label className="text-xs font-bold text-neutral-400 uppercase">Procedimento Vinculado (Próxima Recorrência)</Label>
                <Select value={patientForm.procedimento} onValueChange={v=>setPatientForm({...patientForm, procedimento:v})}>
                  <SelectTrigger className={inputBaseStyle}><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                    {LISTA_PROCEDIMENTOS_PADRAO.map(p => (
                      <SelectItem key={p.name} value={p.name}>{p.name} (R$ {p.price})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-neutral-400 uppercase">Recorrência (Meses)</Label>
                  <Input 
                    type="number" 
                    min="0"
                    value={patientForm.recorrencia_meses} 
                    onChange={e => setPatientForm({...patientForm, recorrencia_meses: e.target.value})} 
                    className={inputBaseStyle} 
                    placeholder="Ex: 6"
                  />
                </div>
                <div className="space-y-2"><Label className="text-xs font-bold text-neutral-400 uppercase">Último Atendimento *</Label><Input type="date" required value={patientForm.ultimo_atendimento} onChange={e=>setPatientForm({...patientForm, ultimo_atendimento:e.target.value})} className={inputBaseStyle} /></div>
              </div>
              <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white font-black mt-4 uppercase">Salvar Paciente</Button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR PACIENTE RECORRÊNCIA E HISTÓRICO COM MULTIPLOS PROCEDIMENTOS */}
      {isEditPatientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl w-full max-w-md relative shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button onClick={() => { setIsEditPatientModalOpen(false); setEditingPatientId(null); }} className="absolute top-4 right-4 text-neutral-500 hover:text-white"><X className="w-5 h-5"/></button>
            <h3 className="text-xl font-black text-white uppercase mb-6 flex items-center gap-2"><Pencil className="w-5 h-5 text-teal-400"/> Editar Cadastro & Histórico</h3>
            <form onSubmit={handleUpdatePatientSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-neutral-400 uppercase">Nome Completo *</Label>
                <Input required value={patientForm.nome} onChange={e=>setPatientForm({...patientForm, nome:e.target.value})} className={inputBaseStyle} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-neutral-400 uppercase">Telefone</Label>
                <Input value={patientForm.telefone} onChange={e=>setPatientForm({...patientForm, telefone:e.target.value})} className={inputBaseStyle} />
              </div>
              
              <div className="space-y-3 border-t border-neutral-800 pt-4">
                <Label className="text-xs font-bold text-teal-400 uppercase tracking-wider block mb-1">Procedimentos da Última Visita</Label>
                <p className="text-[10px] text-neutral-500 mb-2">Marque o que foi feito. Isso sincronizará com a Aba de Fechamento Financeiro automaticamente.</p>
                {patientForm.procedimentos.map((proc, idx) => (
                  <div key={proc.name} className="flex items-center justify-between gap-4 p-2 bg-neutral-950/40 border border-neutral-800/60 rounded-lg">
                    <label className="flex items-center gap-3 cursor-pointer text-sm font-bold text-white uppercase flex-1">
                      <input type="checkbox" checked={proc.checked} onChange={e => handlePatientCheckbox(idx, e.target.checked)} className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-teal-600 focus:ring-teal-500" />
                      {proc.name}
                    </label>
                    {proc.checked && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-neutral-500">R$</span>
                        <Input type="number" step="0.01" value={proc.value} onChange={e => handlePatientValorProc(idx, e.target.value)} className="w-24 h-8 text-xs text-right font-black text-teal-400 bg-neutral-900 border-neutral-800" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-3 border-t border-neutral-800 pt-4">
                <Label className="text-xs font-bold text-amber-400 uppercase tracking-wider block">Adicionar Serviço Extra Customizado</Label>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <Input value={patientForm.extra_nome} onChange={e => setPatientForm({...patientForm, extra_nome: e.target.value})} className={inputBaseStyle} placeholder="Nome do extra..." />
                  </div>
                  <div>
                    <Input type="number" step="0.01" value={patientForm.extra_valor} onChange={e => setPatientForm({...patientForm, extra_valor: e.target.value})} className={inputBaseStyle} placeholder="R$ 0,00" />
                  </div>
                </div>
              </div>

              <div className="space-y-2 border-t border-neutral-800 pt-4">
                <Label className="text-xs font-bold text-neutral-400 uppercase">Procedimento Agendado (Próxima Recorrência)</Label>
                <Select value={patientForm.procedimento} onValueChange={v=>setPatientForm({...patientForm, procedimento:v})}>
                  <SelectTrigger className={inputBaseStyle}><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                    {LISTA_PROCEDIMENTOS_PADRAO.map(p => (
                      <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-neutral-400 uppercase">Recorrência (Meses)</Label>
                  <Input 
                    type="number" 
                    min="0"
                    value={patientForm.recorrencia_meses} 
                    onChange={e => setPatientForm({...patientForm, recorrencia_meses: e.target.value})} 
                    className={inputBaseStyle} 
                  />
                </div>
                <div className="space-y-2"><Label className="text-xs font-bold text-neutral-400 uppercase">Data da Última Visita *</Label><Input type="date" required value={patientForm.ultimo_atendimento} onChange={e=>setPatientForm({...patientForm, ultimo_atendimento:e.target.value})} className={inputBaseStyle} /></div>
              </div>
              <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white font-black mt-4 uppercase">Salvar e Sincronizar</Button>
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
        
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => {
            setEditingAtendimentoId(null);
            setAtendimentoForm({
              paciente_selecionado: "novo", paciente_nome: "", paciente_telefone: "",
              data: new Date().toISOString().split('T')[0], descricao: "", proximo_retorno_meses: "6",
              procedimentos: LISTA_PROCEDIMENTOS_PADRAO.map(p => ({ name: p.name, checked: false, value: p.price.toString() })),
              extra_nome: "", extra_valor: ""
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

      {/* NAVEGAÇÃO DE ABAS */}
      <div className="flex border-b border-neutral-800 mb-8 gap-2">
        <button onClick={() => setActiveTab("recorrencias")} className={`pb-3 px-4 font-black uppercase text-xs tracking-wider border-b-2 transition-colors ${activeTab === "recorrencias" ? "border-teal-500 text-white" : "border-transparent text-neutral-500 hover:text-neutral-300"}`}>
          Pacientes e Recorrências
        </button>
        <button onClick={() => setActiveTab("financas")} className={`pb-3 px-4 font-black uppercase text-xs tracking-wider border-b-2 transition-colors ${activeTab === "financas" ? "border-teal-500 text-white" : "border-transparent text-neutral-500 hover:text-neutral-300"}`}>
          Fechamento Financeiro
        </button>
      </div>

      {/* ABA 1: RECORRÊNCIAS */}
      {activeTab === "recorrencias" && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card className="bg-neutral-900 border-neutral-800 p-6 shadow-xl">
              <div className="flex items-center gap-4">
                <div className="bg-teal-500/10 p-4 rounded-xl border border-teal-500/20 shrink-0">
                  <Users className="w-6 h-6 text-teal-400"/>
                </div>
                <div>
                  <p className="text-neutral-400 text-xs font-bold uppercase tracking-widest">Pacientes Cadastrados</p>
                  <p className="text-3xl font-black text-white mt-1">{patients.length}</p>
                </div>
              </div>
            </Card>

            <Card className="bg-neutral-900 border-neutral-800 p-6 shadow-xl">
              <div className="flex items-center gap-4">
                <div className="bg-amber-500/10 p-4 rounded-xl border border-amber-500/20 shrink-0">
                  <Clock className="w-6 h-6 text-amber-400"/>
                </div>
                <div>
                  <p className="text-neutral-400 text-xs font-bold uppercase tracking-widest">Retornos nos Próximos 30 dias</p>
                  <p className="text-3xl font-black text-amber-400 mt-1">
                    {patients.filter(p => {
                      const prox = new Date(p.proximo_atendimento + "T00:00:00");
                      const limite = new Date(); limite.setDate(limite.getDate() + 30);
                      return prox <= limite && prox >= new Date();
                    }).length}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="bg-neutral-900 border-neutral-800 p-6 shadow-xl">
              <div className="flex items-center gap-4 h-full">
                <div className="bg-neutral-800 p-4 rounded-xl border border-neutral-700 shrink-0">
                  <CalendarDays className="w-6 h-6 text-neutral-400"/>
                </div>
                <div className="grid grid-cols-2 gap-2 w-full">
                  <div>
                    <span className="text-[10px] text-neutral-500 font-bold uppercase block tracking-wider">Total Geral</span>
                    <span className="text-xl font-black text-white">{patients.length}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-500 font-bold uppercase block tracking-wider">Agendados</span>
                    <span className="text-xl font-black text-teal-400">
                      {patients.filter(p => new Date(p.proximo_atendimento + "T00:00:00") >= new Date()).length}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <Card className="bg-neutral-900 border-neutral-800 overflow-hidden shadow-xl">
            <div className="p-6 border-b border-neutral-800"><h2 className="text-sm font-black text-teal-400 uppercase tracking-widest">Lista de Controle de Prevenção e Retornos</h2></div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-neutral-950 border-b border-neutral-800">
                  <tr>
                    <th className="p-4 text-xs font-bold text-neutral-500 uppercase">Paciente</th>
                    <th className="p-4 text-xs font-bold text-neutral-500 uppercase">Telefone</th>
                    <th className="p-4 text-xs font-bold text-neutral-500 uppercase">Última Visita</th>
                    <th className="p-4 text-xs font-bold text-neutral-500 uppercase">Histórico</th>
                    <th className="p-4 text-xs font-bold text-neutral-500 uppercase text-right">Valor Pago</th>
                    <th className="p-4 text-xs font-bold text-neutral-500 uppercase">Próximo Retorno</th>
                    <th className="p-4 text-xs font-bold text-neutral-500 uppercase text-center w-36">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/50">
                  {patients.map((p) => {
                    const proxDate = new Date(p.proximo_atendimento + "T00:00:00");
                    const isAtrasado = proxDate < new Date();
                    return (
                      <tr key={p.id} className="hover:bg-neutral-800/20 transition-colors">
                        <td className="p-4 text-white font-bold text-sm uppercase">{p.nome}</td>
                        <td className="p-4 text-neutral-400 text-sm">{p.telefone || "-"}</td>
                        <td className="p-4 text-neutral-400 text-sm">{new Date(p.ultimo_atendimento + "T00:00:00").toLocaleDateString('pt-BR')}</td>
                        <td className="p-4 text-neutral-300 text-sm uppercase max-w-[150px] truncate" title={p.ultimo_procedimento || "Não registrado"}>{p.ultimo_procedimento || "Não registrado"}</td>
                        <td className="p-4 text-emerald-400 font-bold text-sm text-right">R$ {Number(p.ultimo_valor || 0).toFixed(2).replace('.', ',')}</td>
                        <td className="p-4 text-sm font-medium">
                          <span className={isAtrasado ? "text-red-400 font-bold" : "text-emerald-400"}>
                            {proxDate.toLocaleDateString('pt-BR')} {isAtrasado && "⚠️"}
                          </span>
                        </td>
                        <td className="p-4 text-center space-x-1">
                          <Button onClick={() => handleOpenEditPatientModal(p)} size="icon" variant="ghost" className="h-8 w-8 text-neutral-400 hover:text-white" title="Editar Cadastro e Histórico"><Pencil className="w-4 h-4"/></Button>
                          <Button onClick={() => handleRenew(p)} size="icon" variant="ghost" className="h-8 w-8 text-teal-600 hover:bg-teal-50" title="Confirmar Retorno do Paciente"><RefreshCw className="w-4 h-4"/></Button>
                          <Button onClick={() => handleDelete(p.id)} size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:bg-red-50" title="Apagar Paciente"><Trash2 className="w-4 h-4"/></Button>
                        </td>
                      </tr>
                    );
                  })}
                  {patients.length === 0 && <tr><td colSpan={7} className="p-12 text-center text-neutral-500 text-sm">Nenhum paciente cadastrado no Clinic TSB ainda.</td></tr>}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* ABA 2: FECHAMENTO FINANCEIRO */}
      {activeTab === "financas" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="bg-neutral-900 border-neutral-800 p-6 shadow-xl relative overflow-hidden">
              <div className="flex items-center gap-4">
                <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20 shrink-0">
                  <DollarSign className="w-6 h-6 text-emerald-400"/>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-neutral-400 block">Faturamento do Período</span>
                  <span className="text-3xl font-black text-emerald-400 mt-1 block">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                      atendimentos.reduce((acc, curr) => acc + (curr.valor_total || 0), 0)
                    )}
                  </span>
                </div>
              </div>
            </Card>

            <Card className="bg-neutral-900 border-neutral-800 p-6 shadow-xl">
              <div className="flex items-center gap-4">
                <div className="bg-teal-500/10 p-4 rounded-xl border border-teal-500/20 shrink-0">
                  <Receipt className="w-6 h-6 text-teal-400"/>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-neutral-400 block">Atendimentos Efetuados</span>
                  <span className="text-3xl font-black text-white mt-1 block">{atendimentos.length} casos</span>
                </div>
              </div>
            </Card>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-lg p-1 pr-2">
              <div className="bg-neutral-800 p-2 rounded-md"><CalendarDays className="w-4 h-4 text-teal-400"/></div>
              <Select value={filtroFinancas} onValueChange={setFiltroFinancas}>
                <SelectTrigger className="border-0 bg-transparent text-white focus:ring-0 w-48">
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

            <Button 
              onClick={exportarRelatorioFinanceiroGeral}
              className="bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 text-white font-bold h-11 w-full sm:w-auto flex items-center gap-2"
            >
              <Printer className="w-4 h-4 text-[#DEAE60]"/> Exportar Relatório em PDF
            </Button>
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
                            <span key={p.name} className="bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800 font-medium text-[11px] uppercase text-neutral-300">
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
                        <Button size="icon" variant="ghost" onClick={() => handleDeleteAtendimento(at.id)} className="w-8 h-8 text-neutral-400 hover:text-red-500 hover:bg-red-500/10" title="Excluir Atendimento"><Trash2 className="w-4 h-4"/></Button>
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

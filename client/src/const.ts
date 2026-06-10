// Constantes da Aplicação LabPro

export const APP_NAME = "LabPro";
export const APP_TITLE = "LabPro - Gestão de Prótese Dentária";
export const APP_DESCRIPTION = "Sistema completo de gestão para laboratório de prótese dentária com controle financeiro e acompanhamento de serviços.";

// Status de Serviços
export const SERVICE_STATUS = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

export const SERVICE_STATUS_LABELS = {
  pending: "Pendente",
  in_progress: "Em Andamento",
  completed: "Finalizado",
  cancelled: "Cancelado",
} as const;

// Tipos de Procedimentos
export const PROCEDURE_TYPES = [
  { value: "coroa", label: "Coroa Unitária" },
  { value: "ponte", label: "Ponte Fixa" },
  { value: "protese-total", label: "Prótese Total" },
  { value: "protese-parcial", label: "Prótese Parcial" },
  { value: "implante", label: "Coroa sobre Implante" },
  { value: "outro", label: "Outro" },
] as const;

// Etapas Padrão de Procedimentos
export const DEFAULT_STAGES = [
  { name: "Moldagem", order: 1 },
  { name: "Processamento", order: 2 },
  { name: "Acabamento", order: 3 },
  { name: "Entrega", order: 4 },
] as const;

// Credenciais de Teste
export const TEST_CREDENTIALS = {
  username: "admin",
  password: "123456",
} as const;

// Cores do Design
export const COLORS = {
  primary: "#1E40AF",
  accent: "#D97706",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#DC2626",
  background: "#FFFFFF",
  foreground: "#1F2937",
  muted: "#6B7280",
} as const;

// Rotas da Aplicação
export const ROUTES = {
  LOGIN: "/login",
  DASHBOARD: "/dashboard",
  SERVICES: "/services",
  NEW_SERVICE: "/services/new",
  SERVICE_DETAIL: (id: string) => `/services/${id}`,
  SERVICE_EDIT: (id: string) => `/services/${id}/edit`,
  REPORTS: "/reports",
  SETTINGS: "/settings",
} as const;

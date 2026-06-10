# LabPro - Frontend de Gestão de Laboratório de Prótese Dentária

## 📋 Visão Geral

Frontend completo para o sistema de gestão de laboratório de prótese dentária **Aline Antunes Prótese Odontológica**, desenvolvido com **React 19 + Tailwind CSS 4 + shadcn/ui**.

O sistema foi baseado na arquitetura e design do sistema de barbearia **Sr. Mendes**, adaptado para as necessidades específicas de um laboratório de prótese.

## 🎨 Design & Identidade Visual

- **Paleta de Cores**: Dourado (#DEAE60) com fundo escuro (Neutral 950)
- **Tipografia**: Poppins (headings) + Inter (body)
- **Tema**: Dark mode elegante com acentos em dourado
- **Logo**: "AA" em dourado dentro de um quadrado arredondado
- **Estilo**: Corporativo, profissional e moderno

## 📱 Páginas Implementadas

### 1. **Login** (`/login`)
- Autenticação com usuário e senha
- Credenciais de teste: `admin` / `123456`
- Design elegante com logo da marca
- Armazenamento de sessão em localStorage

### 2. **Dashboard** (`/dashboard`)
- **KPIs em Cards**:
  - Serviços em Andamento
  - Receita do Mês
  - Serviços Finalizados
  - Lucro Líquido
- **Próximos Serviços**: Lista com avatares, status e horários
- **Ações Rápidas**: Botões para novo serviço, ver serviços e relatórios
- Sidebar colapsável com navegação

### 3. **Serviços** (`/services`)
- **Lista de Serviços**: Tabela com filtros avançados
- **Busca**: Por paciente ou procedimento
- **Filtros de Status**: Todos, Em Andamento, Pendente, Finalizado
- **Zebra-striping**: Linhas alternadas para melhor legibilidade
- **Ações**: Link para ver detalhes de cada serviço

### 4. **Novo Serviço** (`/services/new`)
- **Formulário Completo**:
  - Informações do Paciente (nome, telefone)
  - Informações do Dentista (nome, telefone)
  - Detalhes do Procedimento (tipo, descrição)
  - Informações Financeiras (valor bruto, custo operacional)
- **Cálculo Automático**: Lucro líquido calculado em tempo real
- **Sidebar de Dicas**: Orientações para preenchimento
- **Validação**: Campos obrigatórios marcados com *

### 5. **Detalhes do Serviço** (`/services/:id`)
- **Informações Completas**: Paciente, dentista, procedimento
- **Etapas do Procedimento**: Timeline com status editável
  - Moldagem
  - Processamento
  - Acabamento
  - Entrega
- **Resumo Financeiro**: Valor bruto, custo, lucro líquido e margem
- **Modo Edição**: Permite atualizar etapas e status
- **Exportação de PDF**: Relatório para envio ao dentista

### 6. **Relatórios & Fluxo de Caixa** (`/reports`)
- **KPIs Financeiros**:
  - Receita Total
  - Custo Total
  - Lucro Líquido
  - Margem de Lucro (%)
- **Gráficos**:
  - Gráfico de Barras: Receita vs Custo (Mensal)
  - Gráfico de Pizza: Distribuição de Lucro vs Custo
- **Tabela de Serviços Finalizados**: Com filtro por mês
- **Exportação**: Botão para exportar relatório completo

## 🛠️ Estrutura Técnica

### Stack
- **React 19**: Framework frontend
- **Tailwind CSS 4**: Styling com utility classes
- **shadcn/ui**: Componentes reutilizáveis
- **Wouter**: Roteamento client-side
- **Recharts**: Gráficos interativos
- **Sonner**: Notificações toast
- **Lucide React**: Ícones

### Estrutura de Pastas
```
client/
├── src/
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Services.tsx
│   │   ├── NewService.tsx
│   │   ├── ServiceDetail.tsx
│   │   ├── Reports.tsx
│   │   └── NotFound.tsx
│   ├── components/
│   │   ├── DashboardLayout.tsx
│   │   ├── ui/
│   │   └── ...
│   ├── contexts/
│   │   └── ThemeContext.tsx
│   ├── hooks/
│   ├── lib/
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── public/
│   └── [arquivos estáticos]
└── index.html
```

## 🔐 Autenticação

- **Sistema**: localStorage com JSON
- **Credenciais de Teste**: `admin` / `123456`
- **Proteção de Rotas**: Redirecionamento para login se não autenticado
- **Logout**: Botão na sidebar com confirmação

## 💾 Dados Simulados

Todos os dados são simulados com `useState` e `useEffect`. Para integração com backend:

1. Substituir chamadas `setServices()` por `fetch()` ou `axios`
2. Implementar endpoints da API
3. Adicionar tratamento de erros
4. Implementar paginação

## 📊 Funcionalidades Principais

### Gestão de Serviços
- ✅ Criar novo serviço
- ✅ Listar serviços com filtros
- ✅ Visualizar detalhes
- ✅ Editar etapas e status
- ✅ Acompanhar progresso

### Financeiro
- ✅ Cálculo automático de lucro líquido
- ✅ Relatórios de receita e custo
- ✅ Gráficos de análise
- ✅ Margem de lucro
- ✅ Fluxo de caixa

### Exportação
- ✅ PDF de serviço (estrutura pronta)
- ✅ Relatório geral (estrutura pronta)

## 🚀 Como Usar

### Desenvolvimento
```bash
cd /home/ubuntu/lab-protese-frontend
pnpm install
pnpm dev
```

### Build
```bash
pnpm build
```

### Preview
```bash
pnpm preview
```

## 📝 Próximos Passos para Backend

1. **Autenticação JWT**
   - Endpoint: `POST /auth/login`
   - Retornar token JWT
   - Validar em cada requisição

2. **CRUD de Serviços**
   - `GET /services` - Listar
   - `POST /services` - Criar
   - `GET /services/:id` - Detalhes
   - `PUT /services/:id` - Atualizar
   - `DELETE /services/:id` - Deletar

3. **Relatórios**
   - `GET /reports/monthly` - Dados mensais
   - `GET /reports/completed` - Serviços finalizados
   - `GET /reports/summary` - Resumo financeiro

4. **Exportação de PDF**
   - Endpoint: `POST /services/:id/export-pdf`
   - Retornar PDF com informações limitadas

5. **Banco de Dados**
   - Tabela: `services`
   - Tabela: `stages`
   - Tabela: `users`

## 🎯 Integração com Backend

### Exemplo de Integração
```typescript
// Antes (dados simulados)
const [services, setServices] = useState<Service[]>([]);

// Depois (com backend)
useEffect(() => {
  fetch('/api/services')
    .then(res => res.json())
    .then(data => setServices(data))
    .catch(err => toast.error('Erro ao carregar serviços'));
}, []);
```

## 📱 Responsividade

- ✅ Mobile (< 640px)
- ✅ Tablet (640px - 1024px)
- ✅ Desktop (> 1024px)
- ✅ Sidebar colapsável em mobile

## 🎨 Customização

### Cores
Editar em `client/src/index.css`:
```css
:root {
  --primary: #DEAE60; /* Dourado */
  --background: oklch(0.141 0.005 285.823); /* Preto */
  /* ... */
}
```

### Tipografia
Editar em `client/index.html`:
```html
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;900&display=swap" rel="stylesheet" />
```

## 📄 Licença

© 2024 Aline Antunes Prótese Odontológica. Todos os direitos reservados.

## 📞 Suporte

Para dúvidas ou problemas, entre em contato com a equipe de desenvolvimento.

---

**Desenvolvido com ❤️ para Aline Antunes Prótese Odontológica**

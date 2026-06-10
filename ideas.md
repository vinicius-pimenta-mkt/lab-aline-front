# Brainstorm de Design - LabPro (Sistema de Gestão de Prótese Dentária)

## Contexto
Sistema administrativo para laboratório de prótese dentária com foco em gestão de serviços, acompanhamento de etapas, controle financeiro e relatórios. Baseado no design do sistema Sr. Mendes Barbearia, mas adaptado para um contexto mais profissional e técnico de laboratório.

---

## Ideia 1: Modernismo Corporativo com Acentos Dourados

<response>
<text>
**Design Movement:** Modernismo corporativo com toques de luxo e profissionalismo

**Core Principles:**
- Estrutura limpa e funcional com hierarquia clara
- Uso estratégico de ouro/dourado para destacar elementos críticos (status, ações importantes)
- Foco em legibilidade e eficiência visual
- Paleta neutra (cinza, branco) com acentos de azul profundo

**Color Philosophy:**
- Fundo: Branco puro (#FFFFFF) com cinza muito claro (#F8F9FA) para seções
- Texto principal: Cinza escuro (#1F2937)
- Acentos: Azul profundo (#1E40AF) para CTAs e status positivo
- Destaque: Dourado (#D97706) para elementos críticos (lucro, finalizado)
- Avisos: Âmbar (#F59E0B) para atenção, Vermelho (#DC2626) para erros

**Layout Paradigm:**
- Sidebar esquerdo fixo com navegação vertical (Dashboard, Serviços, Relatórios, Configurações)
- Conteúdo principal com grid de cards para serviços em andamento
- Tabelas com zebra-striping para melhor leitura
- Painel superior com KPIs (receita do dia, serviços em andamento, lucro)

**Signature Elements:**
1. Cards com borda esquerda colorida (status indicator)
2. Badges com ícones para status de serviço (em andamento, aguardando, finalizado)
3. Gráficos de pizza/barras para visualização de lucro vs custo

**Interaction Philosophy:**
- Transições suaves ao abrir/fechar modais
- Hover effects sutis em elementos clicáveis
- Confirmação visual ao salvar dados
- Toast notifications para feedback de ações

**Animation:**
- Entrada de cards com slide-in suave (200ms ease-out)
- Hover em linhas de tabela com background fade (150ms)
- Botões com scale(0.97) ao clicar
- Modais com fade-in + slide-up (250ms)

**Typography System:**
- Headings: Poppins Bold (700) para títulos principais
- Subheadings: Poppins SemiBold (600)
- Body: Inter Regular (400) para conteúdo
- Monospace: JetBrains Mono para valores monetários
</text>
<probability>0.08</probability>
</response>

---

## Ideia 2: Minimalismo Técnico com Foco em Dados

<response>
<text>
**Design Movement:** Minimalismo técnico inspirado em dashboards de dados (estilo DataViz)

**Core Principles:**
- Máxima clareza visual com mínimo de elementos decorativos
- Foco total em legibilidade de dados e números
- Tipografia monoespaçada para valores críticos
- Paleta restrita: apenas cores que comunicam informação

**Color Philosophy:**
- Fundo: Cinza muito claro (#F3F4F6) com áreas brancas para conteúdo
- Texto: Cinza escuro (#111827) para máximo contraste
- Dados positivos: Verde (#10B981)
- Dados negativos/atenção: Vermelho (#EF4444)
- Neutro/informativo: Azul (#3B82F6)
- Secundário: Cinza (#6B7280)

**Layout Paradigm:**
- Grid assimétrico com widgets redimensionáveis
- Números grandes e proeminentes (KPIs)
- Tabelas com densidade alta de informação
- Sem sidebar fixo, navegação em abas horizontais

**Signature Elements:**
1. Números em tipografia grande (48px+) para valores críticos
2. Linhas verticais sutis para separação de seções
3. Indicadores de tendência (↑ ↓) com cores
4. Sparklines para histórico rápido

**Interaction Philosophy:**
- Cliques diretos em dados para drill-down
- Filtros rápidos sem necessidade de modais
- Exportação de dados em um clique
- Sem animações desnecessárias, apenas transições de estado

**Animation:**
- Mudanças de números com contador animado (300ms)
- Transições de cor para status (200ms)
- Sem animações de entrada, apenas fade-in (100ms)
- Hover sutil com mudança de background (150ms)

**Typography System:**
- Headings: IBM Plex Mono Bold para títulos
- Body: IBM Plex Sans Regular para descrições
- Dados: JetBrains Mono para números e valores
- Labels: IBM Plex Sans SemiBold para campos
</text>
<probability>0.07</probability>
</response>

---

## Ideia 3: Design Dentário Premium com Tons Naturais

<response>
<text>
**Design Movement:** Design premium inspirado em clínicas dentárias de alto padrão com tons naturais e elegância

**Core Principles:**
- Elegância sutil com tons de azul-claro e verde-menta
- Inspiração em ambientes médicos modernos e acolhedores
- Foco em conforto visual e profissionalismo
- Uso de espaçamento generoso e tipografia sofisticada

**Color Philosophy:**
- Fundo: Branco com toque de azul muito claro (#F0F7FF)
- Texto: Azul-cinza escuro (#0F172A)
- Primário: Azul-menta (#06B6D4) para ações principais
- Secundário: Verde-menta (#10B981) para status positivo
- Acentos: Coral suave (#FB7185) para alertas
- Destaque: Azul profundo (#0369A1) para elementos críticos

**Layout Paradigm:**
- Sidebar esquerdo com ícones + texto, design clean
- Conteúdo com cards com sombra suave
- Espaçamento generoso entre elementos
- Uso de ícones médicos/dentários para contextualizar

**Signature Elements:**
1. Cards com canto superior arredondado com gradiente sutil
2. Ícones de dente/prótese em elementos visuais
3. Badges com ícones para etapas do procedimento
4. Timeline visual para acompanhamento de etapas

**Interaction Philosophy:**
- Transições suaves e agradáveis
- Feedback visual claro em todas as ações
- Modais com overlay semi-transparente
- Confirmações visuais com animações delicadas

**Animation:**
- Entrada de elementos com fade + scale (250ms ease-out)
- Hover em cards com elevação sutil (200ms)
- Transição de status com mudança de cor (300ms)
- Timeline com animação de conexão entre etapas (400ms)

**Typography System:**
- Headings: Playfair Display SemiBold para títulos principais
- Subheadings: Poppins SemiBold (600)
- Body: Lato Regular (400) para conteúdo
- Dados: IBM Plex Mono para valores monetários
</text>
<probability>0.09</probability>
</response>

---

## Decisão Final

Após análise das três abordagens, escolho a **Ideia 1: Modernismo Corporativo com Acentos Dourados** por ser a mais equilibrada entre profissionalismo, funcionalidade e elegância. Esta abordagem:

- Mantém a identidade visual corporativa necessária para um laboratório
- Utiliza o dourado de forma estratégica (similar ao amarelo do Sr. Mendes, mas mais sofisticado)
- Oferece excelente legibilidade para dados financeiros e operacionais
- Permite fácil extensão para futuras features
- Cria uma hierarquia visual clara entre ações normais e críticas

**Paleta Final:**
- Primário: Azul #1E40AF
- Acentos: Dourado #D97706
- Fundo: Branco #FFFFFF
- Secundário: Cinza #F8F9FA
- Texto: Cinza Escuro #1F2937

**Tipografia:**
- Display: Poppins (Bold, SemiBold)
- Body: Inter (Regular, Medium)
- Data: JetBrains Mono

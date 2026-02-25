# Sistema de Controle de Toner

Sistema completo para gerenciamento de estoque de toners, com movimentações, histórico de preços, ordens de compra, logs de atividades, relatórios e muito mais.

## 📋 Pré‑requisitos

- Node.js (versão 18 ou superior) – [baixar aqui](https://nodejs.org)
- Git (opcional, para clonar o repositório) – [baixar aqui](https://git-scm.com)
- Conta no [Supabase](https://supabase.com) (gratuita)
- Editor de código (VS Code recomendado)

## 🚀 Instalação e execução

### 1. Clone o repositório (ou copie os arquivos)

```bash
git clone https://github.com/SEU-USUARIO/controle-toner.git
cd controle-toner
```

### 2. Instale as dependências
Na raiz do projeto, execute:
```bash
npm install
```

### 3. Configure o banco de dados (Supabase)
#### 3.1 Crie um projeto no Supabase

- Acesse supabase.com e faça login.

- Clique em "New project".

- Preencha o nome, a senha do banco e escolha uma região.

- Aguarde a criação do projeto.
#### 3.2 Execute os scripts SQL
No menu lateral, vá em SQL Editor. Execute os seguintes scripts (na ordem):

- scripts/001_create_tables.sql (cria as tabelas principais)

- scripts/002_add_price_column.sql (adiciona coluna de preço nas    movimentações)

- scripts/003_create_profiles_table.sql (cria tabela de perfis)

- scripts/004_create_purchase_orders.sql (cria tabelas de ordens de compra)

- scripts/005_activity_logs.sql (cria tabela de logs de atividades)

Caso prefira, você pode executar todos os scripts de uma só vez, respeitando a ordem das dependências.
#### 3.3 Obtenha as credenciais do projeto
- No painel do Supabase, vá em Project Settings → API.

- Anote a URL e a chave anônima (anon public).
### 4. Configure as variáveis de ambiente 
Crie um arquivo .env.local na raiz do projeto com o seguinte conteúdo:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-publica
```
Substitua pelos valores obtidos no passo anterior.
### 5. Execute o projeto
```bash
npm run dev
```
Acesse http://localhost:3000 no navegador.
### 6. Crie um usuário administratdor 
- Acesse /register e crie um novo usuário.

- No SQL Editor do Supabase, execute o comando abaixo para tornar esse usuário administrador (substitua 'email@exemplo.com' pelo e‑mail usado):
```bash
UPDATE public.profiles SET role = 'admin' WHERE id = (SELECT id FROM auth.users WHERE email = 'email@exemplo.com');
```
Agora você terá acesso à página de Backups (exclusiva para admins).

## 📁 Estrutura do Projeto

### 📂 app/  
Páginas e rotas da aplicação

- 📂 **admin/** – Área administrativa (backups)  
- 📂 **compras/** – Módulo de ordens de compra  
- 📂 **login/** – Página de login  
- 📂 **logs/** – Visualização de logs de atividades  
- 📂 **perfil/** – Perfil do usuário (alterar nome/senha)  
- 📂 **precos/** – Histórico de preços  
- 📂 **register/** – Registro de novos usuários  
- 📂 **relatorios/** – Relatórios avançados (Excel/PDF)  
- 📂 **sugestao-pedido/** – Sugestão automática de pedido  
- 📄 **page.tsx** – Página inicial (dashboard)  
- 📄 **layout.tsx**  
- 🎨 **globals.css**  
- 🔐 **middleware.ts** – Proteção de rotas  

---

#### 📂 components/  
Componentes reutilizáveis (UI, tabelas, diálogos, etc.)

#### 📂 lib/  
Utilitários, clientes Supabase, logger, constantes

#### 📂 public/  
Ícones e arquivos estáticos

#### 📂 scripts/  
Scripts SQL para criação do banco

#### 📂 styles/  
Estilos adicionais

### 🧰 Funcionalidades Principais

- ✅ **Autenticação com Supabase** (e-mail/senha)  
- ✅ **Gestão de toners** (cadastro, edição, exclusão)  
- ✅ **Movimentações** (entrada/saída com observação e preço opcional)  
- ✅ **Histórico de preços por toner** (gráfico e tabela)  
- ✅ **Ordens de compra** (criação, envio, recebimento com atualização automática do estoque)  
- ✅ **Sugestão automática de pedido** baseada no estoque mínimo  
- ✅ **Logs de atividades detalhados** (quem fez o quê e quando)  
- ✅ **Relatórios em Excel e PDF** com filtros por período  
- ✅ **Backups (apenas para admins)** – visualização e download dos backups do Supabase  
- ✅ **Tema claro/escuro** com alternância  
- ✅ **Notificações** (sino com contador de itens críticos)  
- ✅ **Página de ajuda** com FAQs e tutoriais interativos  
- ✅ **Perfil do usuário** (editar nome, alterar senha)  

---

### 📦 Tecnologias Utilizadas

- **Next.js** (App Router)  
- **React**  
- **TypeScript**  
- **Tailwind CSS**  
- **shadcn/ui** – Componentes de interface  
- **Supabase** – Banco de dados, autenticação e storage  
- **Recharts** – Gráficos  
- **jsPDF** – Geração de PDF  
- **xlsx** – Exportação para Excel  
- **date-fns** – Manipulação de datas  

---

# 📄 Licença

Este projeto é de uso interno.  
Consulte o responsável antes de distribuir ou modificar.

---

**Desenvolvido por:** Gabriel Miquelin / Grupo Crivialli  
📧 suporte@crivialli.com.br
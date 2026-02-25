'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  ArrowRight,
  BookOpen, 
  HelpCircle, 
  FileText, 
  Bell, 
  ShoppingCart, 
  Database, 
  DollarSign, 
  Package,
  Search,
  TrendingUp,
  Filter,
  History,
  BarChart,
  Repeat,
  Keyboard,
  Home,
  LogOut,
  User,
  Settings,
  Globe,
  Mail,
  Zap,
  Sparkles,
  Star,
  AlertCircle,
  MessageCircle,
  ExternalLink,
  Clock,
  Maximize,
  Minimize,
  Truck,
  Send,
  CheckCircle,
  XCircle,
  Download,
  Eye,
  Pencil,
  Trash2,
  Plus,
  Minus,
  Moon,
  Sun,
  Laptop
} from 'lucide-react'

export default function AjudaPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [feedbackSent, setFeedbackSent] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('todos')

  const categories = [
    { id: 'todos', nome: 'Todos', icone: <BookOpen className="h-4 w-4" /> },
    { id: 'primeiros', nome: 'Primeiros Passos', icone: <Sparkles className="h-4 w-4" /> },
    { id: 'estoque', nome: 'Estoque', icone: <Package className="h-4 w-4" /> },
    { id: 'compras', nome: 'Compras', icone: <ShoppingCart className="h-4 w-4" /> },
    { id: 'relatorios', nome: 'Relatórios', icone: <BarChart className="h-4 w-4" /> },
    { id: 'configuracoes', nome: 'Configurações', icone: <Settings className="h-4 w-4" /> },
  ]

  const tutoriais = {
    primeirosPassos: {
      titulo: 'Primeiros Passos',
      icone: <Sparkles className="h-5 w-5 text-purple-500" />,
      descricao: 'Configure o sistema, cadastre toners e comece a usar.',
      tags: ['inicio', 'configuracao', 'cadastro'],
      destaque: true,
      categoria: 'primeiros',
      cor: 'from-purple-500 to-pink-500',
      conteudo: (
        <div className="space-y-3">
          <p>Para começar a usar o sistema, siga estes passos:</p>
          <ol className="list-decimal ml-5 space-y-2">
            <li>Faça login com seu e-mail e senha.</li>
            <li>Na página inicial, clique em <strong>"Novo Toner"</strong>.</li>
            <li>Preencha: Produto, Tipo, Marca, Quantidade Inicial e Estoque Mínimo.</li>
            <li>Clique em <strong>"Cadastrar"</strong>.</li>
            <li>Repita para todos os toners que você possui.</li>
          </ol>
          <p>Agora você já pode controlar seu estoque!</p>
        </div>
      ),
    },
    movimentacoes: {
      titulo: 'Movimentações de Estoque',
      icone: <Repeat className="h-5 w-5 text-blue-500" />,
      descricao: 'Registre entradas, saídas e devoluções com motivo.',
      tags: ['entrada', 'saida', 'devolucao', 'movimentar'],
      destaque: true,
      categoria: 'estoque',
      cor: 'from-blue-500 to-cyan-500',
      conteudo: (
        <div className="space-y-3">
          <p>Registrar entrada ou saída:</p>
          <ul className="list-disc ml-5 space-y-2">
            <li>Na tabela de itens, localize o toner.</li>
            <li>Clique em <span className="bg-success/20 text-success px-2 py-0.5 rounded">Entrada</span> para adicionar (opcionalmente informando preço).</li>
            <li>Clique em <span className="bg-destructive/20 text-destructive px-2 py-0.5 rounded">Saída</span> para retirar.</li>
            <li>Informe quantidade e observação.</li>
            <li><strong>Novidade:</strong> Para saídas, escolha o motivo: <strong>Consumo</strong> (uso normal) ou <strong>Devolução</strong> (defeito). O motivo aparece no histórico.</li>
            <li>Confirme – o histórico é atualizado automaticamente.</li>
          </ul>
        </div>
      ),
    },
    ordensCompra: {
      titulo: 'Ordens de Compra',
      icone: <Package className="h-5 w-5 text-green-500" />,
      descricao: 'Crie e acompanhe pedidos de compra, registre recebimentos.',
      tags: ['pedido', 'fornecedor', 'compra', 'recebimento'],
      destaque: true,
      categoria: 'compras',
      cor: 'from-green-500 to-teal-500',
      conteudo: (
        <div className="space-y-3">
          <p>Gerencie pedidos de compra:</p>
          <ol className="list-decimal ml-5 space-y-2">
            <li>Acesse <strong>Menu → Gestão de Compras → Compras</strong>.</li>
            <li>Clique em <strong>"Nova Ordem"</strong>.</li>
            <li>Selecione fornecedor, adicione itens (apenas quantidades).</li>
            <li>Após criar, a ordem fica como <strong>Rascunho</strong>.</li>
            <li>Na listagem, você pode visualizar, marcar como enviado, registrar recebimento ou cancelar.</li>
            <li><strong>Ao registrar recebimento:</strong> o estoque é atualizado, uma entrada é registrada no histórico e um log de atividade é gerado.</li>
          </ol>
          <p className="mt-2">Você também pode exportar a ordem em PDF.</p>
        </div>
      ),
    },
    historicoPrecos: {
      titulo: 'Histórico de Preços',
      icone: <DollarSign className="h-5 w-5 text-yellow-500" />,
      descricao: 'Acompanhe a evolução dos preços de compra dos toners.',
      tags: ['preco', 'evolucao', 'custo', 'grafico'],
      destaque: false,
      categoria: 'relatorios',
      cor: 'from-yellow-500 to-orange-500',
      conteudo: (
        <div className="space-y-3">
          <p>Acompanhe a evolução dos preços:</p>
          <ol className="list-decimal ml-5 space-y-2">
            <li>Acesse <strong>Menu → Relatórios e Análises → Histórico de Preços</strong>.</li>
            <li>Selecione um toner para ver gráfico e tabela de preços registrados.</li>
            <li>Os preços são preenchidos automaticamente em entradas com preço.</li>
            <li>É possível exportar os dados para Excel.</li>
          </ol>
        </div>
      ),
    },
    comparativoPeriodos: {
      titulo: 'Comparativo de Períodos',
      icone: <History className="h-5 w-5 text-indigo-500" />,
      descricao: 'Compare dois períodos (movimentações ou gastos) lado a lado.',
      tags: ['comparar', 'periodos', 'grafico', 'analise'],
      destaque: false,
      categoria: 'relatorios',
      cor: 'from-indigo-500 to-purple-500',
      conteudo: (
        <div className="space-y-3">
          <p>Compare dois períodos quaisquer:</p>
          <ol className="list-decimal ml-5 space-y-2">
            <li>Acesse <strong>Menu → Relatórios e Análises → Comparativo de Períodos</strong>.</li>
            <li>Defina datas para Período A e Período B.</li>
            <li>Escolha o tipo: <strong>Movimentações</strong> (entradas/saídas) ou <strong>Gastos</strong>.</li>
            <li>Clique em <strong>Comparar</strong> – gráficos lado a lado são exibidos.</li>
          </ol>
        </div>
      ),
    },
    relatorios: {
      titulo: 'Relatórios',
      icone: <FileText className="h-5 w-5 text-red-500" />,
      descricao: 'Exporte relatórios de estoque, movimentações e logs em Excel/PDF.',
      tags: ['exportar', 'excel', 'pdf', 'dados'],
      destaque: true,
      categoria: 'relatorios',
      cor: 'from-red-500 to-pink-500',
      conteudo: (
        <div className="space-y-3">
          <p>Gerar relatórios:</p>
          <ol className="list-decimal ml-5 space-y-2">
            <li>Acesse <strong>Menu → Relatórios e Análises → Relatórios</strong>.</li>
            <li>Escolha o tipo: Estoque, Movimentações, Logs ou Itens com Estoque Baixo.</li>
            <li>Defina um período (opcional) e clique em <strong>Exportar Excel</strong> ou <strong>Exportar PDF</strong>.</li>
          </ol>
        </div>
      ),
    },
    sugestaoPedido: {
      titulo: 'Sugestão de Pedido',
      icone: <ShoppingCart className="h-5 w-5 text-emerald-500" />,
      descricao: 'Descubra o que comprar com base no estoque baixo.',
      tags: ['compra', 'sugestao', 'repor'],
      destaque: false,
      categoria: 'compras',
      cor: 'from-emerald-500 to-teal-500',
      conteudo: (
        <div className="space-y-3">
          <p>A ferramenta inteligente de sugestão de pedido:</p>
          <ol className="list-decimal ml-5 space-y-2">
            <li>Acesse <strong>Menu → Gestão de Compras → Sugestão de Pedido</strong>.</li>
            <li>Ajuste o multiplicador (ex: comprar até 2x o mínimo).</li>
            <li>Marque se deseja incluir itens zerados.</li>
            <li>A tabela mostra itens com estoque baixo e quantidade sugerida.</li>
            <li>Exporte a lista em Excel ou PDF.</li>
          </ol>
        </div>
      ),
    },
    notificacoes: {
      titulo: 'Notificações (Sino)',
      icone: <Bell className="h-5 w-5 text-amber-500" />,
      descricao: 'Alertas sobre itens em estoque crítico.',
      tags: ['sino', 'alerta', 'critico'],
      destaque: false,
      categoria: 'configuracoes',
      cor: 'from-amber-500 to-orange-500',
      conteudo: (
        <div className="space-y-3">
          <p>O sino de notificações:</p>
          <ul className="list-disc ml-5 space-y-2">
            <li>Contador vermelho indica toners com quantidade ≤ mínimo.</li>
            <li>Ao clicar, você vê a lista desses itens.</li>
            <li>Clicar em um item leva à página inicial para rápida movimentação.</li>
            <li>O botão "Ver todos" abre o relatório de itens com estoque baixo.</li>
          </ul>
        </div>
      ),
    },
    pesquisaGlobal: {
      titulo: 'Pesquisa Global',
      icone: <Search className="h-5 w-5 text-violet-500" />,
      descricao: 'Encontre rapidamente qualquer item, ordem, log ou página.',
      tags: ['buscar', 'lupa', 'ctrl+k'],
      destaque: true,
      categoria: 'configuracoes',
      cor: 'from-violet-500 to-purple-500',
      conteudo: (
        <div className="space-y-3">
          <p>Busca global:</p>
          <ul className="list-disc ml-5 space-y-2">
            <li>Clique na lupa no cabeçalho ou pressione <kbd>Ctrl+K</kbd>.</li>
            <li>Digite palavras‑chave para buscar toners, ordens, logs ou páginas.</li>
            <li>Resultados em tempo real, agrupados por categoria.</li>
            <li>Ao selecionar um resultado, você é redirecionado diretamente.</li>
          </ul>
        </div>
      ),
    },
    previsaoConsumo: {
      titulo: 'Previsão de Consumo',
      icone: <TrendingUp className="h-5 w-5 text-rose-500" />,
      descricao: 'Saiba quando os toners devem acabar, com base no histórico.',
      tags: ['prever', 'consumo', 'alerta'],
      destaque: false,
      categoria: 'estoque',
      cor: 'from-rose-500 to-pink-500',
      conteudo: (
        <div className="space-y-3">
          <p>Na página inicial, alertas preditivos:</p>
          <ul className="list-disc ml-5 space-y-2">
            <li>Baseado nas saídas dos últimos 30 dias, calcula consumo médio diário.</li>
            <li>Se o estoque atual for suficiente para menos de 30 dias, um card amarelo é exibido.</li>
            <li>Mostra nome, marca, estoque atual, dias restantes e data estimada.</li>
          </ul>
        </div>
      ),
    },
    filtrosLogs: {
      titulo: 'Filtros na Página de Logs',
      icone: <Filter className="h-5 w-5 text-slate-500" />,
      descricao: 'Refine a visualização dos logs por texto e período.',
      tags: ['logs', 'filtrar', 'data'],
      destaque: false,
      categoria: 'configuracoes',
      cor: 'from-slate-500 to-gray-500',
      conteudo: (
        <div className="space-y-3">
          <p>Na página de Logs:</p>
          <ul className="list-disc ml-5 space-y-2">
            <li><strong>Busca textual:</strong> por e‑mail, ação ou detalhes.</li>
            <li><strong>Período:</strong> datas inicial e final.</li>
            <li><strong>Botão "Limpar filtros":</strong> remove todos os filtros.</li>
          </ul>
        </div>
      ),
    },
    modoCompacto: {
      titulo: 'Modo Compacto',
      icone: <Minimize className="h-5 w-5 text-cyan-500" />,
      descricao: 'Reduza espaçamentos e veja mais informações na tela.',
      tags: ['visualizacao', 'densidade', 'compacto'],
      destaque: false,
      categoria: 'configuracoes',
      cor: 'from-cyan-500 to-blue-500',
      conteudo: (
        <div className="space-y-3">
          <p>No menu <strong>Sistema</strong>, você pode alternar entre os modos <strong>Confortável</strong> e <strong>Compacto</strong>.</p>
          <p>O modo compacto reduz paddings e tamanhos de fonte, permitindo que mais itens sejam exibidos na tela ao mesmo tempo – ideal para quem gerencia muitos toners.</p>
        </div>
      ),
    },
    backups: {
      titulo: 'Backups (Admin)',
      icone: <Database className="h-5 w-5 text-stone-500" />,
      descricao: 'Visualize e baixe backups automáticos (apenas admin).',
      tags: ['backup', 'restaurar', 'admin'],
      destaque: false,
      categoria: 'configuracoes',
      cor: 'from-stone-500 to-neutral-500',
      conteudo: (
        <div className="space-y-3">
          <p>Administradores têm acesso à página de backups:</p>
          <ol className="list-decimal ml-5 space-y-2">
            <li>Acesse <strong>Menu → Sistema → Backups</strong>.</li>
            <li>Veja a lista dos últimos backups automáticos.</li>
            <li>Faça download de um backup.</li>
            <li>Para restaurar, siga as instruções técnicas (via CLI ou painel Supabase).</li>
          </ol>
          <p className="text-sm text-muted-foreground mt-2">Os backups são diários e retidos por 7 dias (plano gratuito).</p>
        </div>
      ),
    },
    perfil: {
      titulo: 'Perfil do Usuário',
      icone: <User className="h-5 w-5 text-sky-500" />,
      descricao: 'Edite seu nome, altere senha e configure preferências.',
      tags: ['perfil', 'senha', 'preferencias'],
      destaque: false,
      categoria: 'configuracoes',
      cor: 'from-sky-500 to-blue-500',
      conteudo: (
        <div className="space-y-3">
          <p>No menu <strong>Sistema → Perfil</strong>, você pode:</p>
          <ul className="list-disc ml-5 space-y-2">
            <li>Alterar seu nome.</li>
            <li>Modificar sua senha (com confirmação).</li>
            <li>Configurar tema (claro/escuro/sistema) e notificações.</li>
            <li>Visualizar estatísticas (movimentações, logs) e atividades recentes.</li>
          </ul>
        </div>
      ),
    },
  }

  const atalhos = [
    { tecla: 'Ctrl+K', descricao: 'Abrir pesquisa global' },
    { tecla: 'Ctrl+N', descricao: 'Novo toner (na página inicial)' },
    { tecla: 'Ctrl+E', descricao: 'Exportar relatório atual (Excel)' },
    { tecla: 'Ctrl+P', descricao: 'Exportar relatório atual (PDF)' },
    { tecla: 'Ctrl+H', descricao: 'Ir para página inicial' },
    { tecla: 'Ctrl+S', descricao: 'Salvar rascunho (quando aplicável)' },
    { tecla: 'Ctrl+F', descricao: 'Focar na busca (quando disponível)' },
    { tecla: 'Esc', descricao: 'Fechar diálogos / cancelar' },
  ]

  const linksRapidos = [
    { nome: 'Início', href: '/', icone: <Home className="h-4 w-4" /> },
    { nome: 'Logs', href: '/logs', icone: <History className="h-4 w-4" /> },
    { nome: 'Relatórios', href: '/relatorios', icone: <FileText className="h-4 w-4" /> },
    { nome: 'Perfil', href: '/perfil', icone: <User className="h-4 w-4" /> },
    { nome: 'Compras', href: '/compras', icone: <ShoppingCart className="h-4 w-4" /> },
  ]

  const faqs = [
    {
      pergunta: 'Como cadastrar um novo toner?',
      resposta: <p>1. Clique em <strong>"Novo Toner"</strong> na tabela. 2. Preencha os campos e clique em <strong>"Cadastrar"</strong>.</p>,
    },
    {
      pergunta: 'Como registrar uma entrada ou saída?',
      resposta: <p>Na tabela, clique em <span className="bg-success/20 text-success px-2 py-0.5 rounded">Entrada</span> ou <span className="bg-destructive/20 text-destructive px-2 py-0.5 rounded">Saída</span>. Informe quantidade, observação e, para saída, o motivo. Confirme.</p>,
    },
    {
      pergunta: 'Como criar uma ordem de compra?',
      resposta: <p>Acesse <strong>Menu → Gestão de Compras → Compras</strong>, clique em <strong>"Nova Ordem"</strong>, preencha os dados e salve.</p>,
    },
    {
      pergunta: 'Como faço para receber um pedido?',
      resposta: <p>Na página da ordem, altere as quantidades recebidas e clique em <strong>"Registrar Recebimento"</strong>. O estoque será atualizado e uma entrada será registrada.</p>,
    },
    {
      pergunta: 'O que é o modo compacto?',
      resposta: <p>No menu <strong>Sistema</strong>, a opção <strong>Modo Compacto</strong> reduz espaçamentos e fontes, permitindo ver mais itens na tela.</p>,
    },
    {
      pergunta: 'Como uso a pesquisa global?',
      resposta: <p>Clique na lupa ou pressione <kbd>Ctrl+K</kbd> e digite o que procura (toners, ordens, logs, páginas).</p>,
    },
    {
      pergunta: 'Como vejo os logs de atividades?',
      resposta: <p>Acesse <strong>Menu → Sistema → Logs</strong>. Use os filtros para refinar a busca.</p>,
    },
  ]

  const novidades = [
    { data: '25/02/2026', versao: '2.5.0', descricao: 'Modo compacto, filtros no histórico de movimentações, melhorias na pesquisa global.' },
    { data: '23/02/2026', versao: '2.4.0', descricao: 'Motivo de saída (devolução/consumo), gráfico de evolução do estoque.' },
    { data: '20/02/2026', versao: '2.3.0', descricao: 'Módulo de Ordens de Compra e Histórico de Preços.' },
    { data: '15/02/2026', versao: '2.2.0', descricao: 'Pesquisa global, relatórios comparativos.' },
  ]

  const tutoriaisFiltrados = useMemo(() => {
    const term = searchTerm.toLowerCase()
    return Object.entries(tutoriais).filter(([key, tutorial]) => {
      const matchesSearch = tutorial.titulo.toLowerCase().includes(term) ||
        tutorial.descricao.toLowerCase().includes(term) ||
        tutorial.tags.some(tag => tag.includes(term))
      const matchesCategory = selectedCategory === 'todos' || tutorial.categoria === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [searchTerm, selectedCategory])

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (feedbackMessage.trim()) {
      setFeedbackSent(true)
      setTimeout(() => {
        setFeedbackOpen(false)
        setFeedbackSent(false)
        setFeedbackMessage('')
      }, 2000)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto p-4 max-w-7xl">
        {/* Cabeçalho com efeito vidro */}
        <div className="sticky top-0 z-10 backdrop-blur-lg bg-white/70 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800 rounded-b-2xl mb-6">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                className="rounded-full hover:bg-slate-200 dark:hover:bg-slate-800"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-2xl">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Central de Ajuda
                </h1>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild className="rounded-full">
                <Link href="/">Página Inicial</Link>
              </Button>
            </div>
          </div>

          {/* Barra de pesquisa integrada */}
          <div className="px-4 pb-4">
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar tutoriais (por título, descrição ou palavra‑chave)..."
                className="pl-9 py-6 text-base rounded-full border-2 focus:border-primary"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Filtros de categoria com chips */}
          <div className="px-4 pb-4 flex flex-wrap gap-2 justify-center">
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat.id)}
                className={`rounded-full transition-all ${
                  selectedCategory === cat.id
                    ? 'shadow-md scale-105'
                    : 'hover:scale-105'
                }`}
              >
                {cat.icone}
                <span className="ml-2">{cat.nome}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Conteúdo principal */}
        <div className="space-y-8">
          {/* Links rápidos com cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {linksRapidos.map((link) => (
              <Link key={link.href} href={link.href}>
                <motion.div
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all border border-slate-200 dark:border-slate-700"
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="p-3 bg-primary/10 rounded-full text-primary">
                      {link.icone}
                    </div>
                    <span className="text-sm font-medium">{link.nome}</span>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>

          {/* Seção em Destaque com gradientes e animação */}
          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Star className="h-6 w-6 text-yellow-500" />
              Em Destaque
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(tutoriais)
                .filter(([key, t]) => t.destaque)
                .map(([key, tutorial], index) => (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all group">
                      <div className={`h-2 bg-gradient-to-r ${tutorial.cor}`} />
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <div className="p-2 rounded-lg bg-opacity-10" style={{ backgroundColor: `${tutorial.cor.split(' ')[1]}20` }}>
                            {tutorial.icone}
                          </div>
                          {tutorial.titulo}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          {tutorial.descricao}
                        </p>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" className="w-full group-hover:bg-primary/10 transition-colors">
                              Ver tutorial completo
                              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2 text-xl">
                                {tutorial.icone}
                                {tutorial.titulo}
                              </DialogTitle>
                              <DialogDescription>
                                Tutorial passo a passo
                              </DialogDescription>
                            </DialogHeader>
                            <div className="mt-4 prose dark:prose-invert max-w-none">
                              {tutorial.conteudo}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
            </div>
          </section>

          {/* FAQ com acordeão moderno */}
          <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <HelpCircle className="h-6 w-6 text-primary" />
              Perguntas Frequentes
            </h2>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`faq-${index}`} className="border-b border-slate-200 dark:border-slate-700 last:border-0">
                  <AccordionTrigger className="text-left hover:no-underline hover:bg-slate-50 dark:hover:bg-slate-700/50 px-4 rounded-lg transition-colors">
                    {faq.pergunta}
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 text-muted-foreground">
                    {faq.resposta}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>

          {/* Atalhos de teclado com cards */}
          <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Keyboard className="h-6 w-6 text-primary" />
              Atalhos de Teclado
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {atalhos.map(({ tecla, descricao }) => (
                <div key={tecla} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-sm font-medium">{descricao}</span>
                  <Badge variant="outline" className="font-mono bg-white dark:bg-slate-800">
                    {tecla}
                  </Badge>
                </div>
              ))}
            </div>
          </section>

          {/* Novidades com timeline */}
          <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Clock className="h-6 w-6 text-primary" />
              Novidades e Atualizações
            </h2>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary to-transparent" />
              <div className="space-y-6">
                {novidades.map((item, i) => (
                  <div key={i} className="relative pl-10">
                    <div className="absolute left-2 top-1 w-4 h-4 rounded-full bg-primary border-4 border-white dark:border-slate-800" />
                    <div className="flex items-start gap-4">
                      <Badge variant="outline" className="shrink-0 bg-primary/10 border-primary/20">
                        {item.versao}
                      </Badge>
                      <div>
                        <p className="text-sm font-medium text-primary">{item.data}</p>
                        <p className="text-sm text-muted-foreground">{item.descricao}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Tutoriais com grid responsivo */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                Tutoriais Passo a Passo
              </h2>
              <Badge variant="outline" className="text-lg px-4 py-2">
                {tutoriaisFiltrados.length} tutoriais
              </Badge>
            </div>

            {tutoriaisFiltrados.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl shadow-xl">
                <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg text-muted-foreground">
                  Nenhum tutorial encontrado para "{searchTerm}".
                </p>
              </div>
            ) : (
              <AnimatePresence>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {tutoriaisFiltrados.map(([key, tutorial], index) => (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all group">
                        <div className={`h-1 bg-gradient-to-r ${tutorial.cor}`} />
                        <CardHeader className="pb-2">
                          <CardTitle className="flex items-center gap-2 text-base">
                            <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${tutorial.cor.split(' ')[1]}20` }}>
                              {tutorial.icone}
                            </div>
                            {tutorial.titulo}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {tutorial.descricao}
                          </p>
                          <div className="flex flex-wrap gap-1 mb-3">
                            {tutorial.tags.slice(0, 2).map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                #{tag}
                              </Badge>
                            ))}
                            {tutorial.tags.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{tutorial.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" className="w-full group-hover:bg-primary/10 transition-colors">
                                Ver tutorial completo
                                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2 text-xl">
                                  {tutorial.icone}
                                  {tutorial.titulo}
                                </DialogTitle>
                                <DialogDescription>
                                  Tutorial passo a passo
                                </DialogDescription>
                              </DialogHeader>
                              <div className="mt-4 prose dark:prose-invert max-w-none">
                                {tutorial.conteudo}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </AnimatePresence>
            )}
          </section>

          {/* Rodapé com glassmorphism */}
          <div className="backdrop-blur-lg bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center">
            <p className="text-lg font-medium bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              © 2026 Controle de Toner | Grupo Crivialli
            </p>
            <p className="mt-2 flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                suporte@crivialli.com.br
              </span>
              <span className="flex items-center gap-1">
                <Globe className="h-3 w-3" />
                v2.5.0
              </span>
            </p>
            <div className="mt-4 flex justify-center gap-4">
              <Link href="/termos" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Termos de Uso
              </Link>
              <Link href="/privacidade" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Privacidade
              </Link>
              <Button variant="ghost" size="sm" onClick={() => setFeedbackOpen(true)}>
                <MessageCircle className="h-4 w-4 mr-2" />
                Feedback
              </Button>
            </div>
          </div>
        </div>

        {/* Modal de feedback */}
        <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Enviar feedback</DialogTitle>
              <DialogDescription>
                Sua opinião nos ajuda a melhorar o sistema.
              </DialogDescription>
            </DialogHeader>
            {feedbackSent ? (
              <div className="py-8 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-lg font-medium text-green-600">Feedback enviado!</p>
                <p className="text-sm text-muted-foreground">Obrigado pela contribuição.</p>
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                <Textarea
                  placeholder="Digite sua sugestão, crítica ou elogio..."
                  value={feedbackMessage}
                  onChange={(e) => setFeedbackMessage(e.target.value)}
                  rows={4}
                  required
                  className="resize-none"
                />
                <Button type="submit" className="w-full">
                  Enviar
                </Button>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
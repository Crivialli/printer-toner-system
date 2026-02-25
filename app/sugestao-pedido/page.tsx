'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  ArrowLeft,
  Download,
  ShoppingCart,
  AlertTriangle,
  TrendingUp,
  Package,
  Info,
  Copy,
  PieChart,
  BarChart3,
  Check,
} from 'lucide-react'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { toast } from 'sonner'
import {
  PieChart as RePieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface TonerSugestao {
  id: string
  name: string
  type: string
  brand: string
  quantity: number
  minQuantity: number
  suggested: number
  priority: 'alta' | 'media' | 'baixa'
}

// Variantes para animação
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 24,
      mass: 0.5,
    },
  },
}

const COLORS = {
  alta: '#ef4444',
  media: '#f97316',
  baixa: '#22c55e',
}

export default function SugestaoPedidoPage() {
  const [toners, setToners] = useState<TonerSugestao[]>([])
  const [loading, setLoading] = useState(true)
  const [multiplicador, setMultiplicador] = useState(2)
  const [incluirZerados, setIncluirZerados] = useState(true)
  const [copiado, setCopiado] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadToners() {
      const { data, error } = await supabase
        .from('toners')
        .select('id, name, type, brand, quantity, min_quantity')
        .order('name')

      if (error) {
        console.error('Erro ao carregar toners:', error)
      } else if (data) {
        const sugestoes = data
          .filter(t => t.quantity < t.min_quantity || (incluirZerados && t.quantity === 0))
          .map(t => {
            const suggested = Math.max(0, t.min_quantity * multiplicador - t.quantity)
            let priority: 'alta' | 'media' | 'baixa' = 'baixa'
            if (t.quantity === 0) priority = 'alta'
            else if (t.quantity < t.min_quantity / 2) priority = 'media'
            return {
              id: t.id,
              name: t.name,
              type: t.type === 'toner' ? 'Toner' : 'Cilindro',
              brand: t.brand,
              quantity: t.quantity,
              minQuantity: t.min_quantity,
              suggested,
              priority,
            }
          })
          .sort((a, b) => {
            const prioridade: Record<string, number> = { alta: 1, media: 2, baixa: 3 }
            return prioridade[a.priority] - prioridade[b.priority] || a.name.localeCompare(b.name)
          })
        setToners(sugestoes)
      }
      setLoading(false)
    }
    loadToners()
  }, [supabase, multiplicador, incluirZerados])

  const handleExportExcel = () => {
    const data = toners.map(t => ({
      Produto: t.name,
      Tipo: t.type,
      Marca: t.brand,
      'Estoque Atual': t.quantity,
      'Estoque Mínimo': t.minQuantity,
      'Sugestão de Compra': t.suggested,
      Prioridade: t.priority === 'alta' ? 'Alta' : t.priority === 'media' ? 'Média' : 'Baixa',
    }))

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Sugestão')
    XLSX.writeFile(wb, `sugestao_pedido_${new Date().toISOString().slice(0,10)}.xlsx`)
    toast.success('Planilha exportada com sucesso!')
  }

  const handleExportPDF = () => {
    const doc = new jsPDF()
    doc.text('Sugestão Automática de Pedido', 14, 15)

    const tableColumn = ['Produto', 'Tipo', 'Marca', 'Estoque', 'Mínimo', 'Sugestão', 'Prioridade']
    const tableRows = toners.map(t => [
      t.name,
      t.type,
      t.brand,
      t.quantity.toString(),
      t.minQuantity.toString(),
      t.suggested.toString(),
      t.priority === 'alta' ? 'Alta' : t.priority === 'media' ? 'Média' : 'Baixa',
    ])

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 25,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] },
    })

    doc.save(`sugestao_pedido_${new Date().toISOString().slice(0,10)}.pdf`)
    toast.success('PDF exportado com sucesso!')
  }

  const handleCopyList = () => {
    const text = toners
      .map(t => `${t.name} (${t.brand}): ${t.suggested} unidades (Prioridade ${t.priority})`)
      .join('\n')
    navigator.clipboard.writeText(text)
    setCopiado(true)
    toast.success('Lista copiada para a área de transferência!')
    setTimeout(() => setCopiado(false), 2000)
  }

  const totalSugerido = toners.reduce((acc, t) => acc + t.suggested, 0)

  // Dados para os gráficos
  const prioridadeData = useMemo(() => {
    const counts = {
      alta: toners.filter(t => t.priority === 'alta').length,
      media: toners.filter(t => t.priority === 'media').length,
      baixa: toners.filter(t => t.priority === 'baixa').length,
    }
    return [
      { name: 'Alta', value: counts.alta, color: COLORS.alta },
      { name: 'Média', value: counts.media, color: COLORS.media },
      { name: 'Baixa', value: counts.baixa, color: COLORS.baixa },
    ].filter(d => d.value > 0)
  }, [toners])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="h-16 w-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando sugestões...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <div className="container mx-auto p-4 max-w-7xl">
          {/* Cabeçalho com gradiente */}
          <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 p-8 text-white shadow-xl">
            <div className="absolute right-0 top-0 h-full w-1/3 bg-white/10 skew-x-12" />
            <div className="relative z-10">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.back()}
                  className="rounded-full bg-white/20 text-white hover:bg-white/30"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-3xl font-bold">Sugestão Automática de Pedido</h1>
                  <p className="text-green-100">Calcule a quantidade ideal para comprar</p>
                </div>
              </div>
            </div>
          </div>

          {/* Cards de resumo com tooltips e animação */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div variants={itemVariants}>
                  <Card className="border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Itens para repor</p>
                          <p className="text-3xl font-bold text-blue-600">{toners.length}</p>
                        </div>
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                          <Package className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent>Total de itens que precisam de reposição</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div variants={itemVariants}>
                  <Card className="border-l-4 border-l-green-500 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Total sugerido</p>
                          <p className="text-3xl font-bold text-green-600">{totalSugerido}</p>
                        </div>
                        <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                          <TrendingUp className="h-6 w-6 text-green-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent>Soma de todas as quantidades sugeridas</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div variants={itemVariants}>
                  <Card className="border-l-4 border-l-red-500 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Itens críticos</p>
                          <p className="text-3xl font-bold text-red-600">
                            {toners.filter(t => t.priority === 'alta').length}
                          </p>
                        </div>
                        <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
                          <AlertTriangle className="h-6 w-6 text-red-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent>Itens com prioridade alta (estoque zerado ou muito baixo)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div variants={itemVariants}>
                  <Card className="border-l-4 border-l-purple-500 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Prioridade baixa</p>
                          <p className="text-3xl font-bold text-purple-600">
                            {toners.filter(t => t.priority === 'baixa').length}
                          </p>
                        </div>
                        <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                          <Check className="h-6 w-6 text-purple-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent>Itens com prioridade baixa (podem esperar um pouco)</TooltipContent>
            </Tooltip>
          </motion.div>

          {/* Configurações e gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Configurações da Sugestão
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="multiplicador">Multiplicador do mínimo</Label>
                      <Badge variant="outline" className="text-sm">
                        {multiplicador}x
                      </Badge>
                    </div>
                    <Slider
                      id="multiplicador"
                      min={1}
                      max={5}
                      step={0.5}
                      value={[multiplicador]}
                      onValueChange={(value) => setMultiplicador(value[0])}
                      className="w-full"
                    />
                    <p className="text-sm text-muted-foreground">
                      Sugerir comprar até {multiplicador}x o estoque mínimo
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="incluirZerados"
                      checked={incluirZerados}
                      onChange={(e) => setIncluirZerados(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="incluirZerados">Incluir itens sem estoque</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Distribuição por prioridade
                </CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                {prioridadeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={prioridadeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {prioridadeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </RePieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    Nenhum dado para exibir
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Botões de ação */}
          <div className="flex flex-wrap gap-3 mb-6">
            <Button onClick={handleExportExcel} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Excel
            </Button>
            <Button onClick={handleExportPDF} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              PDF
            </Button>
            <Button onClick={handleCopyList} variant="outline" className="gap-2">
              {copiado ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copiado ? 'Copiado!' : 'Copiar lista'}
            </Button>
          </div>

          {toners.length === 0 ? (
            <Alert className="border-2 border-dashed">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Nenhum item precisa de reposição</AlertTitle>
              <AlertDescription>
                Todos os toners estão com estoque acima do mínimo (ou acima do multiplicador configurado).
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <Alert className="mb-4 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                <ShoppingCart className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertTitle>Sugestão de compra gerada</AlertTitle>
                <AlertDescription>
                  {toners.length} itens precisam de reposição. Total sugerido: {totalSugerido} unidades.
                </AlertDescription>
              </Alert>

              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <Card className="overflow-hidden border-0 shadow-lg">
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-muted/50">
                          <TableRow>
                            <TableHead className="font-semibold">Produto</TableHead>
                            <TableHead className="font-semibold">Tipo</TableHead>
                            <TableHead className="font-semibold">Marca</TableHead>
                            <TableHead className="text-center font-semibold">Estoque</TableHead>
                            <TableHead className="text-center font-semibold">Mínimo</TableHead>
                            <TableHead className="text-center font-semibold">Sugestão</TableHead>
                            <TableHead className="text-center font-semibold">Prioridade</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {toners.map((t, index) => (
                            <motion.tr
                              key={t.id}
                              variants={itemVariants}
                              custom={index}
                              className="hover:bg-muted/30 transition-colors"
                            >
                              <TableCell className="font-medium">{t.name}</TableCell>
                              <TableCell>{t.type}</TableCell>
                              <TableCell>{t.brand}</TableCell>
                              <TableCell className="text-center">
                                <Badge variant={t.quantity === 0 ? 'destructive' : 'outline'}>
                                  {t.quantity}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">{t.minQuantity}</TableCell>
                              <TableCell className="text-center font-semibold text-green-600">
                                {t.suggested}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge
                                  variant={
                                    t.priority === 'alta'
                                      ? 'destructive'
                                      : t.priority === 'media'
                                      ? 'default'
                                      : 'secondary'
                                  }
                                >
                                  {t.priority === 'alta' ? 'Alta' : t.priority === 'media' ? 'Média' : 'Baixa'}
                                </Badge>
                              </TableCell>
                            </motion.tr>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}
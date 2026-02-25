'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ArrowLeft, Download, TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import * as XLSX from 'xlsx'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  ReferenceLine,
} from 'recharts'

interface PrecoHistorico {
  id: string
  toner_id: string
  toner_name: string
  price: number
  created_at: string
  quantity: number
}

interface TonerOption {
  id: string
  name: string
  brand: string
  type: string
}

export default function PrecosPage() {
  const [toners, setToners] = useState<TonerOption[]>([])
  const [selectedToner, setSelectedToner] = useState<string>('')
  const [historico, setHistorico] = useState<PrecoHistorico[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    precoMedio: 0,
    precoMin: 0,
    precoMax: 0,
    ultimoPreco: 0,
    variacao: 0,
  })

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadToners() {
      const { data } = await supabase
        .from('toners')
        .select('id, name, brand, type')
        .order('name')
      if (data) setToners(data)
    }
    loadToners()
  }, [supabase])

  useEffect(() => {
    if (!selectedToner) {
      setHistorico([])
      setLoading(false)
      return
    }

    async function loadPrecos() {
      setLoading(true)
      const { data } = await supabase
        .from('stock_movements')
        .select('id, toner_id, toner_name, price, created_at, quantity')
        .eq('toner_id', selectedToner)
        .eq('type', 'entrada')
        .not('price', 'is', null)
        .order('created_at', { ascending: true })

      if (data) {
        setHistorico(data)
        calcularStats(data)
      }
      setLoading(false)
    }
    loadPrecos()
  }, [selectedToner, supabase])

  const calcularStats = (dados: PrecoHistorico[]) => {
    if (dados.length === 0) return

    const precos = dados.map(d => d.price)
    const precoMedio = precos.reduce((a, b) => a + b, 0) / precos.length
    const precoMin = Math.min(...precos)
    const precoMax = Math.max(...precos)
    const ultimoPreco = dados[dados.length - 1].price
    const primeiroPreco = dados[0].price
    const variacao = ((ultimoPreco - primeiroPreco) / primeiroPreco) * 100

    setStats({
      precoMedio,
      precoMin,
      precoMax,
      ultimoPreco,
      variacao,
    })
  }

  const exportToExcel = () => {
    if (!historico.length) return
    const data = historico.map(h => ({
      Data: format(new Date(h.created_at), 'dd/MM/yyyy', { locale: ptBR }),
      Produto: h.toner_name,
      Quantidade: h.quantity,
      'Preço Unitário': h.price,
      Total: (h.price * h.quantity).toFixed(2),
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Histórico de Preços')
    XLSX.writeFile(wb, `precos_${selectedToner}.xlsx`)
  }

  const chartData = historico.map(h => ({
    data: format(new Date(h.created_at), 'dd/MM/yyyy'),
    preco: h.price,
  }))

  const tonerSelecionado = toners.find(t => t.id === selectedToner)

  return (
    <TooltipProvider>
      <div className="container mx-auto p-4 max-w-7xl">
        {/* Cabeçalho com gradiente */}
        <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white shadow-xl">
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
                <h1 className="text-3xl font-bold">Histórico de Preços</h1>
                <p className="text-blue-100">Acompanhe a evolução dos preços de compra dos toners</p>
              </div>
            </div>
          </div>
        </div>

        {/* Seletor e botão exportar */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="w-72">
              <Select value={selectedToner} onValueChange={setSelectedToner}>
                <SelectTrigger className="border-2 focus:ring-2">
                  <SelectValue placeholder="Selecione um toner" />
                </SelectTrigger>
                <SelectContent>
                  {toners.map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      <span className="font-medium">{t.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">({t.brand})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {historico.length > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" onClick={exportToExcel} className="gap-2">
                    <Download className="h-4 w-4" />
                    Exportar Excel
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Exportar dados para planilha Excel</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {selectedToner && loading && (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        )}

        {!loading && selectedToner && historico.length === 0 && (
          <Card className="border-2 border-dashed">
            <CardContent className="py-12 text-center">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum preço registrado</h3>
              <p className="text-muted-foreground">
                Para este toner, ainda não há movimentações de entrada com preço informado.
              </p>
            </CardContent>
          </Card>
        )}

        {historico.length > 0 && (
          <>
            {/* Cards de estatísticas */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <Card className="border-l-4 border-l-blue-500 shadow-md">
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">Preço médio</p>
                  <p className="text-2xl font-bold text-blue-600">
                    R$ {stats.precoMedio.toFixed(2)}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-green-500 shadow-md">
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">Mínimo</p>
                  <p className="text-2xl font-bold text-green-600">
                    R$ {stats.precoMin.toFixed(2)}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-red-500 shadow-md">
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">Máximo</p>
                  <p className="text-2xl font-bold text-red-600">
                    R$ {stats.precoMax.toFixed(2)}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-purple-500 shadow-md">
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">Último preço</p>
                  <p className="text-2xl font-bold text-purple-600">
                    R$ {stats.ultimoPreco.toFixed(2)}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-amber-500 shadow-md">
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">Variação total</p>
                  <div className="flex items-center gap-1">
                    {stats.variacao > 0 ? (
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    ) : stats.variacao < 0 ? (
                      <TrendingDown className="h-5 w-5 text-red-600" />
                    ) : (
                      <Minus className="h-5 w-5 text-gray-600" />
                    )}
                    <span
                      className={`text-2xl font-bold ${
                        stats.variacao > 0 ? 'text-green-600' : stats.variacao < 0 ? 'text-red-600' : ''
                      }`}
                    >
                      {stats.variacao > 0 ? '+' : ''}{stats.variacao.toFixed(1)}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Gráfico de linha com área */}
            <Card className="mb-6 overflow-hidden border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 pb-2">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Evolução do preço ao longo do tempo
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="h-80 w-full">
                  <ResponsiveContainer>
                    <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                      <defs>
                        <linearGradient id="colorPreco" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                      <XAxis dataKey="data" tick={{ fontSize: 12 }} angle={-30} textAnchor="end" height={60} />
                      <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `R$ ${value}`} />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        }}
                        formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Preço']}
                      />
                      <Area
                        type="monotone"
                        dataKey="preco"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        fill="url(#colorPreco)"
                        dot={{ r: 4, strokeWidth: 2, fill: 'white', stroke: '#3b82f6' }}
                        activeDot={{ r: 6 }}
                      />
                      <ReferenceLine
                        y={stats.precoMedio}
                        stroke="#f97316"
                        strokeDasharray="3 3"
                        label={{ value: 'Média', position: 'right', fill: '#f97316', fontSize: 12 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Tabela de histórico */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
                <CardTitle className="text-base font-medium">Detalhamento das compras</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="font-semibold">Data</TableHead>
                        <TableHead className="font-semibold">Produto</TableHead>
                        <TableHead className="text-right font-semibold">Quantidade</TableHead>
                        <TableHead className="text-right font-semibold">Preço unit.</TableHead>
                        <TableHead className="text-right font-semibold">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historico.map(h => (
                        <TableRow key={h.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="font-medium">
                            {format(new Date(h.created_at), 'dd/MM/yyyy')}
                          </TableCell>
                          <TableCell>{h.toner_name}</TableCell>
                          <TableCell className="text-right">{h.quantity}</TableCell>
                          <TableCell className="text-right font-mono">
                            R$ {h.price.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-mono font-semibold text-green-600">
                            R$ {(h.price * h.quantity).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </TooltipProvider>
  )
}
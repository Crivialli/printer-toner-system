'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  BarChart, 
  DollarSign, 
  Calendar, 
  Info, 
  TrendingUp, 
  TrendingDown,
  Scale,
  HelpCircle
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { 
  BarChart as ReBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ReTooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts'

type ComparativoTipo = 'movimentacoes' | 'gastos'

export default function ComparativoPage() {
  const [tipo, setTipo] = useState<ComparativoTipo>('movimentacoes')
  // Período A (esquerda)
  const [inicioA, setInicioA] = useState('')
  const [fimA, setFimA] = useState('')
  // Período B (direita)
  const [inicioB, setInicioB] = useState('')
  const [fimB, setFimB] = useState('')
  const [dadosA, setDadosA] = useState<any[]>([])
  const [dadosB, setDadosB] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [resumoA, setResumoA] = useState({ total: 0, entradas: 0, saidas: 0 })
  const [resumoB, setResumoB] = useState({ total: 0, entradas: 0, saidas: 0 })

  const router = useRouter()
  const supabase = createClient()

  const handleComparar = async () => {
    if (!inicioA || !fimA || !inicioB || !fimB) {
      alert('Preencha todos os campos de data')
      return
    }
    setLoading(true)
    try {
      if (tipo === 'movimentacoes') {
        await carregarMovimentacoes(inicioA, fimA, setDadosA, setResumoA)
        await carregarMovimentacoes(inicioB, fimB, setDadosB, setResumoB)
      } else {
        await carregarGastos(inicioA, fimA, setDadosA, setResumoA)
        await carregarGastos(inicioB, fimB, setDadosB, setResumoB)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  async function carregarMovimentacoes(
    inicio: string, 
    fim: string, 
    setData: (data: any[]) => void,
    setResumo: (resumo: any) => void
  ) {
    const { data: movimentacoes, error } = await supabase
      .from('stock_movements')
      .select('type, quantity')
      .gte('created_at', new Date(inicio).toISOString())
      .lte('created_at', new Date(fim).toISOString())

    if (error) {
      console.error(error)
      setData([])
      setResumo({ total: 0, entradas: 0, saidas: 0 })
      return
    }

    const entradas = movimentacoes.filter(m => m.type === 'entrada').reduce((acc, m) => acc + m.quantity, 0)
    const saidas = movimentacoes.filter(m => m.type === 'saida').reduce((acc, m) => acc + m.quantity, 0)

    setData([
      { name: 'Entradas', valor: entradas },
      { name: 'Saídas', valor: saidas },
    ])
    setResumo({ total: entradas + saidas, entradas, saidas })
  }

  async function carregarGastos(
    inicio: string, 
    fim: string, 
    setData: (data: any[]) => void,
    setResumo: (resumo: any) => void
  ) {
    const { data: movimentacoes, error } = await supabase
      .from('stock_movements')
      .select('price, quantity')
      .eq('type', 'entrada')
      .gte('created_at', new Date(inicio).toISOString())
      .lte('created_at', new Date(fim).toISOString())

    if (error) {
      console.error(error)
      setData([])
      setResumo({ total: 0 })
      return
    }

    const totalGasto = movimentacoes.reduce((acc, m) => acc + (m.price || 0) * m.quantity, 0)
    setData([{ name: 'Gasto total', valor: totalGasto }])
    setResumo({ total: totalGasto })
  }

  const formatarMoeda = (valor: number) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  const calcularVariacao = () => {
    if (tipo === 'movimentacoes') {
      const totalA = resumoA.entradas + resumoA.saidas
      const totalB = resumoB.entradas + resumoB.saidas
      if (totalA === 0) return null
      const variacao = ((totalB - totalA) / totalA) * 100
      return variacao
    } else {
      if (resumoA.total === 0) return null
      const variacao = ((resumoB.total - resumoA.total) / resumoA.total) * 100
      return variacao
    }
  }

  const variacao = calcularVariacao()

  return (
    <TooltipProvider>
      <div className="container mx-auto p-4 max-w-7xl">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <h1 className="text-2xl font-bold">Relatório Comparativo</h1>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon">
                <HelpCircle className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>Compare dois períodos quaisquer. Os dados são mostrados lado a lado, com gráficos e resumos.</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Abas de tipo */}
        <Tabs value={tipo} onValueChange={(v) => setTipo(v as ComparativoTipo)} className="mb-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="movimentacoes">Movimentações</TabsTrigger>
            <TabsTrigger value="gastos">Gastos</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Seletores de período */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4" />
                Período A (esquerda)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="inicioA">Data início</Label>
                <Input
                  id="inicioA"
                  type="date"
                  value={inicioA}
                  onChange={(e) => setInicioA(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="fimA">Data fim</Label>
                <Input
                  id="fimA"
                  type="date"
                  value={fimA}
                  onChange={(e) => setFimA(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4" />
                Período B (direita)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="inicioB">Data início</Label>
                <Input
                  id="inicioB"
                  type="date"
                  value={inicioB}
                  onChange={(e) => setInicioB(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="fimB">Data fim</Label>
                <Input
                  id="fimB"
                  type="date"
                  value={fimB}
                  onChange={(e) => setFimB(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Botão comparar */}
        <div className="flex justify-center mb-8">
          <Button onClick={handleComparar} disabled={loading} size="lg" className="px-8">
            {loading ? 'Comparando...' : 'Comparar Períodos'}
          </Button>
        </div>

        {/* Resultados */}
        {dadosA.length > 0 && dadosB.length > 0 && (
          <>
            {/* Cards de resumo e variação */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Período A</p>
                      <p className="text-2xl font-bold">
                        {tipo === 'movimentacoes' 
                          ? `${resumoA.entradas + resumoA.saidas} unidades`
                          : formatarMoeda(resumoA.total)}
                      </p>
                    </div>
                    <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                      {tipo === 'movimentacoes' ? (
                        <BarChart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Período B</p>
                      <p className="text-2xl font-bold">
                        {tipo === 'movimentacoes' 
                          ? `${resumoB.entradas + resumoB.saidas} unidades`
                          : formatarMoeda(resumoB.total)}
                      </p>
                    </div>
                    <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                      {tipo === 'movimentacoes' ? (
                        <BarChart className="h-6 w-6 text-green-600 dark:text-green-400" />
                      ) : (
                        <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Variação</p>
                      <p className={`text-2xl font-bold flex items-center gap-1 ${
                        variacao && variacao > 0 ? 'text-green-600' : variacao && variacao < 0 ? 'text-red-600' : ''
                      }`}>
                        {variacao !== null ? (
                          <>
                            {variacao > 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                            {Math.abs(variacao).toFixed(1)}%
                          </>
                        ) : (
                          '-'
                        )}
                      </p>
                    </div>
                    <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                      <Scale className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Gráficos lado a lado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {inicioA && fimA && (
                      <>
                        {format(new Date(inicioA), 'dd/MM/yyyy')} a {format(new Date(fimA), 'dd/MM/yyyy')}
                      </>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {tipo === 'movimentacoes' ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <ReBarChart data={dadosA}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <ReTooltip />
                        <Legend />
                        <Bar dataKey="valor" fill="#3b82f6" />
                      </ReBarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-4xl font-bold text-green-600">{formatarMoeda(dadosA[0]?.valor || 0)}</p>
                      <p className="text-sm text-muted-foreground mt-2">Gasto total no período</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {inicioB && fimB && (
                      <>
                        {format(new Date(inicioB), 'dd/MM/yyyy')} a {format(new Date(fimB), 'dd/MM/yyyy')}
                      </>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {tipo === 'movimentacoes' ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <ReBarChart data={dadosB}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <ReTooltip />
                        <Legend />
                        <Bar dataKey="valor" fill="#22c55e" />
                      </ReBarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-4xl font-bold text-green-600">{formatarMoeda(dadosB[0]?.valor || 0)}</p>
                      <p className="text-sm text-muted-foreground mt-2">Gasto total no período</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Mensagem quando não há dados */}
        {dadosA.length === 0 && dadosB.length === 0 && !loading && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Nenhum dado para comparar</AlertTitle>
            <AlertDescription>
              Selecione dois períodos válidos e clique em "Comparar Períodos".
            </AlertDescription>
          </Alert>
        )}
      </div>
    </TooltipProvider>
  )
}
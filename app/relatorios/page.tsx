'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CalendarIcon, Download, FileText, FileSpreadsheet, ArrowLeft, Loader2, Info } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { toast } from 'sonner'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'

type RelatorioTipo = 'estoque' | 'movimentacoes' | 'logs' | 'baixo_estoque'

export default function RelatoriosPage() {
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [tipo, setTipo] = useState<RelatorioTipo>('movimentacoes')
  const [loading, setLoading] = useState(false)
  const [resultCount, setResultCount] = useState<number | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // Redirecionar se não estiver logado
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/login')
    })
  }, [router, supabase])

  const handleExportExcel = async () => {
    setLoading(true)
    try {
      const data = await fetchDados()
      if (!data.length) {
        toast.warning('Nenhum dado encontrado para o período selecionado.')
        return
      }
      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Relatório')
      XLSX.writeFile(wb, `relatorio_${tipo}_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`)
      toast.success('Relatório exportado com sucesso!')
    } catch (error) {
      console.error(error)
      toast.error('Erro ao gerar relatório.')
    } finally {
      setLoading(false)
    }
  }

  const handleExportPDF = async () => {
    setLoading(true)
    try {
      const dados = await fetchDados()
      if (!dados.length) {
        toast.warning('Nenhum dado encontrado para o período selecionado.')
        return
      }

      const doc = new jsPDF()
      const title = `Relatório de ${getTitulo()}`
      doc.text(title, 14, 15)

      let columns: string[] = []
      let rows: any[][] = []

      if (tipo === 'estoque') {
        columns = ['Produto', 'Tipo', 'Marca', 'Quantidade', 'Mínimo']
        rows = dados.map((item: any) => [
          item.Produto,
          item.Tipo,
          item.Marca,
          item.Quantidade,
          item['Estoque Mínimo'],
        ])
      } else if (tipo === 'movimentacoes') {
        columns = ['Data', 'Produto', 'Tipo', 'Quantidade', 'Observação']
        rows = dados.map((item: any) => [
          item.Data,
          item.Produto,
          item.Tipo,
          item.Quantidade,
          item.Observação,
        ])
      } else if (tipo === 'logs') {
        columns = ['Data', 'Usuário', 'Ação', 'Detalhes']
        rows = dados.map((item: any) => [
          item.Data,
          item.Usuário,
          item.Ação,
          item.Detalhes,
        ])
      } else if (tipo === 'baixo_estoque') {
        columns = ['Produto', 'Tipo', 'Marca', 'Quantidade', 'Mínimo']
        rows = dados.map((item: any) => [
          item.Produto,
          item.Tipo,
          item.Marca,
          item.Quantidade,
          item['Estoque Mínimo'],
        ])
      }

      autoTable(doc, {
        head: [columns],
        body: rows,
        startY: 25,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] },
      })

      doc.save(`relatorio_${tipo}_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`)
      toast.success('Relatório PDF gerado com sucesso!')
    } catch (error) {
      console.error(error)
      toast.error('Erro ao gerar PDF.')
    } finally {
      setLoading(false)
    }
  }

  const fetchDados = async () => {
    let query: any
    const inicio = dataInicio ? new Date(dataInicio) : null
    const fim = dataFim ? new Date(dataFim) : null
    if (fim) fim.setHours(23, 59, 59)

    switch (tipo) {
      case 'estoque':
        const { data: toners } = await supabase
          .from('toners')
          .select('name, type, brand, quantity, min_quantity')
          .order('name')
        const estoqueData = (toners || []).map(t => ({
          Produto: t.name,
          Tipo: t.type === 'toner' ? 'Toner' : 'Cilindro',
          Marca: t.brand,
          Quantidade: t.quantity,
          'Estoque Mínimo': t.min_quantity,
        }))
        setResultCount(estoqueData.length)
        return estoqueData

      case 'movimentacoes':
        let movQuery = supabase
          .from('stock_movements')
          .select('created_at, toner_name, type, quantity, note')
          .order('created_at', { ascending: false })
        if (inicio) movQuery = movQuery.gte('created_at', inicio.toISOString())
        if (fim) movQuery = movQuery.lte('created_at', fim.toISOString())
        const { data: movs } = await movQuery
        const movData = (movs || []).map(m => ({
          Data: format(new Date(m.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
          Produto: m.toner_name,
          Tipo: m.type === 'entrada' ? 'Entrada' : 'Saída',
          Quantidade: m.type === 'entrada' ? `+${m.quantity}` : `-${m.quantity}`,
          Observação: m.note || '',
        }))
        setResultCount(movData.length)
        return movData

      case 'logs':
        let logQuery = supabase
          .from('activity_logs')
          .select('created_at, user_email, action, details')
          .order('created_at', { ascending: false })
        if (inicio) logQuery = logQuery.gte('created_at', inicio.toISOString())
        if (fim) logQuery = logQuery.lte('created_at', fim.toISOString())
        const { data: logs } = await logQuery
        const logData = (logs || []).map(l => ({
          Data: format(new Date(l.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
          Usuário: l.user_email || 'Anônimo',
          Ação: l.action,
          Detalhes: JSON.stringify(l.details),
        }))
        setResultCount(logData.length)
        return logData

      case 'baixo_estoque':
        const { data: todos } = await supabase
          .from('toners')
          .select('name, type, brand, quantity, min_quantity')
        const filtrados = (todos || []).filter(t => t.quantity <= t.min_quantity)
        const baixoData = filtrados.map(t => ({
          Produto: t.name,
          Tipo: t.type === 'toner' ? 'Toner' : 'Cilindro',
          Marca: t.brand,
          Quantidade: t.quantity,
          'Estoque Mínimo': t.min_quantity,
        }))
        setResultCount(baixoData.length)
        return baixoData

      default:
        setResultCount(0)
        return []
    }
  }

  const getTitulo = () => {
    const map = {
      estoque: 'Estoque Atual',
      movimentacoes: 'Movimentações',
      logs: 'Logs de Atividades',
      baixo_estoque: 'Itens com Estoque Baixo',
    }
    return map[tipo]
  }

  const handlePreview = async () => {
    setLoading(true)
    try {
      const data = await fetchDados()
      if (data.length) {
        toast.info(`${data.length} registros encontrados.`)
      } else {
        toast.warning('Nenhum registro encontrado.')
      }
    } catch (error) {
      toast.error('Erro ao buscar dados.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <TooltipProvider>
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Relatórios Avançados</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Cards de resumo (opcional) */}
            {resultCount !== null && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{resultCount}</div>
                    <p className="text-xs text-muted-foreground">Registros encontrados</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">
                      {dataInicio && dataFim ? (
                        `${format(new Date(dataInicio), 'dd/MM')} - ${format(new Date(dataFim), 'dd/MM')}`
                      ) : (
                        'Todos os períodos'
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Período selecionado</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{getTitulo()}</div>
                    <p className="text-xs text-muted-foreground">Tipo de relatório</p>
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="bg-muted/30 p-4 rounded-lg space-y-4">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Info className="h-4 w-4" />
                Filtros
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de Relatório</Label>
                  <Select value={tipo} onValueChange={(v) => setTipo(v as RelatorioTipo)}>
                    <SelectTrigger id="tipo">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="estoque">Estoque Atual</SelectItem>
                      <SelectItem value="movimentacoes">Movimentações</SelectItem>
                      <SelectItem value="logs">Logs de Atividades</SelectItem>
                      <SelectItem value="baixo_estoque">Itens com Estoque Baixo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dataInicio">Data Início</Label>
                  <Input
                    id="dataInicio"
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dataFim">Data Fim</Label>
                  <Input
                    id="dataFim"
                    type="date"
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 items-center">
              <Button onClick={handlePreview} variant="secondary" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Ver quantos registros
              </Button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={handleExportExcel} disabled={loading} variant="outline" className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSpreadsheet className="mr-2 h-4 w-4" />}
                    Exportar Excel
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Exportar dados para planilha Excel (.xlsx)</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={handleExportPDF} disabled={loading} variant="outline" className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                    Exportar PDF
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Exportar dados para documento PDF</p>
                </TooltipContent>
              </Tooltip>
            </div>

            {resultCount !== null && resultCount === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md">
                Nenhum registro encontrado. Tente ajustar os filtros.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )
}
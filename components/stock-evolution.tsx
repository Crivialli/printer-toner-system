'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { subDays, format, eachDayOfInterval } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface DailyStock {
  date: string
  total: number
}

export function StockEvolution() {
  const [data, setData] = useState<DailyStock[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      const hoje = new Date()
      const inicio = subDays(hoje, 6) // últimos 7 dias incluindo hoje
      inicio.setHours(0, 0, 0, 0)
      hoje.setHours(23, 59, 59, 999)

      // Buscar todas as movimentações do período
      const { data: movimentos, error } = await supabase
        .from('stock_movements')
        .select('type, quantity, created_at')
        .gte('created_at', inicio.toISOString())
        .lte('created_at', hoje.toISOString())

      if (error) {
        console.error('Erro ao carregar movimentos:', error)
        setLoading(false)
        return
      }

      // Calcular saldo líquido por dia (entradas - saídas)
      const saldoPorDia: Record<string, number> = {}
      movimentos.forEach(m => {
        const dia = format(new Date(m.created_at), 'yyyy-MM-dd')
        const delta = m.type === 'entrada' ? m.quantity : -m.quantity
        saldoPorDia[dia] = (saldoPorDia[dia] || 0) + delta
      })

      // Obter estoque atual total
      const { data: toners, error: tonersError } = await supabase
        .from('toners')
        .select('quantity')

      if (tonersError) {
        console.error('Erro ao carregar toners:', tonersError)
        setLoading(false)
        return
      }

      const estoqueAtual = toners.reduce((acc, t) => acc + t.quantity, 0)

      // Gerar lista de dias no intervalo (7 dias)
      const dias = eachDayOfInterval({ start: inicio, end: new Date() })
        .map(d => format(d, 'yyyy-MM-dd'))
        .sort()

      // Calcular estoque para cada dia
      // Primeiro, precisamos do estoque no início do período
      const saldosDias = dias.map(dia => ({ dia, saldo: saldoPorDia[dia] || 0 }))
      const somaSaldos = saldosDias.reduce((acc, d) => acc + d.saldo, 0)
      let estoqueInicio = estoqueAtual - somaSaldos

      const dailyData: DailyStock[] = []
      for (const dia of dias) {
        const saldo = saldoPorDia[dia] || 0
        estoqueInicio += saldo // estoque no final do dia
        dailyData.push({
          date: format(new Date(dia), 'dd/MM'),
          total: estoqueInicio,
        })
      }

      setData(dailyData)
      setLoading(false)
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Evolução do Estoque (7 dias)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Carregando...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Evolução do Estoque (7 dias)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={100}>
          <LineChart data={data}>
            <Line type="monotone" dataKey="total" stroke="#8884d8" strokeWidth={2} dot={false} />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
            <Tooltip />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
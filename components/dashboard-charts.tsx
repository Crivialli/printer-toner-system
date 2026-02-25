'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { subDays } from 'date-fns'
import type { TonerItem, StockMovement } from "@/lib/toner-store"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface DashboardChartsProps {
  toners: TonerItem[]
  movements: StockMovement[]
}

export function DashboardCharts({ toners, movements }: DashboardChartsProps) {
  const [limit, setLimit] = useState(10)

  // Dados para o gráfico de estoque atual - limitado pelo valor do seletor
  const stockData = toners
    .slice(0, limit)
    .map(toner => ({
      name: toner.name.length > 15 ? toner.name.substring(0, 12) + "..." : toner.name,
      quantidade: toner.quantity,
      min: toner.minQuantity,
    }))

  // Dados para o gráfico de movimentações nos últimos 7 dias
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - i)
    return date.toLocaleDateString("pt-BR").slice(0, 5)
  }).reverse()

  const movementsByDay = last7Days.map(day => {
    const dayMovements = movements.filter(m => m.date.includes(day))
    const entradas = dayMovements.filter(m => m.type === "entrada").reduce((acc, m) => acc + m.quantity, 0)
    const saidas = dayMovements.filter(m => m.type === "saida").reduce((acc, m) => acc + m.quantity, 0)
    return { day, entradas, saidas }
  })

  // Top 5 toners mais consumidos nos últimos 30 dias
  const trintaDiasAtras = subDays(new Date(), 30)
  const saidasRecentes = movements.filter(
    m => m.type === 'saida' && new Date(m.date) >= trintaDiasAtras
  )

  const consumoPorToner: Record<string, number> = {}
  saidasRecentes.forEach(m => {
    const key = m.tonerName
    consumoPorToner[key] = (consumoPorToner[key] || 0) + m.quantity
  })

  const topConsumidos = Object.entries(consumoPorToner)
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-2 text-xs">
          <p className="font-medium">{payload[0].name}</p>
          <p style={{ color: payload[0].color }}>
            Quantidade: <span className="font-mono">{payload[0].value}</span>
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-4">
      {/* Linha com controle de quantidade */}
      <div className="flex items-center justify-end gap-2">
        <span className="text-sm text-muted-foreground">Mostrar no gráfico:</span>
        <Select value={String(limit)} onValueChange={(v) => setLimit(Number(v))}>
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">5</SelectItem>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="15">15</SelectItem>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="50">50</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Gráfico de barras - Estoque atual */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Estoque Atual (top {limit})</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stockData} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="name" 
                  angle={-30} 
                  textAnchor="end" 
                  height={60} 
                  interval={0}
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                />
                <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="quantidade" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} name="Quantidade" />
                <Bar dataKey="min" fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={40} name="Mínimo" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top 5 toners mais consumidos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Top 5 Toners Mais Consumidos (30 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart 
                data={topConsumidos} 
                layout="vertical" 
                margin={{ top: 10, right: 10, left: 40, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#6b7280' }} />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                  width={120}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" fill="#8b5cf6" radius={[0, 4, 4, 0]} maxBarSize={20} name="Consumo" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de movimentações recentes */}
        {movements.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Movimentações nos Últimos 7 Dias</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={movementsByDay} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#6b7280' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="entradas" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={40} name="Entradas" />
                  <Bar dataKey="saidas" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} name="Saídas" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, Clock } from 'lucide-react'
import { subDays } from 'date-fns'
import type { TonerItem, StockMovement } from '@/lib/toner-store'

interface ConsumptionForecastProps {
  toners: TonerItem[]
  movements: StockMovement[]
}

export function ConsumptionForecast({ toners, movements }: ConsumptionForecastProps) {
  const trintaDiasAtras = subDays(new Date(), 30)
  const saidasRecentes = movements.filter(
    m => m.type === 'saida' && new Date(m.date) >= trintaDiasAtras
  )

  const consumoMap = new Map<string, number>()
  saidasRecentes.forEach(m => {
    const current = consumoMap.get(m.tonerId) || 0
    consumoMap.set(m.tonerId, current + m.quantity)
  })

  const forecasts = toners
    .map(toner => {
      const totalConsumo = consumoMap.get(toner.id) || 0
      const consumoDiario = totalConsumo / 30
      if (consumoDiario <= 0 || toner.quantity <= 0) return null

      const diasRestantes = Math.floor(toner.quantity / consumoDiario)
      const dataEstimada = new Date()
      dataEstimada.setDate(dataEstimada.getDate() + diasRestantes)

      return {
        ...toner,
        diasRestantes,
        dataEstimada: dataEstimada.toLocaleDateString('pt-BR'),
      }
    })
    .filter((f): f is NonNullable<typeof f> => f !== null && f.diasRestantes < 30)

  if (forecasts.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5" />
          Previsão de Consumo (próximos 30 dias)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {forecasts.map(toner => (
            <Card key={toner.id} className="border-l-4 border-l-yellow-500">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{toner.name}</p>
                    <p className="text-sm text-muted-foreground">{toner.brand}</p>
                  </div>
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                </div>
                <div className="mt-2 space-y-1 text-sm">
                  <p>
                    Estoque atual: <span className="font-semibold">{toner.quantity}</span>
                  </p>
                  <p>
                    Previsão: <span className="font-semibold">{toner.diasRestantes} dias</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Estima-se acabar em {toner.dataEstimada}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
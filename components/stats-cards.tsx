"use client"

import { Package, AlertTriangle, CircleCheck } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import type { TonerItem } from "@/lib/toner-store"

interface StatsCardsProps {
  toners: TonerItem[]
}

export function StatsCards({ toners }: StatsCardsProps) {
  const totalItems = toners.reduce((acc, t) => acc + t.quantity, 0)
  const lowStock = toners.filter((t) => t.quantity > 0 && t.quantity <= t.minQuantity)
  const outOfStock = toners.filter((t) => t.quantity === 0)

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Card>
        <CardContent className="flex items-center gap-4 pt-0">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Package className="size-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total em Estoque</p>
            <p className="text-2xl font-bold text-foreground">{totalItems}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center gap-4 pt-0">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-warning/15">
            <AlertTriangle className="size-5 text-warning" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Estoque Baixo</p>
            <p className="text-2xl font-bold text-foreground">{lowStock.length}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center gap-4 pt-0">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
            {outOfStock.length > 0 ? (
              <AlertTriangle className="size-5 text-destructive" />
            ) : (
              <CircleCheck className="size-5 text-success" />
            )}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Sem Estoque</p>
            <p className="text-2xl font-bold text-foreground">{outOfStock.length}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

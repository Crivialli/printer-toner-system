"use client"

import { useState } from "react"
import { Plus, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { TonerItem } from "@/lib/toner-store"

interface StockDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  toner: TonerItem | null
  mode: "entrada" | "saida"
  onConfirm: (quantity: number, note: string, price?: number, reason?: 'consumo' | 'devolucao') => void
}

export function StockDialog({
  open,
  onOpenChange,
  toner,
  mode,
  onConfirm,
}: StockDialogProps) {
  const [quantity, setQuantity] = useState(1)
  const [note, setNote] = useState("")
  const [price, setPrice] = useState<number | undefined>(undefined)
  const [reason, setReason] = useState<'consumo' | 'devolucao'>('consumo')

  const isEntrada = mode === "entrada"
  const maxSaida = toner?.quantity ?? 0

  function handleConfirm() {
    onConfirm(
      quantity,
      note,
      isEntrada ? price : undefined,
      !isEntrada ? reason : undefined
    )
    setQuantity(1)
    setNote("")
    setPrice(undefined)
    setReason('consumo')
  }

  function handleOpenChange(value: boolean) {
    if (!value) {
      setQuantity(1)
      setNote("")
      setPrice(undefined)
      setReason('consumo')
    }
    onOpenChange(value)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEntrada ? (
              <Plus className="size-5 text-success" />
            ) : (
              <Minus className="size-5 text-destructive" />
            )}
            {isEntrada ? "Entrada de Estoque" : "Saída de Estoque"}
          </DialogTitle>
          <DialogDescription>
            {toner
              ? `${toner.name} - ${toner.brand} (Estoque atual: ${toner.quantity})`
              : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Quantidade */}
          <div>
            <label htmlFor="quantity" className="mb-1.5 block text-sm font-medium">
              Quantidade
            </label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="size-4" />
              </Button>
              <input
                id="quantity"
                type="number"
                min={1}
                max={!isEntrada ? maxSaida : undefined}
                value={quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1
                  if (!isEntrada) {
                    setQuantity(Math.min(val, maxSaida))
                  } else {
                    setQuantity(Math.max(1, val))
                  }
                }}
                className="h-8 w-20 rounded-md border bg-background px-3 text-center text-sm"
              />
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => {
                  if (!isEntrada) {
                    setQuantity((q) => Math.min(q + 1, maxSaida))
                  } else {
                    setQuantity((q) => q + 1)
                  }
                }}
                disabled={!isEntrada && quantity >= maxSaida}
              >
                <Plus className="size-4" />
              </Button>
            </div>
          </div>

          {/* Preço (apenas para entrada) */}
          {isEntrada && (
            <div>
              <label htmlFor="price" className="mb-1.5 block text-sm font-medium">
                Preço unitário (R$) – opcional
              </label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={price ?? ''}
                onChange={(e) => setPrice(e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="0,00"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Informe o valor pago por unidade.
              </p>
            </div>
          )}

          {/* Motivo da saída (apenas para saída) */}
          {!isEntrada && (
            <div>
              <label htmlFor="reason" className="mb-1.5 block text-sm font-medium">
                Motivo da saída
              </label>
              <Select value={reason} onValueChange={(v: 'consumo' | 'devolucao') => setReason(v)}>
                <SelectTrigger id="reason">
                  <SelectValue placeholder="Selecione o motivo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="consumo">Consumo / Uso</SelectItem>
                  <SelectItem value="devolucao">Devolução (defeito)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Observação */}
          <div>
            <label htmlFor="note" className="mb-1.5 block text-sm font-medium">
              Observação (opcional)
            </label>
            <input
              id="note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex: Compra mensal, Troca impressora..."
              className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!isEntrada && quantity > maxSaida}
            className={
              isEntrada
                ? "bg-success text-success-foreground hover:bg-success/90"
                : "bg-destructive text-destructive-foreground hover:bg-destructive/90"
            }
          >
            {isEntrada ? "Confirmar Entrada" : "Confirmar Saída"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
"use client"

import { useState, useEffect } from "react"
import { Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { TonerItem, TonerType } from "@/lib/toner-store"

interface EditTonerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  toner: TonerItem | null
  onConfirm: (id: string, data: {
    name: string
    type: TonerType
    brand: string
    minQuantity: number
  }) => void
}

export function EditTonerDialog({
  open,
  onOpenChange,
  toner,
  onConfirm,
}: EditTonerDialogProps) {
  const [name, setName] = useState("")
  const [type, setType] = useState<TonerType>("toner")
  const [brand, setBrand] = useState("")
  const [minQuantity, setMinQuantity] = useState(1)

  useEffect(() => {
    if (toner) {
      setName(toner.name)
      setType(toner.type)
      setBrand(toner.brand)
      setMinQuantity(toner.minQuantity)
    }
  }, [toner])

  const handleConfirm = () => {
    if (!toner) return
    if (!name.trim() || !brand.trim()) return
    onConfirm(toner.id, {
      name: name.trim(),
      type,
      brand: brand.trim(),
      minQuantity,
    })
  }

  const isValid = name.trim().length > 0 && brand.trim().length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="size-5 text-primary" />
            Editar Toner
          </DialogTitle>
          <DialogDescription>
            Altere os dados do toner. O histórico de movimentações não será alterado.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor="edit-name" className="mb-1.5 block text-sm font-medium">
              Nome do Produto *
            </label>
            <input
              id="edit-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            />
          </div>

          <div>
            <label htmlFor="edit-type" className="mb-1.5 block text-sm font-medium">
              Impressora Compátivel *
            </label>
            <Select value={type} onValueChange={(v) => setType(v as TonerType)}>
              <SelectTrigger id="edit-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="toner">Toner</SelectItem>
                <SelectItem value="cilindro">Cilindro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label htmlFor="edit-brand" className="mb-1.5 block text-sm font-medium">
              Marca *
            </label>
            <input
              id="edit-brand"
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            />
          </div>

          <div>
            <label htmlFor="edit-min" className="mb-1.5 block text-sm font-medium">
              Quantidade mínima
            </label>
            <input
              id="edit-min"
              type="number"
              min={1}
              value={minQuantity}
              onChange={(e) => setMinQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="h-9 w-24 rounded-md border bg-background px-3 text-center text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!isValid}>
            Salvar alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
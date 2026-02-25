"use client"

import { useState } from "react"
import { PackagePlus } from "lucide-react"
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
import { Input } from "@/components/ui/input"
import { MARCAS, PRODUTOS } from "@/lib/constants" // <-- importe as listas
import type { TonerType } from "@/lib/toner-store"

interface NewTonerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (data: {
    name: string
    type: TonerType
    brand: string
    minQuantity: number
    initialQuantity: number
  }) => void
}

export function NewTonerDialog({
  open,
  onOpenChange,
  onConfirm,
}: NewTonerDialogProps) {
  const [name, setName] = useState("")
  const [type, setType] = useState<TonerType>("toner")
  const [brand, setBrand] = useState("")
  const [minQuantity, setMinQuantity] = useState(2)
  const [initialQuantity, setInitialQuantity] = useState(0)

  const handleConfirm = () => {
    if (!name || !brand) return
    onConfirm({
      name,
      type,
      brand,
      minQuantity,
      initialQuantity,
    })
    resetForm()
  }

  const resetForm = () => {
    setName("")
    setType("toner")
    setBrand("")
    setMinQuantity(2)
    setInitialQuantity(0)
  }

  const handleOpenChange = (value: boolean) => {
    if (!value) resetForm()
    onOpenChange(value)
  }

  const isValid = name && brand

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackagePlus className="size-5 text-primary" />
            Cadastrar Novo Toner
          </DialogTitle>
          <DialogDescription>
            Preencha os dados do novo modelo de toner ou cilindro.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Produto (Select) */}
          <div>
            <label htmlFor="product" className="mb-1.5 block text-sm font-medium">
              Produto *
            </label>
            <Select value={name} onValueChange={setName}>
              <SelectTrigger id="product">
                <SelectValue placeholder="Selecione o produto" />
              </SelectTrigger>
              <SelectContent>
                {PRODUTOS.map((prod) => (
                  <SelectItem key={prod} value={prod}>
                    {prod}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tipo */}
          <div>
            <label htmlFor="type" className="mb-1.5 block text-sm font-medium">
              Tipo *
            </label>
            <Select value={type} onValueChange={(v) => setType(v as TonerType)}>
              <SelectTrigger id="type">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="toner">Toner</SelectItem>
                <SelectItem value="cilindro">Cilindro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Marca (Select) */}
          <div>
            <label htmlFor="brand" className="mb-1.5 block text-sm font-medium">
              Impressora Compátivel *
            </label>
            <Select value={brand} onValueChange={setBrand}>
              <SelectTrigger id="brand">
                <SelectValue placeholder="Selecione a marca" />
              </SelectTrigger>
              <SelectContent>
                {MARCAS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quantidade Inicial */}
          <div>
            <label htmlFor="initialQuantity" className="mb-1.5 block text-sm font-medium">
              Quantidade Inicial
            </label>
            <Input
              id="initialQuantity"
              type="number"
              min={0}
              value={initialQuantity}
              onChange={(e) => setInitialQuantity(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-24 text-center"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Quantidade com que o toner será cadastrado no estoque.
            </p>
          </div>

          {/* Quantidade mínima */}
          <div>
            <label htmlFor="minQuantity" className="mb-1.5 block text-sm font-medium">
              Quantidade mínima (alerta)
            </label>
            <Input
              id="minQuantity"
              type="number"
              min={1}
              value={minQuantity}
              onChange={(e) => setMinQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-24 text-center"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Você será alertado quando o estoque estiver igual ou abaixo desse valor.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!isValid}>
            Cadastrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
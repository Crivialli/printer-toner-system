'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'

interface Supplier {
  id: string
  name: string
}

interface Toner {
  id: string
  name: string
  brand: string
}

interface OrderItem {
  id: string
  toner_id: string
  toner_name: string
  quantity: number
  price: number // <-- adicionado
}

export default function NovaOrdemPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [toners, setToners] = useState<Toner[]>([])
  const [selectedSupplier, setSelectedSupplier] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    loadSuppliers()
    loadToners()
  }, [])

  useEffect(() => {
    const tonersParam = searchParams.get('toners')
    if (tonersParam && toners.length > 0) {
      const ids = tonersParam.split(',')
      const suggestedItems = ids
        .map(id => {
          const toner = toners.find(t => t.id === id)
          if (!toner) return null
          return {
            id: uuidv4(),
            toner_id: toner.id,
            toner_name: `${toner.name} (${toner.brand})`,
            quantity: 1,
            price: 0,
          }
        })
        .filter(Boolean) as OrderItem[]
      setItems(suggestedItems)
    }
  }, [searchParams, toners])

  const loadSuppliers = async () => {
    const { data } = await supabase.from('suppliers').select('id, name').order('name')
    if (data) setSuppliers(data)
  }

  const loadToners = async () => {
    const { data } = await supabase.from('toners').select('id, name, brand').order('name')
    if (data) setToners(data)
  }

  const addItem = () => {
    setItems([
      ...items,
      {
        id: uuidv4(),
        toner_id: '',
        toner_name: '',
        quantity: 1,
        price: 0,
      },
    ])
  }

  const updateItem = (id: string, field: keyof OrderItem, value: any) => {
    setItems(
      items.map((item) => {
        if (item.id !== id) return item
        const updated = { ...item, [field]: value }
        if (field === 'toner_id') {
          const toner = toners.find((t) => t.id === value)
          updated.toner_name = toner ? `${toner.name} (${toner.brand})` : ''
        }
        return updated
      })
    )
  }

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id))
  }

  const total = items.reduce((acc, item) => acc + item.quantity * item.price, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSupplier || items.length === 0) {
      alert('Selecione um fornecedor e adicione pelo menos um item.')
      return
    }
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()

    const year = new Date().getFullYear()
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    const poNumber = `PO-${year}-${random}`

    const { data: order, error: orderError } = await supabase
      .from('purchase_orders')
      .insert({
        po_number: poNumber,
        supplier_id: selectedSupplier,
        order_date: new Date().toISOString().split('T')[0],
        notes,
        total_amount: total,
        created_by: user?.id,
        status: 'draft',
      })
      .select()
      .single()

    if (orderError) {
      alert('Erro ao criar ordem: ' + orderError.message)
      setLoading(false)
      return
    }

    const itemsToInsert = items.map((item) => ({
      purchase_order_id: order.id,
      toner_id: item.toner_id,
      quantity_ordered: item.quantity,
      unit_price: item.price,
    }))

    const { error: itemsError } = await supabase
      .from('purchase_order_items')
      .insert(itemsToInsert)

    if (itemsError) {
      alert('Erro ao adicionar itens: ' + itemsError.message)
    } else {
      router.push('/compras')
    }
    setLoading(false)
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Nova Ordem de Compra</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="supplier">Fornecedor *</Label>
              <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                <SelectTrigger id="supplier">
                  <SelectValue placeholder="Selecione um fornecedor" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">Observações</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Instruções para o fornecedor..."
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Itens do pedido *</Label>
                <Button type="button" size="sm" variant="outline" onClick={addItem}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Item
                </Button>
              </div>

              {items.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum item adicionado. Clique em "Adicionar Item" para começar.
                </p>
              )}

              {items.map((item) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-end border p-3 rounded-lg bg-muted/30">
                  <div className="col-span-5">
                    <Label className="text-xs">Toner</Label>
                    <Select
                      value={item.toner_id}
                      onValueChange={(v) => updateItem(item.id, 'toner_id', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {toners.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name} ({t.brand})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Quantidade</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)
                      }
                    />
                  </div>
                  <div className="col-span-3">
                    <Label className="text-xs">Preço unit. (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.price}
                      onChange={(e) =>
                        updateItem(item.id, 'price', parseFloat(e.target.value) || 0)
                      }
                    />
                  </div>
                  <div className="col-span-1">
                    <Label className="text-xs">Total</Label>
                    <p className="text-sm font-medium">
                      {(item.quantity * item.price).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </p>
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {items.length > 0 && (
              <div className="text-right text-lg font-semibold">
                Total: {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Criando...' : 'Criar Ordem'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
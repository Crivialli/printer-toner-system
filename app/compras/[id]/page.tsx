'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Download, Send, Truck, XCircle, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { v4 as uuidv4 } from 'uuid'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { logActivity } from '@/lib/logger' // <-- import adicionado

interface Supplier {
  id: string
  name: string
  contact_name?: string
  email?: string
  phone?: string
  cnpj?: string
}

interface OrderItem {
  id: string
  toner_id: string
  toner_name: string
  quantity_ordered: number
  quantity_received: number
  unit_price: number
  total_price: number
}

interface Order {
  id: string
  po_number: string
  supplier: Supplier
  status: 'draft' | 'sent' | 'partial' | 'received' | 'cancelled'
  order_date: string
  notes: string | null
  total_amount: number
  items: OrderItem[]
}

const statusLabels: Record<string, string> = {
  draft: 'Rascunho',
  sent: 'Enviado',
  partial: 'Recebido Parcial',
  received: 'Recebido',
  cancelled: 'Cancelado',
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  sent: 'bg-blue-100 text-blue-800',
  partial: 'bg-yellow-100 text-yellow-800',
  received: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [receivedQuantities, setReceivedQuantities] = useState<Record<string, number>>({})
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadOrder()
  }, [id])

  const loadOrder = async () => {
    setLoading(true)

    const { data: orderData, error: orderError } = await supabase
      .from('purchase_orders')
      .select(`
        *,
        suppliers ( id, name, contact_name, email, phone, cnpj )
      `)
      .eq('id', id)
      .single()

    if (orderError || !orderData) {
      console.error('Erro ao carregar ordem:', orderError)
      router.push('/compras')
      return
    }

    const { data: itemsData, error: itemsError } = await supabase
      .from('purchase_order_items')
      .select(`
        id,
        toner_id,
        quantity_ordered,
        quantity_received,
        unit_price,
        total_price,
        toners ( name, brand )
      `)
      .eq('purchase_order_id', id)
      .order('created_at', { ascending: true })

    if (itemsError) {
      console.error('Erro ao carregar itens:', itemsError)
    }

    const items = (itemsData || []).map((item: any) => ({
      id: item.id,
      toner_id: item.toner_id,
      toner_name: `${item.toners.name} (${item.toners.brand})`,
      quantity_ordered: item.quantity_ordered,
      quantity_received: item.quantity_received,
      unit_price: item.unit_price,
      total_price: item.total_price,
    }))

    setOrder({
      id: orderData.id,
      po_number: orderData.po_number,
      supplier: orderData.suppliers,
      status: orderData.status,
      order_date: orderData.order_date,
      notes: orderData.notes,
      total_amount: orderData.total_amount,
      items,
    })

    const initialReceived: Record<string, number> = {}
    items.forEach((item: OrderItem) => {
      initialReceived[item.id] = item.quantity_received
    })
    setReceivedQuantities(initialReceived)
    setLoading(false)
  }

  const updateOrderStatus = async (newStatus: Order['status']) => {
    if (!order) return
    setUpdating(true)
    const { error } = await supabase
      .from('purchase_orders')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', order.id)

    if (error) {
      alert('Erro ao atualizar status: ' + error.message)
    } else {
      setOrder({ ...order, status: newStatus })
    }
    setUpdating(false)
  }

  const handleReceive = async () => {
    if (!order) return

    const hasChanges = order.items.some(
      (item) => receivedQuantities[item.id] !== item.quantity_received
    )
    if (!hasChanges) {
      alert('Nenhuma quantidade recebida foi alterada.')
      return
    }

    for (const item of order.items) {
      const received = receivedQuantities[item.id] || 0
      if (received > item.quantity_ordered) {
        alert(`A quantidade recebida para ${item.toner_name} não pode ser maior que a quantidade pedida (${item.quantity_ordered}).`)
        return
      }
      if (received < 0) {
        alert('A quantidade recebida não pode ser negativa.')
        return
      }
    }

    setUpdating(true)

    for (const item of order.items) {
      const newReceived = receivedQuantities[item.id] || 0
      const diff = newReceived - item.quantity_received
      
      console.log(`Item ${item.id}: diff = ${diff}, newReceived = ${newReceived}, oldReceived = ${item.quantity_received}`)
      
      if (diff === 0) continue

      // 1. Atualizar a quantidade recebida no item da ordem
      const { error: itemError } = await supabase
        .from('purchase_order_items')
        .update({ quantity_received: newReceived })
        .eq('id', item.id)

      if (itemError) {
        console.error('Erro ao atualizar item:', itemError)
        alert('Erro ao atualizar item: ' + itemError.message)
        setUpdating(false)
        return
      }

      if (diff > 0) {
        const { data: { user } } = await supabase.auth.getUser()
        const movementId = uuidv4()
        const now = new Date()

        // 2. Inserir movimentação
        const { error: movError } = await supabase
          .from('stock_movements')
          .insert({
            id: movementId,
            toner_id: item.toner_id,
            toner_name: item.toner_name,
            type: 'entrada',
            quantity: diff,
            note: `Recebimento da ordem ${order.po_number}`,
            price: item.unit_price,
            user_id: user?.id,
            created_at: now.toISOString(),
          })

        if (movError) {
          console.error('Erro ao inserir movimento:', movError)
          alert('Erro ao registrar entrada no estoque: ' + movError.message)
          setUpdating(false)
          return
        }

        // 3. Atualizar estoque do toner
        const { data: toner, error: fetchError } = await supabase
          .from('toners')
          .select('quantity')
          .eq('id', item.toner_id)
          .single()

        if (fetchError) {
          console.error('Erro ao buscar toner:', fetchError)
          alert('Erro ao buscar toner: ' + fetchError.message)
          setUpdating(false)
          return
        }

        if (!toner) {
          alert('Toner não encontrado no banco.')
          setUpdating(false)
          return
        }

        const novaQuantidade = toner.quantity + diff
        console.log(`Atualizando toner ${item.toner_name} (${item.toner_id}): ${toner.quantity} + ${diff} = ${novaQuantidade}`)

        const { error: tonerError } = await supabase
          .from('toners')
          .update({ quantity: novaQuantidade })
          .eq('id', item.toner_id)

        if (tonerError) {
          console.error('Erro ao atualizar toner:', tonerError)
          alert('Erro ao atualizar estoque do toner: ' + tonerError.message)
          setUpdating(false)
          return
        }

        // 4. 🔹 Registrar LOG de atividade
        await logActivity('movimentação', {
          toner_id: item.toner_id,
          tipo: 'entrada',
          quantidade: diff,
          observacao: `Recebimento da ordem ${order.po_number}`,
          nova_quantidade: novaQuantidade,
          preco: item.unit_price,
        })

        console.log(`✅ Toner ${item.toner_name} atualizado e log registrado!`)
      }
    }

    const allReceived = order.items.every(
      (item) => (receivedQuantities[item.id] || 0) >= item.quantity_ordered
    )
    const anyReceived = order.items.some(
      (item) => (receivedQuantities[item.id] || 0) > 0
    )

    let newStatus: Order['status'] = order.status
    if (allReceived) newStatus = 'received'
    else if (anyReceived) newStatus = 'partial'
    else newStatus = 'sent'

    await updateOrderStatus(newStatus)
    await loadOrder()
    setUpdating(false)
    alert('Recebimento registrado com sucesso!')
    
    setTimeout(() => {
      router.push('/')
    }, 1500)
  }

  const exportToPDF = () => {
    if (!order) return

    const doc = new jsPDF()
    
    const companyName = "Ispl - Industria Sulamericana de Produtos de Limpeza Ltda"
    const companyCnpj = "01.125.487/0001-00"
    const companyPhone = "3241-8018 (TI)"
    const companyEmail = "ti@crivialli.com.br"

    doc.setFontSize(16)
    doc.text("ORDEM DE COMPRA", 105, 15, { align: "center" })
    doc.setFontSize(10)
    doc.text(`Nº ${order.po_number}`, 105, 22, { align: "center" })

    doc.setFontSize(10)
    doc.text("EMITENTE:", 14, 35)
    doc.setFontSize(9)
    doc.text(companyName, 14, 42)
    doc.text(`CNPJ: ${companyCnpj}`, 14, 49)
    doc.text(`Telefone: ${companyPhone}`, 14, 56)
    doc.text(`E-mail: ${companyEmail}`, 14, 63)

    doc.setFontSize(10)
    doc.text("FORNECEDOR:", 120, 35)
    doc.setFontSize(9)
    doc.text(order.supplier.name, 120, 42)
    let y = 49
    if (order.supplier.cnpj) {
      doc.text(`CNPJ: ${order.supplier.cnpj}`, 120, y)
      y += 7
    }
    if (order.supplier.phone) {
      doc.text(`Telefone: ${order.supplier.phone}`, 120, y)
      y += 7
    }
    if (order.supplier.email) {
      doc.text(`E-mail: ${order.supplier.email}`, 120, y)
      y += 7
    }
    if (order.supplier.contact_name) {
      doc.text(`Contato: ${order.supplier.contact_name}`, 120, y)
    }

    doc.setFontSize(9)
    doc.text(`Data do pedido: ${format(new Date(order.order_date), 'dd/MM/yyyy')}`, 14, 80)

    const tableColumn = ['Produto', 'Quantidade']
    const tableRows = order.items.map(item => [
      item.toner_name,
      item.quantity_ordered.toString(),
    ])

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 90,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] },
    })

    if (order.notes) {
      const finalY = (doc as any).lastAutoTable.finalY + 10
      doc.text(`Observações: ${order.notes}`, 14, finalY)
    }

    doc.save(`OC-${order.po_number}.pdf`)
  }

  if (loading) {
    return <div className="p-8 text-center">Carregando...</div>
  }

  if (!order) {
    return <div className="p-8 text-center">Ordem não encontrada.</div>
  }

  const currentStatus = order.status
  const disabledStatuses = ['received', 'cancelled']

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <CardTitle>Ordem de Compra {order.po_number}</CardTitle>
            <Badge className={statusColors[order.status]}>
              {statusLabels[order.status]}
            </Badge>
          </div>
          <Button variant="outline" size="sm" onClick={exportToPDF}>
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Fornecedor</h3>
              <p>{order.supplier.name}</p>
              {order.supplier.cnpj && <p className="text-sm text-muted-foreground">CNPJ: {order.supplier.cnpj}</p>}
              {order.supplier.phone && <p className="text-sm text-muted-foreground">Telefone: {order.supplier.phone}</p>}
              {order.supplier.email && <p className="text-sm text-muted-foreground">E-mail: {order.supplier.email}</p>}
              {order.supplier.contact_name && <p className="text-sm text-muted-foreground">Contato: {order.supplier.contact_name}</p>}
            </div>
            <div>
              <h3 className="font-semibold mb-2">Detalhes do Pedido</h3>
              <p className="text-sm">Data: {format(new Date(order.order_date), 'dd/MM/yyyy')}</p>
              {order.notes && <p className="text-sm">Obs: {order.notes}</p>}
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold mb-4">Itens do Pedido</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-center">Qtd Pedida</TableHead>
                  <TableHead className="text-center">Qtd Recebida</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.toner_name}</TableCell>
                    <TableCell className="text-center">{item.quantity_ordered}</TableCell>
                    <TableCell className="text-center">
                      {currentStatus === 'draft' || currentStatus === 'sent' || currentStatus === 'partial' ? (
                        <Input
                          type="number"
                          min="0"
                          max={item.quantity_ordered}
                          value={receivedQuantities[item.id] || 0}
                          onChange={(e) =>
                            setReceivedQuantities({
                              ...receivedQuantities,
                              [item.id]: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-20 text-center mx-auto"
                          disabled={disabledStatuses.includes(currentStatus)}
                        />
                      ) : (
                        item.quantity_received
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex gap-2 justify-end">
            {order.status === 'draft' && (
              <>
                <Button variant="default" onClick={() => updateOrderStatus('sent')} disabled={updating}>
                  <Send className="h-4 w-4 mr-2" />
                  Marcar como Enviado
                </Button>
                <Button variant="destructive" onClick={() => updateOrderStatus('cancelled')} disabled={updating}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
              </>
            )}

            {(order.status === 'sent' || order.status === 'partial') && (
              <Button variant="default" onClick={handleReceive} disabled={updating}>
                <Truck className="h-4 w-4 mr-2" />
                Registrar Recebimento
              </Button>
            )}

            {order.status === 'received' && (
              <Button variant="outline" disabled>
                <CheckCircle className="h-4 w-4 mr-2" />
                Recebido
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
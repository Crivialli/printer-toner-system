'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Plus,
  Eye,
  Trash2,
  ArrowLeft,
  Search,
  Filter,
  Download,
  FileText,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  AlertCircle,
  MoreVertical,
  RefreshCw,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface PurchaseOrder {
  id: string
  po_number: string
  supplier_name: string
  status: string
  order_date: string
  expected_date: string | null
  total_amount: number
  item_count?: number
}

const statusConfig = {
  draft: { label: 'Rascunho', color: 'bg-gray-100 text-gray-800', icon: FileText },
  sent: { label: 'Enviado', color: 'bg-blue-100 text-blue-800', icon: Truck },
  partial: { label: 'Recebido Parcial', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
  received: { label: 'Recebido', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800', icon: XCircle },
}

export default function ComprasPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [filteredOrders, setFilteredOrders] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    partial: 0,
    received: 0,
    cancelled: 0,
  })

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadOrders()
  }, [])

  useEffect(() => {
    filterOrders()
  }, [searchTerm, statusFilter, orders])

  const loadOrders = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('purchase_orders')
      .select(`
        id,
        po_number,
        order_date,
        expected_date,
        status,
        total_amount,
        suppliers ( name )
      `)
      .order('order_date', { ascending: false })

    if (error) {
      console.error('Erro ao carregar ordens:', error)
    } else if (data) {
      // Buscar contagem de itens para cada ordem (opcional, para exibir)
      const ordersWithCount = await Promise.all(
        data.map(async (o: any) => {
          const { count } = await supabase
            .from('purchase_order_items')
            .select('*', { count: 'exact', head: true })
            .eq('purchase_order_id', o.id)
          return {
            id: o.id,
            po_number: o.po_number,
            supplier_name: o.suppliers?.name || '—',
            status: o.status,
            order_date: o.order_date,
            expected_date: o.expected_date,
            total_amount: o.total_amount,
            item_count: count || 0,
          }
        })
      )
      setOrders(ordersWithCount)
      setFilteredOrders(ordersWithCount)

      // Calcular estatísticas
      const stats = ordersWithCount.reduce(
        (acc, order) => {
          acc.total++
          if (order.status === 'draft' || order.status === 'sent') acc.pending++
          else if (order.status === 'partial') acc.partial++
          else if (order.status === 'received') acc.received++
          else if (order.status === 'cancelled') acc.cancelled++
          return acc
        },
        { total: 0, pending: 0, partial: 0, received: 0, cancelled: 0 }
      )
      setStats(stats)
    }
    setLoading(false)
  }

  const filterOrders = () => {
    let filtered = orders

    // Filtro por texto
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (order) =>
          order.po_number.toLowerCase().includes(term) ||
          order.supplier_name.toLowerCase().includes(term)
      )
    }

    // Filtro por status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((order) => order.status === statusFilter)
    }

    setFilteredOrders(filtered)
  }

  const handleDelete = async (id: string, poNumber: string) => {
    if (!confirm(`Tem certeza que deseja excluir a ordem ${poNumber}?`)) return

    const { error } = await supabase
      .from('purchase_orders')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Erro ao excluir ordem: ' + error.message)
    } else {
      // Atualiza a lista local
      setOrders(orders.filter((o) => o.id !== id))
    }
  }

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
    const Icon = config.icon
    return (
      <Badge className={`${config.color} border-0 flex items-center gap-1 w-fit`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const clearFilters = () => {
    setSearchTerm('')
    setStatusFilter('all')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      {/* Cabeçalho com ações */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold">Ordens de Compra</h1>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => router.push('/compras/novo')}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Ordem
          </Button>
        </div>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Package className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Parciais</p>
                <p className="text-2xl font-bold">{stats.partial}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Recebidas</p>
                <p className="text-2xl font-bold">{stats.received}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Canceladas</p>
                <p className="text-2xl font-bold">{stats.cancelled}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e busca */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número do pedido ou fornecedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full md:w-auto">
                    <Filter className="h-4 w-4 mr-2" />
                    {statusFilter === 'all' ? 'Todos os status' : statusConfig[statusFilter as keyof typeof statusConfig]?.label}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Filtrar por status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                    Todos
                  </DropdownMenuItem>
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <DropdownMenuItem key={key} onClick={() => setStatusFilter(key)}>
                      <config.icon className="h-4 w-4 mr-2" />
                      {config.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              {(searchTerm || statusFilter !== 'all') && (
                <Button variant="ghost" onClick={clearFilters} size="icon">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Listagem de ordens */}
      <Card>
        <CardContent className="p-0">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma ordem encontrada</h3>
              <p className="text-muted-foreground mb-4">
                {orders.length === 0
                  ? 'Comece criando sua primeira ordem de compra.'
                  : 'Nenhuma ordem corresponde aos filtros aplicados.'}
              </p>
              {orders.length === 0 ? (
                <Button onClick={() => router.push('/compras/novo')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar primeira ordem
                </Button>
              ) : (
                <Button variant="outline" onClick={clearFilters}>
                  Limpar filtros
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº Pedido</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Previsão</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Itens</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.po_number}</TableCell>
                    <TableCell>{order.supplier_name}</TableCell>
                    <TableCell>
                      {format(new Date(order.order_date), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell>
                      {order.expected_date
                        ? format(new Date(order.expected_date), 'dd/MM/yyyy')
                        : '—'}
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell className="text-right">{order.item_count}</TableCell>
                    <TableCell className="text-right">
                      {order.total_amount.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/compras/${order.id}`)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Visualizar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(order.id, order.po_number)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
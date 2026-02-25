"use client"

import { useState, useMemo } from "react"
import { 
  Plus, 
  Minus, 
  PackagePlus, 
  Trash2, 
  Pencil, 
  Search, 
  ChevronLeft, 
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useDensity } from "@/contexts/density-context"
import type { TonerItem } from "@/lib/toner-store"

interface TonerTableProps {
  toners: TonerItem[]
  onAction: (toner: TonerItem, mode: "entrada" | "saida") => void
  onNewToner: () => void
  onDelete: (toner: TonerItem) => void
  onEdit: (toner: TonerItem) => void
}

// Funções auxiliares (getStatusValue, StatusBadge, getTypeBadge) permanecem iguais
function getStatusValue(toner: TonerItem): string {
  const qty = Number(toner.quantity)
  const min = Number(toner.minQuantity)
  if (qty === 0) return "sem_estoque"
  if (qty <= min) return "baixo"
  return "ok"
}

function StatusBadge({ status }: { status: string }) {
  let variant: "default" | "secondary" | "destructive" | "outline" = "outline"
  let className = "rounded-full px-2 py-0.5 font-medium"

  if (status === "sem_estoque") {
    variant = "destructive"
    return <Badge variant={variant} className={className}>Sem estoque</Badge>
  }

  if (status === "baixo") {
    className += " bg-yellow-100 text-yellow-800 border-yellow-200"
    return (
      <Badge variant="outline" className={className}>
        Estoque baixo
      </Badge>
    )
  }

  className += " bg-green-100 text-green-800 border-green-200"
  return (
    <Badge variant="outline" className={className}>
      OK
    </Badge>
  )
}

function getTypeBadge(type: string) {
  if (type === "cilindro") {
    return (
      <Badge variant="secondary" className="rounded-full px-2 py-0.5 font-medium">
        Cilindro
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="rounded-full px-2 py-0.5 font-medium">
      Toner
    </Badge>
  )
}

export function TonerTable({ toners, onAction, onNewToner, onDelete, onEdit }: TonerTableProps) {
  const { density } = useDensity()

  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("todos")
  const [statusFilter, setStatusFilter] = useState<string>("todos")
  const [sortColumn, setSortColumn] = useState<keyof TonerItem | "">("")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  // Tamanhos baseados na densidade para botões e textos
  const buttonSize = density === 'compact' ? 'sm' : 'default'
  const textSize = density === 'compact' ? 'text-xs' : 'text-sm'
  const headingSize = density === 'compact' ? 'text-sm' : 'text-base'

  // Aplicar filtros
  const filteredToners = useMemo(() => {
    return toners.filter(toner => {
      const matchesSearch = searchTerm === "" || 
        toner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        toner.brand.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = typeFilter === "todos" || toner.type === typeFilter
      const status = getStatusValue(toner)
      const matchesStatus = statusFilter === "todos" || status === statusFilter
      return matchesSearch && matchesType && matchesStatus
    })
  }, [toners, searchTerm, typeFilter, statusFilter])

  // Ordenação
  const sortedToners = useMemo(() => {
    if (!sortColumn) return filteredToners
    return [...filteredToners].sort((a, b) => {
      let aVal: any = a[sortColumn]
      let bVal: any = b[sortColumn]
      if (sortColumn === 'quantity' || sortColumn === 'minQuantity') {
        aVal = Number(aVal)
        bVal = Number(bVal)
      }
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
      }
      return 0
    })
  }, [filteredToners, sortColumn, sortDirection])

  // Paginação
  const totalPages = Math.ceil(sortedToners.length / rowsPerPage)
  const paginatedToners = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return sortedToners.slice(start, start + rowsPerPage)
  }, [sortedToners, currentPage, rowsPerPage])

  const handleSort = (column: keyof TonerItem) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  return (
    <Card className="shadow-md border-0">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <CardTitle className={`${headingSize} font-semibold`}>Itens em Estoque</CardTitle>
        <Button size={buttonSize} onClick={onNewToner} className="shadow-sm">
          <PackagePlus className="size-4 mr-2" />
          Novo Toner
        </Button>
      </CardHeader>

      {/* Barra de filtros */}
      <div className="px-6 pb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por produto ou marca..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            className="pl-8"
          />
        </div>
        <div className="flex gap-2">
          <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setCurrentPage(1) }}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="toner">Toner</SelectItem>
              <SelectItem value="cilindro">Cilindro</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1) }}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="ok">OK</SelectItem>
              <SelectItem value="baixo">Estoque baixo</SelectItem>
              <SelectItem value="sem_estoque">Sem estoque</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <CardContent className="p-0">
        {/* Container interno com padding variável */}
        <div style={{ padding: 'var(--card-padding)' }}>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead 
                    style={{ padding: 'var(--table-cell-padding)' }}
                    className="cursor-pointer hover:text-foreground"
                    onClick={() => handleSort('name')}
                  >
                    Produto {sortColumn === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead 
                    style={{ padding: 'var(--table-cell-padding)' }}
                    className="cursor-pointer hover:text-foreground"
                    onClick={() => handleSort('type')}
                  >
                    Tipo {sortColumn === 'type' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead 
                    style={{ padding: 'var(--table-cell-padding)' }}
                    className="cursor-pointer hover:text-foreground"
                    onClick={() => handleSort('brand')}
                  >
                    Marca {sortColumn === 'brand' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead 
                    style={{ padding: 'var(--table-cell-padding)' }}
                    className="text-center cursor-pointer hover:text-foreground"
                    onClick={() => handleSort('quantity')}
                  >
                    Qtd. {sortColumn === 'quantity' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead style={{ padding: 'var(--table-cell-padding)' }} className="text-center">
                    Status
                  </TableHead>
                  <TableHead style={{ padding: 'var(--table-cell-padding)' }} className="text-right">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedToners.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Nenhum item encontrado com os filtros atuais.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedToners.map((toner) => (
                    <TableRow key={toner.id} className="hover:bg-muted/30">
                      <TableCell style={{ padding: 'var(--table-cell-padding)' }} className="font-medium">
                        {toner.name}
                      </TableCell>
                      <TableCell style={{ padding: 'var(--table-cell-padding)' }}>
                        {getTypeBadge(toner.type)}
                      </TableCell>
                      <TableCell style={{ padding: 'var(--table-cell-padding)' }} className="text-muted-foreground">
                        {toner.brand}
                      </TableCell>
                      <TableCell style={{ padding: 'var(--table-cell-padding)' }} className="text-center font-semibold">
                        {toner.quantity}
                      </TableCell>
                      <TableCell style={{ padding: 'var(--table-cell-padding)' }} className="text-center">
                        <StatusBadge status={getStatusValue(toner)} />
                      </TableCell>
                      <TableCell style={{ padding: 'var(--table-cell-padding)' }}>
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size={buttonSize}
                            variant="ghost"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => onAction(toner, "entrada")}
                          >
                            <Plus className="size-4" />
                            {density !== 'compact' && " Entrada"}
                          </Button>
                          <Button
                            size={buttonSize}
                            variant="ghost"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => onAction(toner, "saida")}
                            disabled={toner.quantity === 0}
                          >
                            <Minus className="size-4" />
                            {density !== 'compact' && " Saída"}
                          </Button>
                          <Button
                            size={buttonSize}
                            variant="ghost"
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => onEdit(toner)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            size={buttonSize}
                            variant="ghost"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => onDelete(toner)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Paginação */}
        {filteredToners.length > 0 && (
          <div className="border-t" style={{ padding: 'var(--card-padding)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Linhas por página:</span>
                <Select
                  value={String(rowsPerPage)}
                  onValueChange={(v) => {
                    setRowsPerPage(Number(v))
                    setCurrentPage(1)
                  }}
                >
                  <SelectTrigger className="h-8 w-16">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="text-sm">
                  Página {currentPage} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
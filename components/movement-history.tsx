'use client'

import * as XLSX from 'xlsx'
import { useState, useMemo } from 'react'
import { ArrowDownCircle, ArrowUpCircle, Download, Search, X, ChevronUp, ChevronDown } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
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
import type { StockMovement } from '@/lib/toner-store'

interface MovementHistoryProps {
  movements: StockMovement[]
}

export function MovementHistory({ movements }: MovementHistoryProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<'todos' | 'entrada' | 'saida'>('todos')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isMinimized, setIsMinimized] = useState(false)

  // Filtrar movimentações
  const filteredMovements = useMemo(() => {
    return movements.filter(mov => {
      const matchesSearch = searchTerm === '' || 
        mov.tonerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (mov.note && mov.note.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesType = typeFilter === 'todos' || mov.type === typeFilter

      const movDate = new Date(mov.date.split(',')[0].split('/').reverse().join('-'))
      const matchesStart = !startDate || movDate >= new Date(startDate)
      const matchesEnd = !endDate || movDate <= new Date(endDate)

      return matchesSearch && matchesType && matchesStart && matchesEnd
    })
  }, [movements, searchTerm, typeFilter, startDate, endDate])

  const exportToExcel = () => {
    const data = filteredMovements.map(mov => ({
      Data: mov.date,
      Produto: mov.tonerName,
      Tipo: mov.type === 'entrada' ? 'Entrada' : 'Saída',
      Quantidade: mov.type === 'entrada' ? `+${mov.quantity}` : `-${mov.quantity}`,
      Observação: mov.note || ''
    }))

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Histórico')
    XLSX.writeFile(wb, `historico_toner_${new Date().toISOString().slice(0,10)}.xlsx`)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setTypeFilter('todos')
    setStartDate('')
    setEndDate('')
  }

  if (movements.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Movimentações</CardTitle>
          <CardDescription>
            Nenhuma movimentação registrada ainda.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <CardTitle>Histórico de Movimentações</CardTitle>
            <CardDescription>
              {filteredMovements.length} movimentações encontradas
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMinimized(!isMinimized)}
            className="h-8 w-8"
          >
            {isMinimized ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
        </div>
        <Button size="sm" variant="outline" onClick={exportToExcel}>
          <Download className="mr-2 size-4" />
          Exportar Excel
        </Button>
      </CardHeader>

      {!isMinimized && (
        <CardContent className="space-y-4">
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Produto ou observação..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="type">Tipo</Label>
              <Select value={typeFilter} onValueChange={(v: any) => setTypeFilter(v)}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saida">Saída</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="startDate">Data início</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="endDate">Data fim</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-2" />
              Limpar filtros
            </Button>
          </div>

          {/* Desktop Table */}
          <div className="hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>Data</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-center">Qtd.</TableHead>
                  <TableHead>Observação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMovements.map((mov) => (
                  <TableRow key={mov.id}>
                    <TableCell className="text-muted-foreground">
                      {mov.date}
                    </TableCell>
                    <TableCell className="font-medium">{mov.tonerName}</TableCell>
                    <TableCell>
                      {mov.type === "entrada" ? (
                        <Badge className="bg-success/15 text-success border-success/20 hover:bg-success/15">
                          <ArrowDownCircle className="mr-1 size-3" />
                          Entrada
                        </Badge>
                      ) : (
                        <Badge className="bg-destructive/15 text-destructive border-destructive/20 hover:bg-destructive/15">
                          <ArrowUpCircle className="mr-1 size-3" />
                          Saída
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {mov.type === "entrada" ? "+" : "-"}
                      {mov.quantity}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {mov.note || "---"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="flex flex-col gap-2 sm:hidden">
            {filteredMovements.map((mov) => (
              <div
                key={mov.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-medium text-foreground">
                    {mov.tonerName}
                  </p>
                  <p className="text-xs text-muted-foreground">{mov.date}</p>
                  {mov.note && (
                    <p className="text-xs text-muted-foreground">{mov.note}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-semibold ${
                      mov.type === "entrada" ? "text-success" : "text-destructive"
                    }`}
                  >
                    {mov.type === "entrada" ? "+" : "-"}
                    {mov.quantity}
                  </span>
                  {mov.type === "entrada" ? (
                    <ArrowDownCircle className="size-4 text-success" />
                  ) : (
                    <ArrowUpCircle className="size-4 text-destructive" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredMovements.length === 0 && (
            <p className="text-center text-muted-foreground py-4">
              Nenhuma movimentação encontrada com os filtros atuais.
            </p>
          )}
        </CardContent>
      )}
    </Card>
  )
}
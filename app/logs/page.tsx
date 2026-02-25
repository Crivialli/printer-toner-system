'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ArrowLeft, Save, Bookmark, Trash2, MoreVertical } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'

interface Log {
  id: string
  user_id: string
  user_email: string
  action: string
  details: any
  created_at: string
}

interface Profile {
  id: string
  name: string
}

interface SavedFilter {
  id: string
  name: string
  filters: {
    searchText: string
    startDate: string
    endDate: string
  }
  created_at: string
}

function formatDetails(action: string, details: any) {
  if (!details) return <span className="text-muted-foreground">-</span>

  switch (action) {
    case 'criou toner':
      return (
        <div className="space-y-1 text-sm">
          <p><span className="font-semibold">Nome:</span> {details.nome}</p>
          <p><span className="font-semibold">Tipo:</span> {details.tipo}</p>
          <p><span className="font-semibold">Marca:</span> {details.marca}</p>
          <p><span className="font-semibold">Quantidade inicial:</span> {details.quantidade_inicial}</p>
          <p><span className="font-semibold">Estoque mínimo:</span> {details.estoque_minimo}</p>
          <p className="text-xs text-muted-foreground">ID: {details.toner_id?.substring(0, 8)}...</p>
        </div>
      )
    case 'editou toner':
      return (
        <div className="space-y-1 text-sm">
          <p className="font-semibold">Antes:</p>
          <div className="ml-2 text-xs">
            <p>Nome: {details.dados_antigos?.nome}</p>
            <p>Marca: {details.dados_antigos?.marca}</p>
            <p>Tipo: {details.dados_antigos?.tipo}</p>
            <p>Mínimo: {details.dados_antigos?.estoque_minimo}</p>
          </div>
          <p className="font-semibold mt-1">Depois:</p>
          <div className="ml-2 text-xs">
            <p>Nome: {details.dados_novos?.name}</p>
            <p>Marca: {details.dados_novos?.brand}</p>
            <p>Tipo: {details.dados_novos?.type}</p>
            <p>Mínimo: {details.dados_novos?.minQuantity}</p>
          </div>
        </div>
      )
    case 'excluiu toner':
      return (
        <div className="space-y-1 text-sm">
          <p><span className="font-semibold">Nome:</span> {details.nome}</p>
          <p><span className="font-semibold">Tipo:</span> {details.tipo}</p>
          <p><span className="font-semibold">Marca:</span> {details.marca}</p>
          <p className="text-xs text-muted-foreground">ID: {details.toner_id?.substring(0, 8)}...</p>
        </div>
      )
    case 'movimentação':
      return (
        <div className="space-y-1 text-sm">
          <p><span className="font-semibold">Tipo:</span> {details.tipo}</p>
          {details.motivo && <p><span className="font-semibold">Motivo:</span> {details.motivo === 'devolucao' ? 'Devolução' : 'Consumo'}</p>}
          <p><span className="font-semibold">Quantidade:</span> {details.quantidade}</p>
          <p><span className="font-semibold">Nova quantidade:</span> {details.nova_quantidade}</p>
          {details.observacao && <p><span className="font-semibold">Observação:</span> {details.observacao}</p>}
          <p className="text-xs text-muted-foreground">ID: {details.toner_id?.substring(0, 8)}...</p>
        </div>
      )
    default:
      return (
        <pre className="text-xs bg-muted p-2 rounded overflow-auto max-w-xs">
          {JSON.stringify(details, null, 2)}
        </pre>
      )
  }
}

const actionColor: Record<string, string> = {
  'criou toner': 'bg-green-100 text-green-800 border-green-200',
  'editou toner': 'bg-blue-100 text-blue-800 border-blue-200',
  'excluiu toner': 'bg-red-100 text-red-800 border-red-200',
  'movimentação': 'bg-purple-100 text-purple-800 border-purple-200',
}

export default function LogsPage() {
  const [logs, setLogs] = useState<Log[]>([])
  const [filteredLogs, setFilteredLogs] = useState<Log[]>([])
  const [userNames, setUserNames] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  // Estados para filtros
  const [searchText, setSearchText] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Estados para filtros salvos
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([])
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [filterName, setFilterName] = useState('')
  const [loadingFilters, setLoadingFilters] = useState(false)

  const supabase = createClient()
  const router = useRouter()

  // Carregar logs e nomes dos usuários
  useEffect(() => {
    async function loadLogs() {
      const { data: logsData, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200)

      if (error) {
        console.error('Erro ao carregar logs:', error)
        setLoading(false)
        return
      }

      if (!logsData) {
        setLoading(false)
        return
      }

      const userIds = [...new Set(logsData.map((log: any) => log.user_id).filter(Boolean))]

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', userIds)

        const nameMap: Record<string, string> = {}
        profiles?.forEach((profile: Profile) => {
          nameMap[profile.id] = profile.name
        })
        setUserNames(nameMap)
      }

      setLogs(logsData as Log[])
      setFilteredLogs(logsData as Log[])
      setLoading(false)
    }

    loadLogs()
  }, [supabase])

  // Carregar filtros salvos do usuário
  useEffect(() => {
    async function loadSavedFilters() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('saved_filters')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (data) setSavedFilters(data)
    }
    loadSavedFilters()
  }, [supabase])

  // Aplicar filtros
  useEffect(() => {
    let filtered = logs

    if (searchText.trim()) {
      const term = searchText.toLowerCase()
      filtered = filtered.filter(log => {
        const emailMatch = log.user_email?.toLowerCase().includes(term)
        const actionMatch = log.action?.toLowerCase().includes(term)
        const detailsMatch = log.details && JSON.stringify(log.details).toLowerCase().includes(term)
        return emailMatch || actionMatch || detailsMatch
      })
    }

    if (startDate) {
      const start = new Date(startDate)
      start.setHours(0, 0, 0, 0)
      filtered = filtered.filter(log => new Date(log.created_at) >= start)
    }

    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      filtered = filtered.filter(log => new Date(log.created_at) <= end)
    }

    setFilteredLogs(filtered)
  }, [searchText, startDate, endDate, logs])

  const clearFilters = () => {
    setSearchText('')
    setStartDate('')
    setEndDate('')
  }

  const handleSaveFilter = async () => {
    if (!filterName.trim()) {
      toast.error('Digite um nome para o filtro')
      return
    }

    setLoadingFilters(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('saved_filters')
      .insert({
        user_id: user.id,
        name: filterName,
        filters: {
          searchText,
          startDate,
          endDate,
        },
      })

    if (error) {
      toast.error('Erro ao salvar filtro')
    } else {
      toast.success('Filtro salvo com sucesso!')
      setSaveDialogOpen(false)
      setFilterName('')
      // Recarregar lista
      const { data } = await supabase
        .from('saved_filters')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (data) setSavedFilters(data)
    }
    setLoadingFilters(false)
  }

  const handleApplyFilter = (filter: SavedFilter) => {
    setSearchText(filter.filters.searchText || '')
    setStartDate(filter.filters.startDate || '')
    setEndDate(filter.filters.endDate || '')
  }

  const handleDeleteFilter = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este filtro?')) return

    const { error } = await supabase
      .from('saved_filters')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error('Erro ao excluir filtro')
    } else {
      toast.success('Filtro excluído')
      setSavedFilters(savedFilters.filter(f => f.id !== id))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando logs...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Logs de Atividades</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Barra de filtros com botão de salvar */}
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="md:col-span-2">
                <Label htmlFor="search">Buscar</Label>
                <div className="relative">
                  <Input
                    id="search"
                    placeholder="Pesquisar por e-mail, ação ou detalhes..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="startDate">Data inicial</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="endDate">Data final</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Limpar filtros
                </Button>
                <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Save className="h-4 w-4 mr-2" />
                      Salvar filtros
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Salvar filtros</DialogTitle>
                      <DialogDescription>
                        Dê um nome para esta combinação de filtros.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <Label htmlFor="filterName">Nome do filtro</Label>
                      <Input
                        id="filterName"
                        value={filterName}
                        onChange={(e) => setFilterName(e.target.value)}
                        placeholder="Ex: Logs de movimentação da semana"
                      />
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleSaveFilter} disabled={loadingFilters}>
                        Salvar
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Dropdown de filtros salvos */}
              {savedFilters.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Bookmark className="h-4 w-4 mr-2" />
                      Filtros salvos
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    {savedFilters.map((filter) => (
                      <div key={filter.id} className="flex items-center justify-between px-2 py-1">
                        <button
                          className="flex-1 text-left text-sm hover:bg-accent rounded px-2 py-1"
                          onClick={() => handleApplyFilter(filter)}
                        >
                          <span className="font-medium">{filter.name}</span>
                          <span className="block text-xs text-muted-foreground">
                            {filter.filters.searchText || 'sem texto'} · {filter.filters.startDate || '?'} a {filter.filters.endDate || '?'}
                          </span>
                        </button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleDeleteFilter(filter.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* Tabela de logs */}
          {filteredLogs.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhum log encontrado com os filtros atuais.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Data/Hora</TableHead>
                    <TableHead className="whitespace-nowrap">Usuário (Nome)</TableHead>
                    <TableHead className="whitespace-nowrap">E-mail</TableHead>
                    <TableHead className="whitespace-nowrap">Ação</TableHead>
                    <TableHead>Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => {
                    const userName = log.user_id ? userNames[log.user_id] : null
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap align-top">
                          {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="whitespace-nowrap align-top">
                          {userName || '—'}
                        </TableCell>
                        <TableCell className="whitespace-nowrap align-top">
                          {log.user_email || '—'}
                        </TableCell>
                        <TableCell className="whitespace-nowrap align-top">
                          <Badge className={actionColor[log.action] || ''} variant="outline">
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="max-w-md bg-muted/50 p-3 rounded-md">
                            {formatDetails(log.action, log.details)}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
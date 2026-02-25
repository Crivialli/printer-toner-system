'use client'

import { useState, useEffect } from 'react'
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ArrowLeft, Download, RefreshCw, Database, Clock, HardDrive, AlertCircle, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Backup {
  id: string
  date: Date
  size: string
  status: 'available' | 'downloading' | 'restoring'
  type: 'automático' | 'manual'
}

export default function AdminBackupPage() {
  const [backups, setBackups] = useState<Backup[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null)
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Verificar se usuário é admin
  useEffect(() => {
    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (data?.role !== 'admin') {
        router.push('/') // Redireciona se não for admin
        return
      }

      setUserRole(data.role)
      loadBackupInfo()
    }
    checkAdmin()
  }, [router, supabase])

  // Simular lista de backups (substituir por dados reais da API Supabase)
  const loadBackupInfo = async () => {
    setLoading(true)
    // Simulação de dados
    setTimeout(() => {
      const mockBackups: Backup[] = [
        {
          id: '1',
          date: new Date(Date.now() - 86400000),
          size: '156 MB',
          status: 'available',
          type: 'automático',
        },
        {
          id: '2',
          date: new Date(Date.now() - 172800000),
          size: '152 MB',
          status: 'available',
          type: 'automático',
        },
        {
          id: '3',
          date: new Date(Date.now() - 259200000),
          size: '148 MB',
          status: 'available',
          type: 'automático',
        },
      ]
      setBackups(mockBackups)
      setLoading(false)
    }, 1000)
  }

  const handleDownload = (backup: Backup) => {
    // Simular download: abrir painel do Supabase
    window.open('https://app.supabase.com/project/_/database/backups', '_blank')
  }

  const handleRestore = (backup: Backup) => {
    setSelectedBackup(backup)
    setRestoreDialogOpen(true)
  }

  const confirmRestore = () => {
    // Simular restauração - exibir instruções
    alert([
      'Para restaurar o backup:',
      '1. Acesse o painel do Supabase',
      '2. Vá em Database → Backups',
      '3. Clique em "Restore to a New Project"',
      '4. Siga as instruções na tela',
    ].join('\n'))
    setRestoreDialogOpen(false)
  }

  const totalBackups = backups.length
  const lastBackup = backups[0]
  const totalSize = backups.reduce((acc, b) => acc + parseInt(b.size), 0) // simplificado

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold">Backups</h1>
        <Badge variant="outline" className="ml-2">Admin</Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Backups</p>
                <p className="text-3xl font-bold">{totalBackups}</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-full">
                <Database className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Último Backup</p>
                <p className="text-lg font-semibold">
                  {lastBackup ? format(lastBackup.date, "dd/MM/yyyy") : '-'}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tamanho Total</p>
                <p className="text-lg font-semibold">~{totalSize} MB</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                <HardDrive className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Retenção</p>
                <p className="text-lg font-semibold">7 dias</p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                <AlertCircle className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Backup Settings Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Configurações de Backup
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Backups Automáticos</h3>
              <p className="text-sm text-muted-foreground">
                O Supabase realiza backups diários automaticamente.
              </p>
              <p className="text-sm mt-1">
                <Badge variant="outline" className="mr-2">Retenção</Badge>
                7 dias (plano gratuito) · 30+ dias (planos pagos)
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Backup Manual</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Você pode criar um backup manual a qualquer momento.
              </p>
              <Button variant="outline" size="sm" onClick={() => window.open('https://app.supabase.com/project/_/database/backups', '_blank')}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Ir para Supabase
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* What's included alert */}
      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Antes de restaurar</AlertTitle>
        <AlertDescription>
          O backup restaura apenas o banco de dados. Os seguintes itens não são incluídos:
          <ul className="list-disc ml-5 mt-2 text-sm">
            <li>Edge Functions</li>
            <li>Configurações de Auth e API keys</li>
            <li>Configurações de Realtime</li>
            <li>Arquivos do Storage (apenas metadados)</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Backups List */}
      <Card>
        <CardHeader>
          <CardTitle>Últimos Backups Disponíveis</CardTitle>
        </CardHeader>
        <CardContent>
          {backups.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhum backup disponível.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tamanho</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {backups.map((backup) => (
                  <TableRow key={backup.id}>
                    <TableCell className="font-medium">
                      {format(backup.date, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>{backup.size}</TableCell>
                    <TableCell>
                      <Badge variant={backup.type === 'automático' ? 'secondary' : 'default'}>
                        {backup.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleDownload(backup)}>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                        <Button variant="default" size="sm" onClick={() => handleRestore(backup)}>
                          Restaurar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Restore Dialog */}
      <Dialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restaurar Backup</DialogTitle>
            <DialogDescription>
              {selectedBackup && (
                <>Backup de {format(selectedBackup.date, "dd/MM/yyyy 'às' HH:mm")}</>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Atenção</AlertTitle>
              <AlertDescription>
                A restauração cria um novo projeto. Os dados atuais não serão substituídos.
              </AlertDescription>
            </Alert>
            <p className="text-sm">
              Para restaurar este backup, siga as instruções:
            </p>
            <ol className="list-decimal ml-5 text-sm space-y-1">
              <li>Acesse o painel do Supabase</li>
              <li>Vá em Database → Backups</li>
              <li>Localize o backup desejado e clique em "Restore to a New Project"</li>
              <li>Siga as instruções na tela</li>
            </ol>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestoreDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmRestore}>
              Entendi, abrir instruções
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
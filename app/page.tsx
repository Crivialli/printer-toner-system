"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { v4 as uuidv4 } from "uuid"
import { motion } from "framer-motion"
import { Header } from "@/components/header"
import { StatsCards } from "@/components/stats-cards"
import { TonerTable } from "@/components/toner-table"
import { StockDialog } from "@/components/stock-dialog"
import { MovementHistory } from "@/components/movement-history"
import { NewTonerDialog } from "@/components/new-toner-dialog"
import { EditTonerDialog } from "@/components/edit-toner-dialog"
import { DashboardCharts } from "@/components/dashboard-charts"
import { ConsumptionForecast } from "@/components/consumption-forecast"
import { StockEvolution } from "@/components/stock-evolution"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase-client"
import { logActivity } from "@/lib/logger"
import type { TonerItem, StockMovement, TonerType } from "@/lib/toner-store"

// Variantes para animação com tipos corrigidos
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0, scale: 0.95 },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 24,
      mass: 0.5,
    },
  },
};

export default function Home() {
  const [toners, setToners] = useState<TonerItem[]>([])
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedToner, setSelectedToner] = useState<TonerItem | null>(null)
  const [dialogMode, setDialogMode] = useState<"entrada" | "saida">("entrada")
  const [newTonerOpen, setNewTonerOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [tonerToEdit, setTonerToEdit] = useState<TonerItem | null>(null)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Buscar nome do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single()
      if (profile?.name) setUserName(profile.name)

      // Buscar toners
      const { data: tonersData, error: tonersError } = await supabase
        .from('toners')
        .select('*')
        .order('name')

      if (!tonersError && tonersData) {
        const formattedToners: TonerItem[] = tonersData.map((t: any) => ({
          id: t.id,
          name: t.name,
          type: t.type,
          brand: t.brand,
          quantity: t.quantity,
          minQuantity: t.min_quantity,
        }))
        setToners(formattedToners)
      }

      // Buscar movimentos
      const { data: movementsData, error: movementsError } = await supabase
        .from('stock_movements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (!movementsError && movementsData) {
        const formattedMovements: StockMovement[] = movementsData.map((m: any) => ({
          id: m.id,
          tonerId: m.toner_id,
          tonerName: m.toner_name,
          type: m.type,
          quantity: m.quantity,
          date: new Date(m.created_at).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          note: m.note || '',
          price: m.price,
          reason: m.reason,
        }))
        setMovements(formattedMovements)
      }

      setLoading(false)
    }

    loadData()
  }, [router, supabase])

  const handleAction = useCallback(
    (toner: TonerItem, mode: "entrada" | "saida") => {
      setSelectedToner(toner)
      setDialogMode(mode)
      setDialogOpen(true)
    },
    []
  )

  const handleConfirm = useCallback(
    async (quantity: number, note: string, price?: number, reason?: 'consumo' | 'devolucao') => {
      if (!selectedToner) return

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const newQty =
        dialogMode === "entrada"
          ? selectedToner.quantity + quantity
          : Math.max(0, selectedToner.quantity - quantity)

      const { error: updateError } = await supabase
        .from('toners')
        .update({ quantity: newQty })
        .eq('id', selectedToner.id)

      if (updateError) {
        alert('Erro ao registrar movimentação.')
        return
      }

      const now = new Date()
      const movementData: any = {
        id: uuidv4(),
        toner_id: selectedToner.id,
        toner_name: `${selectedToner.name} (${selectedToner.brand})`,
        type: dialogMode,
        quantity,
        note,
        user_id: user.id,
        created_at: now.toISOString(),
      }

      if (dialogMode === 'entrada' && price !== undefined) movementData.price = price
      if (dialogMode === 'saida' && reason !== undefined) movementData.reason = reason

      const { error: insertError } = await supabase
        .from('stock_movements')
        .insert(movementData)

      if (insertError) {
        alert('Movimentação registrada, mas houve erro ao salvar histórico.')
      } else {
        const logDetails: any = {
          toner_id: selectedToner.id,
          tipo: dialogMode,
          quantidade: quantity,
          observacao: note,
          nova_quantidade: newQty,
        }
        if (dialogMode === 'entrada' && price !== undefined) logDetails.preco = price
        if (dialogMode === 'saida' && reason !== undefined) logDetails.motivo = reason
        await logActivity('movimentação', logDetails)

        const movement: StockMovement = {
          id: movementData.id,
          tonerId: selectedToner.id,
          tonerName: movementData.toner_name,
          type: dialogMode,
          quantity,
          date: now.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          note,
          price: dialogMode === 'entrada' ? price : undefined,
          reason: dialogMode === 'saida' ? reason : undefined,
        }
        setMovements(prev => [movement, ...prev])
      }

      setToners(prev =>
        prev.map(t => (t.id === selectedToner.id ? { ...t, quantity: newQty } : t))
      )
      setDialogOpen(false)
    },
    [selectedToner, dialogMode, supabase]
  )

  const handleNewToner = useCallback(
    async (data: { 
      name: string; 
      type: "cilindro" | "toner"; 
      brand: string; 
      minQuantity: number;
      initialQuantity: number; 
    }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const newToner = {
        id: uuidv4(),
        name: data.name,
        type: data.type,
        brand: data.brand,
        quantity: data.initialQuantity,
        min_quantity: data.minQuantity,
        created_at: new Date().toISOString(),
      }

      const { error } = await supabase.from('toners').insert(newToner)
      if (error) {
        alert('Erro ao cadastrar toner.')
        return
      }

      await logActivity('criou toner', {
        toner_id: newToner.id,
        nome: data.name,
        marca: data.brand,
        tipo: data.type,
        quantidade_inicial: data.initialQuantity,
        estoque_minimo: data.minQuantity,
      })

      const tonerItem: TonerItem = {
        id: newToner.id,
        name: newToner.name,
        type: newToner.type,
        brand: newToner.brand,
        quantity: newToner.quantity,
        minQuantity: newToner.min_quantity,
      }
      setToners(prev => [...prev, tonerItem])
      setNewTonerOpen(false)
    },
    [supabase]
  )

  const handleDelete = useCallback(
    async (toner: TonerItem) => {
      if (!window.confirm(`Tem certeza que deseja excluir "${toner.name} (${toner.brand})"?`)) return

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await logActivity('excluiu toner', {
        toner_id: toner.id,
        nome: toner.name,
        marca: toner.brand,
        tipo: toner.type,
      })

      const { error } = await supabase.from('toners').delete().eq('id', toner.id)
      if (error) {
        alert('Erro ao excluir toner.')
        return
      }

      setToners(prev => prev.filter(t => t.id !== toner.id))
      setMovements(prev => prev.filter(m => m.tonerId !== toner.id))
    },
    [supabase]
  )

  const handleEditToner = useCallback((toner: TonerItem) => {
    setTonerToEdit(toner)
    setEditDialogOpen(true)
  }, [])

  const handleSaveEdit = useCallback(
    async (id: string, data: { name: string; type: TonerType; brand: string; minQuantity: number }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const tonerAntigo = toners.find(t => t.id === id)

      const updates = {
        name: data.name,
        type: data.type,
        brand: data.brand,
        min_quantity: data.minQuantity,
      }

      const { error } = await supabase.from('toners').update(updates).eq('id', id)
      if (error) {
        alert('Erro ao salvar alterações.')
        return
      }

      await logActivity('editou toner', {
        toner_id: id,
        dados_antigos: tonerAntigo ? {
          nome: tonerAntigo.name,
          marca: tonerAntigo.brand,
          tipo: tonerAntigo.type,
          estoque_minimo: tonerAntigo.minQuantity,
        } : null,
        dados_novos: data,
      })

      setToners(prev => prev.map(t => (t.id === id ? { ...t, ...data } : t)))
      setEditDialogOpen(false)
      setTonerToEdit(null)
    },
    [toners, supabase]
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="h-16 w-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando painel...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Olá, {userName || 'Usuário'}!
          </h2>
          <p className="text-muted-foreground mt-1">
            Aqui está o resumo do seu estoque hoje.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          <motion.div variants={itemVariants}>
            <StatsCards toners={toners} />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StockEvolution />
          </motion.div>
          <motion.div variants={itemVariants}>
            <ConsumptionForecast toners={toners} movements={movements} />
          </motion.div>
          <motion.div variants={itemVariants}>
            <DashboardCharts toners={toners} movements={movements} />
          </motion.div>
          <motion.div variants={itemVariants}>
            <TonerTable
              toners={toners}
              onAction={handleAction}
              onNewToner={() => setNewTonerOpen(true)}
              onDelete={handleDelete}
              onEdit={handleEditToner}
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <MovementHistory movements={movements} />
          </motion.div>
        </motion.div>
      </main>

      <StockDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        toner={selectedToner}
        mode={dialogMode}
        onConfirm={handleConfirm}
      />
      <NewTonerDialog
        open={newTonerOpen}
        onOpenChange={setNewTonerOpen}
        onConfirm={handleNewToner}
      />
      <EditTonerDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        toner={tonerToEdit}
        onConfirm={handleSaveEdit}
      />
    </div>
  )
}
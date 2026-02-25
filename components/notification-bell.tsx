"use client"

import { useEffect, useState } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase-client"
import { useRouter } from "next/navigation"

interface CriticalItem {
  id: string
  name: string
  brand: string
  quantity: number
  minQuantity: number
}

export function NotificationBell() {
  const [criticalItems, setCriticalItems] = useState<CriticalItem[]>([])
  const [viewedItemIds, setViewedItemIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  const fetchCritical = async () => {
    const { data, error } = await supabase
      .from('toners')
      .select('id, name, brand, quantity, min_quantity')
    
    if (error) {
      console.error('Erro ao buscar toners:', error)
      return
    }

    if (data) {
      // Mapeia os dados para o formato CriticalItem (convertendo min_quantity para minQuantity)
      const critical: CriticalItem[] = data
        .filter(t => t.quantity <= t.min_quantity)
        .map(t => ({
          id: t.id,
          name: t.name,
          brand: t.brand,
          quantity: t.quantity,
          minQuantity: t.min_quantity,
        }))
      setCriticalItems(critical)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchCritical()
    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchCritical, 30000)
    return () => clearInterval(interval)
  }, [])

  // Calcula quantos itens não foram vistos
  const unreadCount = criticalItems.filter(item => !viewedItemIds.has(item.id)).length

  const handleOpenChange = (open: boolean) => {
    if (open) {
      // Quando o dropdown é aberto, marca todos os itens atuais como visualizados
      const newViewed = new Set(viewedItemIds)
      criticalItems.forEach(item => newViewed.add(item.id))
      setViewedItemIds(newViewed)
    }
  }

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-primary-foreground hover:bg-primary-foreground/15">
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>Itens com Estoque Baixo</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {criticalItems.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Nenhum item crítico no momento.
          </div>
        ) : (
          criticalItems.map(item => (
            <DropdownMenuItem key={item.id} className="flex justify-between items-start cursor-pointer" onClick={() => router.push('/')}>
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.brand}</p>
              </div>
              <Badge variant="destructive" className="ml-2 shrink-0">
                {item.quantity} / {item.minQuantity}
              </Badge>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Button variant="ghost" className="w-full justify-center" onClick={() => router.push('/relatorios?tipo=baixo_estoque')}>
            Ver todos
          </Button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
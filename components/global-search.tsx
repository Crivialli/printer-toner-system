'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { 
  Search, 
  Loader2, 
  Home, 
  History, 
  FileText, 
  User, 
  HelpCircle, 
  ShoppingCart, 
  DollarSign, 
  Package, 
  Database,
  File,
  Tag,
  Briefcase,
  X
} from 'lucide-react'
import { useDebounce } from '@/hooks/use-debounce'

interface SearchResult {
  id: string
  title: string
  subtitle: string
  url: string
  type: 'toner' | 'ordem' | 'log' | 'pagina'
  icon?: React.ReactNode
}

// Lista de páginas com ícones
const PAGES = [
  { title: 'Início', url: '/', keywords: ['inicio', 'home', 'principal'], icon: <Home className="h-4 w-4" /> },
  { title: 'Logs', url: '/logs', keywords: ['logs', 'atividades', 'historico'], icon: <History className="h-4 w-4" /> },
  { title: 'Relatórios', url: '/relatorios', keywords: ['relatorios', 'relatório', 'relatorio'], icon: <FileText className="h-4 w-4" /> },
  { title: 'Perfil', url: '/perfil', keywords: ['perfil', 'usuario', 'usuário'], icon: <User className="h-4 w-4" /> },
  { title: 'Ajuda', url: '/ajuda', keywords: ['ajuda', 'faq', 'tutorial', 'duvida'], icon: <HelpCircle className="h-4 w-4" /> },
  { title: 'Sugestão de Pedido', url: '/sugestao-pedido', keywords: ['sugestao', 'pedido', 'compra', 'sugestão'], icon: <ShoppingCart className="h-4 w-4" /> },
  { title: 'Histórico de Preços', url: '/precos', keywords: ['precos', 'preço', 'historico', 'valores'], icon: <DollarSign className="h-4 w-4" /> },
  { title: 'Compras', url: '/compras', keywords: ['compras', 'ordem', 'ordens', 'pedidos'], icon: <Briefcase className="h-4 w-4" /> },
  { title: 'Backups', url: '/admin/backup', keywords: ['backup', 'backups', 'restaurar'], icon: <Database className="h-4 w-4" /> },
]

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 300)
  const router = useRouter()
  const supabase = createClient()
  const abortControllerRef = useRef<AbortController | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Atalho Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(true)
        setTimeout(() => inputRef.current?.focus(), 100)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const performSearch = useCallback(async (term: string) => {
    if (!term.trim()) {
      setResults([])
      return
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    setLoading(true)
    const searchResults: SearchResult[] = []
    const lowerTerm = term.toLowerCase()

    // 1. Páginas
    PAGES.forEach(page => {
      if (
        page.title.toLowerCase().includes(lowerTerm) ||
        page.keywords.some(k => k.includes(lowerTerm))
      ) {
        searchResults.push({
          id: `page-${page.url}`,
          title: page.title,
          subtitle: 'Página do sistema',
          url: page.url,
          type: 'pagina',
          icon: page.icon,
        })
      }
    })

    // 2. Toners
    const { data: toners } = await supabase
      .from('toners')
      .select('id, name, brand')
      .ilike('name', `%${term}%`)
      .limit(3)

    if (toners) {
      toners.forEach(t => {
        searchResults.push({
          id: t.id,
          title: t.name,
          subtitle: t.brand,
          url: `/`,
          type: 'toner',
          icon: <Tag className="h-4 w-4" />,
        })
      })
    }

    // 3. Ordens
    const { data: ordens } = await supabase
      .from('purchase_orders')
      .select('id, po_number, suppliers ( name )')
      .ilike('po_number', `%${term}%`)
      .limit(3) as any

    if (ordens) {
      ordens.forEach((o: any) => {
        searchResults.push({
          id: o.id,
          title: o.po_number,
          subtitle: o.suppliers?.name || '—',
          url: `/compras/${o.id}`,
          type: 'ordem',
          icon: <File className="h-4 w-4" />,
        })
      })
    }

    // 4. Logs
    if (term.length >= 3) {
      const { data: logs } = await supabase
        .from('activity_logs')
        .select('id, action, user_email')
        .or(`action.ilike.%${term}%,user_email.ilike.%${term}%`)
        .limit(3)

      if (logs) {
        logs.forEach(l => {
          searchResults.push({
            id: l.id,
            title: l.action,
            subtitle: l.user_email || '—',
            url: `/logs`,
            type: 'log',
            icon: <History className="h-4 w-4" />,
          })
        })
      }
    }

    setResults(searchResults)
    setLoading(false)
    abortControllerRef.current = null
  }, [supabase])

  useEffect(() => {
    performSearch(debouncedSearch)
  }, [debouncedSearch, performSearch])

  const handleSelect = (url: string) => {
    setOpen(false)
    setSearchTerm('')
    router.push(url)
  }

  const handleClear = () => {
    setSearchTerm('')
    setResults([])
    inputRef.current?.focus()
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/15">
          <Search className="size-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[400px] p-2">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            ref={inputRef}
            placeholder="Buscar toners, ordens, logs ou páginas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9 border-0 focus-visible:ring-0 p-0"
          />
          {searchTerm && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleClear}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <DropdownMenuSeparator className="my-2" />
        <div className="max-h-[400px] overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {!loading && results.length === 0 && searchTerm && (
            <p className="text-center text-muted-foreground py-6">
              Nenhum resultado encontrado para "{searchTerm}"
            </p>
          )}
          {!loading && results.length > 0 && (
            <>
              {['pagina', 'toner', 'ordem', 'log'].map(type => {
                const items = results.filter(r => r.type === type)
                if (items.length === 0) return null
                return (
                  <div key={type}>
                    <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground px-2 py-1">
                      {type === 'pagina' ? '📄 Páginas' :
                       type === 'toner' ? '🖨️ Toners' :
                       type === 'ordem' ? '📦 Ordens de Compra' : '📋 Logs'}
                    </DropdownMenuLabel>
                    {items.map(r => (
                      <DropdownMenuItem
                        key={r.id}
                        onSelect={() => handleSelect(r.url)}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <span className="text-muted-foreground">{r.icon}</span>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{r.title}</span>
                          <span className="text-xs text-muted-foreground">{r.subtitle}</span>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </div>
                )
              })}
            </>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
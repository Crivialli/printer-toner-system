"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import {
  Printer,
  LogOut,
  Settings,
  Sun,
  Moon,
  Home,
  BarChart,
  ShoppingCart,
  User,
  HelpCircle,
  Package,
  DollarSign,
  FileText,
  History,
  Database,
  Logs,
  Maximize,
  Minimize,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase-client"
import { NotificationBell } from "@/components/notification-bell"
import { GlobalSearch } from "@/components/global-search"
import { useDensity } from "@/contexts/density-context"

export function Header() {
  const router = useRouter()
  const supabase = createClient()
  const { theme, setTheme } = useTheme()
  const { density, toggleDensity } = useDensity()
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    async function getUserRole() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        setUserRole(data?.role || null)
      }
    }
    getUserRole()
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="bg-primary text-primary-foreground">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5">
        {/* Logo e título (link para a home) */}
        <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary-foreground/15">
            <Printer className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Controle de Toner | Grupo Crivialli
            </h1>
            <p className="text-sm text-primary-foreground/70">
              Gerenciamento de estoque de suprimentos
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          {/* Botão Início (Home) */}
          <Link href="/" passHref>
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/15">
              <Home className="size-5" />
            </Button>
          </Link>

          {/* Pesquisa Global */}
          <GlobalSearch />

          {/* Sino de notificações */}
          <NotificationBell />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/15">
                <Settings className="size-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Menu</DropdownMenuLabel>
              <DropdownMenuSeparator />

              {/* Relatórios e Análises */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <BarChart className="mr-2 h-4 w-4" />
                  <span>Relatórios e Análises</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent className="w-48">
                    <DropdownMenuItem asChild>
                      <Link href="/relatorios" className="flex items-center">
                        <FileText className="mr-2 h-4 w-4" />
                        Relatórios
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/relatorios/comparativo" className="flex items-center">
                        <History className="mr-2 h-4 w-4" />
                        Comparativo de Períodos
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/precos" className="flex items-center">
                        <DollarSign className="mr-2 h-4 w-4" />
                        Histórico de Preços
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>

              {/* Gestão de Compras */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  <span>Gestão de Compras</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent className="w-48">
                    <DropdownMenuItem asChild>
                      <Link href="/sugestao-pedido" className="flex items-center">
                        <Package className="mr-2 h-4 w-4" />
                        Sugestão de Pedido
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/compras" className="flex items-center">
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Compras
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>

              {/* Sistema */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Sistema</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent className="w-48">
                    <DropdownMenuItem asChild>
                      <Link href="/logs" className="flex items-center">
                        <Logs className="mr-2 h-4 w-4" />
                        Logs
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/perfil" className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        Perfil
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/ajuda" className="flex items-center">
                        <HelpCircle className="mr-2 h-4 w-4" />
                        Ajuda
                      </Link>
                    </DropdownMenuItem>
                    {userRole === 'admin' && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin/backup" className="flex items-center">
                          <Database className="mr-2 h-4 w-4" />
                          Backups
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    {/* Opção de densidade */}
                    <DropdownMenuItem onClick={toggleDensity}>
                      {density === 'compact' ? (
                        <><Maximize className="mr-2 h-4 w-4" /> Modo Confortável</>
                      ) : (
                        <><Minimize className="mr-2 h-4 w-4" /> Modo Compacto</>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                      {theme === 'dark' ? (
                        <><Sun className="mr-2 h-4 w-4" /> Modo Claro</>
                      ) : (
                        <><Moon className="mr-2 h-4 w-4" /> Modo Escuro</>
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>

              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { createClient } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Loader2, Sun, Moon, History, BarChart } from 'lucide-react'

interface Profile {
  id: string
  name: string
  email: string
  role: 'admin' | 'user'
  avatar_url?: string
  theme_preference?: 'light' | 'dark' | 'system'
  notifications_enabled?: boolean
  created_at: string
}

interface UserStats {
  totalMovements: number
  totalLogs: number
  memberSince: string
}

export default function PerfilPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [recentActivities, setRecentActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [nameError, setNameError] = useState('')
  const [nameSuccess, setNameSuccess] = useState('')

  const router = useRouter()
  const supabase = createClient()
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Buscar perfil na tabela profiles
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileData) {
        setProfile({
          id: user.id,
          email: user.email!,
          name: profileData.name || '',
          role: profileData.role || 'user',
          avatar_url: profileData.avatar_url,
          theme_preference: profileData.theme_preference || 'system',
          notifications_enabled: profileData.notifications_enabled ?? true,
          created_at: profileData.created_at,
        })
        // Aplica o tema salvo
        if (profileData.theme_preference) {
          setTheme(profileData.theme_preference)
        }
      } else {
        setProfile({
          id: user.id,
          email: user.email!,
          name: '',
          role: 'user',
          theme_preference: 'system',
          notifications_enabled: true,
          created_at: new Date().toISOString(),
        })
      }

      // Estatísticas
      const { count: movCount } = await supabase
        .from('stock_movements')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      const { count: logCount } = await supabase
        .from('activity_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      setStats({
        totalMovements: movCount || 0,
        totalLogs: logCount || 0,
        memberSince: profileData?.created_at || user.created_at,
      })

      // Atividades recentes
      const { data: logs } = await supabase
        .from('activity_logs')
        .select('action, details, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      setRecentActivities(logs || [])
      setLoading(false)
    }

    loadProfile()
  }, [router, supabase, setTheme])

  const handleSaveName = async () => {
    if (!profile) return
    setNameError('')
    setNameSuccess('')
    setSaving(true)

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: profile.id,
        name: profile.name,
        updated_at: new Date().toISOString(),
      })

    if (error) {
      setNameError('Erro ao salvar nome: ' + error.message)
    } else {
      setNameSuccess('Nome atualizado com sucesso!')
    }
    setSaving(false)
  }

  const handleThemeChange = async (newTheme: 'light' | 'dark' | 'system') => {
    if (!profile) return
    
    // Atualiza o tema global
    setTheme(newTheme)
    
    // Atualiza o estado local
    setProfile({ ...profile, theme_preference: newTheme })
    
    // Salva no banco
    setSaving(true)
    await supabase
      .from('profiles')
      .upsert({
        id: profile.id,
        theme_preference: newTheme,
        updated_at: new Date().toISOString(),
      })
    setSaving(false)
  }

  const handleNotificationChange = async (checked: boolean) => {
    if (!profile) return
    
    setProfile({ ...profile, notifications_enabled: checked })
    
    setSaving(true)
    await supabase
      .from('profiles')
      .upsert({
        id: profile.id,
        notifications_enabled: checked,
        updated_at: new Date().toISOString(),
      })
    setSaving(false)
  }

  const handleSavePreferences = async () => {
    if (!profile) return
    setSaving(true)

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: profile.id,
        theme_preference: profile.theme_preference,
        notifications_enabled: profile.notifications_enabled,
        updated_at: new Date().toISOString(),
      })

    if (error) {
      alert('Erro ao salvar preferências: ' + error.message)
    } else {
      alert('Preferências salvas com sucesso!')
    }
    setSaving(false)
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('As senhas não coincidem.')
      return
    }
    if (passwordData.newPassword.length < 6) {
      setPasswordError('A nova senha deve ter pelo menos 6 caracteres.')
      return
    }

    setSaving(true)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: profile!.email,
      password: passwordData.currentPassword,
    })

    if (signInError) {
      setPasswordError('Senha atual incorreta.')
      setSaving(false)
      return
    }

    const { error } = await supabase.auth.updateUser({
      password: passwordData.newPassword,
    })

    if (error) {
      setPasswordError(error.message)
    } else {
      setPasswordSuccess('Senha alterada com sucesso!')
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Perfil não encontrado.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold">Meu Perfil</h1>
        <Badge variant={profile.role === 'admin' ? 'default' : 'secondary'}>
          {profile.role === 'admin' ? 'Administrador' : 'Usuário'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Coluna esquerda - Informações básicas */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile.avatar_url || ''} />
                  <AvatarFallback className="bg-primary/10 text-2xl">
                    {profile.name?.charAt(0) || profile.email.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <div className="flex gap-2">
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    placeholder="Seu nome completo"
                  />
                  <Button onClick={handleSaveName} disabled={saving} size="sm">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
                  </Button>
                </div>
                {nameError && <p className="text-sm text-destructive">{nameError}</p>}
                {nameSuccess && <p className="text-sm text-green-600">{nameSuccess}</p>}
              </div>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input value={profile.email} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">
                  Para alterar o e‑mail, use a opção no Supabase.
                </p>
              </div>
              <div className="pt-2 text-sm text-muted-foreground">
                <p>Membro desde: {new Date(profile.created_at).toLocaleDateString('pt-BR')}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Estatísticas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <BarChart className="h-4 w-4" /> Movimentações
                  </span>
                  <Badge variant="outline">{stats?.totalMovements}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <History className="h-4 w-4" /> Logs de atividades
                  </span>
                  <Badge variant="outline">{stats?.totalLogs}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coluna direita */}
        <div className="md:col-span-2">
          <Tabs defaultValue="preferences" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="preferences">Preferências</TabsTrigger>
              <TabsTrigger value="security">Segurança</TabsTrigger>
              <TabsTrigger value="activity">Atividades</TabsTrigger>
            </TabsList>

            <TabsContent value="preferences" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Preferências do Sistema</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Tema</Label>
                      <p className="text-sm text-muted-foreground">
                        Escolha o tema da interface
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={theme === 'light' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleThemeChange('light')}
                        disabled={saving}
                      >
                        <Sun className="h-4 w-4 mr-2" />
                        Claro
                      </Button>
                      <Button
                        variant={theme === 'dark' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleThemeChange('dark')}
                        disabled={saving}
                      >
                        <Moon className="h-4 w-4 mr-2" />
                        Escuro
                      </Button>
                      <Button
                        variant={theme === 'system' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleThemeChange('system')}
                        disabled={saving}
                      >
                        Sistema
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <div className="space-y-0.5">
                      <Label className="text-base">Notificações</Label>
                      <p className="text-sm text-muted-foreground">
                        Receber alertas sobre estoque baixo
                      </p>
                    </div>
                    <Switch
                      checked={profile.notifications_enabled}
                      onCheckedChange={handleNotificationChange}
                      disabled={saving}
                    />
                  </div>
                  <Button onClick={handleSavePreferences} disabled={saving} className="w-full mt-4">
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Salvar preferências
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Alterar senha</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Senha atual</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, currentPassword: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">Nova senha</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, newPassword: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                        }
                        required
                      />
                    </div>
                    {passwordError && (
                      <p className="text-sm text-destructive">{passwordError}</p>
                    )}
                    {passwordSuccess && (
                      <p className="text-sm text-green-600">{passwordSuccess}</p>
                    )}
                    <Button type="submit" disabled={saving}>
                      {saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Alterando...
                        </>
                      ) : (
                        'Alterar senha'
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Atividades recentes</CardTitle>
                </CardHeader>
                <CardContent>
                  {recentActivities.length === 0 ? (
                    <p className="text-muted-foreground">Nenhuma atividade recente.</p>
                  ) : (
                    <ul className="space-y-3">
                      {recentActivities.map((act, idx) => (
                        <li key={idx} className="border-b pb-2 last:border-0">
                          <p className="font-medium">{act.action}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(act.created_at).toLocaleString('pt-BR')}
                          </p>
                          {act.details && (
                            <p className="text-sm mt-1">{JSON.stringify(act.details)}</p>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-client'

type Density = 'comfortable' | 'compact'

interface DensityContextType {
  density: Density
  setDensity: (density: Density) => void
  toggleDensity: () => void
}

const DensityContext = createContext<DensityContextType | undefined>(undefined)

export function DensityProvider({ children }: { children: React.ReactNode }) {
  const [density, setDensity] = useState<Density>('comfortable')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadDensity() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('density')
          .eq('id', user.id)
          .single()
        if (data?.density) {
          setDensity(data.density)
        }
      }
      setLoading(false)
    }
    loadDensity()
  }, [supabase])

  const updateDensity = async (newDensity: Density) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('profiles')
      .update({ density: newDensity })
      .eq('id', user.id)

    setDensity(newDensity)
  }

  const toggleDensity = () => {
    const newDensity = density === 'comfortable' ? 'compact' : 'comfortable'
    updateDensity(newDensity)
  }

  // 🔹 Enquanto carrega, não renderiza os filhos (evita erro de contexto)
  if (loading) {
    return null // ou um spinner, se preferir
  }

  return (
    <DensityContext.Provider value={{ density, setDensity: updateDensity, toggleDensity }}>
      {children}
    </DensityContext.Provider>
  )
}

export function useDensity() {
  const context = useContext(DensityContext)
  if (!context) {
    throw new Error('useDensity must be used within a DensityProvider')
  }
  return context
}
'use client'

import { useEffect } from 'react'
import { useDensity } from '@/contexts/density-context'

export function useDensityClass() {
  const { density } = useDensity()

  useEffect(() => {
    document.body.classList.remove('density-comfortable', 'density-compact')
    document.body.classList.add(`density-${density}`)
  }, [density])
}
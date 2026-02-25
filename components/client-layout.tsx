'use client'

import { useDensityClass } from '@/hooks/use-density-class'

export function ClientLayout({ children }: { children: React.ReactNode }) {
  useDensityClass()
  return <>{children}</>
}
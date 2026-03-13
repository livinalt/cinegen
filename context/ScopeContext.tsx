'use client'

/**
 * ScopeContext — singleton Daydream stream instance shared across the whole app.
 * Components call useScope() to get the same shared instance.
 */

import React, { createContext, useContext } from 'react'
import { useDaydreamStream, DaydreamStreamResult } from '@/hooks/useDaydreamStream'

const ScopeContext = createContext<DaydreamStreamResult | null>(null)

export function ScopeProvider({ children }: { children: React.ReactNode }) {
  const scope = useDaydreamStream()
  return <ScopeContext.Provider value={scope}>{children}</ScopeContext.Provider>
}

export function useScope(): DaydreamStreamResult {
  const ctx = useContext(ScopeContext)
  if (!ctx) throw new Error('useScope must be used inside ScopeProvider')
  return ctx
}

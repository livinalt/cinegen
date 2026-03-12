'use client'

import { useState, useCallback, useRef } from 'react'
import { AppProvider } from '@/context/AppContext'
import { TopBar } from '@/components/layout/TopBar'
import { LeftPanel } from '@/components/panels/LeftPanel'
import { CenterPreview } from '@/components/preview/CenterPreview'
import { RightPanel } from '@/components/panels/RightPanel'
import { BottomBar } from '@/components/panels/BottomBar'
import { SettingsModal } from '@/components/modals/SettingsModal'
import { useKeyboard } from '@/hooks/useKeyboard'

function AppShell() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'warn'|'error'|'success' } | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useKeyboard()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: 'var(--app-bg)' }}>
      <TopBar onSettingsOpen={() => setSettingsOpen(true)} canvasRef={canvasRef} />

      <div className="app-canvas">
        <LeftPanel />

        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 10, minWidth: 0, minHeight: 0 }}>
          <CenterPreview ref={canvasRef} />
          <BottomBar
            toast={toast}
            onDismissToast={() => setToast(null)}
          />
        </div>

        <RightPanel />
      </div>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}

export default function HomePage() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  )
}

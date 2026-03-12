'use client'

import { Modal } from '@/components/ui/Modal'
import { useApp } from '@/context/AppContext'
import { useTheme } from 'next-themes'
import { Sun, Moon, Monitor } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SettingsModalProps {
  open: boolean
  onClose: () => void
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const { state, setParam } = useApp()
  const { theme, setTheme } = useTheme()
  const { params } = state

  const themes = [
    { value: 'light',  label: 'Light',  Icon: Sun },
    { value: 'dark',   label: 'Dark',   Icon: Moon },
    { value: 'system', label: 'System', Icon: Monitor },
  ]

  return (
    <Modal open={open} onClose={onClose} title="Settings" size="md">
      <div className="flex flex-col gap-5">

        {/* Theme */}
        <div>
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Theme</p>
          <div className="flex gap-2">
            {themes.map(({ value, label, Icon }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={cn(
                  'flex-1 flex flex-col items-center gap-1.5 py-3 rounded-lg transition-all text-xs font-medium'
                )}
                style={{
                  background: theme === value ? 'var(--accent-muted)' : 'var(--raised-bg)',
                  border: `1px solid ${theme === value ? 'var(--accent-border)' : 'var(--border-default)'}`,
                  color: theme === value ? 'var(--accent)' : 'var(--text-secondary)',
                }}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Output resolution */}
        <div>
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Output Resolution</p>
          <div className="flex gap-2">
            {[
              { w: 1920, h: 1080, label: '1080p FHD' },
              { w: 3840, h: 2160, label: '4K UHD' },
            ].map(({ w, h, label }) => (
              <button
                key={label}
                onClick={() => { setParam('outputWidth', w); setParam('outputHeight', h) }}
                className="flex-1 py-2 rounded text-xs font-medium transition-all"
                style={{
                  background: params.outputWidth === w ? 'var(--accent-muted)' : 'var(--raised-bg)',
                  border: `1px solid ${params.outputWidth === w ? 'var(--accent-border)' : 'var(--border-default)'}`,
                  color: params.outputWidth === w ? 'var(--accent)' : 'var(--text-secondary)',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Keyboard shortcuts */}
        <div>
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Keyboard Shortcuts</p>
          <div
            className="rounded-lg overflow-hidden"
            style={{ border: '1px solid var(--border-default)' }}
          >
            {[
              ['Space / →', 'Next lyric'],
              ['←',         'Previous lyric'],
              ['F',         'Toggle freeze'],
              ['B',         'Toggle blackout'],
              ['R',         'Randomize'],
              ['Esc',       'Reset to preset'],
            ].map(([key, label], i) => (
              <div
                key={key}
                className="flex items-center justify-between px-3 py-2 text-xs"
                style={{
                  borderTop: i > 0 ? '1px solid var(--border-subtle)' : 'none',
                  background: 'var(--raised-bg)',
                }}
              >
                <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                <kbd
                  className="font-mono text-2xs px-1.5 py-0.5 rounded"
                  style={{
                    background: 'var(--panel-bg)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {key}
                </kbd>
              </div>
            ))}
          </div>
        </div>

        {/* Backend config */}
        <div>
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Backend</p>
          <div
            className="px-3 py-2.5 rounded-lg font-mono text-xs"
            style={{ background: 'var(--raised-bg)', border: '1px solid var(--border-default)', color: 'var(--text-tertiary)' }}
          >
            <div className="flex justify-between">
              <span>API Endpoint</span>
              <span style={{ color: 'var(--text-secondary)' }}>localhost:8000</span>
            </div>
            <div className="flex justify-between mt-1">
              <span>Daydream Scope</span>
              <span style={{ color: 'var(--text-tertiary)' }}>Not connected</span>
            </div>
            <div className="flex justify-between mt-1">
              <span>Payments</span>
              <span style={{ color: '#22c55e' }}>Disabled (dev mode)</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}

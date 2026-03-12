'use client'

import { useTheme } from 'next-themes'
import { Sun, Moon, Monitor } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useRef, useEffect } from 'react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const options = [
    { value: 'light',  label: 'Light',  Icon: Sun },
    { value: 'dark',   label: 'Dark',   Icon: Moon },
    { value: 'system', label: 'System', Icon: Monitor },
  ]

  const current = options.find(o => o.value === theme) || options[2]
  const CurrentIcon = current.Icon

  return (
    <div ref={ref} className="relative">
      <button
        className="btn-ghost btn-icon rounded flex items-center gap-1.5 px-2 py-1.5"
        onClick={() => setOpen(v => !v)}
        aria-label="Toggle theme"
        title="Toggle theme"
      >
        <CurrentIcon size={14} style={{ color: 'var(--text-secondary)' }} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1 z-50 rounded-lg overflow-hidden py-1"
          style={{
            background: 'var(--panel-bg)',
            border: '1px solid var(--border-default)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            minWidth: 120,
          }}
        >
          {options.map(({ value, label, Icon }) => (
            <button
              key={value}
              className={cn(
                'w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors',
                theme === value
                  ? 'font-medium'
                  : 'font-normal'
              )}
              style={{
                color: theme === value ? 'var(--accent)' : 'var(--text-secondary)',
                background: theme === value ? 'var(--accent-muted)' : 'transparent',
              }}
              onClick={() => { setTheme(value); setOpen(false) }}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

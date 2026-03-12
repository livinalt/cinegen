'use client'

interface ToggleProps {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
  sublabel?: string
}

export function Toggle({ checked, onChange, label, sublabel }: ToggleProps) {
  return (
    <div
      className="toggle-wrap"
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
      tabIndex={0}
      style={{ cursor: 'pointer', userSelect: 'none' }}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onChange(!checked) } }}
    >
      {label && (
        <div>
          <div className="toggle-label">{label}</div>
          {sublabel && (
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: 'var(--text-tertiary)', marginTop: 2 }}>
              {sublabel}
            </div>
          )}
        </div>
      )}
      <div className={`toggle-switch${checked ? ' on' : ''}`} />
    </div>
  )
}

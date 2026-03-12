import Link from 'next/link'
import { Check } from 'lucide-react'

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Try CineGen with no commitment.',
    color: 'var(--text-secondary)',
    borderColor: 'var(--border-default)',
    features: [
      'Live AI generation with watermark',
      '12 free presets',
      'Virtual camera output',
      'Lyrics overlay system',
      'Manual lyrics advance',
      'NDI output',
    ],
    cta: 'Get Started Free',
    ctaStyle: 'secondary',
  },
  {
    name: 'Pro',
    price: '$19',
    period: 'per month',
    description: 'Everything you need for live production.',
    color: 'var(--accent)',
    borderColor: 'var(--accent-border)',
    badge: 'Most Popular',
    features: [
      'No watermark',
      'All 36 presets across 6 categories',
      'Transform Mode (video stylization)',
      'Unlimited MP4 export (1080p + 4K)',
      'Priority GPU inference',
      'Custom preset saving (20 slots)',
      'NDI output',
    ],
    cta: 'Upgrade to Pro',
    ctaStyle: 'primary',
  },
  {
    name: 'Team',
    price: '$49',
    period: 'per month',
    description: 'For AV teams and production companies.',
    color: '#8b5cf6',
    borderColor: 'rgba(139,92,246,0.25)',
    features: [
      'Everything in Pro',
      '3 seats included',
      'Shared preset library',
      'API access',
      'Priority support',
    ],
    cta: 'Get Team',
    ctaStyle: 'secondary',
  },
]

export default function PricingPage() {
  const paymentsEnabled = process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === 'true'

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'var(--bg-app)', color: 'var(--text-primary)' }}
    >
      {/* Nav */}
      <nav
        className="flex items-center justify-between px-8 h-14"
        style={{ borderBottom: '1px solid var(--border-default)', background: 'var(--bg-panel)' }}
      >
        <Link href="/" className="flex items-center gap-2.5">
          <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
            <rect x="1" y="1" width="9" height="13" rx="2" stroke="var(--accent)" strokeWidth="1.5" />
            <rect x="12" y="8" width="9" height="13" rx="2" stroke="var(--accent)" strokeWidth="1.5" opacity="0.45" />
          </svg>
          <span className="font-brand font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
            CineGen
          </span>
        </Link>
        <Link
          href="/"
          className="text-sm font-medium transition-colors"
          style={{ color: 'var(--text-secondary)' }}
        >
          ← Back to App
        </Link>
      </nav>

      {/* Hero */}
      <div className="text-center pt-16 pb-12 px-4">
        <h1 className="font-brand font-bold text-3xl mb-3" style={{ color: 'var(--text-primary)' }}>
          Simple, honest pricing
        </h1>
        <p className="text-md" style={{ color: 'var(--text-secondary)', maxWidth: 480, margin: '0 auto' }}>
          Start free. Upgrade when you need more.
          All features unlocked during development.
        </p>
        {!paymentsEnabled && (
          <div
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full text-sm"
            style={{
              background: 'rgba(34,197,94,0.1)',
              border: '1px solid rgba(34,197,94,0.2)',
              color: '#22c55e',
            }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-blink" />
            All features unlocked — payments coming soon
          </div>
        )}
      </div>

      {/* Pricing cards */}
      <div className="flex flex-col md:flex-row gap-6 px-8 pb-16 max-w-4xl mx-auto w-full">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className="flex-1 rounded-xl p-6 flex flex-col"
            style={{
              background: 'var(--bg-panel)',
              border: `1px solid ${plan.borderColor}`,
              boxShadow: plan.ctaStyle === 'primary' ? '0 0 0 1px var(--accent-border)' : 'none',
            }}
          >
            {plan.badge && (
              <div
                className="inline-flex self-start mb-3 px-2 py-0.5 rounded-full font-mono text-2xs tracking-wider uppercase"
                style={{
                  background: 'var(--accent-muted)',
                  border: '1px solid var(--accent-border)',
                  color: 'var(--accent)',
                }}
              >
                {plan.badge}
              </div>
            )}

            <h2 className="font-brand font-semibold text-xl mb-1" style={{ color: 'var(--text-primary)' }}>
              {plan.name}
            </h2>
            <div className="flex items-baseline gap-1.5 mb-2">
              <span className="font-brand font-bold text-3xl" style={{ color: plan.color }}>
                {plan.price}
              </span>
              <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                /{plan.period}
              </span>
            </div>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              {plan.description}
            </p>

            <div className="flex flex-col gap-2.5 flex-1 mb-8">
              {plan.features.map((f) => (
                <div key={f} className="flex items-start gap-2.5">
                  <Check size={13} className="mt-0.5 shrink-0" style={{ color: plan.color }} />
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{f}</span>
                </div>
              ))}
            </div>

            <Link href="/">
              <button
                className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all"
                style={
                  plan.ctaStyle === 'primary'
                    ? { background: 'var(--accent)', color: '#fff', border: 'none' }
                    : {
                        background: 'var(--bg-raised)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-default)',
                      }
                }
              >
                {!paymentsEnabled ? 'Open App (All Unlocked)' : plan.cta}
              </button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}

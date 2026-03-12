import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono:    ['DM Mono', 'monospace'],
      },
      fontSize: {
        '2xs': ['10px', { lineHeight: '14px' }],
        xs:    ['11px', { lineHeight: '16px' }],
        sm:    ['12px', { lineHeight: '18px' }],
        base:  ['13px', { lineHeight: '20px' }],
        md:    ['14px', { lineHeight: '22px' }],
        lg:    ['16px', { lineHeight: '24px' }],
      },
      borderRadius: {
        DEFAULT: 'var(--radius-sm)',
        sm:  'var(--radius-xs)',
        md:  'var(--radius-sm)',
        lg:  'var(--radius-md)',
        xl:  'var(--radius-card)',
        full: '9999px',
      },
      animation: {
        'pulse-dot': 'pulse 2.5s ease-in-out infinite',
        'blink':     'blink 1s ease-in-out infinite',
        'fade-in':   'fadeIn 0.2s ease forwards',
        'slide-up':  'slideUp 0.2s ease forwards',
      },
    },
  },
  plugins: [],
}

export default config

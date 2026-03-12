import type { Metadata } from 'next'
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import './globals.css'

export const metadata: Metadata = {
  title: 'CineGen — AI Live Event Background Generator',
  description: 'Generate and transform real-time AI video backgrounds for live events, churches, concerts, and more.',
  keywords: ['AI video', 'live event backgrounds', 'church visuals', 'ProPresenter', 'generative AI'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}

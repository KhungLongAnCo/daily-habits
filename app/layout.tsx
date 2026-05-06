import type { Metadata } from 'next'
import { Outfit, Syne } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const outfit = Outfit({ 
  subsets: ['latin'],
  variable: '--font-sans',
})

const syne = Syne({ 
  subsets: ['latin'],
  variable: '--font-heading',
})

export const metadata: Metadata = {
  title: 'Daily Habits | Future',
  description: 'Track your daily habits in style',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${outfit.variable} ${syne.variable} font-sans antialiased min-h-screen selection:bg-primary/30 selection:text-primary-foreground`}>
        {children}
        <Toaster theme="dark" className="!bg-black/50 !backdrop-blur-xl !border-white/10" />
      </body>
    </html>
  )
}

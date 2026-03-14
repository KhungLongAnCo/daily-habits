'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

type Props = {
  email: string | undefined
}

export function UserMenu({ email }: Props) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)

  const initial = email ? email[0].toUpperCase() : '?'
  const displayEmail = email ?? 'Unknown user'

  // Close on outside click
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [])

  // Close on Escape (only when open)
  useEffect(() => {
    if (!open) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open])

  function handleLogout() {
    startTransition(async () => {
      try {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/login')
      } catch {
        toast.error('Failed to log out. Please try again.')
      }
    })
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium hover:bg-muted/80 transition-colors"
        aria-label="User menu"
        aria-expanded={open}
      >
        {initial}
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-48 bg-background border border-border rounded-md shadow-md z-50 py-1">
          <div className="px-3 py-2 text-xs text-muted-foreground truncate">
            {displayEmail}
          </div>
          <div className="border-t border-border my-1" />
          <button
            onClick={handleLogout}
            disabled={isPending}
            className="w-full text-left px-3 py-2 text-sm text-destructive hover:bg-muted transition-colors disabled:opacity-50"
          >
            {isPending ? 'Logging out…' : 'Log out'}
          </button>
        </div>
      )}
    </div>
  )
}

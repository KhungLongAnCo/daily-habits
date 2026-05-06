'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="p-6 rounded-2xl bg-primary/10 border border-primary/20 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-10 h-10 text-primary mx-auto mb-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
        </svg>
        <p className="text-foreground font-medium">Link transmitted.</p>
        <p className="text-sm text-muted-foreground mt-2">Check your neural inbox to authenticate.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-3">
        <Label htmlFor="email" className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Identification</Label>
        <Input
          id="email"
          type="email"
          placeholder="user@network.local"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="bg-black/20 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-primary/50 focus-visible:border-primary h-12 px-4 rounded-xl transition-all duration-300 hover:bg-black/30"
        />
      </div>
      {error && (
        <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-in shake">
          {error}
        </div>
      )}
      <Button 
        type="submit" 
        className="w-full h-12 rounded-xl bg-white text-black hover:bg-white/90 font-bold tracking-wide transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:-translate-y-0.5 relative overflow-hidden group" 
        disabled={loading}
      >
        <span className="relative z-10">{loading ? 'Initiating...' : 'Authenticate'}</span>
        <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
      </Button>
    </form>
  )
}

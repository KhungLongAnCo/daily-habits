'use client'

import { useState, useTransition } from 'react'
import { createHabit } from '@/app/actions'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus } from 'lucide-react'

export function AddHabitForm() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    setError(null)
    startTransition(async () => {
      try {
        await createHabit(name.trim())
        setName('')
        setOpen(false)
      } catch {
        setError('Failed to deploy protocol. Please retry.')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button 
            className="group relative h-12 rounded-xl bg-primary/20 text-primary hover:bg-primary hover:text-primary-foreground border border-primary/30 transition-all duration-300 shadow-[0_0_15px_rgba(var(--primary),0.2)] hover:shadow-[0_0_25px_rgba(var(--primary),0.5)]"
          >
            <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
            <Plus size={18} className="mr-2 transition-transform duration-300 group-hover:rotate-90" />
            <span className="font-bold tracking-wide">New Protocol</span>
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md bg-black/60 backdrop-blur-2xl border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] !rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-heading font-bold text-gradient-primary">Initialize Protocol</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-3">
            <Label htmlFor="habit-name" className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
              Protocol Designation
            </Label>
            <Input
              id="habit-name"
              placeholder="e.g. Morning Meditation"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-primary/50 focus-visible:border-primary h-14 px-4 rounded-xl transition-all duration-300 hover:bg-white/10 text-lg"
            />
          </div>
          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-in shake">
              {error}
            </div>
          )}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="h-12 rounded-xl border-white/10 bg-transparent text-white hover:bg-white/10 transition-colors"
            >
              Abort
            </Button>
            <Button 
              type="submit" 
              disabled={!name.trim() || isPending}
              className="h-12 rounded-xl bg-white text-black hover:bg-white/90 font-bold tracking-wide transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)]"
            >
              {isPending ? 'Deploying...' : 'Deploy'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

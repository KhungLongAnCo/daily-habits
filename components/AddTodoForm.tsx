'use client'

import { useState, useTransition } from 'react'
import { createTodo } from '@/app/actions'
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
import { todayISO } from '@/lib/utils/dates'

export function AddTodoForm() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [dueDate, setDueDate] = useState(todayISO())
  const [dueTime, setDueTime] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !dueDate) return

    setError(null)
    startTransition(async () => {
      try {
        await createTodo(name.trim(), dueDate, dueTime || undefined)
        setName('')
        setDueTime('')
        setOpen(false)
      } catch {
        setError('Failed to deploy task. Please retry.')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button 
            className="group relative h-10 px-4 rounded-xl bg-secondary/20 text-secondary hover:bg-secondary hover:text-secondary-foreground border border-secondary/30 transition-all duration-300 shadow-[0_0_15px_rgba(var(--secondary),0.2)] hover:shadow-[0_0_25px_rgba(var(--secondary),0.5)]"
          >
            <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
            <Plus size={16} className="mr-2 transition-transform duration-300 group-hover:rotate-90" />
            <span className="font-bold tracking-wide">New Task</span>
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md bg-black/60 backdrop-blur-2xl border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] !rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-heading font-bold text-gradient-primary">Initialize Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-3">
            <Label htmlFor="todo-name" className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
              Task Designation
            </Label>
            <Input
              id="todo-name"
              placeholder="e.g. Call the matrix operator"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-secondary/50 focus-visible:border-secondary h-12 px-4 rounded-xl transition-all duration-300 hover:bg-white/10 text-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label htmlFor="todo-date" className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                Execution Date
              </Label>
              <Input
                id="todo-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
                className="bg-white/5 border-white/10 text-white focus-visible:ring-secondary/50 focus-visible:border-secondary h-12 px-4 rounded-xl transition-all duration-300 hover:bg-white/10"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="todo-time" className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                Execution Time (Optional)
              </Label>
              <Input
                id="todo-time"
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="bg-white/5 border-white/10 text-white focus-visible:ring-secondary/50 focus-visible:border-secondary h-12 px-4 rounded-xl transition-all duration-300 hover:bg-white/10 [color-scheme:dark]"
              />
            </div>
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
              disabled={!name.trim() || !dueDate || isPending}
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

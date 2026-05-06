'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createHabit(name: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('habits')
    .insert({ name, user_id: user.id })

  if (error) throw new Error(error.message)
  revalidatePath('/')
}

export async function deleteHabit(habitId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('habits')
    .delete()
    .eq('id', habitId)

  if (error) throw new Error(error.message)
  revalidatePath('/')
}

export async function toggleHabitLog(
  habitId: string,
  date: string
): Promise<void> {
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('habit_logs')
    .select('id')
    .eq('habit_id', habitId)
    .eq('date', date)
    .single()

  if (existing) {
    const { error } = await supabase
      .from('habit_logs')
      .delete()
      .eq('id', existing.id)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase
      .from('habit_logs')
      .insert({ habit_id: habitId, date })
    if (error) throw new Error(error.message)
  }

  revalidatePath('/')
}

export async function updateHabit(habitId: string, name: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const trimmed = name.trim()
  if (!trimmed) throw new Error('Habit name cannot be empty')

  const { error } = await supabase
    .from('habits')
    .update({ name: trimmed })
    .eq('id', habitId)

  if (error) throw new Error(error.message)
  revalidatePath('/')
}

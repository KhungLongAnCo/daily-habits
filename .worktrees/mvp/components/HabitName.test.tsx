import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HabitName } from './HabitName'

// Mock server actions
vi.mock('@/app/actions', () => ({
  updateHabit: vi.fn().mockResolvedValue(undefined),
  deleteHabit: vi.fn().mockResolvedValue(undefined),
}))

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: { error: vi.fn() },
}))

import { updateHabit, deleteHabit } from '@/app/actions'
import { toast } from 'sonner'

const habit = { id: 'habit-1', name: 'Read 30 min' }

beforeEach(() => {
  vi.clearAllMocks()
})

function setup() {
  const user = userEvent.setup()
  const result = render(<HabitName habit={habit} />)
  return { user, ...result }
}

describe('HabitName — idle state', () => {
  it('renders the habit name', () => {
    setup()
    expect(screen.getByText('Read 30 min')).toBeInTheDocument()
  })

  it('renders edit and delete buttons', () => {
    setup()
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
  })
})

describe('HabitName — editing state', () => {
  it('shows an input pre-filled with the habit name when edit is clicked', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: /edit/i }))
    expect(screen.getByRole('textbox')).toHaveValue('Read 30 min')
  })

  it('saves on Enter with a changed name', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: /edit/i }))
    const input = screen.getByRole('textbox')
    await user.clear(input)
    await user.type(input, 'Exercise')
    await user.keyboard('{Enter}')
    expect(updateHabit).toHaveBeenCalledWith('habit-1', 'Exercise')
  })

  it('saves on blur with a changed name', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: /edit/i }))
    const input = screen.getByRole('textbox')
    await user.clear(input)
    await user.type(input, 'Meditate')
    fireEvent.blur(input)
    await waitFor(() => expect(updateHabit).toHaveBeenCalledWith('habit-1', 'Meditate'))
  })

  it('does not call updateHabit if name is unchanged', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: /edit/i }))
    await user.keyboard('{Enter}')
    expect(updateHabit).not.toHaveBeenCalled()
  })

  it('does not call updateHabit if name is empty, reverts to original', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: /edit/i }))
    const input = screen.getByRole('textbox')
    await user.clear(input)
    await user.keyboard('{Enter}')
    expect(updateHabit).not.toHaveBeenCalled()
    expect(screen.getByText('Read 30 min')).toBeInTheDocument()
  })

  it('does not call updateHabit if name is whitespace only, reverts to original', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: /edit/i }))
    const input = screen.getByRole('textbox')
    await user.clear(input)
    await user.type(input, '   ')
    await user.keyboard('{Enter}')
    expect(updateHabit).not.toHaveBeenCalled()
    expect(screen.getByText('Read 30 min')).toBeInTheDocument()
  })

  it('cancels on Escape, reverts to original name', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: /edit/i }))
    const input = screen.getByRole('textbox')
    await user.clear(input)
    await user.type(input, 'Something else')
    await user.keyboard('{Escape}')
    expect(updateHabit).not.toHaveBeenCalled()
    expect(screen.getByText('Read 30 min')).toBeInTheDocument()
  })

  it('shows toast.error and returns to idle if updateHabit throws', async () => {
    vi.mocked(updateHabit).mockRejectedValueOnce(new Error('DB error'))
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: /edit/i }))
    const input = screen.getByRole('textbox')
    await user.clear(input)
    await user.type(input, 'New name')
    await user.keyboard('{Enter}')
    await waitFor(() => expect(toast.error).toHaveBeenCalled())
    expect(screen.getByText('Read 30 min')).toBeInTheDocument()
  })
})

describe('HabitName — confirming-delete state', () => {
  it('shows confirmation UI when delete is clicked', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: /delete/i }))
    expect(screen.getByText(/delete read 30 min/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /yes, delete/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  it('calls deleteHabit when "Yes, delete" is clicked', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: /delete/i }))
    await user.click(screen.getByRole('button', { name: /yes, delete/i }))
    expect(deleteHabit).toHaveBeenCalledWith('habit-1')
  })

  it('returns to idle on Cancel', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: /delete/i }))
    await user.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.getByText('Read 30 min')).toBeInTheDocument()
  })

  it('returns to idle on Escape', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: /delete/i }))
    await user.keyboard('{Escape}')
    expect(screen.getByText('Read 30 min')).toBeInTheDocument()
  })

  it('shows toast.error and returns to confirming-delete if deleteHabit throws', async () => {
    vi.mocked(deleteHabit).mockRejectedValueOnce(new Error('DB error'))
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: /delete/i }))
    await user.click(screen.getByRole('button', { name: /yes, delete/i }))
    await waitFor(() => expect(toast.error).toHaveBeenCalled())
    expect(screen.getByRole('button', { name: /yes, delete/i })).toBeInTheDocument()
  })
})

import { LoginForm } from '@/components/LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-sm space-y-6 p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Daily Habits</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to track your habits</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}

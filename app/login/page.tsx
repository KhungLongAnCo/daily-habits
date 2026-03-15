import { LoginForm } from '@/components/LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-violet-50 via-background to-indigo-50">
      <div className="w-full max-w-sm">
        <div className="bg-white/80 backdrop-blur-sm border border-border/50 rounded-2xl shadow-xl shadow-violet-100/50 p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-violet-500 to-indigo-600 flex items-center justify-center mx-auto shadow-md shadow-violet-200">
              <span className="text-white text-xl">✦</span>
            </div>
            <h1 className="text-2xl font-bold bg-linear-to-r from-violet-700 to-indigo-600 bg-clip-text text-transparent">
              Daily Habits
            </h1>
            <p className="text-sm text-muted-foreground">Sign in to track your habits</p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  )
}

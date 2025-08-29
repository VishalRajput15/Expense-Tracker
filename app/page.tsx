// Landing page: Login / Signup
"use client"

import AuthForm from "@/components/auth-form"
import { AuthProvider } from "@/hooks/use-auth"

export default function HomePage() {
  return (
    <AuthProvider>
      <main className="min-h-dvh flex items-center justify-center p-4">
        <AuthForm />
      </main>
    </AuthProvider>
  )
}

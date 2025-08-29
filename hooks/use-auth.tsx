// Auth context and hooks
"use client"

import type React from "react"

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { clearSession, getSession, login as loginLs, signup as signupLs } from "@/lib/local-storage"

type AuthContextValue = {
  user: string | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  signup: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setUser(getSession())
    setLoading(false)

    const onStorage = (e: StorageEvent) => {
      if (e.key === "et:session") setUser(getSession())
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      async login(username, password) {
        loginLs(username.trim(), password)
        setUser(username.trim())
      },
      async signup(username, password) {
        signupLs(username.trim(), password)
        setUser(username.trim())
      },
      logout() {
        clearSession()
        setUser(null)
      },
    }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}

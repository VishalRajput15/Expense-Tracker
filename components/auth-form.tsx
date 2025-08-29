"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

export default function AuthForm() {
  const router = useRouter()
  const { login, signup } = useAuth()
  const { toast } = useToast()
  const [loginState, setLoginState] = useState({ username: "", password: "" })
  const [signupState, setSignupState] = useState({ username: "", password: "" })
  const [loading, setLoading] = useState(false)

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(loginState.username, loginState.password)
      router.push("/dashboard")
    } catch (err: any) {
      toast({ title: "Login failed", description: err.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const onSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await signup(signupState.username, signupState.password)
      router.push("/dashboard")
    } catch (err: any) {
      toast({ title: "Signup failed", description: err.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-pretty">Expense Tracker</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="login">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign up</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form onSubmit={onLogin} className="flex flex-col gap-4 mt-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="login-username">Username</Label>
                <Input
                  id="login-username"
                  value={loginState.username}
                  onChange={(e) => setLoginState((s) => ({ ...s, username: e.target.value }))}
                  required
                  autoComplete="username"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  value={loginState.password}
                  onChange={(e) => setLoginState((s) => ({ ...s, password: e.target.value }))}
                  required
                  autoComplete="current-password"
                />
              </div>
              <Button disabled={loading} type="submit" className="w-full">
                {loading ? "Please wait…" : "Login"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={onSignup} className="flex flex-col gap-4 mt-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="signup-username">Username</Label>
                <Input
                  id="signup-username"
                  value={signupState.username}
                  onChange={(e) => setSignupState((s) => ({ ...s, username: e.target.value }))}
                  required
                  autoComplete="username"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  value={signupState.password}
                  onChange={(e) => setSignupState((s) => ({ ...s, password: e.target.value }))}
                  required
                  autoComplete="new-password"
                />
              </div>
              <Button disabled={loading} type="submit" className="w-full">
                {loading ? "Please wait…" : "Create account"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

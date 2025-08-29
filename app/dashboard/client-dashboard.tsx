// Dashboard page
"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { AuthProvider, useAuth } from "@/hooks/use-auth"
import { DashboardHeader } from "@/components/dashboard-header"
import { ExpenseForm } from "@/components/expense-form"
import { ExpensesTable } from "@/components/expenses-table"
import { Charts } from "@/components/charts"
import { FiltersBar, type Filters } from "@/components/filters-bar"
import { BudgetsPanel } from "@/components/budgets-panel"
import { AchievementsPanel } from "@/components/achievements-panel"
import { useExpenses, usePreferences, useBudgets } from "@/hooks/use-user-data"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent } from "@/components/ui/card"
import { formatAmount } from "@/lib/currency"
import { getCategoryMeta } from "@/lib/categories"
import type { Expense } from "@/lib/local-storage"

function DashboardContent() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const { expenses, runRecurringNow } = useExpenses(user)
  const { prefs } = usePreferences(user)
  const { budgets, calcSpent } = useBudgets(user)
  const { toast } = useToast()
  const [editing, setEditing] = useState<Expense | null>(null)
  const [filters, setFilters] = useState<Filters>({
    q: "",
    category: "all",
    from: "",
    to: "",
  })

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/")
    }
  }, [loading, user, router])

  useEffect(() => {
    if (!user) return
    runRecurringNow().catch(() => {})
  }, [user, runRecurringNow])

  // filter logic
  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      if (filters.q && !(e.description || "").toLowerCase().includes(filters.q.toLowerCase())) return false
      if (filters.category !== "all" && e.category !== filters.category) return false
      if (filters.from && e.date < filters.from) return false
      if (filters.to && e.date > filters.to) return false
      return true
    })
  }, [expenses, filters])

  // budget alerts (80% and 100%) once per month per budget
  useEffect(() => {
    if (!user || !budgets?.length) return
    const ym = new Date().toISOString().slice(0, 7)
    const key = (id: string, level: "80" | "100") => `et:alert:${user}:${ym}:${id}:${level}`
    budgets.forEach((b) => {
      const spent = b.type === "monthly" ? calcSpent() : calcSpent((b as any).category)
      const pct = b.amount > 0 ? spent / b.amount : 0
      if (pct >= 1 && !localStorage.getItem(key(b.id, "100"))) {
        localStorage.setItem(key(b.id, "100"), "1")
        toast({
          title: "Budget exceeded",
          description:
            b.type === "monthly"
              ? "You have exceeded your monthly budget."
              : `You have exceeded your ${getCategoryMeta((b as any).category).label} budget.`,
          variant: "destructive",
        })
      } else if (pct >= 0.8 && !localStorage.getItem(key(b.id, "80"))) {
        localStorage.setItem(key(b.id, "80"), "1")
        toast({
          title: "Budget alert",
          description:
            b.type === "monthly"
              ? "You have used 80% of your monthly budget."
              : `You have used 80% of your ${getCategoryMeta((b as any).category).label} budget.`,
        })
      }
    })
  }, [user, budgets, calcSpent, toast])

  const totals = useMemo(() => {
    const total = expenses.reduce((acc, e) => acc + e.amount, 0)
    const monthNow = new Date().toISOString().slice(0, 7) // YYYY-MM
    const totalThisMonth = expenses.filter((e) => e.date.slice(0, 7) === monthNow).reduce((acc, e) => acc + e.amount, 0)
    return { total, totalThisMonth }
  }, [expenses])

  const currency = prefs?.currency ?? "INR"

  if (loading || !user) {
    return <main className="p-4">Loading...</main>
  }

  return (
    <main className="p-4 max-w-5xl mx-auto flex flex-col gap-6">
      <DashboardHeader />
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-semibold">
              <span className="mr-1" aria-hidden="true">
                💰
              </span>
              {formatAmount(totals.total, currency)}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-xl bg-amber-50/60 dark:bg-amber-950/30">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">This Month</p>
            <p className="text-2xl font-semibold">{formatAmount(totals.totalThisMonth, currency)}</p>
          </CardContent>
        </Card>
      </section>

      <FiltersBar filters={filters} onChange={setFilters} />
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BudgetsPanel />
        <AchievementsPanel />
      </section>

      <ExpenseForm editExpense={editing} onDone={() => setEditing(null)} />
      <ExpensesTable onEdit={(e) => setEditing(e)} items={filtered} />
      <Charts items={filtered} />
    </main>
  )
}

export default function DashboardPage() {
  return (
    <AuthProvider>
      <DashboardContent />
    </AuthProvider>
  )
}

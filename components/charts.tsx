"use client"

import {
  Pie,
  PieChart,
  Cell,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  BarChart,
  XAxis,
  YAxis,
  Bar,
  CartesianGrid,
} from "recharts"
import { useAuth } from "@/hooks/use-auth"
import { useExpenses, usePreferences } from "@/hooks/use-user-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatAmount } from "@/lib/currency"
import { useMemo } from "react"
import { getCategoryMeta } from "@/lib/categories"
import type { Expense } from "@/lib/local-storage"

const COLORS = ["#2563eb", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#14b8a6", "#84cc16"]

export function Charts({ items }: { items?: Expense[] }) {
  const { user } = useAuth()
  const { expenses } = useExpenses(user)
  const { prefs } = usePreferences(user)
  const currency = prefs?.currency ?? "INR"
  const list = items ?? expenses

  const byCategory = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of list) {
      map.set(e.category, (map.get(e.category) || 0) + e.amount)
    }
    return Array.from(map.entries()).map(([cat, value]) => {
      const meta = getCategoryMeta(cat)
      return { name: meta.label, key: cat, emoji: meta.emoji, color: meta.color, value }
    })
  }, [list])

  const biggestCategory = useMemo(() => {
    return byCategory.reduce((acc, cur) => (cur.value > acc.value ? cur : acc), { name: "-", value: 0 } as any)
  }, [byCategory])

  const byMonth = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of list) {
      const d = new Date(e.date)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      map.set(key, (map.get(key) || 0) + e.amount)
    }
    const arr = Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, total]) => ({ month, total }))
    return arr
  }, [list])

  // comparison: this month vs last
  const { thisMonthTotal, lastMonthTotal, comparisonData, insight } = useMemo(() => {
    const now = new Date()
    const ymThis = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
    const last = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const ymLast = `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, "0")}`

    const thisMonthTotal = list.filter((e) => e.date.slice(0, 7) === ymThis).reduce((s, e) => s + e.amount, 0)
    const lastMonthTotal = list.filter((e) => e.date.slice(0, 7) === ymLast).reduce((s, e) => s + e.amount, 0)

    const comparisonData = [
      { label: "Last", total: lastMonthTotal },
      { label: "This", total: thisMonthTotal },
    ]

    let insight = "No change."
    if (lastMonthTotal > 0) {
      const diff = thisMonthTotal - lastMonthTotal
      const pct = Math.round((diff / lastMonthTotal) * 100)
      if (pct > 0) insight = `This month is ${pct}% higher than last month.`
      else if (pct < 0) insight = `This month is ${Math.abs(pct)}% lower than last month.`
      else insight = "This month matches last month."
    } else if (thisMonthTotal > 0) {
      insight = "Spending started this month (no data last month)."
    }

    return { thisMonthTotal, lastMonthTotal, comparisonData, insight }
  }, [list])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Pie by category */}
      <Card className="rounded-xl bg-sky-50/60 dark:bg-sky-950/30">
        <CardHeader>
          <CardTitle className="text-pretty">Spending by Category (Pie)</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={byCategory} dataKey="value" nameKey="name" outerRadius={90}>
                {byCategory.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <ReTooltip
                formatter={(value: any) => formatAmount(Number(value), currency)}
                labelFormatter={(_, payload) => {
                  const p = (payload?.[0]?.payload as any) || {}
                  return `${p.emoji ?? ""} ${p.name ?? ""}`
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <p className="text-sm text-muted-foreground mt-2">
            <span aria-hidden="true">👑 </span>
            Biggest category: <span className="font-medium">{biggestCategory?.name}</span> (
            {formatAmount(biggestCategory?.value ?? 0, currency)})
          </p>
        </CardContent>
      </Card>

      {/* Monthly trend bar */}
      <Card className="rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30">
        <CardHeader>
          <CardTitle className="text-pretty">Monthly Trend (Bar)</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byMonth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <ReTooltip formatter={(value: any) => formatAmount(Number(value), currency)} />
              <Bar dataKey="total" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Comparison + insight */}
      <Card className="rounded-xl md:col-span-2">
        <CardHeader>
          <CardTitle className="text-pretty">This Month vs Last (Comparison)</CardTitle>
        </CardHeader>
        <CardContent className="h-56">
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <ReTooltip formatter={(value: any) => formatAmount(Number(value), currency)} />
                <Bar dataKey="total" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-sm text-muted-foreground mt-3">{insight}</p>
        </CardContent>
      </Card>
    </div>
  )
}

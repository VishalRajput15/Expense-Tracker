"use client"
import { useAuth } from "@/hooks/use-auth"
import { useExpenses } from "@/hooks/use-user-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

function compute(expenses: { amount: number; date: string }[]) {
  const count = expenses.length
  const total = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0)
  const points = count * 10 + Math.floor(total / 1000) * 5
  const level = 1 + Math.floor(points / 100)
  const nextLevelAt = level * 100
  const progress = Math.min(100, Math.round((points / nextLevelAt) * 100))
  const badges = [
    { id: "first", label: "First Expense", earned: count >= 1 },
    { id: "habit", label: "7+ Expenses", earned: count >= 7 },
    { id: "spender", label: "Spent 5k+", earned: total >= 5000 },
  ]
  return { points, level, progress, badges }
}

export function AchievementsPanel() {
  const { user } = useAuth()
  const { expenses } = useExpenses(user)
  const stats = compute(expenses)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Achievements</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span>Level</span>
          <span className="font-semibold">{stats.level}</span>
        </div>
        <Progress value={stats.progress} />
        <div className="flex items-center justify-between text-sm">
          <span>Points</span>
          <span className="font-semibold">{stats.points}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {stats.badges.map((b) => (
            <span
              key={b.id}
              className={`rounded-full border px-2 py-1 text-xs ${b.earned ? "bg-green-600 text-white border-transparent" : "text-muted-foreground"}`}
            >
              {b.label}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@/hooks/use-auth"
import { useBudgets, usePreferences } from "@/hooks/use-user-data"
import { CATEGORY_OPTIONS, getCategoryMeta } from "@/lib/categories"
import { formatAmount } from "@/lib/currency"

export function BudgetsPanel() {
  const { user } = useAuth()
  const { budgets, add, remove, calcSpent } = useBudgets(user)
  const { prefs } = usePreferences(user)
  const [type, setType] = useState<"monthly" | "category">("monthly")
  const [category, setCategory] = useState<string>("Food")
  const [amount, setAmount] = useState<number>(0)

  const currency = prefs?.currency ?? "INR"
  const items = budgets || []

  return (
    <Card className="rounded-xl">
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base md:text-lg font-semibold">Budgets</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          <div className="flex flex-col gap-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v: "monthly" | "category") => setType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly total</SelectItem>
                <SelectItem value="category">Per category</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {type === "category" && (
            <div className="flex flex-col gap-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((c) => (
                    <SelectItem key={c} value={c}>
                      <span className="inline-flex items-center gap-2">
                        <span aria-hidden="true">{getCategoryMeta(c).emoji}</span>
                        <span>{getCategoryMeta(c).label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Label>Amount</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={amount || ""}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
          </div>
          <div className="md:col-span-3">
            <Button
              className="rounded-lg"
              onClick={async () => {
                if (!amount || amount <= 0) return
                await add(type === "monthly" ? ({ type, amount } as any) : ({ type, category, amount } as any))
                setAmount(0)
              }}
            >
              Add budget
            </Button>
          </div>
        </div>

        {!items.length ? (
          <p className="text-sm text-muted-foreground">No budgets yet. Create one above.</p>
        ) : (
          <div className="space-y-4">
            {items.map((b) => {
              const spent = b.type === "monthly" ? calcSpent() : calcSpent(b.category)
              const pct = b.amount > 0 ? Math.min(100, Math.round((spent / b.amount) * 100)) : 0
              return (
                <div key={b.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">
                      {b.type === "monthly" ? "Monthly total" : `Category: ${getCategoryMeta(b.category).label}`}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatAmount(spent, currency)} / {formatAmount(b.amount, currency)}
                    </div>
                  </div>
                  <Progress className="mt-2" value={pct} />
                  <div className="mt-2 text-xs text-muted-foreground">{pct}%</div>
                  <div className="mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg bg-transparent"
                      onClick={() => remove(b.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

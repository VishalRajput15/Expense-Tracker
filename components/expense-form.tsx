"use client"

import type React from "react"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/hooks/use-auth"
import { useExpenses, usePreferences } from "@/hooks/use-user-data"
import { useToast } from "@/hooks/use-toast"
import { useRecurring } from "@/hooks/use-user-data"
import type { Expense } from "@/lib/local-storage"
import { currencySymbols } from "@/lib/currency"
import { getCategoryMeta, CATEGORY_OPTIONS } from "@/lib/categories"
import VoiceCapture from "@/components/voice-capture"

type Props = {
  editExpense?: Expense | null
  onDone?: () => void
}

export function ExpenseForm({ editExpense, onDone }: Props) {
  const { user } = useAuth()
  const { add, update } = useExpenses(user)
  const { prefs } = usePreferences(user)
  const { toast } = useToast()
  const { add: addRecurringTemplate } = useRecurring(user)

  const [amount, setAmount] = useState<number>(0)
  const [category, setCategory] = useState<string>("Food")
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10))
  const [description, setDescription] = useState<string>("")
  const [tagsInput, setTagsInput] = useState<string>("")
  const [splitEnabled, setSplitEnabled] = useState<boolean>(false)
  const [splits, setSplits] = useState<{ who: string; share: number }[]>([{ who: "", share: 0 }])
  const [recurringEnabled, setRecurringEnabled] = useState<boolean>(false)
  const [dayOfMonth, setDayOfMonth] = useState<number>(() => Number(new Date().toISOString().slice(8, 10)))

  useEffect(() => {
    if (editExpense) {
      setAmount(editExpense.amount)
      setCategory(editExpense.category)
      setDate(editExpense.date)
      setDescription(editExpense.description ?? "")
      setTagsInput(editExpense.tags?.join(", ") ?? "")
      if (editExpense.split?.length) {
        setSplitEnabled(true)
        setSplits(editExpense.split.map((s) => ({ who: s.who, share: s.share })))
      } else {
        setSplitEnabled(false)
        setSplits([{ who: "", share: 0 }])
      }
      setRecurringEnabled(false)
      setDayOfMonth(Number(editExpense.date.slice(8, 10)))
    }
  }, [editExpense])

  const currency = prefs?.currency ?? "INR"
  const threshold = prefs?.threshold ?? 5000
  const isEditing = !!editExpense

  const canSubmit = useMemo(() => amount > 0 && category && date, [amount, category, date])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return

    const tags =
      tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean) || undefined
    const split = splitEnabled
      ? splits
          .map((s) => ({ who: s.who.trim(), share: Number(s.share) }))
          .filter((s) => s.who && Number.isFinite(s.share) && s.share > 0)
      : undefined

    if (isEditing && editExpense) {
      await update(editExpense.id, { amount, category, date, description, tags, split })
      toast({ title: "Expense updated" })
    } else {
      await add({ amount, category, date, description, tags, split })
      if (recurringEnabled) {
        await addRecurringTemplate({
          amount,
          category,
          description,
          dayOfMonth: Number.isFinite(dayOfMonth) && dayOfMonth > 0 ? dayOfMonth : Number(date.slice(8, 10)),
          tags,
          split,
          enabled: true,
        })
      }
      if (amount >= threshold) {
        toast({
          title: "High expense alert",
          description: `This expense is >= ${currencySymbols[currency]}${threshold}`,
          variant: "destructive",
        })
      } else {
        toast({ title: "Expense added" })
      }
    }
    if (!isEditing) {
      setAmount(0)
      setCategory("Food")
      setDate(new Date().toISOString().slice(0, 10))
      setDescription("")
      setTagsInput("")
      setSplitEnabled(false)
      setSplits([{ who: "", share: 0 }])
      setRecurringEnabled(false)
      setDayOfMonth(Number(new Date().toISOString().slice(8, 10)))
    }
    onDone?.()
  }

  // helper: try to map a parsed category string to one of our options
  function resolveCategory(name?: string) {
    if (!name) return null
    const normalized = name.trim().toLowerCase()
    const exact = CATEGORY_OPTIONS.find((c) => c.toLowerCase() === normalized)
    if (exact) return exact
    // loose match by startsWith
    const loose = CATEGORY_OPTIONS.find((c) => c.toLowerCase().startsWith(normalized))
    return loose || null
  }

  return (
    <Card className="rounded-xl">
      <CardContent className="pt-6">
        {/* add a small toolbar with voice capture */}
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Add a new expense</p>
          <VoiceCapture
            onResult={(r) => {
              if (typeof r.amount === "number" && Number.isFinite(r.amount)) setAmount(r.amount)
              const mapped = resolveCategory(r.category)
              if (mapped) setCategory(mapped)
              if (r.description) setDescription(r.description)
            }}
          />
        </div>

        <form onSubmit={onSubmit} className="grid md:grid-cols-5 gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              min={0}
              step="0.01"
              value={amount || ""}
              onChange={(e) => setAmount(Number(e.target.value))}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select category">
                  {getCategoryMeta(category).emoji} {getCategoryMeta(category).label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((c) => {
                  const meta = getCategoryMeta(c)
                  return (
                    <SelectItem key={c} value={c}>
                      <span className="inline-flex items-center gap-2">
                        <span aria-hidden="true">{meta.emoji}</span>
                        <span>{meta.label}</span>
                      </span>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="date">Date</Label>
            <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div className="md:col-span-2 flex flex-col gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional"
              className="h-10"
            />
          </div>
          <div className="md:col-span-5 flex flex-col gap-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              placeholder="Comma-separated (e.g. office, groceries)"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Example: food, office, shared</p>
          </div>

          <div className="md:col-span-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Input
                id="split-toggle"
                type="checkbox"
                checked={splitEnabled}
                onChange={(e) => setSplitEnabled(e.target.checked)}
                className="w-4 h-4"
                aria-label="Enable split shares"
              />
              <Label htmlFor="split-toggle">Split this expense</Label>
            </div>

            {!isEditing && (
              <div className="flex items-center gap-2">
                <Input
                  id="recurring-toggle"
                  type="checkbox"
                  checked={recurringEnabled}
                  onChange={(e) => setRecurringEnabled(e.target.checked)}
                  className="w-4 h-4"
                  aria-label="Make this a monthly recurring expense"
                />
                <Label htmlFor="recurring-toggle">Make monthly recurring</Label>
                <div className="flex items-center gap-2">
                  <Label htmlFor="dom" className="text-sm">
                    Day
                  </Label>
                  <Input
                    id="dom"
                    type="number"
                    min={1}
                    max={31}
                    className="w-20"
                    value={dayOfMonth}
                    onChange={(e) => setDayOfMonth(Number(e.target.value || 1))}
                    disabled={!recurringEnabled}
                  />
                </div>
              </div>
            )}
          </div>

          {splitEnabled && (
            <div className="md:col-span-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {splits.map((row, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      aria-label={`Person ${idx + 1} name`}
                      placeholder="Name"
                      value={row.who}
                      onChange={(e) => {
                        const next = [...splits]
                        next[idx] = { ...next[idx], who: e.target.value }
                        setSplits(next)
                      }}
                    />
                    <Input
                      aria-label={`Person ${idx + 1} share`}
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="Share"
                      value={row.share || ""}
                      onChange={(e) => {
                        const next = [...splits]
                        next[idx] = { ...next[idx], share: Number(e.target.value) }
                        setSplits(next)
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-lg bg-transparent"
                      onClick={() => setSplits((s) => s.filter((_, i) => i !== idx))}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex items-center justify-between">
                <Button
                  type="button"
                  variant="secondary"
                  className="rounded-lg"
                  onClick={() => setSplits((s) => [...s, { who: "", share: 0 }])}
                >
                  Add person
                </Button>
                <p className="text-xs text-muted-foreground">
                  Optional. You can assign per-person shares. This does not need to sum exactly to the total.
                </p>
              </div>
            </div>
          )}

          <div className="md:col-span-5">
            <Button
              type="submit"
              disabled={!canSubmit}
              className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700"
            >
              <span className="mr-2" aria-hidden="true">
                {isEditing ? "✏️" : "➕"}
              </span>
              {isEditing ? "Update expense" : "Add expense"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

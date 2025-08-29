// Local Storage "backend" with per-user namespacing
"use client"

import type { CurrencyCode } from "@/lib/currency"

export type Expense = {
  id: string
  amount: number
  category: string
  date: string // ISO date YYYY-MM-DD
  description?: string
  tags?: string[]
  split?: { who: string; share: number }[]
  createdAt: string // ISO datetime
}

export type Preferences = {
  currency: CurrencyCode
  threshold: number // alert threshold in selected currency units
  theme?: "light" | "dark" | "system"
}

export type RecurringTemplate = {
  id: string
  amount: number
  category: string
  description?: string
  dayOfMonth: number // 1-31
  tags?: string[]
  split?: { who: string; share: number }[]
  enabled: boolean
  lastRunMonth?: string // YYYY-MM
}

export type Budget =
  | {
      id: string
      type: "monthly"
      amount: number
      // applies to current month; persisted once, reused each month
      createdAt: string
    }
  | {
      id: string
      type: "category"
      category: string
      amount: number
      createdAt: string
    }

export type UserData = {
  expenses: Expense[]
  preferences: Preferences
  recurringTemplates?: RecurringTemplate[]
  budgets?: Budget[]
}

const AUTH_KEY = (u: string) => `et:auth:${u}`
const USER_KEY = (u: string) => `et:user:${u}`
const SESSION_KEY = "et:session"

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}
function write<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function getSession(): string | null {
  try {
    return localStorage.getItem(SESSION_KEY)
  } catch {
    return null
  }
}
export function setSession(username: string) {
  localStorage.setItem(SESSION_KEY, username)
}
export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}

export function usernameExists(username: string) {
  return !!read<{ password: string }>(AUTH_KEY(username))
}

export function signup(username: string, password: string) {
  if (usernameExists(username)) throw new Error("Username already exists")
  write(AUTH_KEY(username), { password })
  const defaultData: UserData = {
    expenses: [],
    preferences: { currency: "INR", threshold: 5000, theme: "system" },
    recurringTemplates: [],
    budgets: [],
  }
  write(USER_KEY(username), defaultData)
  setSession(username)
}

export function login(username: string, password: string) {
  const creds = read<{ password: string }>(AUTH_KEY(username))
  if (!creds || creds.password !== password) throw new Error("Invalid username or password")
  setSession(username)
}

export function getUserData(username: string): UserData {
  const data = read<UserData>(USER_KEY(username))
  if (!data) {
    const fallback: UserData = {
      expenses: [],
      preferences: { currency: "INR", threshold: 5000, theme: "system" },
      recurringTemplates: [],
      budgets: [],
    }
    write(USER_KEY(username), fallback)
    return fallback
  }
  if (!Array.isArray(data.recurringTemplates)) data.recurringTemplates = []
  if (!Array.isArray(data.budgets)) data.budgets = []
  write(USER_KEY(username), data)
  return data
}
export function setUserData(username: string, data: UserData) {
  write(USER_KEY(username), data)
}

export function addExpense(username: string, exp: Omit<Expense, "id" | "createdAt">): Expense {
  const data = getUserData(username)
  const newExp: Expense = {
    ...exp,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  }
  data.expenses.unshift(newExp)
  setUserData(username, data)
  return newExp
}
export function updateExpense(
  username: string,
  expId: string,
  patch: Partial<Omit<Expense, "id" | "createdAt">>,
): Expense | null {
  const data = getUserData(username)
  const idx = data.expenses.findIndex((e) => e.id === expId)
  if (idx === -1) return null
  const updated: Expense = { ...data.expenses[idx], ...patch }
  data.expenses[idx] = updated
  setUserData(username, data)
  return updated
}
export function deleteExpense(username: string, expId: string) {
  const data = getUserData(username)
  data.expenses = data.expenses.filter((e) => e.id !== expId)
  setUserData(username, data)
}

export function getPreferences(username: string): Preferences {
  return getUserData(username).preferences
}
export function setPreferences(username: string, prefs: Partial<Preferences>) {
  const data = getUserData(username)
  data.preferences = { ...data.preferences, ...prefs }
  setUserData(username, data)
}

export function mergeExpenses(username: string, incoming: Expense[]) {
  const data = getUserData(username)
  const byId = new Map<string, Expense>()
  for (const e of data.expenses) byId.set(e.id, e)
  for (const e of incoming) {
    const id = e.id || crypto.randomUUID()
    const normalized: Expense = {
      id,
      amount: Number(e.amount),
      category: e.category || "Other",
      date: e.date || new Date().toISOString().slice(0, 10),
      description: e.description || "",
      tags: Array.isArray(e.tags)
        ? e.tags.map((t) => String(t)).filter(Boolean)
        : typeof (e as any).tags === "string"
          ? String((e as any).tags)
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : undefined,
      split: Array.isArray(e.split)
        ? e.split
            .map((s: any) => ({ who: String(s.who ?? ""), share: Number(s.share) }))
            .filter((s) => s.who && Number.isFinite(s.share))
        : undefined,
      createdAt: e.createdAt || new Date().toISOString(),
    }
    byId.set(id, normalized)
  }
  const merged = Array.from(byId.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  data.expenses = merged
  setUserData(username, data)
  return merged.length
}

export function addRecurringTemplate(
  username: string,
  tpl: Omit<RecurringTemplate, "id" | "enabled" | "lastRunMonth"> & { enabled?: boolean },
) {
  const data = getUserData(username)
  const newTpl: RecurringTemplate = {
    id: crypto.randomUUID(),
    amount: tpl.amount,
    category: tpl.category,
    description: tpl.description,
    dayOfMonth: Math.min(Math.max(Number(tpl.dayOfMonth) || 1, 1), 31),
    tags: tpl.tags?.filter(Boolean),
    split: tpl.split,
    enabled: tpl.enabled ?? true,
    lastRunMonth: undefined,
  }
  data.recurringTemplates = data.recurringTemplates || []
  data.recurringTemplates.push(newTpl)
  setUserData(username, data)
  return newTpl
}

function daysInMonth(year: number, monthIndexZeroBased: number) {
  return new Date(year, monthIndexZeroBased + 1, 0).getDate()
}

export function runRecurring(username: string) {
  const data = getUserData(username)
  const tpls = data.recurringTemplates || []
  if (!tpls.length) return 0
  const now = new Date()
  const ym = now.toISOString().slice(0, 7) // YYYY-MM
  let created = 0
  for (const t of tpls) {
    if (!t.enabled) continue
    if (t.lastRunMonth === ym) continue
    const year = now.getFullYear()
    const monthIdx = now.getMonth()
    const dom = Math.min(t.dayOfMonth, daysInMonth(year, monthIdx))
    const date = new Date(year, monthIdx, dom).toISOString().slice(0, 10)
    const exp: Omit<Expense, "id" | "createdAt"> = {
      amount: t.amount,
      category: t.category,
      description: t.description,
      date,
      tags: t.tags,
      split: t.split,
    }
    addExpense(username, exp)
    t.lastRunMonth = ym
    created++
  }
  setUserData(username, data)
  return created
}

export function getBudgets(username: string): Budget[] {
  return getUserData(username).budgets || []
}
export function setBudgets(username: string, budgets: Budget[]) {
  const data = getUserData(username)
  data.budgets = budgets
  setUserData(username, data)
}
export function addBudget(
  username: string,
  budget:
    | Omit<Extract<Budget, { type: "monthly" }>, "id" | "createdAt">
    | Omit<Extract<Budget, { type: "category" }>, "id" | "createdAt">,
): Budget {
  const data = getUserData(username)
  const b: Budget =
    (budget as any).type === "category"
      ? {
          id: crypto.randomUUID(),
          type: "category",
          category: (budget as any).category,
          amount: budget.amount,
          createdAt: new Date().toISOString(),
        }
      : {
          id: crypto.randomUUID(),
          type: "monthly",
          amount: (budget as any).amount,
          createdAt: new Date().toISOString(),
        }
  data.budgets = data.budgets || []
  data.budgets.push(b)
  setUserData(username, data)
  return b
}
export function updateBudget(username: string, id: string, patch: Partial<Budget>): Budget | null {
  const data = getUserData(username)
  const idx = (data.budgets || []).findIndex((b) => b.id === id)
  if (idx === -1) return null
  const prev = data.budgets![idx]
  data.budgets![idx] = { ...prev, ...patch }
  setUserData(username, data)
  return data.budgets![idx]
}
export function deleteBudget(username: string, id: string) {
  const data = getUserData(username)
  data.budgets = (data.budgets || []).filter((b) => b.id !== id)
  setUserData(username, data)
}

export function spentThisMonth(username: string, category?: string) {
  const data = getUserData(username)
  const ym = new Date().toISOString().slice(0, 7)
  const list = data.expenses.filter((e) => e.date.slice(0, 7) === ym && (!category || e.category === category))
  return list.reduce((acc, e) => acc + e.amount, 0)
}

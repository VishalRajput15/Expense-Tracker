// SWR-based hooks for user data from localStorage
"use client"

import useSWR, { mutate as globalMutate } from "swr"
import {
  type Expense,
  addExpense,
  deleteExpense,
  getPreferences,
  getUserData,
  setPreferences,
  updateExpense,
  mergeExpenses,
  type Expense as ExpenseType,
  addRecurringTemplate,
  runRecurring,
  type RecurringTemplate,
  getBudgets,
  addBudget,
  updateBudget,
  deleteBudget,
  spentThisMonth,
  type Budget,
} from "@/lib/local-storage"

export function useUserData(username: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    username ? `et:user:${username}` : null,
    () => (username ? getUserData(username) : null),
    { revalidateOnFocus: false },
  )
  return { data, error, isLoading, mutate }
}

export function usePreferences(username: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    username ? `et:user:${username}:prefs` : null,
    () => (username ? getPreferences(username) : null),
    { revalidateOnFocus: false },
  )
  return {
    prefs: data,
    error,
    isLoading,
    async update(patch: Partial<ReturnType<typeof getPreferences>>) {
      if (!username) return
      setPreferences(username, patch)
      await Promise.all([globalMutate(`et:user:${username}`), mutate()])
    },
  }
}

export function useExpenses(username: string | null) {
  const key = username ? `et:user:${username}` : null
  const { data, error, isLoading, mutate } = useSWR(key, () => (username ? getUserData(username) : null), {
    revalidateOnFocus: false,
  })

  return {
    expenses: data?.expenses ?? [],
    error,
    isLoading,
    async add(exp: Omit<Expense, "id" | "createdAt">) {
      if (!username) return
      addExpense(username, exp)
      await mutate()
    },
    async update(id: string, patch: Partial<Omit<Expense, "id" | "createdAt">>) {
      if (!username) return
      updateExpense(username, id, patch)
      await mutate()
    },
    async remove(id: string) {
      if (!username) return
      deleteExpense(username, id)
      await mutate()
    },
    async importExpenses(list: ExpenseType[]) {
      if (!username || !list?.length) return
      mergeExpenses(username, list)
      await mutate()
    },
    async runRecurringNow() {
      if (!username) return 0
      const n = runRecurring(username)
      await mutate()
      return n
    },
    mutate,
  }
}

export function useRecurring(username: string | null) {
  const key = username ? `et:user:${username}` : null
  const { data, mutate } = useSWR(key, () => (username ? getUserData(username) : null), {
    revalidateOnFocus: false,
  })
  return {
    templates: data?.recurringTemplates ?? [],
    async add(tpl: Omit<RecurringTemplate, "id" | "enabled" | "lastRunMonth"> & { enabled?: boolean }) {
      if (!username) return
      addRecurringTemplate(username, tpl)
      await mutate()
    },
    async run() {
      if (!username) return 0
      const n = runRecurring(username)
      await mutate()
      return n
    },
  }
}

export function useBudgets(username: string | null) {
  const key = username ? `et:user:${username}:budgets` : null
  const { data, mutate } = useSWR(key, () => (username ? getBudgets(username) : null), {
    revalidateOnFocus: false,
  })
  return {
    budgets: (data as Budget[]) || [],
    async add(b: Omit<Budget, "id" | "createdAt">) {
      if (!username) return
      addBudget(username, b as any)
      await mutate()
    },
    async update(id: string, patch: Partial<Budget>) {
      if (!username) return
      updateBudget(username, id, patch)
      await mutate()
    },
    async remove(id: string) {
      if (!username) return
      deleteBudget(username, id)
      await mutate()
    },
    calcSpent(category?: string) {
      if (!username) return 0
      return spentThisMonth(username, category)
    },
    mutate,
  }
}

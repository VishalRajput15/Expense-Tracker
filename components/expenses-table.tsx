"use client"
import { useAuth } from "@/hooks/use-auth"
import { useExpenses, usePreferences } from "@/hooks/use-user-data"
import { formatAmount } from "@/lib/currency"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Expense } from "@/lib/local-storage"
import { getCategoryMeta } from "@/lib/categories"
import { Badge } from "@/components/ui/badge"

type Props = {
  onEdit: (exp: Expense) => void
  items?: Expense[]
}

export function ExpensesTable({ onEdit, items }: Props) {
  const { user } = useAuth()
  const { expenses, remove } = useExpenses(user)
  const { prefs } = usePreferences(user)

  const list = items ?? expenses

  if (!list.length) {
    return <p className="text-sm text-muted-foreground">No expenses yet.</p>
  }

  const currency = prefs?.currency ?? "INR"
  const threshold = prefs?.threshold ?? 5000

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Amount</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.map((e) => {
            const meta = getCategoryMeta(e.category)
            const isHigh = e.amount >= threshold
            return (
              <TableRow key={e.id}>
                <TableCell>
                  <span
                    className={
                      isHigh ? "font-bold text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
                    }
                  >
                    {isHigh && <span aria-hidden="true">⚠️ </span>}
                    {formatAmount(e.amount, currency)}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-2">
                    <span aria-hidden="true">{meta.emoji}</span>
                    <span>{meta.label}</span>
                  </span>
                </TableCell>
                <TableCell>{e.date}</TableCell>
                <TableCell className="max-w-[320px]">
                  <div className="truncate">{e.description}</div>
                  {(e.tags?.length || e.split?.length) && (
                    <div className="mt-1 space-y-1">
                      {e.tags?.length ? (
                        <div className="flex flex-wrap gap-1">
                          {e.tags.map((t) => (
                            <Badge key={t} variant="secondary" className="rounded-md">
                              {t}
                            </Badge>
                          ))}
                        </div>
                      ) : null}
                      {e.split?.length ? (
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          {e.split.map((s, i) => (
                            <span key={i}>
                              {s.who}: {formatAmount(s.share, currency)}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEdit(e)}
                      aria-label="Edit"
                      className="rounded-lg hover:bg-muted"
                    >
                      <span className="mr-1" aria-hidden="true">
                        ✏️
                      </span>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => remove(e.id)}
                      aria-label="Delete"
                      className="rounded-lg"
                    >
                      <span className="mr-1" aria-hidden="true">
                        🗑️
                      </span>
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

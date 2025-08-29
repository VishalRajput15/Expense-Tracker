"use client"

import type { Expense } from "@/lib/local-storage"

const csvEscape = (val: unknown) => {
  const s = String(val ?? "")
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function expensesToCSV(expenses: any[]) {
  const headers = ["id", "amount", "category", "date", "description", "createdAt", "tags", "split"]
  const rows = expenses.map((e) =>
    [
      e.id,
      e.amount,
      e.category,
      e.date,
      e.description ?? "",
      e.createdAt,
      Array.isArray(e.tags) ? e.tags.join("|") : "",
      Array.isArray(e.split) ? JSON.stringify(e.split) : "",
    ]
      .map(csvEscape)
      .join(","),
  )
  return [headers.join(","), ...rows].join("\n")
}

function parseCSVLine(line: string) {
  const out: string[] = []
  let cur = ""
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"'
        i++
      } else if (ch === '"') {
        inQuotes = false
      } else {
        cur += ch
      }
    } else {
      if (ch === '"') inQuotes = true
      else if (ch === ",") {
        out.push(cur)
        cur = ""
      } else {
        cur += ch
      }
    }
  }
  out.push(cur)
  return out
}

export function expensesFromCSV(csv: string) {
  const lines = csv.trim().split(/\r?\n/)
  if (lines.length <= 1) return []
  const header = lines[0].split(",").map((h) => h.trim())
  const idx = Object.fromEntries(header.map((h) => [h, header.indexOf(h)])) as Record<string, number>
  const records = []
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i])
    const get = (k: string) => (idx[k] >= 0 ? (cols[idx[k]] ?? "") : "")
    const amount = Number(get("amount"))
    if (!Number.isFinite(amount)) continue
    const tagsRaw = get("tags")
    const splitRaw = get("split")
    records.push({
      id: get("id") || crypto.randomUUID(),
      amount,
      category: get("category") || "Other",
      date: get("date") || new Date().toISOString().slice(0, 10),
      description: get("description") || "",
      createdAt: get("createdAt") || new Date().toISOString(),
      tags: tagsRaw
        ? String(tagsRaw)
            .split("|")
            .map((t) => t.trim())
            .filter(Boolean)
        : undefined,
      split: splitRaw ? JSON.parse(splitRaw) : undefined,
    })
  }
  return records
}

export function expensesToJSON(expenses: any[]) {
  return JSON.stringify(expenses, null, 2)
}

export function expensesFromJSON(json: string): Expense[] {
  const arr = JSON.parse(json)
  if (!Array.isArray(arr)) return []
  return arr
    .map((e: any) => ({
      id: e?.id || crypto.randomUUID(),
      amount: Number(e?.amount),
      category: String(e?.category ?? "Other"),
      date: String(e?.date ?? new Date().toISOString().slice(0, 10)),
      description: e?.description ? String(e.description) : "",
      createdAt: String(e?.createdAt ?? new Date().toISOString()),
      tags: Array.isArray(e?.tags) ? e.tags : undefined,
      split: Array.isArray(e?.split) ? e.split : undefined,
    }))
    .filter((e: Expense) => Number.isFinite(e.amount))
}

export function downloadBlob(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

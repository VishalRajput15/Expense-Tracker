"use client"

import { useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { CATEGORY_OPTIONS, getCategoryMeta } from "@/lib/categories"

export type Filters = {
  q: string
  category: string | "all"
  from: string
  to: string
}

type Props = {
  filters: Filters
  onChange: (next: Filters) => void
}

export function FiltersBar({ filters, onChange }: Props) {
  const categories = useMemo(() => ["all", ...CATEGORY_OPTIONS] as const, [])

  return (
    <Card className="rounded-xl">
      <CardContent className="pt-6">
        <div className="grid md:grid-cols-4 gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="q">Search</Label>
            <Input
              id="q"
              placeholder="Keyword in description"
              value={filters.q}
              onChange={(e) => onChange({ ...filters, q: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="category">Category</Label>
            <Select value={filters.category} onValueChange={(v: any) => onChange({ ...filters, category: v })}>
              <SelectTrigger id="category">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) =>
                  c === "all" ? (
                    <SelectItem key="all" value="all">
                      All
                    </SelectItem>
                  ) : (
                    <SelectItem key={c} value={c}>
                      <span className="inline-flex items-center gap-2">
                        <span aria-hidden="true">{getCategoryMeta(c).emoji}</span>
                        <span>{getCategoryMeta(c).label}</span>
                      </span>
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="from">From</Label>
            <Input
              id="from"
              type="date"
              value={filters.from}
              onChange={(e) => onChange({ ...filters, from: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="to">To</Label>
            <Input
              id="to"
              type="date"
              value={filters.to}
              onChange={(e) => onChange({ ...filters, to: e.target.value })}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

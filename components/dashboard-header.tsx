"use client"

import { useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useExpenses, usePreferences } from "@/hooks/use-user-data"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import { expensesToCSV, expensesToJSON, downloadBlob } from "@/lib/export"

// shadcn ui
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function DashboardHeader() {
  const { user, logout } = useAuth()
  const { prefs, update } = usePreferences(user)
  const { expenses } = useExpenses(user)
  const { setTheme, resolvedTheme, theme } = useTheme()
  const locale = (prefs as any)?.locale ?? "en"

  useEffect(() => {
    if (prefs?.theme && prefs.theme !== theme) setTheme(prefs.theme)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefs?.theme])

  function handleExportCSV() {
    if (!user) return
    const csv = expensesToCSV(expenses)
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")
    downloadBlob(`expenses-${user}-${stamp}.csv`, "\ufeff" + csv, "text/csv;charset=utf-8")
  }

  function handleExportJSON() {
    if (!user) return
    const json = expensesToJSON(expenses)
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")
    downloadBlob(`expenses-${user}-${stamp}.json`, json, "application/json;charset=utf-8")
  }

  const isDark = (resolvedTheme ?? theme) === "dark"

  return (
    <header className="w-full border-b bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        {/* Left: Logo + Title */}
        <div className="flex min-w-0 items-center gap-3">
          <div aria-hidden="true" className="h-8 w-8 rounded-md bg-blue-600 dark:bg-blue-500" />
          <span className="truncate text-base font-semibold md:text-lg">Expense Tracker</span>
        </div>

        {/* Right: Icon Controls */}
        <nav className="flex flex-wrap items-center gap-2">
          {/* Theme toggle */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                  className="h-9 w-9 rounded-lg transition-transform hover:scale-105 hover:bg-muted"
                  onClick={() => {
                    const next = isDark ? "light" : "dark"
                    setTheme(next)
                    if (user) update({ theme: next as "light" | "dark" })
                  }}
                  title=""
                >
                  <span aria-hidden="true" className="text-lg">
                    {isDark ? "☀️" : "🌙"}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{isDark ? "Light mode" : "Dark mode"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Download dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Download expenses"
                className="h-9 w-9 rounded-lg transition-transform hover:scale-105 hover:bg-muted"
              >
                <span aria-hidden="true" className="text-lg">
                  ⬇️
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[160px]">
              <DropdownMenuItem onClick={handleExportCSV}>Download CSV</DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportJSON}>Download JSON</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Language dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 rounded-lg px-2 text-xs font-medium transition-transform hover:scale-105 hover:bg-muted"
                aria-label="Language"
              >
                {locale.toUpperCase()}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => user && update({ locale: "en" as any })}>English</DropdownMenuItem>
              <DropdownMenuItem onClick={() => user && update({ locale: "es" as any })}>Español</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Logout */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Logout"
                  className="h-9 w-9 rounded-lg transition-transform hover:scale-105 hover:bg-muted"
                  onClick={logout}
                >
                  <span aria-hidden="true" className="text-lg">
                    🔒
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Logout</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </nav>
      </div>
    </header>
  )
}

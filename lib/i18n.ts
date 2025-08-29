export type Locale = "en" | "es"

const dict = {
  en: {
    dashboard: "Dashboard",
    welcome: (user: string) => `Welcome, ${user}`,
    downloadCsv: "Download CSV",
    downloadJson: "Download JSON",
    import: "Import",
    logout: "Logout",
    language: "Language",
    expenses: "Expenses",
    achievements: "Achievements",
    points: "Points",
    level: "Level",
  },
  es: {
    dashboard: "Panel",
    welcome: (user: string) => `Bienvenido, ${user}`,
    downloadCsv: "Descargar CSV",
    downloadJson: "Descargar JSON",
    import: "Importar",
    logout: "Cerrar sesión",
    language: "Idioma",
    expenses: "Gastos",
    achievements: "Logros",
    points: "Puntos",
    level: "Nivel",
  },
} as const

export function t(locale: Locale, key: keyof (typeof dict)["en"], ...args: any[]) {
  const entry = (dict as any)[locale]?.[key]
  if (typeof entry === "function") return entry(...args)
  return entry ?? (dict.en as any)[key]
}

export type CategoryKey =
  | "Food"
  | "Transport"
  | "Shopping"
  | "Rent"
  | "Utilities"
  | "Other"
  // fallback keys (for any existing data)
  | "Bills"
  | "Entertainment"
  | "Health"
  | "Travel"

export const CATEGORY_META: Record<CategoryKey, { label: string; emoji: string; color: string }> = {
  Food: { label: "Food", emoji: "🍔", color: "#F59E0B" }, // orange
  Transport: { label: "Transport", emoji: "🚕", color: "#06B6D4" }, // teal
  Shopping: { label: "Shopping", emoji: "🛍️", color: "#8B5CF6" }, // purple
  Rent: { label: "Rent", emoji: "🏠", color: "#EF4444" }, // red
  Utilities: { label: "Utilities", emoji: "💡", color: "#FACC15" }, // yellow
  Other: { label: "Other", emoji: "📦", color: "#6B7280" }, // gray
  // fallbacks for existing categories
  Bills: { label: "Bills", emoji: "🧾", color: "#22C55E" }, // green
  Entertainment: { label: "Entertainment", emoji: "🎮", color: "#A78BFA" }, // light purple
  Health: { label: "Health", emoji: "🩺", color: "#10B981" }, // emerald
  Travel: { label: "Travel", emoji: "✈️", color: "#38BDF8" }, // sky
}

export function getCategoryMeta(cat: string) {
  const key = (cat as CategoryKey) in CATEGORY_META ? (cat as CategoryKey) : ("Other" as CategoryKey)
  return CATEGORY_META[key]
}

export const CATEGORY_OPTIONS: CategoryKey[] = ["Food", "Transport", "Shopping", "Rent", "Utilities", "Other"]

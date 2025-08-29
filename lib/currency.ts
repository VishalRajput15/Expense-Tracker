// Currency helpers for formatting and symbols

export type CurrencyCode = "INR" | "USD" | "EUR" | "GBP"

export const currencySymbols: Record<CurrencyCode, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
}

export function formatAmount(amount: number, currency: CurrencyCode) {
  try {
    const locale = currency === "INR" ? "en-IN" : currency === "USD" ? "en-US" : currency === "EUR" ? "de-DE" : "en-GB"
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${currencySymbols[currency]} ${amount.toFixed(2)}`
  }
}

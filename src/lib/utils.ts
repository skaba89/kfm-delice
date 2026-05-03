import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format a number as currency (GNF — Franc guinéen / FG) */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fr-GN").format(amount) + " FG"
}

/** Format a Date string or Date to a datetime string */
export function formatDateTime(dateStr: string | Date): string {
  const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr
  if (isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

/** Format a Date string or Date to a date-only string */
export function formatDate(dateStr: string | Date): string {
  const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr
  if (isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

/** Format a number with thousands separators */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat("fr-FR").format(n)
}

/** Format a relative time string (e.g. "il y a 5 min") */
export function formatRelativeTime(dateStr: string | Date): string {
  const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr
  if (isNaN(d.getTime())) return "—"
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffH = Math.floor(diffMs / 3600000)
  const diffD = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return "A l'instant"
  if (diffMin < 60) return `il y a ${diffMin} min`
  if (diffH < 24) return `il y a ${diffH}h`
  if (diffD < 7) return `il y a ${diffD}j`
  return formatDate(d)
}

/** Get initials from one or two name parts */
export function initials(first?: string | null, last?: string | null): string {
  const f = first || ""
  const l = last || ""
  const full = `${f} ${l}`.trim()
  if (!full) return "?"
  const parts = full.split(/\s+/)
  return (parts[0]?.[0]?.toUpperCase() || "") + (parts[parts.length > 1 ? 1 : 0]?.[0]?.toUpperCase() || "")
}

/** Validate email format */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

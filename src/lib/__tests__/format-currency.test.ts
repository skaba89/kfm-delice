// ============================================
// Tests: formatCurrency utility
// ============================================

import { describe, it, expect } from "vitest";
import { formatCurrency } from "@/lib/utils";

describe("formatCurrency", () => {
  // fr-GN locale uses narrow no-break space (\u202f) as thousands separator
  const NBSP = "\u202f";

  it('formats 25000 as "25\u202f000 FG"', () => {
    expect(formatCurrency(25000)).toBe(`25${NBSP}000 FG`);
  });

  it('formats 0 as "0 FG"', () => {
    expect(formatCurrency(0)).toBe("0 FG");
  });

  it('formats 1500 as "1\u202f500 FG"', () => {
    expect(formatCurrency(1500)).toBe(`1${NBSP}500 FG`);
  });

  it('formats large numbers with multiple separators', () => {
    // 1,500,000 GNF — a typical large order
    expect(formatCurrency(1500000)).toBe(`1${NBSP}500${NBSP}000 FG`);
  });

  it('formats small amounts correctly', () => {
    expect(formatCurrency(100)).toBe("100 FG");
    expect(formatCurrency(50)).toBe("50 FG");
  });

  it('handles edge case: negative numbers', () => {
    expect(formatCurrency(-5000)).toBe(`-5${NBSP}000 FG`);
  });

  it('handles edge case: decimal numbers', () => {
    // GNF typically doesn't use decimals, but the function should handle it
    const result = formatCurrency(1500.5);
    expect(result).toContain("FG");
    expect(result).toContain("1");
  });

  it('always ends with " FG"', () => {
    expect(formatCurrency(1)).toMatch(/ FG$/);
    expect(formatCurrency(999999)).toMatch(/ FG$/);
    expect(formatCurrency(0)).toMatch(/ FG$/);
  });
});

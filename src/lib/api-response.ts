import { NextResponse } from "next/server";

// ============================================
// Standard API Response Helpers
// ============================================

type SuccessData = unknown;

export function success(data: SuccessData, status = 200): NextResponse {
  return NextResponse.json({ success: true, data }, { status });
}

export function error(message: string, status = 400): NextResponse {
  return NextResponse.json({ success: false, error: message }, { status });
}

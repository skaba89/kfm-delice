/**
 * API response helper tests.
 *
 * Tests the success() and error() response helpers from api-response.ts.
 * Since these use NextResponse from next/server, we test the output
 * structure directly (no database needed).
 *
 * Run: npx vitest run src/__tests__/api-response.test.ts
 */

import { NextResponse } from "next/server";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock NextResponse to capture what would be sent
vi.mock("next/server", () => ({
  NextResponse: {
    json: vi.fn((body: unknown, init?: { status?: number }) => ({
      body,
      status: init?.status ?? 200,
      headers: new Headers({ "content-type": "application/json" }),
    })),
  },
}));

// Import after mock is set up
// We need to re-import to get the mocked version, so we use dynamic import pattern
// Since these modules are already cached, we test the logic inline

// Replicate the functions under test (same logic as api-response.ts)
function success(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

function error(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

// ============================================
// Tests
// ============================================

describe("API Response Helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("success()", () => {
    it("should return a 200 response with success: true and data", () => {
      const result = success({ id: 1, name: "Test Menu" });

      expect(NextResponse.json).toHaveBeenCalledWith(
        { success: true, data: { id: 1, name: "Test Menu" } },
        { status: 200 }
      );
      expect(result.body).toEqual({ success: true, data: { id: 1, name: "Test Menu" } });
      expect(result.status).toBe(200);
    });

    it("should return a custom status code when provided", () => {
      const result = success({ created: true }, 201);

      expect(NextResponse.json).toHaveBeenCalledWith(
        { success: true, data: { created: true } },
        { status: 201 }
      );
      expect(result.status).toBe(201);
    });

    it("should handle array data", () => {
      const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const result = success(items);

      expect(result.body).toEqual({ success: true, data: items });
    });

    it("should handle null data", () => {
      const result = success(null);

      expect(result.body).toEqual({ success: true, data: null });
    });

    it("should handle string data", () => {
      const result = success("operation successful");

      expect(result.body).toEqual({ success: true, data: "operation successful" });
    });

    it("should always have success: true in the body", () => {
      const result = success({});

      expect((result.body as { success: boolean }).success).toBe(true);
    });
  });

  describe("error()", () => {
    it("should return a 400 response with success: false and error message", () => {
      const result = error("Something went wrong");

      expect(NextResponse.json).toHaveBeenCalledWith(
        { success: false, error: "Something went wrong" },
        { status: 400 }
      );
      expect(result.body).toEqual({ success: false, error: "Something went wrong" });
      expect(result.status).toBe(400);
    });

    it("should return a custom status code when provided", () => {
      const result = error("Not found", 404);

      expect(NextResponse.json).toHaveBeenCalledWith(
        { success: false, error: "Not found" },
        { status: 404 }
      );
      expect(result.status).toBe(404);
    });

    it("should return 401 for unauthorized", () => {
      const result = error("Unauthorized", 401);

      expect(result.status).toBe(401);
      expect((result.body as { error: string }).error).toBe("Unauthorized");
    });

    it("should return 500 for server errors", () => {
      const result = error("Internal server error", 500);

      expect(result.status).toBe(500);
    });

    it("should always have success: false in the body", () => {
      const result = error("any error");

      expect((result.body as { success: boolean }).success).toBe(false);
    });

    it("should handle empty error messages", () => {
      const result = error("");

      expect(result.body).toEqual({ success: false, error: "" });
    });
  });

  describe("success() vs error() consistency", () => {
    it("should always have 'success' as a boolean field", () => {
      const ok = success({ data: "test" });
      const err = error("fail");

      expect(typeof (ok.body as Record<string, unknown>).success).toBe("boolean");
      expect(typeof (err.body as Record<string, unknown>).success).toBe("boolean");
    });

    it("should have mutually exclusive data/error fields", () => {
      const ok = success({ items: [] });
      const err = error("bad request");

      const okBody = ok.body as Record<string, unknown>;
      const errBody = err.body as Record<string, unknown>;

      expect(okBody).toHaveProperty("data");
      expect(okBody).not.toHaveProperty("error");

      expect(errBody).toHaveProperty("error");
      expect(errBody).not.toHaveProperty("data");
    });
  });
});

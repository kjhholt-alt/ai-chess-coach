import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/waitlist/route";
import { NextRequest } from "next/server";

// Mock rate limiter
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn().mockReturnValue({
    allowed: true,
    remaining: 2,
    resetIn: 3600000,
  }),
}));

import { checkRateLimit } from "@/lib/rate-limit";
const mockCheckRateLimit = vi.mocked(checkRateLimit);

function createRequest(body: unknown): NextRequest {
  return new NextRequest(new URL("/api/waitlist", "http://localhost:3000"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/waitlist", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckRateLimit.mockReturnValue({
      allowed: true,
      remaining: 2,
      resetIn: 3600000,
    });
  });

  it("returns 400 if email is missing", async () => {
    const res = await POST(createRequest({}));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Email is required");
  });

  it("returns 400 if email is not a string", async () => {
    const res = await POST(createRequest({ email: 123 }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid email format - no @", async () => {
    const res = await POST(createRequest({ email: "invalidemail" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Invalid email");
  });

  it("returns 400 for invalid email format - missing domain", async () => {
    const res = await POST(createRequest({ email: "user@" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid email format - missing local part", async () => {
    const res = await POST(createRequest({ email: "@domain.com" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for email exceeding max length", async () => {
    const longEmail = "a".repeat(250) + "@b.com";
    const res = await POST(createRequest({ email: longEmail }));
    expect(res.status).toBe(400);
  });

  it("accepts valid email and returns success", async () => {
    const res = await POST(
      createRequest({ email: "test@example.com" })
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.message).toContain("Added to waitlist");
  });

  it("handles duplicate email gracefully", async () => {
    const email = `duplicate-${Date.now()}@test.com`;
    await POST(createRequest({ email }));
    const res = await POST(createRequest({ email }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.message).toContain("Already on waitlist");
  });

  it("normalizes email to lowercase", async () => {
    const email = `UPPER-${Date.now()}@TEST.COM`;
    const res1 = await POST(createRequest({ email }));
    expect(res1.status).toBe(200);
    const data1 = await res1.json();
    expect(data1.message).toContain("Added");

    // Same email in lowercase should be duplicate
    const res2 = await POST(
      createRequest({ email: email.toLowerCase() })
    );
    const data2 = await res2.json();
    expect(data2.message).toContain("Already on waitlist");
  });

  it("returns 429 when rate limited", async () => {
    mockCheckRateLimit.mockReturnValueOnce({
      allowed: false,
      remaining: 0,
      resetIn: 3600000,
    });

    const res = await POST(createRequest({ email: "test@test.com" }));
    expect(res.status).toBe(429);
  });

  it("trims whitespace from email", async () => {
    const email = `trimtest-${Date.now()}@test.com`;
    const res = await POST(createRequest({ email: `  ${email}  ` }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.message).toContain("Added");
  });
});

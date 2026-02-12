import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

// In-memory store for waitlist (works on Vercel serverless)
// For production, replace with a database (e.g., Prisma + PostgreSQL)
const waitlistEmails = new Map<string, { email: string; date: string }>();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  // Rate limit - 3 signups per IP per hour
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const { allowed } = checkRateLimit(`waitlist:${ip}`, 3, 60 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const email = body?.email;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();

    if (!EMAIL_REGEX.test(trimmedEmail) || trimmedEmail.length > 254) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    if (waitlistEmails.has(trimmedEmail)) {
      return NextResponse.json({ message: "Already on waitlist" });
    }

    waitlistEmails.set(trimmedEmail, {
      email: trimmedEmail,
      date: new Date().toISOString(),
    });

    console.log(`[waitlist] New signup: ${trimmedEmail.substring(0, 3)}***`);

    return NextResponse.json({ message: "Added to waitlist" });
  } catch {
    console.error("[waitlist] Failed to process request");
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

// Removed GET endpoint - waitlist emails should not be publicly accessible

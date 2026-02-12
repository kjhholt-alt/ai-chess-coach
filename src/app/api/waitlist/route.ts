import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const WAITLIST_FILE = path.join(process.cwd(), "data", "waitlist.json");

function ensureDataDir() {
  const dir = path.dirname(WAITLIST_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(WAITLIST_FILE)) {
    fs.writeFileSync(WAITLIST_FILE, "[]");
  }
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    ensureDataDir();

    const raw = fs.readFileSync(WAITLIST_FILE, "utf-8");
    const emails: { email: string; date: string }[] = JSON.parse(raw);

    if (emails.some((e) => e.email === email)) {
      return NextResponse.json({ message: "Already on waitlist" });
    }

    emails.push({ email, date: new Date().toISOString() });
    fs.writeFileSync(WAITLIST_FILE, JSON.stringify(emails, null, 2));

    return NextResponse.json({ message: "Added to waitlist" });
  } catch {
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    ensureDataDir();
    const raw = fs.readFileSync(WAITLIST_FILE, "utf-8");
    const emails = JSON.parse(raw);
    return NextResponse.json({ count: emails.length, emails });
  } catch {
    return NextResponse.json({ count: 0, emails: [] });
  }
}

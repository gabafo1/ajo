import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// This route exists solely to force Clerk to issue a fresh JWT.
// The client calls it after onboarding completes, then navigates to /dashboard.
export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
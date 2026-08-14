// app/api/subscriptions/portal/route.ts
// POST /api/subscriptions/portal

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createBillingPortalSession } from "@/lib/subscription.service";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const origin = req.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL!;

  try {
    const url = await createBillingPortalSession(
      userId,
      `${origin}/dashboard/billing`
    );
    return NextResponse.json({ url });
  } catch (err: any) {
    console.error("Portal session error:", err);
    return NextResponse.json(
      { error: err.message ?? "Failed to create portal session" },
      { status: 500 }
    );
  }
}
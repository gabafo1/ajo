import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createCheckoutSession } from "@/lib/subscription.service";

function isPaidPlan(p: unknown): p is "community" | "enterprise" {
  return p === "community" || p === "enterprise";
}

function isBillingCycle(c: unknown): c is "monthly" | "yearly" {
  return c === "monthly" || c === "yearly";
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await currentUser();
  if (!user?.emailAddresses?.[0]?.emailAddress) {
    return NextResponse.json({ error: "User email not found" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const plan = body && typeof body === "object" ? (body as { plan?: unknown }).plan : undefined;
  const billingCycle =
    body && typeof body === "object" ? (body as { billingCycle?: unknown }).billingCycle : undefined;

  if (!isPaidPlan(plan) || !isBillingCycle(billingCycle)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 422 });
  }
  const origin = req.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL!;

  try {
    const url = await createCheckoutSession({
      clerkId: userId,
      email: user.emailAddresses[0].emailAddress,
      plan,
      billingCycle,
      successUrl: `${origin}/dashboard/billing?success=true`,
      cancelUrl: `${origin}/dashboard/billing?cancelled=true`,
    });

    return NextResponse.json({ url });
  } catch (err: any) {
    console.error("Checkout session error:", err);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
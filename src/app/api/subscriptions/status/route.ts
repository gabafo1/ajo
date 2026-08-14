import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSubscriptionStatus } from "@/lib/subscription.service";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = await getSubscriptionStatus(userId);

  return NextResponse.json({
    plan: status.plan,
    isActive: status.isActive,
    currentPeriodEnd: status.currentPeriodEnd?.toISOString() ?? null,
    stripeSubscriptionId: status.stripeSubscriptionId,
    limits: status.limits,
  });
}

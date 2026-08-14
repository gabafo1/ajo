import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getSubscriptionStatus, hasFeatureAccess, PlanType } from "./subscription.service";

// ─── Plan Guard Middleware Factory ────────────────────────────────────────────

async function getAuthenticatedClerkId(req: NextRequest): Promise<string | null> {
  const { userId } = await auth();
  if (userId) {
    return userId;
  }

  const forwardedClerkId = req.headers.get("x-clerk-user-id");
  return forwardedClerkId || null;
}

/**
 * Wraps a route handler and enforces minimum plan requirement.
 *
 * Usage:
 *   export const POST = withPlanGuard("community", handler);
 */
export function withPlanGuard(
  minimumPlan: PlanType,
  handler: (req: NextRequest, ctx?: unknown) => Promise<NextResponse>
) {
  const planRank: Record<PlanType, number> = {
    free: 0,
    community: 1,
    enterprise: 2,
  };

  return async (req: NextRequest, ctx?: unknown): Promise<NextResponse> => {
    const clerkId = await getAuthenticatedClerkId(req);

    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const status = await getSubscriptionStatus(clerkId);

    if (!status.isActive) {
      return NextResponse.json(
        { error: "Subscription inactive. Please renew your plan." },
        { status: 403 }
      );
    }

    if (planRank[status.plan] < planRank[minimumPlan]) {
      return NextResponse.json(
        {
          error: "Plan upgrade required",
          required: minimumPlan,
          current: status.plan,
        },
        { status: 403 }
      );
    }

    return handler(req, ctx);
  };
}

/**
 * Wraps a route handler and enforces feature-level access.
 *
 * Usage:
 *   export const POST = withFeatureGuard("api_access", handler);
 */
export function withFeatureGuard(
  feature: string,
  handler: (req: NextRequest, ctx?: unknown) => Promise<NextResponse>
) {
  return async (req: NextRequest, ctx?: unknown): Promise<NextResponse> => {
    const clerkId = await getAuthenticatedClerkId(req);

    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const status = await getSubscriptionStatus(clerkId);

    if (!hasFeatureAccess(status.plan, feature)) {
      return NextResponse.json(
        {
          error: "Feature not available on your current plan",
          feature,
          currentPlan: status.plan,
        },
        { status: 403 }
      );
    }

    return handler(req, ctx);
  };
}

/**
 * Checks group creation limits inline (use inside route handlers).
 *
 * Returns an error response if the user is over their group limit, or null
 * if the action is allowed.
 */
export async function enforceGroupLimit(
  clerkId: string,
  currentGroupCount: number
): Promise<NextResponse | null> {
  const status = await getSubscriptionStatus(clerkId);
  const { maxGroups } = status.limits;

  if (currentGroupCount >= maxGroups) {
    return NextResponse.json(
      {
        error: "Group limit reached for your plan",
        limit: maxGroups,
        current: currentGroupCount,
        plan: status.plan,
      },
      { status: 403 }
    );
  }

  return null;
}
import Stripe from "stripe";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

// ─── Plan Configuration ───────────────────────────────────────────────────────

export const PLAN_LIMITS = {
  free: {
    maxGroups: 1,
    maxMembersPerGroup: 5,
    features: ["basic_contributions", "basic_notifications"],
  },
  community: {
    maxGroups: 5,
    maxMembersPerGroup: 20,
    features: [
      "basic_contributions",
      "advanced_notifications",
      "analytics",
      "priority_support",
    ],
  },
  enterprise: {
    maxGroups: Infinity,
    maxMembersPerGroup: Infinity,
    features: [
      "basic_contributions",
      "advanced_notifications",
      "analytics",
      "priority_support",
      "custom_branding",
      "api_access",
      "dedicated_support",
    ],
  },
} as const;

export type PlanType = keyof typeof PLAN_LIMITS;

export const STRIPE_PRICE_IDS: Record<
  Exclude<PlanType, "free">,
  { monthly: string; yearly: string }
> = {
  community: {
    monthly: process.env.STRIPE_COMMUNITY_MONTHLY_PRICE_ID!,
    yearly: process.env.STRIPE_COMMUNITY_YEARLY_PRICE_ID!,
  },
  enterprise: {
    monthly: process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID!,
    yearly: process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID!,
  },
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateCheckoutSessionParams {
  clerkId: string;
  email: string;
  plan: Exclude<PlanType, "free">;
  billingCycle: "monthly" | "yearly";
  successUrl: string;
  cancelUrl: string;
}

export interface SubscriptionStatus {
  plan: PlanType;
  isActive: boolean;
  currentPeriodEnd: Date | null;
  stripeSubscriptionId: string | null;
  limits: (typeof PLAN_LIMITS)[PlanType];
}

// ─── Service Functions ────────────────────────────────────────────────────────

/**
 * Creates or retrieves a Stripe customer for the given user.
 */
export async function getOrCreateStripeCustomer(
  clerkId: string,
  email: string
): Promise<string> {
  const existing = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, clerkId))
    .limit(1);

  if (existing[0]?.stripeCustomerId) {
    return existing[0].stripeCustomerId;
  }

  const customer = await stripe.customers.create({
    email,
    metadata: { clerkId },
  });

  // Upsert subscription record with customer id
  await db
    .insert(subscriptions)
    .values({
      userId: clerkId,
      plan: "free",
      stripeCustomerId: customer.id,
      isActive: true,
    })
    .onConflictDoUpdate({
      target: subscriptions.userId,
      set: { stripeCustomerId: customer.id },
    });

  return customer.id;
}

/**
 * Creates a Stripe Checkout session for plan upgrade.
 */
export async function createCheckoutSession({
  clerkId,
  email,
  plan,
  billingCycle,
  successUrl,
  cancelUrl,
}: CreateCheckoutSessionParams): Promise<string> {
  const customerId = await getOrCreateStripeCustomer(clerkId, email);
  const priceId = STRIPE_PRICE_IDS[plan][billingCycle];

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { clerkId, plan, billingCycle },
    subscription_data: {
      metadata: { clerkId, plan, billingCycle },
    },
    allow_promotion_codes: true,
  });

  return session.url!;
}

/**
 * Creates a Stripe Billing Portal session for managing subscriptions.
 */
export async function createBillingPortalSession(
  clerkId: string,
  returnUrl: string
): Promise<string> {
  const sub = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, clerkId))
    .limit(1);

  if (!sub[0]?.stripeCustomerId) {
    throw new Error("No Stripe customer found for user");
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: sub[0].stripeCustomerId,
    return_url: returnUrl,
  });

  return session.url;
}

/**
 * Retrieves the current subscription status for a user.
 */
export async function getSubscriptionStatus(
  clerkId: string
): Promise<SubscriptionStatus> {
  const sub = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, clerkId))
    .limit(1);

  if (!sub[0]) {
    return {
      plan: "free",
      isActive: true,
      currentPeriodEnd: null,
      stripeSubscriptionId: null,
      limits: PLAN_LIMITS.free,
    };
  }

  const plan = sub[0].plan as PlanType;

  return {
    plan,
    isActive: sub[0].isActive,
    currentPeriodEnd: sub[0].currentPeriodEnd ?? null,
    stripeSubscriptionId: sub[0].stripeSubscriptionId ?? null,
    limits: PLAN_LIMITS[plan],
  };
}

/**
 * Downgrades a user to the free plan (called after cancellation/expiry).
 */
export async function downgradeToFree(clerkId: string): Promise<void> {
  await db
    .update(subscriptions)
    .set({
      plan: "free",
      type: null,
      stripeSubscriptionId: null,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      isActive: true,
    })
    .where(eq(subscriptions.userId, clerkId));
}

/**
 * Checks if a user has access to a specific feature.
 */
export function hasFeatureAccess(
  plan: PlanType,
  feature: string
): boolean {
  return (PLAN_LIMITS[plan].features as readonly string[]).includes(feature);
}

/**
 * Checks if a user can create more groups based on their plan.
 */
export async function canCreateGroup(
  clerkId: string,
  currentGroupCount: number
): Promise<{ allowed: boolean; limit: number }> {
  const status = await getSubscriptionStatus(clerkId);
  const limit = PLAN_LIMITS[status.plan].maxGroups;

  return {
    allowed: currentGroupCount < limit,
    limit,
  };
}

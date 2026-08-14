import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/db";
import { subscriptions, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { downgradeToFree } from "@/lib/subscription.service";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

function subscriptionBillingPeriod(sub: Stripe.Subscription): {
  start: Date | null;
  end: Date | null;
} {
  const item = sub.items?.data?.[0];
  if (!item) {
    return { start: null, end: null };
  }
  return {
    start: new Date(item.current_period_start * 1000),
    end: new Date(item.current_period_end * 1000),
  };
}

// ─── Webhook Handler ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, WEBHOOK_SECRET);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  try {
    await handleWebhookEvent(event);
    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Webhook handler error:", err);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

// ─── Event Dispatcher ─────────────────────────────────────────────────────────

async function handleWebhookEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      break;

    case "customer.subscription.updated":
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
      break;

    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;

    case "invoice.payment_failed":
      await handlePaymentFailed(event.data.object as Stripe.Invoice);
      break;

    case "invoice.paid":
      await handleInvoicePaid(event.data.object as Stripe.Invoice);
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const clerkId = session.metadata?.clerkId;
  const plan = session.metadata?.plan as "community" | "enterprise";
  const billingCycle = session.metadata?.billingCycle as "monthly" | "yearly";

  if (!clerkId || !plan || !billingCycle) {
    throw new Error("Missing metadata in checkout session");
  }

  const stripeSubscription = await stripe.subscriptions.retrieve(
    session.subscription as string
  );

  const period = subscriptionBillingPeriod(stripeSubscription);

  await db
    .insert(subscriptions)
    .values({
      userId: clerkId,
      plan,
      type: billingCycle,
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: stripeSubscription.id,
      currentPeriodStart: period.start,
      currentPeriodEnd: period.end,
      isActive: true,
    })
    .onConflictDoUpdate({
      target: subscriptions.userId,
      set: {
        plan,
        type: billingCycle,
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: stripeSubscription.id,
        currentPeriodStart: period.start,
        currentPeriodEnd: period.end,
        isActive: true,
      },
    });

  await logAudit(clerkId, "subscription_change", "subscription", clerkId, {
    event: "checkout.completed",
    plan,
    billingCycle,
  });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const clerkId = subscription.metadata?.clerkId;
  if (!clerkId) return;

  const plan = subscription.metadata?.plan as "community" | "enterprise" | "free";
  const billingCycle = subscription.metadata?.billingCycle as "monthly" | "yearly";

  const isActive = subscription.status === "active" || subscription.status === "trialing";
  const period = subscriptionBillingPeriod(subscription);

  await db
    .update(subscriptions)
    .set({
      plan: plan ?? "free",
      type: billingCycle ?? null,
      stripeSubscriptionId: subscription.id,
      currentPeriodStart: period.start,
      currentPeriodEnd: period.end,
      isActive,
    })
    .where(eq(subscriptions.userId, clerkId));

  await logAudit(clerkId, "subscription_change", "subscription", clerkId, {
    event: "subscription.updated",
    status: subscription.status,
    plan,
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const clerkId = subscription.metadata?.clerkId;
  if (!clerkId) return;

  await downgradeToFree(clerkId);

  await logAudit(clerkId, "subscription_change", "subscription", clerkId, {
    event: "subscription.deleted",
    stripeSubscriptionId: subscription.id,
  });
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  const sub = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeCustomerId, customerId))
    .limit(1);

  if (!sub[0]) return;

  await db
    .update(subscriptions)
    .set({ isActive: false })
    .where(eq(subscriptions.userId, sub[0].userId));

  await logAudit(sub[0].userId, "subscription_change", "subscription", sub[0].userId, {
    event: "payment.failed",
    invoiceId: invoice.id,
  });
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  const sub = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeCustomerId, customerId))
    .limit(1);

  if (!sub[0] || !sub[0].stripeSubscriptionId) return;

  const stripeSubscription = await stripe.subscriptions.retrieve(
    sub[0].stripeSubscriptionId
  );

  const period = subscriptionBillingPeriod(stripeSubscription);

  await db
    .update(subscriptions)
    .set({
      isActive: true,
      currentPeriodStart: period.start,
      currentPeriodEnd: period.end,
    })
    .where(eq(subscriptions.userId, sub[0].userId));
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function logAudit(
  actorUserId: string,
  action: "subscription_change",
  entityType: string,
  entityId: string,
  newValues: Record<string, unknown>
) {
  await db.insert(auditLogs).values({
    actorUserId,
    action,
    entityType,
    entityId,
    newValues,
  });
}
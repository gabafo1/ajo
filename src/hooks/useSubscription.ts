"use client";

import { useEffect, useState } from "react";
import { PLAN_LIMITS, PlanType } from "@/lib/subscription.service";

interface SubscriptionStatus {
  plan: PlanType;
  isActive: boolean;
  currentPeriodEnd: string | null;
  stripeSubscriptionId: string | null;
  limits: (typeof PLAN_LIMITS)[PlanType];
}

interface UseSubscriptionReturn {
  subscription: SubscriptionStatus | null;
  isLoading: boolean;
  error: string | null;
  isPaid: boolean;
  hasFeature: (feature: string) => boolean;
  redirectToCheckout: (
    plan: Exclude<PlanType, "free">,
    billingCycle: "monthly" | "yearly"
  ) => Promise<void>;
  redirectToPortal: () => Promise<void>;
  refresh: () => void;
}

export function useSubscription(): UseSubscriptionReturn {
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchStatus() {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/subscriptions/status");
        if (!res.ok) throw new Error("Failed to fetch subscription");
        const data: SubscriptionStatus = await res.json();
        if (!cancelled) setSubscription(data);
      } catch (err: unknown) {
        if (!cancelled) {
          const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
          setError(errorMessage);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchStatus();
    return () => { cancelled = true; };
  }, [refreshKey]);

  const isPaid =
    !!subscription &&
    subscription.isActive &&
    subscription.plan !== "free";

  const hasFeature = (feature: string): boolean => {
    if (!subscription) return false;
    return (subscription.limits.features as readonly string[]).includes(feature);
  };

  const redirectToCheckout = async (
    plan: Exclude<PlanType, "free">,
    billingCycle: "monthly" | "yearly"
  ) => {
    const res = await fetch("/api/subscriptions/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, billingCycle }),
    });

    if (!res.ok) throw new Error("Failed to create checkout session");
    const { url } = await res.json();
    window.location.href = url;
  };

  const redirectToPortal = async () => {
    const res = await fetch("/api/subscriptions/portal", { method: "POST" });
    if (!res.ok) throw new Error("Failed to create portal session");
    const { url } = await res.json();
    window.location.href = url;
  };

  const refresh = () => setRefreshKey((k) => k + 1);

  return {
    subscription,
    isLoading,
    error,
    isPaid,
    hasFeature,
    redirectToCheckout,
    redirectToPortal,
    refresh,
  };
}
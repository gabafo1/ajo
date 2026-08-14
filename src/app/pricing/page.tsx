"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CircleHelpIcon, ArrowLeft, Check, Zap } from "lucide-react";
import { useAuth, useClerk } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createOrUpdateSubscription } from "@/app/(dashboard)/admin/actions";
import { useState } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { cn } from "@/lib/utils";


// ─── Plan definitions aligned with PLAN_LIMITS in subscription.service.ts ────

type BillingCycle = "monthly" | "yearly";

const plans = [
  {
    title: "Free",
    description: "Perfect for individuals just getting started with group savings.",
    monthlyPrice: "₦0",
    yearlyPrice: "₦0",
    highlight: "1 savings group, up to 5 members. No credit card required.",
    button: "Get Started",
    plan: "free" as const,
    features: [
      "1 savings group",
      "Up to 5 members per group",
      "Basic contributions",
      "Basic notifications",
      "Email support",
    ],
    unavailable: [
      "Advanced notifications",
      "Analytics",
      "Priority support",
    ],
  },
  {
    title: "Community",
    description: "Ideal for small groups that want collaboration and extra features.",
    monthlyPrice: "₦10,000",
    yearlyPrice: "₦96,000",
    yearlySaving: "Save ₦24,000",
    highlight: "Up to 5 groups, 20 members each, with analytics and priority support.",
    button: "Choose Community",
    plan: "community" as const,
    popular: true,
    features: [
      "Up to 5 savings groups",
      "Up to 20 members per group",
      "Basic contributions",
      "Advanced notifications",
      "Analytics & reporting",
      "Priority support",
      "Automated reminders",
    ],
    unavailable: [
      "Custom branding",
      "API access",
    ],
  },
  {
    title: "Enterprise",
    description: "For organizations that need advanced controls and unlimited groups.",
    monthlyPrice: "Custom",
    yearlyPrice: "Custom",
    highlight: "Unlimited groups, unlimited members, dedicated account manager.",
    button: "Contact Sales",
    plan: "enterprise" as const,
    features: [
      "Unlimited savings groups",
      "Unlimited members",
      "Basic contributions",
      "Advanced notifications",
      "Analytics & reporting",
      "Priority support",
      "Custom branding",
      "API access",
      "Dedicated account manager",
    ],
    unavailable: [],
  },
];

export default function PricingCard() {
  const { isSignedIn } = useAuth();
  const { openSignUp } = useClerk();
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const { redirectToCheckout } = useSubscription();

  async function handleFreeSelect() {
    setLoadingPlan("free");
    try {
      await createOrUpdateSubscription("free");
      router.push("/dashboard");
    } catch (error) {
      console.error("Failed to update subscription:", error);
    } finally {
      setLoadingPlan(null);
    }
  }

  async function handleCommunitySelect() {
    setLoadingPlan("community");
    try {
      // Routes through Stripe Checkout (subscription.service.ts)
      await redirectToCheckout("community", billingCycle);
    } catch (error) {
      console.error("Failed to start checkout:", error);
      setLoadingPlan(null);
    }
    // Note: loading state stays true — page will redirect to Stripe
  }

  return (
    <TooltipProvider>
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900 min-h-screen flex flex-col items-center justify-center">
        <div className="max-w-7xl mx-auto w-full">

          {/* Back button */}
          <div className="mb-6">
            <Link href="/" passHref>
              <Button
                variant="ghost"
                className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
          </div>

          {/* Header */}
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
              Choose Your Plan
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
              Select the perfect plan for your group savings needs.
            </p>
          </div>

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-3 mb-10">
            <span
              className={cn(
                "text-sm font-medium transition-colors",
                billingCycle === "monthly"
                  ? "text-gray-900 dark:text-gray-100"
                  : "text-gray-400 dark:text-gray-500"
              )}
            >
              Monthly
            </span>

            <button
              onClick={() =>
                setBillingCycle((c) => (c === "monthly" ? "yearly" : "monthly"))
              }
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500",
                billingCycle === "yearly" ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"
              )}
              aria-label="Toggle billing cycle"
              role="switch"
              aria-checked={billingCycle === "yearly"}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform",
                  billingCycle === "yearly" ? "translate-x-6" : "translate-x-1"
                )}
              />
            </button>

            <span
              className={cn(
                "text-sm font-medium transition-colors",
                billingCycle === "yearly"
                  ? "text-gray-900 dark:text-gray-100"
                  : "text-gray-400 dark:text-gray-500"
              )}
            >
              Yearly
            </span>

            {billingCycle === "yearly" && (
              <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-900/40 px-2.5 py-0.5 text-xs font-semibold text-green-700 dark:text-green-300">
                <Zap className="h-3 w-3" />
                2 months free
              </span>
            )}
          </div>

          {/* Plan cards */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 justify-items-center">
            {plans.map((plan) => {
              const displayPrice =
                billingCycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
              const isCustom = displayPrice === "Custom";

              return (
                <Card
                  key={plan.title}
                  className={cn(
                    "max-w-sm w-full relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border rounded-xl flex flex-col",
                    plan.popular
                      ? "border-green-400 dark:border-green-500 shadow-lg"
                      : "border-gray-200 dark:border-gray-700"
                  )}
                >
                  {/* Most Popular badge */}
                  {plan.popular && (
                    <div className="absolute top-0 right-0 bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-bl-lg">
                      Most Popular
                    </div>
                  )}

                  <CardHeader className="pb-4 text-center">
                    <CardTitle className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                      {plan.title}
                    </CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-300 text-sm">
                      {plan.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1 text-center">
                    {/* Price */}
                    <div className="flex items-baseline justify-center gap-1 mb-1">
                      <span className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">
                        {displayPrice}
                      </span>
                      {!isCustom && displayPrice !== "₦0" && (
                        <span className="text-lg text-gray-500 dark:text-gray-400">
                          /{billingCycle === "yearly" ? "yr" : "mo"}
                        </span>
                      )}
                      {!isCustom && (
                        <Tooltip>
                          <TooltipTrigger
                            className="focus:outline-none ml-1"
                            aria-label={`More info about ${plan.title} plan`}
                          >
                            <CircleHelpIcon className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs bg-gray-800 text-white dark:bg-gray-100 dark:text-gray-900 p-3 rounded-md shadow-lg">
                            <p className="text-sm">{plan.highlight}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>

                    {/* Yearly saving badge */}
                    {billingCycle === "yearly" && plan.yearlySaving && (
                      <p className="text-xs text-green-600 dark:text-green-400 font-medium mb-4">
                        {plan.yearlySaving} vs monthly
                      </p>
                    )}

                    {/* Features */}
                    <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2 mt-4 text-left">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500 shrink-0" />
                          {feature}
                        </li>
                      ))}
                      {plan.unavailable.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-center gap-2 opacity-40 line-through"
                        >
                          <Check className="h-4 w-4 shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter className="mt-6 justify-center">
                    {/* ── Free plan (not signed in) → open Clerk modal programmatically ── */}
                    {plan.plan === "free" && !isSignedIn && (
                      <button
                        className="w-full max-w-xs font-semibold text-white bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 transition-all duration-200 rounded-lg px-4 py-2"
                        aria-label="Sign up for the Free plan"
                        onClick={() =>
                          openSignUp({
                            fallbackRedirectUrl: "/dashboard",
                            unsafeMetadata: { role: "admin", onboardingComplete: false },
                          })
                        }
                      >
                        {plan.button}
                      </button>
                    )}

                    {/* ── Free plan (signed in) ── */}
                    {plan.plan === "free" && isSignedIn && (
                      <Button
                        size="lg"
                        className="w-full max-w-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg"
                        disabled={loadingPlan === "free"}
                        onClick={handleFreeSelect}
                      >
                        {loadingPlan === "free" ? "Updating..." : plan.button}
                      </Button>
                    )}

                    {/* ── Community plan → Stripe Checkout ── */}
                    {plan.plan === "community" && (
                      <Button
                        size="lg"
                        className="w-full max-w-xs font-semibold text-white bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 rounded-lg"
                        disabled={loadingPlan === "community"}
                        onClick={() =>
                          isSignedIn
                            ? handleCommunitySelect()
                            : router.push("/sign-in")
                        }
                      >
                        {loadingPlan === "community"
                          ? "Redirecting to payment..."
                          : plan.button}
                      </Button>
                    )}

                    {/* ── Enterprise plan → Contact sales ── */}
                    {plan.plan === "enterprise" && (
                      <Button
                        size="lg"
                        variant="outline"
                        className="w-full max-w-xs font-semibold border-gray-800 text-gray-800 hover:bg-gray-100 dark:border-gray-300 dark:text-gray-300 rounded-lg"
                        onClick={() => router.push("/contact")}
                      >
                        {plan.button}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          {/* Footer note */}
          <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-10">
            Payments are processed securely via Stripe. Cancel anytime from your billing dashboard.
          </p>
        </div>
      </section>
    </TooltipProvider>
  );
}
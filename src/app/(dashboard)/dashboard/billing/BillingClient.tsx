"use client";

import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";

type Props = {
  checkoutSuccess: boolean;
  checkoutCancelled: boolean;
};

export function BillingClient({ checkoutSuccess, checkoutCancelled }: Props) {
  const {
    subscription,
    isLoading,
    error,
    redirectToCheckout,
    redirectToPortal,
    refresh,
  } = useSubscription();

  return (
    <div className="p-6 max-w-lg">
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">Billing</h1>
      <p className="text-sm text-gray-600 mb-6">
        Manage your subscription and payment method.
      </p>

      {checkoutSuccess && (
        <p className="mb-4 rounded-md bg-green-50 text-green-800 text-sm px-3 py-2">
          Payment completed. Your plan may take a moment to update.
        </p>
      )}
      {checkoutCancelled && (
        <p className="mb-4 rounded-md bg-amber-50 text-amber-900 text-sm px-3 py-2">
          Checkout was cancelled. You can try again anytime.
        </p>
      )}

      {isLoading ? (
        <p className="text-gray-500">Loading subscription…</p>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : subscription ? (
        <div className="space-y-4">
          <div className="rounded-lg border p-4">
            <p className="text-sm text-gray-500">Current plan</p>
            <p className="text-lg font-medium capitalize">{subscription.plan}</p>
            <p className="text-sm text-gray-600 mt-1">
              {subscription.isActive ? "Active" : "Inactive"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() =>
                redirectToCheckout("community", "monthly").catch(console.error)
              }
            >
              Upgrade to Community
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                redirectToCheckout("enterprise", "monthly").catch(console.error)
              }
            >
              Upgrade to Enterprise
            </Button>
            <Button type="button" variant="outline" onClick={() => redirectToPortal().catch(console.error)}>
              Manage billing
            </Button>
            <Button type="button" variant="ghost" onClick={refresh}>
              Refresh status
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-gray-500">Unable to load subscription.</p>
      )}
    </div>
  );
}

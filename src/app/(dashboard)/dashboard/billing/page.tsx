import { BillingClient } from "./BillingClient";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; cancelled?: string }>;
}) {
  const sp = await searchParams;
  return (
    <BillingClient
      checkoutSuccess={sp.success === "true"}
      checkoutCancelled={sp.cancelled === "true"}
    />
  );
}

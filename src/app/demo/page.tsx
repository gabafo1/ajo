import Link from "next/link";

export default function DemoPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      <div className="max-w-lg text-center">
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">
          Balajo demo
        </h1>
        <p className="text-gray-600 mb-6">
          Balajo helps savings groups track contributions, cycles, payouts, and
          audit history. Sign in to use the dashboard, or explore pricing for
          paid tiers.
        </p>
        <ul className="text-left text-sm text-gray-600 space-y-2 mb-8 list-disc pl-5">
          <li>Dashboard with members and quick actions</li>
          <li>Transactions and (admin) audit reports</li>
          <li>Notifications, billing, and Paystack-ready group pools</li>
        </ul>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/sign-in"
            className="rounded-lg bg-gray-900 text-white px-4 py-2 text-sm font-medium hover:bg-gray-800"
          >
            Sign in
          </Link>
          <Link
            href="/pricing"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Pricing
          </Link>
          <Link href="/" className="text-primary text-sm underline self-center">
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}

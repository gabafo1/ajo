import { MetricCards, type Metric } from "@/app/(dashboard)/components/Metric-card";
import { Users, CreditCard, Activity, Coins } from "lucide-react";
import { UsersTable } from "@/app/(dashboard)/components/UsersTable";
import { GroupMembersTable } from "@/app/(dashboard)/components/GroupMembersTable";
import { AdBanner } from "@/app/(dashboard)/components/Ad-Banner";
import { ChartPie } from "../components/Chart-Pie";
import { ChartLine } from "../components/Chart-Line";
import {
  // Admin — platform-wide
  getSubscriptionsCount as getPlatformContributionsCount,
  getSubscriptionsBreakDown as getPlatformContributionBreakDown,
  getActiveSubsByPlanPerMonth as getPlatformCyclesPerMonth,
  getUserCount,
  getUserList,
  // User — group-scoped
  getGroupContributionsCount,
  getGroupContributionBreakDown,
  getGroupActiveCyclesPerMonth,
  getGroupPayouts,
  getGroupLastCycleContributions,
  getGroupMembers,
  getUserSubscription,
} from "@/app/(dashboard)/admin/actions";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { kyc } from "@/db/schema";
import { eq } from "drizzle-orm";
import QuickActions from "../components/Quick-Links";
import Link from "next/link";

export default async function Dashboard() {
  const user = await currentUser();

  // 🔒 Must be authenticated
  if (!user?.id) redirect("/sign-in");

  // 🔒 Must have completed onboarding (set by submitKYC action)
  //    Middleware handles this too, but the server component double-checks
  //    in case of stale JWT edge cases.
  const onboardingComplete = user.publicMetadata?.onboardingComplete === true;
  if (!onboardingComplete) redirect("/onboarding");

  const isAdmin = user.publicMetadata?.role === "admin";

  const subscription = await getUserSubscription();

  // Fetch KYC — groupName is the group identifier for non-admin users
  const existingKyc = await db
    .select()
    .from(kyc)
    .where(eq(kyc.userId, user.id));

  const groupName: string | null = existingKyc[0]?.groupName ?? null;

  // ── ADMIN BRANCH ──────────────────────────────────────────────────────────
  if (isAdmin) {
    const [
      platformContributions,
      platformBreakDown,
      platformCyclesPerMonth,
      totalUserCount,
      allUsers,
    ] = await Promise.all([
      getPlatformContributionsCount(),
      getPlatformContributionBreakDown(),
      getPlatformCyclesPerMonth(),
      getUserCount(),
      getUserList(),
    ]);

    const metrics: Metric[] = [
      {
        title: "Members",
        value: String(totalUserCount),
        change: "+60% from last cycle",
        icon: <Users className="h-4 w-4 text-muted-foreground" />,
      },
      {
        title: "Total Contributions",
        value: String(platformContributions),
        change: "+100% from last cycle",
        icon: <CreditCard className="h-4 w-4 text-muted-foreground" />,
      },
      {
        title: "Group Payouts",
        value: "₦200,000",
        change: "+200% from last cycle",
        icon: <Coins className="h-4 w-4 text-muted-foreground" />,
      },
      {
        title: "Last Cycle Contributions",
        value: "500",
        change: "+60% from last cycle",
        icon: <Activity className="h-4 w-4 text-muted-foreground" />,
      },
    ];

    return (
      <div className="container mx-auto p-4 space-y-4">
        <h1 className="text-3xl font-bold mb-6">
          Dashboard
          <span className="ml-3 text-sm font-normal text-muted-foreground bg-muted px-2 py-1 rounded">
            Admin View
          </span>
        </h1>

        <MetricCards metrics={metrics} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <ChartLine data={platformCyclesPerMonth} />
          </div>
          <div className="flex flex-col space-y-4">
            <AdBanner />
            <QuickActions />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1 lg:col-span-2">
            <div className="bg-card rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-bold m-4">Recent Members</h2>
              <UsersTable data={Array.isArray(allUsers) ? allUsers : (allUsers?.data ?? [])} />
            </div>
          </div>
          <ChartPie data={platformBreakDown} />
        </div>
      </div>
    );
  }

  // ── USER BRANCH ───────────────────────────────────────────────────────────
  // groupName may be null if the user hasn't been added to a group yet —
  // that's fine; we show an empty state instead of redirecting to /onboarding.
  const hasGroup = Boolean(groupName);

  const [
    groupContributions,
    groupBreakDown,
    groupCyclesPerMonth,
    groupPayouts,
    lastCycleContributions,
    groupMembers,
  ] = hasGroup
    ? await Promise.all([
        getGroupContributionsCount(groupName!),
        getGroupContributionBreakDown(groupName!),
        getGroupActiveCyclesPerMonth(groupName!),
        getGroupPayouts(groupName!),
        getGroupLastCycleContributions(groupName!),
        getGroupMembers(groupName!).then((members) =>
          members.map((m) => ({ ...m, groupName: m.groupName ?? "" }))
        ),
      ])
    : [0, [], [], "₦0", "0", []];

  const adaptedCyclesForChart = (groupCyclesPerMonth as { month: string; total: number }[]).map(
    (r) => ({
      month: new Date(r.month + "-01") as unknown as Date,
      monthLabel: r.month,
      monthlySubscriptions: r.total,
      yearlySubscriptions: 0,
    })
  );

  const adaptedBreakDownForChart = (groupBreakDown as { name: string; value: number }[]).map(
    (r) => ({
      plan: r.name as "free" | "community" | "enterprise",
      total: r.value,
    })
  );

  const members = groupMembers as { userId: string; firstName: string; lastName: string; groupName: string; phone: string | null }[];

  const metrics: Metric[] = [
    {
      title: "Group Members",
      value: String(members.length),
      change: "",
      icon: <Users className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: "Your Contributions",
      value: String(groupContributions),
      change: "",
      icon: <CreditCard className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: "Group Payouts",
      value: groupPayouts as string,
      change: "",
      icon: <Coins className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: "Last Cycle Contributions",
      value: lastCycleContributions as string,
      change: "",
      icon: <Activity className="h-4 w-4 text-muted-foreground" />,
    },
  ];

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {groupName ?? "My Dashboard"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {hasGroup
              ? `${members.length} member${members.length !== 1 ? "s" : ""} · Group Dashboard`
              : "You haven't been added to a group yet."}
          </p>
        </div>
      </div>

      <MetricCards metrics={metrics} />

      {hasGroup ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <ChartLine data={adaptedCyclesForChart} />
            </div>
            <div className="flex flex-col space-y-4">
              <AdBanner />
              <QuickActions />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1 lg:col-span-2">
              <div className="bg-card rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold">{groupName} — Members</h2>
                    <p className="text-sm text-muted-foreground">
                      Total: {members.length} member{members.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <GroupMembersTable data={members} />
              </div>
            </div>
            <ChartPie data={adaptedBreakDownForChart} />
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
          <Users className="h-12 w-12 mb-4 opacity-30" />
          <p className="text-lg font-medium">No group yet</p>
          <p className="text-sm mt-1">Get started with your savings group.</p>
          <Link href="/ajo/setup" className="mt-4 px-5 py-2.5 bg-green-600 text-white rounded-xl font-semibold text-sm">
            Get started
          </Link>
        </div>
      )}
    </div>
  );
}
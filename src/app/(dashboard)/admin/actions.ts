"use server";

import { db } from "@/db"
import {
    contributions,
    subscriptions,
    kyc,
    transactions,
    groupMembers,
    users,
    accounts,
    accountBalances,
    userReputation,
    notificationPreferences,
    auditLogs,
    groups,
    groupInvites,
} from "@/db/schema";
import { count, sql, asc, and, or, eq, isNull, desc, inArray } from "drizzle-orm"
import { auth, clerkClient } from "@clerk/nextjs/server";
import { Roles } from "@/types/globals";
import { revalidatePath } from "next/cache";
import { sendTransactionalEmail } from "@/services/email";

export type ActionStatus = "success" | "error" | "warning" | "default"

const ALLOWED_ROLES = ["admin", "member"] as const;
type AllowedRole = (typeof ALLOWED_ROLES)[number];

export const checkRole = async (role: Roles) => {
    const { sessionClaims } = await auth();
    return sessionClaims?.metadata.role === role;
}

export async function setRole(formData: FormData) {
    const client = await clerkClient();

    if (!await checkRole("admin")) {
        return { status: "error" as ActionStatus, message: "Unauthorized" }
    }

    const targetId = formData.get("id") as string;
    const newRole = formData.get("role") as string;

    if (!ALLOWED_ROLES.includes(newRole as AllowedRole)) {
        return { status: "error" as ActionStatus, message: "Invalid role" };
    }

    try {
        // Fetch existing metadata first so we don't clobber onboardingComplete
        // or any other publicMetadata fields already set on this user.
        const targetUser = await client.users.getUser(targetId);

        const res = await client.users.updateUser(targetId, {
            publicMetadata: {
                ...targetUser.publicMetadata,
                role: newRole as Roles,
            }
        });
        revalidatePath("/admin/users");
        return { message: res.publicMetadata, status: "success" as ActionStatus }
    } catch (err) {
        return {
            status: "error" as ActionStatus,
            message: err instanceof Error ? err.message : String(err),
        }
    }
}

export async function deleteUser(formData: FormData) {
    const client = await clerkClient();

    if (!await checkRole("admin")) {
        return { status: "error" as ActionStatus, message: "Unauthorized" }
    }

    try {
        const userId = formData.get("id") as string;
        await client.users.deleteUser(userId);
        revalidatePath("/admin/users");
        return { status: "success" as ActionStatus, message: "User deleted" }
    } catch (err) {
        return {
            status: "error" as ActionStatus,
            message: err instanceof Error ? err.message : String(err),
        }
    }
}

export async function removeRole(formData: FormData) {
    const client = await clerkClient();

    if (!await checkRole("admin")) {
        return { status: "error" as ActionStatus, message: "Unauthorized" }
    }

    try {
        const targetId = formData.get("id") as string;
        const targetUser = await client.users.getUser(targetId);

        const { role, ...rest } = targetUser.publicMetadata;
        const res = await client.users.updateUser(targetId, {
            publicMetadata: rest,
        });
        revalidatePath("/admin/users");
        return { message: res.publicMetadata, status: "success" as ActionStatus }
    } catch (err) {
        return {
            status: "error" as ActionStatus,
            message: err instanceof Error ? err.message : String(err),
        }
    }
}

export async function getInvitations() {
    if (!await checkRole("admin")) {
        return [];
    }

    const client = await clerkClient();
    const invitations = await client.invitations.getInvitationList({ status: "pending" })
    return invitations;
}

export async function revokeInvitation(invitationId: string) {
    if (!await checkRole("admin")) {
        return { status: "error" as ActionStatus, message: "Unauthorized" }
    }

    const client = await clerkClient();
    try {
        const res = await client.invitations.revokeInvitation(invitationId);
        revalidatePath("/admin/users");
        return {
            message: res.revoked,
            status: res.revoked ? "success" as ActionStatus : "error" as ActionStatus
        }
    } catch (err) {
        return {
            status: "error" as ActionStatus,
            message: err instanceof Error ? err.message : String(err),
        }
    }
}

export async function getUserCount() {
    if (!await checkRole("admin")) {
        return 0;
    }

    const client = await clerkClient();
    return await client.users.getCount();
}

export async function getUserList() {
    if (!await checkRole("admin")) {
        return [];
    }

    const client = await clerkClient();
    return await client.users.getUserList();
}

export async function sendInvitation(
    state: { message: string; status: ActionStatus },
    formData: FormData
): Promise<{ message: string; status: ActionStatus }> {
    if (!await checkRole("admin")) {
        return { status: "error" as ActionStatus, message: "Unauthorized" }
    }

    const client = await clerkClient();
    const email = formData.get("email") as string;

    const invitations = await client.invitations.getInvitationList({ status: "pending" })
    const existingInvitation = invitations.data.find(i => i.emailAddress === email)

    if (existingInvitation) {
        return { status: "warning" as ActionStatus, message: "User already invited" }
    }

    try {
        const invitation = await client.invitations.createInvitation({
            emailAddress: email,
            publicMetadata: {
                role: "user",
                onboardingComplete: false,
            }
        });
        if (invitation.status !== "pending") {
            return { status: "error" as ActionStatus, message: "Failed to send invitation!" }
        }
        revalidatePath("/admin/users");
        return { status: "success" as ActionStatus, message: "Invitation Sent!" }
    } catch (err) {
        return {
            status: "error" as ActionStatus,
            message: err instanceof Error ? err.message : "Failed to send invitation!"
        }
    }
}

export type GroupInviteFormState = {
    message: string;
    status: ActionStatus;
    inviteId?: string;
    joinUrl?: string;
};

export async function listGroupsForInvite(): Promise <
    { id: string; groupName: string }[]
> {
    if (!(await checkRole("admin"))) {
        return [];
    }
    return db
        .select({
            id: groups.id,
            groupName: groups.groupName,
        })
        .from(groups)
        .orderBy(asc(groups.groupName));
}

export type PendingGroupInviteRow = {
    id: string;
    email: string | null;
    groupName: string;
    createdAt: Date;
    expiresAt: Date | null;
};

export async function listPendingGroupInvites(): Promise <
    PendingGroupInviteRow[]
> {
    if (!(await checkRole("admin"))) {
        return [];
    }
    const rows = await db
        .select({
            id: groupInvites.id,
            email: groupInvites.email,
            createdAt: groupInvites.createdAt,
            expiresAt: groupInvites.expiresAt,
            groupName: groups.groupName,
        })
        .from(groupInvites)
        .innerJoin(groups, eq(groups.id, groupInvites.groupId))
        .where(eq(groupInvites.status, "pending"))
        .orderBy(desc(groupInvites.createdAt))
        .limit(50);

    return rows;
}

function escapeHtmlLite(s: string) {
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

export async function createGroupInvite(
    _prev: GroupInviteFormState,
    formData: FormData
): Promise<GroupInviteFormState> {
    if (!(await checkRole("admin"))) {
        return { message: "Unauthorized", status: "error" };
    }

    const { userId } = await auth();
    if (!userId) {
        return { message: "Unauthorized", status: "error" };
    }

    const groupId = (formData.get("groupId") as string)?.trim();
    const email = (formData.get("email") as string)?.trim().toLowerCase();

    if (!groupId || !email) {
        return {
            message: "Choose a group and enter an email address.",
            status: "error",
        };
    }

    const [g] = await db
        .select()
        .from(groups)
        .where(eq(groups.id, groupId))
        .limit(1);

    if (!g) {
        return { message: "Group not found.", status: "error" };
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 14);

    const [invite] = await db
        .insert(groupInvites)
        .values({
            groupId,
            invitedBy: userId,
            email,
            expiresAt,
            status: "pending",
        })
        .returning();

    const base = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
    const joinUrl = `${base}/ajo/join?invite=${invite.id}`;

    await db.insert(auditLogs).values({
        actorUserId: userId,
        action: "create",
        entityType: "group_invite",
        entityId: invite.id,
        newValues: { groupId, email },
    });

    if (process.env.RESEND_API_KEY) {
        try {
            const from =
                process.env.RESEND_INVITE_FROM ??
                process.env.CONTACT_FROM_EMAIL ??
                "Balajo <onboarding@resend.dev>";
            await sendTransactionalEmail({
                to: email,
                from,
                subject: `You're invited to ${g.groupName} on Balajo`,
                html: `<p>You've been invited to join the savings group <strong>${escapeHtmlLite(g.groupName)}</strong>.</p>
                       <p><a href="${joinUrl}">Accept invitation</a></p>
                       <p>If the link does not work, copy and paste this URL into your browser:</p>
                       <p style="word-break:break-all;font-size:12px;">${joinUrl}</p>`,
            });
        } catch (e) {
            console.error("Group invite email failed:", e);
        }
    }

    revalidatePath("/admin/users");
    return {
        message:
            "Group invite created. Share the link below. An email was sent if Resend is configured.",
        status: "success",
        inviteId: invite.id,
        joinUrl,
    };
}

// ─────────────────────────────────────────────
// ADMIN — Platform-wide queries
// ─────────────────────────────────────────────

export async function getUserSubscription() {
    const { userId } = await auth();
    if (!userId) return null;

    const [subscription] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId));

    return subscription ?? null;
}

export async function createOrUpdateSubscription(
    plan: "free"
) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const now = new Date();
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const email =
        user.emailAddresses.find(
            (address) => address.id === user.primaryEmailAddressId
        )?.emailAddress ??
        user.emailAddresses[0]?.emailAddress;

    if (!email) {
        throw new Error("User email not found");
    }

    await db.transaction(async (tx) => {
        await tx
            .insert(users)
            .values({
                clerkId: userId,
                email,
                firstName: user.firstName ?? "",
                lastName: user.lastName ?? "",
                isActive: true,
            })
            .onConflictDoUpdate({
                target: users.clerkId,
                set: {
                    email,
                    firstName: user.firstName ?? "",
                    lastName: user.lastName ?? "",
                    isActive: true,
                },
            });

        await tx
            .insert(subscriptions)
            .values({
                userId,
                plan,
                type: null,
                isActive: true,
                currentPeriodStart: now,
                currentPeriodEnd: null,
            })
            .onConflictDoUpdate({
                target: subscriptions.userId,
                set: {
                    plan,
                    isActive: true,
                    currentPeriodStart: now,
                    currentPeriodEnd: null,
                    type: null,
                },
            });

        await tx
            .insert(accounts)
            .values({
                type: "user_wallet",
                userId,
                name: `Wallet – ${userId}`,
            })
            .onConflictDoNothing();

        const [wallet] = await tx
            .select({ id: accounts.id })
            .from(accounts)
            .where(
                and(
                    eq(accounts.userId, userId),
                    eq(accounts.type, "user_wallet")
                )
            )
            .limit(1);

        await tx
            .insert(accountBalances)
            .values({
                accountId: wallet.id,
                balance: "0",
            })
            .onConflictDoNothing();

        await tx
            .insert(userReputation)
            .values({ userId })
            .onConflictDoNothing({ target: userReputation.userId });

        await tx
            .insert(notificationPreferences)
            .values({ userId })
            .onConflictDoNothing({ target: notificationPreferences.userId });

        await tx.insert(auditLogs).values({
            actorUserId: userId,
            action: "subscription_change",
            entityType: "subscription",
            entityId: userId,
            newValues: { plan },
        });
    });
}

export async function getSubscriptionsCount() {
    const data = await db.select({ count: count() }).from(subscriptions);
    return data[0].count;
}

export async function getSubscriptionsBreakDown() {
    return await db.select({
        plan: subscriptions.plan,
        total: sql<number>`count(*)`,
    })
        .from(subscriptions)
        .where(eq(subscriptions.isActive, true))
        .groupBy(subscriptions.plan);
}

export async function getActiveSubsByPlanPerMonth(interval: number = 12) {
    return await db.select({
        month: sql<Date>`date_trunc('month', series.month)`,
        monthLabel: sql<string>`to_char(date_trunc('month', series.month), 'Mon YYYY')`,
        monthlySubscriptions: sql<number>`count(*) filter (
            where ${subscriptions.type} = 'monthly'
            and ${subscriptions.currentPeriodStart} <= series.month
            and (${subscriptions.currentPeriodEnd} is null or ${subscriptions.currentPeriodEnd} >= series.month)
        )`,
        yearlySubscriptions: sql<number>`count(*) filter (
            where ${subscriptions.type} = 'yearly'
            and ${subscriptions.currentPeriodStart} <= series.month
            and (${subscriptions.currentPeriodEnd} is null or ${subscriptions.currentPeriodEnd} >= series.month)
        )`,
    })
        .from(sql`
            (
                SELECT generate_series(
                DATE_TRUNC('month', CURRENT_DATE - (${interval}::integer || ' months')::interval),
                DATE_TRUNC('month', CURRENT_DATE),
                '1 month'::interval
                ) as month
            ) as series
        `)
        .leftJoin(subscriptions, sql`
            ${subscriptions.currentPeriodStart} <= series.month
            and (${subscriptions.currentPeriodEnd} is null or ${subscriptions.currentPeriodEnd} >= series.month)
        `)
        .groupBy(
            sql`DATE_TRUNC('month', series.month)`,
            sql`to_char(date_trunc('month', series.month), 'Mon YYYY')`
        )
        .orderBy(asc(sql`DATE_TRUNC('month', series.month)`));
}

export async function getContributionsCount() {
    const result = await db
        .select({ total: sql<number>`SUM(${contributions.amount})` })
        .from(contributions);
    return result[0]?.total ?? 0;
}

export async function getContributionBreakDown() {
    const result = await db
        .select({
            groupId: contributions.groupId,
            total: sql<number>`SUM(${contributions.amount})`,
        })
        .from(contributions)
        .groupBy(contributions.groupId);

    return result.map((r) => ({ name: r.groupId, value: Number(r.total) }));
}

export async function getActiveCyclesPerMonth() {
    const result = await db
        .select({
            month: sql<string>`TO_CHAR(${sql`DATE_TRUNC('month', ${groups.createdAt})`}, 'YYYY-MM')`,
            total: sql<number>`COUNT(*)`,
        })
        .from(groups)
        .where(eq(groups.isActive, true))
        .groupBy(sql`TO_CHAR(${sql`DATE_TRUNC('month', ${groups.createdAt})`}, 'YYYY-MM')`)
        .orderBy(sql`TO_CHAR(${sql`DATE_TRUNC('month', ${groups.createdAt})`}, 'YYYY-MM')`);

    return result.map((r) => ({ month: r.month, total: Number(r.total) }));
}

export async function getRecentContributions(limit = 10) {
    const result = await db
        .select()
        .from(contributions)
        .orderBy(desc(contributions.createdAt))
        .limit(limit);

    return result.map((c) => ({
        id: c.id,
        date: c.createdAt?.toISOString() ?? "",
        amount: c.amount,
        type: "contribution" as const,
        status: c.status as "completed" | "pending" | "failed",
        contributor: c.userId,
    }));
}

// ─────────────────────────────────────────────
// USER — Group-scoped queries (non-admin)
// ─────────────────────────────────────────────

export async function getGroupContributionsCount(groupId: string) {
    const result = await db
        .select({ total: sql<number>`SUM(${contributions.amount})` })
        .from(contributions)
        .where(eq(contributions.groupId, groupId));

    return result[0]?.total ?? 0;
}

export async function getGroupContributionBreakDown(groupId: string) {
    const result = await db
        .select({
            userId: contributions.userId,
            total: sql<number>`SUM(${contributions.amount})`,
        })
        .from(contributions)
        .where(eq(contributions.groupId, groupId))
        .groupBy(contributions.userId);

    return result.map((r) => ({
        name: r.userId,
        value: Number(r.total),
    }));
}

export async function getGroupActiveCyclesPerMonth(groupId: string) {
    const result = await db
        .select({
            month: sql<string>`TO_CHAR(${contributions.createdAt}, 'YYYY-MM')`,
            total: sql<number>`SUM(${contributions.amount})`,
        })
        .from(contributions)
        .where(eq(contributions.groupId, groupId))
        .groupBy(sql`TO_CHAR(${contributions.createdAt}, 'YYYY-MM')`)
        .orderBy(sql`TO_CHAR(${contributions.createdAt}, 'YYYY-MM')`);

    return result.map((r) => ({ month: r.month, total: Number(r.total) }));
}

export async function getGroupPayouts(groupId: string): Promise<string> {
    const members = await db
        .selectDistinct({ userId: groupMembers.userId })
        .from(groupMembers)
        .where(eq(groupMembers.groupId, groupId));

    const memberIds = members.map((m) => m.userId);
    if (memberIds.length === 0) return "₦0";

    const result = await db
        .select({ total: sql<number>`SUM(${transactions.amount})` })
        .from(transactions)
        .where(
            and(
                eq(transactions.groupId, groupId),
                eq(transactions.type, "withdrawal"),
                eq(transactions.status, "completed"),
                inArray(transactions.userId, memberIds)
            )
        );

    const total = result[0]?.total ?? 0;
    return `₦${Number(total).toLocaleString()}`;
}

export async function getGroupLastCycleContributions(groupId: string): Promise<string> {
    const lastMonthResult = await db
        .select({
            lastMonth: sql<string>`MAX(TO_CHAR(${contributions.createdAt}, 'YYYY-MM'))`,
        })
        .from(contributions)
        .where(eq(contributions.groupId, groupId));

    const lastMonth = lastMonthResult[0]?.lastMonth;
    if (!lastMonth) return "0";

    const result = await db
        .select({ total: sql<number>`SUM(${contributions.amount})` })
        .from(contributions)
        .where(
            and(
                eq(contributions.groupId, groupId),
                sql`TO_CHAR(${contributions.createdAt}, 'YYYY-MM') = ${lastMonth}`
            )
        );

    return String(result[0]?.total ?? 0);
}

// FIX: pulls groupName from the `groups` table (the actual source of truth
// for a group's name) instead of `kyc.groupName`, which is being removed
// from onboarding and was never a reliable per-member value anyway.
export async function getGroupMembers(groupId: string) {
    const [group] = await db
        .select({ groupName: groups.groupName })
        .from(groups)
        .where(eq(groups.id, groupId));

    const groupName = group?.groupName ?? "";

    const memberRows = await db
        .select({ userId: groupMembers.userId })
        .from(groupMembers)
        .where(eq(groupMembers.groupId, groupId));

    const memberIds = memberRows.map((m) => m.userId);
    if (memberIds.length === 0) return [];

    const members = await db
        .select({
            userId: kyc.userId,
            firstName: kyc.firstName,
            lastName: kyc.lastName,
            phone: kyc.phone,
        })
        .from(kyc)
        .where(inArray(kyc.userId, memberIds));

    return members.map((m) => ({ ...m, groupName }));
}
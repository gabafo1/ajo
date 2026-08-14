import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";

const ACTION_LABEL: Record<string, string> = {
  create: "Create",
  update: "Update",
  delete: "Delete",
  login: "Login",
  logout: "Logout",
  contribution: "Contribution",
  withdrawal: "Withdrawal",
  subscription_change: "Subscription",
  role_change: "Role change",
  kyc_update: "KYC update",
};

export async function GET() {
  const { sessionClaims, userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (sessionClaims?.metadata?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await db
    .select()
    .from(auditLogs)
    .orderBy(desc(auditLogs.createdAt))
    .limit(200);

  const logs = rows.map((row) => ({
    id: row.id,
    timestamp: row.createdAt.toISOString(),
    action: row.action,
    actionLabel: ACTION_LABEL[row.action] ?? row.action,
    status: "success" as const,
    user: row.actorUserId,
    details: `${row.entityType} ${row.entityId}${row.newValues ? ` — ${JSON.stringify(row.newValues)}` : ""}`,
  }));

  return NextResponse.json({ logs });
}

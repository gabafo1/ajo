import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { groupInvites, groupMembers, groups } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const [row] = await db
    .select({
      invite: groupInvites,
      groupName: groups.groupName,
    })
    .from(groupInvites)
    .innerJoin(groups, eq(groups.id, groupInvites.groupId))
    .where(eq(groupInvites.id, id))
    .limit(1);

  if (!row || row.invite.status !== "pending") {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  if (row.invite.expiresAt && new Date(row.invite.expiresAt) < new Date()) {
    return NextResponse.json({ error: "Invite expired" }, { status: 410 });
  }

  return NextResponse.json({
    groupName: row.groupName,
    expiresAt: row.invite.expiresAt?.toISOString() ?? null,
  });
}

export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const [row] = await db
    .select()
    .from(groupInvites)
    .where(eq(groupInvites.id, id))
    .limit(1);

  if (!row || row.status !== "pending") {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  if (row.expiresAt && new Date(row.expiresAt) < new Date()) {
    return NextResponse.json({ error: "Invite expired" }, { status: 410 });
  }

  const user = await currentUser();
  const primaryEmail =
    user?.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
      ?.emailAddress ??
    user?.emailAddresses[0]?.emailAddress;

  if (!primaryEmail) {
    return NextResponse.json({ error: "No email on account" }, { status: 400 });
  }

  if (
    row.email &&
    primaryEmail.toLowerCase() !== row.email.toLowerCase()
  ) {
    return NextResponse.json(
      { error: "This invite was sent to a different email address" },
      { status: 403 }
    );
  }

  await db
    .insert(groupMembers)
    .values({
      clerkId: userId,
      userId: userId,
      groupId: row.groupId,
      role: "member",
    })
    .onConflictDoNothing({
      target: [groupMembers.groupId, groupMembers.userId],
    });

  await db
    .update(groupInvites)
    .set({ status: "accepted" })
    .where(eq(groupInvites.id, id));

  return NextResponse.json({ success: true, groupId: row.groupId });
}

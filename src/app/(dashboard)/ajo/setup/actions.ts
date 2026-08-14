"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { groups, groupMembers, accounts } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { initiateGroupActivation } from "@/app/(actions)/group-activation"; // from earlier

// Returns the group the current user OWNS (there's always exactly one,
// created automatically at onboarding), plus basic membership stats.
export async function getMyOwnedGroup() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const [membership] = await db
    .select()
    .from(groupMembers)
    .where(and(eq(groupMembers.userId, userId), eq(groupMembers.role, "owner")));

  if (!membership) return null;

  const [group] = await db
    .select()
    .from(groups)
    .where(eq(groups.id, membership.groupId));

  if (!group) return null;

  const members = await db
    .select()
    .from(groupMembers)
    .where(eq(groupMembers.groupId, group.id));

  return { group, memberCount: members.length };
}

// A group is "untouched" if the owner hasn't configured or activated it yet —
// safe to discard if the user decides to join someone else's group instead.
function isUntouchedGroup(group: typeof groups.$inferSelect, memberCount: number) {
  return !group.isEnabled && memberCount <= 1 && group.contributionAmount === "0.00";
}

export async function configureMyGroup(formData: FormData) {
  const { userId } = await auth();
  if (!userId) return { status: "error" as const, message: "Unauthorized" };

  const owned = await getMyOwnedGroup();
  if (!owned) return { status: "error" as const, message: "No owned group found" };

  const groupName = (formData.get("groupName") as string)?.trim();
  const contributionAmount = (formData.get("contributionAmount") as string)?.trim();
  const cycleDurationDays = Number(formData.get("cycleDurationDays"));
  const maxMembers = Number(formData.get("maxMembers"));
  const isPublic = formData.get("isPublic") === "true";

  const errors: Record<string, string> = {};
  if (!groupName) errors.groupName = "Group name is required";
  if (!contributionAmount || Number(contributionAmount) <= 0)
    errors.contributionAmount = "Enter a valid contribution amount";
  if (!cycleDurationDays || cycleDurationDays < 1)
    errors.cycleDurationDays = "Enter a valid cycle length in days";
  if (!maxMembers || maxMembers < 2)
    errors.maxMembers = "Group needs at least 2 members";

  if (Object.keys(errors).length > 0) {
    return { status: "error" as const, message: "Please fix the errors below", errors };
  }

  await db
    .update(groups)
    .set({
      groupName,
      contributionAmount,
      cycleDurationDays,
      maxMembers,
      isPublic,
    })
    .where(eq(groups.id, owned.group.id));

  return { status: "success" as const, groupId: owned.group.id };
}

// Kicks off the Paystack activation flow for the group the user owns.
export async function activateMyGroup() {
  const owned = await getMyOwnedGroup();
  if (!owned) throw new Error("No owned group found");
  return initiateGroupActivation(owned.group.id);
}

export async function getJoinableGroups() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  return db
    .select()
    .from(groups)
    .where(and(eq(groups.isPublic, true), eq(groups.isActive, true)));
}

// Leaves/discards the auto-created owned group (only if untouched) and
// joins the selected group as a regular member instead.
export async function joinGroup(targetGroupId: string) {
  const { userId } = await auth();
  if (!userId) return { status: "error" as const, message: "Unauthorized" };

  const owned = await getMyOwnedGroup();

  if (owned && !isUntouchedGroup(owned.group, owned.memberCount)) {
    return {
      status: "error" as const,
      message: "You've already configured or activated your own group — you can't join another one.",
    };
  }

  const [targetGroup] = await db.select().from(groups).where(eq(groups.id, targetGroupId));
  if (!targetGroup) return { status: "error" as const, message: "Group not found" };

  const memberCount = (
    await db.select().from(groupMembers).where(eq(groupMembers.groupId, targetGroupId))
  ).length;
  if (memberCount >= targetGroup.maxMembers) {
    return { status: "error" as const, message: "This group is already full" };
  }

  if (owned) {
    // Discard the untouched auto-created group and its pool account.
    await db.delete(accounts).where(eq(accounts.groupId, owned.group.id));
    await db.delete(groupMembers).where(eq(groupMembers.groupId, owned.group.id));
    await db.delete(groups).where(eq(groups.id, owned.group.id));
  }

  await db.insert(groupMembers).values({
    clerkId: userId,
    userId,
    groupId: targetGroupId,
    role: "member",
  });

  return { status: "success" as const, groupId: targetGroupId };
}
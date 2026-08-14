"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/db";
import { groups, groupMembers, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createAccount } from "@/services/accounts";
import { revalidatePath } from "next/cache";

export type CreateGroupState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success"; groupId: string };

export async function createGroupAction(
  _prev: CreateGroupState,
  formData: FormData
): Promise<CreateGroupState> {
  const { userId } = await auth();
  if (!userId) {
    return { status: "error", message: "You must be signed in." };
  }

  const groupName = (formData.get("groupName") as string)?.trim();
  const contributionRaw = (formData.get("contributionAmount") as string)?.trim();
  const cycleDaysRaw = (formData.get("cycleDurationDays") as string)?.trim();

  if (!groupName) {
    return { status: "error", message: "Group name is required." };
  }

  const contributionAmount = contributionRaw || "0.00";
  const cycleDurationDays = Math.max(1, parseInt(cycleDaysRaw || "31", 10) || 31);

  const slugBase = groupName
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

  let slug = slugBase || `group-${userId.slice(-6)}`;
  const clash = await db.select().from(groups).where(eq(groups.slug, slug)).limit(1);
  if (clash[0]) {
    slug = `${slugBase}-${Date.now().toString(36)}`;
  }

  try {
    const client = await clerkClient();
    const cu = await client.users.getUser(userId);
    const email = cu.emailAddresses[0]?.emailAddress ?? "";

    await db
      .insert(users)
      .values({
        clerkId: userId,
        email,
        firstName: cu.firstName ?? "",
        lastName: cu.lastName ?? "",
      })
      .onConflictDoUpdate({
        target: users.clerkId,
        set: {
          email,
          firstName: cu.firstName ?? "",
          lastName: cu.lastName ?? "",
        },
      });

    const [group] = await db
      .insert(groups)
      .values({
        groupName,
        slug,
        ownerId: userId,
        contributionAmount,
        cycleDurationDays,
        maxMembers: 10,
      })
      .returning();

    await db.insert(groupMembers).values({
      clerkId: userId,
      userId: userId,
      groupId: group.id,
      role: "owner",
    });

    await createAccount({
      type: "group_pool",
      groupId: group.id,
      name: `${groupName} pool`,
    });

    revalidatePath("/dashboard");
    revalidatePath("/schedule");

    return { status: "success", groupId: group.id };
  } catch (e) {
    return {
      status: "error",
      message: e instanceof Error ? e.message : "Could not create group.",
    };
  }
}
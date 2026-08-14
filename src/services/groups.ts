import { db } from "@/db";
import { groups, groupMembers } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function createGroup({
  groupName,
  slug,
  ownerId,
  organizationId,
  contributionAmount,
  cycleDurationDays,
}: {
  groupName: string;
  slug: string;
  ownerId: string;
  organizationId?: string | null;
  contributionAmount: string;
  cycleDurationDays: number;
}) {

  const [group] = await db
    .insert(groups)
    .values({
      groupName,
      slug,
      ownerId,
      organizationId: organizationId ?? undefined,
      contributionAmount,
      cycleDurationDays,
    })
    .returning();

  // Creator becomes ADMIN
  await db.insert(groupMembers).values({
    clerkId: ownerId,
    groupId: group.id,
    userId: ownerId,
    role: "owner",
  });

  return group;
}

export async function getOrganizationGroups(orgId: string) {
  return db
    .select()
    .from(groups)
    .where(eq(groups.organizationId, orgId));
}
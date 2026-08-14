import { db } from "@/db";
import { organizations } from "@/db/schema";
import { organizationMembers } from "@/db/schema";

export async function addMemberToOrganization({
  organizationId,
  userId,
  role,
}: {
  organizationId: string;
  userId: string;
  role?: string;
}) {

  await db.insert(organizationMembers)
    .values({
      organizationId,
      userId,
      role
    });

}

export async function createOrganization({
  name,
  slug,
  ownerId,
  description,
}: {
  name: string;
  slug: string;
  ownerId: string;
  description?: string | null;
}) {

  const [org] = await db.insert(organizations)
    .values({
      name,
      slug,
      ownerId,
      description
    })
    .returning();

  return org;

}
import { db } from "@/db";
import { groupInvites } from "@/db/schema";

export async function createInvite({
  groupId,
  invitedBy,
  email,
}: {
  groupId: string;
  invitedBy: string;
  email: string;
}) {
  const [invite] = await db
    .insert(groupInvites)
    .values({
      groupId,
      invitedBy,
      email,
    })
    .returning();

  return invite;
}
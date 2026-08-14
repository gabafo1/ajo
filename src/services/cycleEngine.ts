import { db } from "@/db";
import { contributions, groupMembers, cycles } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function isCycleComplete(cycleId: string, groupId: string) {

  const members = await db
    .select()
    .from(groupMembers)
    .where(eq(groupMembers.groupId, groupId));

  const paidMembers = await db
    .select()
    .from(contributions)
    .where(eq(contributions.cycleId, cycleId));

  return paidMembers.length === members.length;
}
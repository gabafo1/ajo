import { db } from "@/db";
import { contributions, cycles, groupMembers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { adjustUserScore } from "@/services/reputation";

export async function detectMissedPayments(cycleId: string, groupId: string) {

  const members = await db
    .select()
    .from(groupMembers)
    .where(eq(groupMembers.groupId, groupId));

  const paid = await db
    .select()
    .from(contributions)
    .where(eq(contributions.cycleId, cycleId));

  const paidUsers = paid.map(p => p.userId);

  for (const member of members) {

    if (!paidUsers.includes(member.userId)) {

      await adjustUserScore(member.userId, -40);

    }

  }
}
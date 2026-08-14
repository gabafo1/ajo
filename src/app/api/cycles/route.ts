import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { cycles, groupMembers, groups } from "@/db/schema";
import { desc, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const memberships = await db
    .select({ groupId: groupMembers.groupId })
    .from(groupMembers)
    .where(eq(groupMembers.userId, userId));

  const groupIds = [...new Set(memberships.map((m) => m.groupId))];
  if (groupIds.length === 0) {
    return NextResponse.json({ cycles: [] });
  }

  const cycleRows = await db
    .select({
      cycle: cycles,
      groupName: groups.groupName,
    })
    .from(cycles)
    .innerJoin(groups, eq(groups.id, cycles.groupId))
    .where(inArray(cycles.groupId, groupIds))
    .orderBy(desc(cycles.startDate));

  const payload = cycleRows.map(({ cycle, groupName }) => ({
    id: cycle.id,
    groupId: cycle.groupId,
    groupName,
    cycleNumber: cycle.cycleNumber,
    status: cycle.status,
    startDate: cycle.startDate.toISOString(),
    endDate: cycle.endDate.toISOString(),
    beneficiaryUserId: cycle.beneficiaryUserId,
  }));

  return NextResponse.json({ cycles: payload });
}

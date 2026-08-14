import { db } from "@/db";
import { cycles } from "@/db/schema";

export async function createCycle({
  groupId,
  cycleNumber,
  beneficiaryUserId,
  startDate,
  endDate,
}: {
  groupId: string;
  cycleNumber: number;
  beneficiaryUserId: string;
  startDate: Date;
  endDate: Date;
}) {
  const [cycle] = await db
    .insert(cycles)
    .values({
      groupId,
      cycleNumber,
      beneficiaryUserId,
      startDate,
      endDate,
    })
    .returning();

  return cycle;
}
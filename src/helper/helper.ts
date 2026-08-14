import { db } from "@/db";
import { cycles } from "@/db/schema";

export async function createNextCycle(groupId: string, nextBeneficiary: string, cycleNumber: number) {

  await db.insert(cycles).values({
    groupId,
    cycleNumber,
    beneficiaryUserId: nextBeneficiary,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    status: "active"
  });

}
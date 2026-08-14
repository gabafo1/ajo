import { db } from "@/db";
import { groupPayouts } from "@/db/schema";

export async function schedulePayout({
  groupId,
  beneficiaryUserId,
  cycleNumber,
  totalAmount,
  scheduledDate,
}: {
  groupId: string;
  beneficiaryUserId: string;
  cycleNumber: number;
  totalAmount: string;
  scheduledDate: Date;
}) {
  const [payout] = await db
    .insert(groupPayouts)
    .values({
      groupId,
      beneficiaryUserId,
      cycleNumber,
      totalAmount,
      scheduledDate,
      status: "scheduled",
    })
    .returning();

  return payout;
}
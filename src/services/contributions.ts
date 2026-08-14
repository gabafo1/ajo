import { db } from "@/db";
import { contributions } from "@/db/schema";

export async function createContribution({
  groupId,
  userId,
  amount,
  cycleId,
  transactionId,
}: {
  groupId: string;
  userId: string;
  amount: string;
  cycleId?: string;
  transactionId?: string;
}) {
  const [contribution] = await db
    .insert(contributions)
    .values({
      groupId,
      userId,
      amount,
      cycleId,
      transactionId,
      status: "completed",
    })
    .returning();

  return contribution;
}
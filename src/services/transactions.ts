import { db } from "@/db";
import { transactions } from "@/db/schema";
import { eq } from "drizzle-orm"

export async function createTransaction({
  userId,
  groupId,
  type,
  amount,
  reference,
  paymentProvider,
}: {
  userId: string;
  groupId?: string;
  type: "contribution" | "withdrawal" | "refund";
  amount: string;
  reference: string;
  paymentProvider?: string;
}) {
  const [txn] = await db
    .insert(transactions)
    .values({
      userId,
      groupId,
      type,
      amount,
      reference,
      status: "pending",
      paymentProvider,
    })
    .returning();

  return txn;
}

export async function markTransactionCompleted(
  transactionId: string
) {
  await db
    .update(transactions)
    .set({
      status: "completed",
    })
    .where(eq(transactions.id, transactionId));
}
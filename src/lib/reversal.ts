import { db } from "@/db";
import { ledgerTransactions, ledgerEntries } from "@/db/schema";
import { eq } from "drizzle-orm";
import { postLedgerTransaction } from "@/services/ledger";

export async function reverseTransaction({
  originalTransactionId,
  reversedBy,
  reason,
}: {
  originalTransactionId: string;
  reversedBy: string;
  reason?: string;
}) {
  const [original] = await db
    .select()
    .from(ledgerTransactions)
    .where(eq(ledgerTransactions.id, originalTransactionId));

  if (!original) {
    throw new Error("Original transaction not found");
  }

  if (original.status === "reversed") {
    throw new Error("Transaction already reversed");
  }

  const originalEntries = await db
    .select()
    .from(ledgerEntries)
    .where(eq(ledgerEntries.transactionId, originalTransactionId));

  if (originalEntries.length === 0) {
    throw new Error("No ledger entries found");
  }

  const reversal = await postLedgerTransaction({
    reference: `REV-${original.reference}`,
    description: reason || `Reversal of ${original.reference}`,
    createdBy: reversedBy,
    entries: originalEntries.map((entry) => ({
      accountId: entry.accountId,
      type: (entry.type === "debit" ? "credit" : "debit") as "debit" | "credit",
      amount: String(entry.amount),
    })),
  });

  await db
    .update(ledgerTransactions)
    .set({
      status: "reversed",
      reversedTransactionId: reversal.id,
    })
    .where(eq(ledgerTransactions.id, originalTransactionId));

  return reversal;
}

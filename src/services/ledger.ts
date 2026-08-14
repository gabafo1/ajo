import { db } from "@/db";
import {
  ledgerTransactions,
  ledgerEntries,
} from "@/db/schema";

export async function postLedgerTransaction({
  reference,
  description,
  entries,
  createdBy,
}: {
  reference: string;
  description?: string;
  createdBy?: string;
  entries: {
    accountId: string;
    type: "debit" | "credit";
    amount: string;
  }[];
}) {
  const totalDebit = entries
    .filter((e) => e.type === "debit")
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const totalCredit = entries
    .filter((e) => e.type === "credit")
    .reduce((sum, e) => sum + Number(e.amount), 0);

  if (totalDebit !== totalCredit) {
    throw new Error("Ledger not balanced");
  }

  return await db.transaction(async (tx) => {
    const [txn] = await tx
      .insert(ledgerTransactions)
      .values({
        reference,
        description,
        createdBy,
      })
      .returning();

    await tx.insert(ledgerEntries).values(
      entries.map((e) => ({
        transactionId: txn.id,
        accountId: e.accountId,
        type: e.type,
        amount: e.amount,
      }))
    );

    return txn;
  });
}
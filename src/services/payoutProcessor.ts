import { db } from "@/db";
import { groupPayouts, cycles, contributions } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { postLedgerTransaction } from "./ledger";
import { getGroupPoolAccount, getUserWallet } from "./accounts";

export async function processCyclePayout(cycleId: string) {
  const [cycle] = await db
    .select()
    .from(cycles)
    .where(eq(cycles.id, cycleId));

  if (!cycle) throw new Error("Cycle not found");

  const [sumRow] = await db
    .select({
      total: sql<string>`coalesce(sum(${contributions.amount}::numeric), 0)::text`,
    })
    .from(contributions)
    .where(
      and(
        eq(contributions.cycleId, cycleId),
        eq(contributions.status, "completed")
      )
    );

  const payoutAmount = sumRow?.total ?? "0";
  if (Number(payoutAmount) <= 0) {
    throw new Error("No completed contribution total for this cycle");
  }

  const pool = await getGroupPoolAccount(cycle.groupId);
  const beneficiaryWallet = await getUserWallet(cycle.beneficiaryUserId);

  if (!pool) {
    throw new Error("Group pool account not found");
  }
  if (!beneficiaryWallet) {
    throw new Error("Beneficiary wallet not found");
  }

  const reference = `payout_${cycleId}_${Date.now()}`;

  const ledgerTxn = await postLedgerTransaction({
    reference,
    description: "Ajo cycle payout",
    createdBy: cycle.beneficiaryUserId,
    entries: [
      {
        accountId: pool.id,
        type: "debit",
        amount: payoutAmount,
      },
      {
        accountId: beneficiaryWallet.id,
        type: "credit",
        amount: payoutAmount,
      },
    ],
  });

  await db.insert(groupPayouts).values({
    groupId: cycle.groupId,
    cycleId: cycle.id,
    beneficiaryUserId: cycle.beneficiaryUserId,
    cycleNumber: cycle.cycleNumber,
    totalAmount: payoutAmount,
    scheduledDate: new Date(),
    status: "paid",
    ledgerTransactionId: ledgerTxn.id,
  });

  await db
    .update(cycles)
    .set({ status: "completed" })
    .where(eq(cycles.id, cycleId));
}

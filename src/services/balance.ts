import { db } from "@/db";
import { accountBalances } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getAccountBalance(accountId: string) {
  const [balance] = await db
    .select()
    .from(accountBalances)
    .where(eq(accountBalances.accountId, accountId));

  return balance?.balance ?? "0";
}

export async function updateBalance(
  accountId: string,
  amount: number
) {
  await db
    .update(accountBalances)
    .set({
      balance: amount.toString(),
    })
    .where(eq(accountBalances.accountId, accountId));
}
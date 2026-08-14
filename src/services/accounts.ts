import { db } from "@/db";
import { accounts, accountBalances, accountTypeEnum } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function createAccount({
  type,
  userId,
  groupId,
  name,
}: {
  type: typeof accountTypeEnum.enumValues[number];
  userId?: string;
  groupId?: string;
  name: string;
}) {
  const [account] = await db
    .insert(accounts)
    .values({
      type,
      userId,
      groupId,
      name,
    })
    .returning();

  await db.insert(accountBalances).values({
    accountId: account.id,
  });

  return account;
}

export async function getUserWallet(userId: string) {
  const [wallet] = await db
    .select()
    .from(accounts)
    .where(
      and(eq(accounts.userId, userId), eq(accounts.type, "user_wallet"))
    )
    .limit(1);

  return wallet;
}

export async function getGroupPoolAccount(groupId: string) {
  const [pool] = await db
    .select()
    .from(accounts)
    .where(
      and(eq(accounts.groupId, groupId), eq(accounts.type, "group_pool"))
    )
    .limit(1);

  return pool;
}
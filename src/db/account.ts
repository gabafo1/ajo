import { eq } from "drizzle-orm";
import { db } from "./index";
import { accounts, accountBalances } from "./schema";

/**
 * Provisioning hook for Clerk `user.created` (and similar).
 * Maps webhook shapes to the `accounts` / `account_balances` schema.
 */
export async function createAccount({
  ownerType,
  ownerId,
  accountType,
}: {
  ownerType: "user" | "group";
  ownerId: string;
  accountType: string;
}) {
  if (ownerType === "user" && accountType === "wallet") {
    const existing = await db
      .select()
      .from(accounts)
      .where(eq(accounts.userId, ownerId))
      .limit(1);

    if (existing[0]) {
      return existing[0];
    }

    const [account] = await db
      .insert(accounts)
      .values({
        type: "user_wallet",
        userId: ownerId,
        name: "Personal wallet",
      })
      .returning();

    await db.insert(accountBalances).values({
      accountId: account.id,
    });

    return account;
  }

  throw new Error(`Unsupported account: ${ownerType}/${accountType}`);
}

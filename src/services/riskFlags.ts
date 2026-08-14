import { db } from "@/db";
import { riskFlags } from "@/db/schema";

export async function flagUser(userId: string, reason: string) {

  await db.insert(riskFlags).values({
    userId,
    reason,
    severity: 2
  });

}
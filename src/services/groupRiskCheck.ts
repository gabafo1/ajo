import { db } from "@/db";
import { userReputation } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function canJoinGroup(userId: string) {

  const [rep] = await db
    .select()
    .from(userReputation)
    .where(eq(userReputation.userId, userId));

  if (!rep) return true;

  if (rep.score < 40) {
    return false;
  }

  return true;
}

export async function canReceivePayout(userId: string) {

    const [rep] = await db
      .select()
      .from(userReputation)
      .where(eq(userReputation.userId, userId));
  
    if (!rep) return true;
  
    if (rep.score < 60) {
  
      throw new Error("User reputation too low for payout");
  
    }
  
  }

import { db } from "@/db";
import { userReputation } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function adjustUserScore(userId: string, delta: number) {

  const [rep] = await db
    .select()
    .from(userReputation)
    .where(eq(userReputation.userId, userId));

  if (!rep) {
    await db.insert(userReputation).values({
      userId,
      score: 100 + delta
    });
    return;
  }

  await db
    .update(userReputation)
    .set({
      score: rep.score + delta
    })
    .where(eq(userReputation.userId, userId));
}
import { db } from "@/db";
import { cycles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { detectMissedPayments } from "@/cron/cron";

/**
 * Vercel Cron (or any scheduler) should call:
 *   GET /api/cron/missed-payments
 * with header: Authorization: Bearer ${CRON_SECRET}
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not set" },
      { status: 503 }
    );
  }

  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const activeCycles = await db
    .select()
    .from(cycles)
    .where(eq(cycles.status, "active"));

  for (const c of activeCycles) {
    await detectMissedPayments(c.id, c.groupId);
  }

  return NextResponse.json({
    ok: true,
    cyclesProcessed: activeCycles.length,
  });
}

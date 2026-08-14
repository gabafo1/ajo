import { NextResponse } from "next/server";
import { processNotifications } from "@/services/notificationWorker";

/**
 * Process pending in-app / email / SMS notifications.
 * Authorization: Bearer ${CRON_SECRET}
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

  await processNotifications();

  return NextResponse.json({ ok: true });
}

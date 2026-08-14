// app/api/webhooks/paystack/route.ts
import { db } from "@/db";
import { transactions, groups } from "@/db/schema";
import { clerkClient } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { createNotification } from "@/services/notifications";
import crypto from "crypto";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const rawBody = await req.text();

  // 1️⃣ Verify Paystack signature — critical, do not skip
  const signature = req.headers.get("x-paystack-signature");
  const expected = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
    .update(rawBody)
    .digest("hex");

  if (signature !== expected) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);

  if (event.event !== "charge.success") {
    return NextResponse.json({ ok: true }); // ignore other event types
  }

  const reference = event.data.reference as string;

  const [txn] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.reference, reference));

  if (!txn || txn.type !== "group_activation" || txn.status === "completed") {
    // Already processed, or not ours — ack so Paystack stops retrying
    return NextResponse.json({ ok: true });
  }

  // 2️⃣ Mark transaction completed
  await db
    .update(transactions)
    .set({
      status: "completed",
      providerReference: event.data.reference,
      providerResponse: event.data,
    })
    .where(eq(transactions.id, txn.id));

  // 3️⃣ Enable the group
  await db
    .update(groups)
    .set({ isEnabled: true, enabledAt: new Date() })
    .where(eq(groups.id, txn.groupId!));

  // 4️⃣ Promote the user to admin in Clerk
  const client = await clerkClient();
  const clerkUser = await client.users.getUser(txn.userId);
  await client.users.updateUser(txn.userId, {
    publicMetadata: {
      ...(clerkUser.publicMetadata ?? {}),
      role: "admin",
    },
  });

  // 5️⃣ Notify the user
  await createNotification({
    userId: txn.userId,
    type: "system",
    channel: "in_app",
    title: "Group activated 🎉",
    message: "Your payment was successful. Your group is now active and you're an admin.",
    metadata: { groupId: txn.groupId },
  });

  return NextResponse.json({ ok: true });
}
// app/(actions)/group-activation.ts
"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/db";
import { groups, transactions } from "@/db/schema";
import { eq } from "drizzle-orm";

const GROUP_ACTIVATION_FEE_KOBO = 5000; // ₦5,000 — keep in sync with above, or move to a shared constants file

export async function initiateGroupActivation(groupId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const [group] = await db.select().from(groups).where(eq(groups.id, groupId));
  if (!group) throw new Error("Group not found");
  if (group.ownerId !== userId) throw new Error("Only the group owner can activate this group");
  if (group.isEnabled) throw new Error("Group is already enabled");

  const client = await clerkClient();
  const clerkUser = await client.users.getUser(userId);
  const email = clerkUser.emailAddresses[0]?.emailAddress;
  if (!email) throw new Error("No email on file for Paystack checkout");

  const reference = `activate_${groupId}_${Date.now()}`;

  // Record a pending transaction before hitting Paystack, so the webhook
  // has something to reconcile against even if the redirect never completes.
  await db.insert(transactions).values({
    groupId,
    userId,
    type: "group_activation",
    status: "pending",
    amount: (GROUP_ACTIVATION_FEE_KOBO / 100).toFixed(2),
    reference,
    paymentProvider: "paystack",
  });

  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      amount: GROUP_ACTIVATION_FEE_KOBO, // Paystack expects kobo
      reference,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/groups/${groupId}/activation-complete`,
      metadata: { groupId, userId, purpose: "group_activation" },
    }),
  });

  const data = await res.json();

  if (!data.status) {
    throw new Error(data.message ?? "Failed to initialize payment");
  }

  return { authorizationUrl: data.data.authorization_url as string };
}
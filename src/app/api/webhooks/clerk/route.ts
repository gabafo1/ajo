import { Webhook } from "svix";
import { headers } from "next/headers";
import { clerkClient } from "@clerk/nextjs/server";
import { createAccount } from "@/db/account";
import { db } from "@/db";
import { users } from "@/db/schema";

export async function POST(req: Request) {
  const payload = await req.text();
  const headerPayload = await headers();

  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);

  let evt;

  try {
    evt = wh.verify(payload, {
      "svix-id": svixId!,
      "svix-timestamp": svixTimestamp!,
      "svix-signature": svixSignature!,
    });
  } catch {
    return new Response("Invalid webhook", { status: 400 });
  }

  const event = evt as {
    type: string;
    data: {
      id: string;
      first_name?: string | null;
      last_name?: string | null;
      primary_email_address_id?: string | null;
      email_addresses?: { id: string; email_address: string }[];
    };
  };

  if (event.type === "user.created") {
    const userId = event.data.id;
    const emails = event.data.email_addresses ?? [];
    const primaryId = event.data.primary_email_address_id;
    const email =
      emails.find((e) => e.id === primaryId)?.email_address ??
      emails[0]?.email_address ??
      "";

    const client = await clerkClient();

    await client.users.updateUser(userId, {
      publicMetadata: {
        role: "member",
        onboardingComplete: false,
      },
    });

    await db
      .insert(users)
      .values({
        clerkId: userId,
        email,
        firstName: event.data.first_name ?? "",
        lastName: event.data.last_name ?? "",
      })
      .onConflictDoUpdate({
        target: users.clerkId,
        set: {
          email,
          firstName: event.data.first_name ?? "",
          lastName: event.data.last_name ?? "",
        },
      });

    await createAccount({
      ownerType: "user",
      ownerId: userId,
      accountType: "wallet",
    });
  }

  return new Response("OK", { status: 200 });
}

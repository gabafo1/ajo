import { db } from "@/db";
import { notifications } from "@/db/schema";

export async function createNotification({
  userId,
  title,
  message,
  type,
  channel = "in_app",
  metadata,
}: {
  userId: string;
  title: string;
  message: string;
  type: "transaction" | "system" | "admin";
  channel?: "email" | "sms" | "push" | "in_app";
  metadata?: Record<string, unknown>;
}) {
  const [notification] = await db
    .insert(notifications)
    .values({
      userId,
      type,
      title,
      message,
      channel,
      metadata,
    })
    .returning();

  return notification;
}
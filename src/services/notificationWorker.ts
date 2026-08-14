import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendNotification } from "./sendNotification";

export async function processNotifications() {

  const pending = await db
    .select()
    .from(notifications)
    .where(eq(notifications.status, "pending"))
    .limit(50);

  for (const notification of pending) {

    try {

      await sendNotification(notification);

      await db.update(notifications)
        .set({
          status: "sent",
          sentAt: new Date()
        })
        .where(eq(notifications.id, notification.id));

    } catch {

      await db.update(notifications)
        .set({ status: "failed" })
        .where(eq(notifications.id, notification.id));

    }

  }

}
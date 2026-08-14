import type { notifications } from "@/db/schema";
import { sendTransactionalEmail } from "./email";
import { sendSMS as sendSmsViaTermii } from "./sms";

type Notification = typeof notifications.$inferSelect;

async function sendEmailChannel(notification: Notification) {
  const meta = notification.metadata as { email?: string } | null | undefined;
  const email = meta?.email;
  if (!email) return;

  await sendTransactionalEmail({
    to: email,
    subject: notification.title,
    html: `<p>${escapeHtml(notification.message)}</p>`,
  });
}

async function sendSmsChannel(notification: Notification) {
  const meta = notification.metadata as { phone?: string } | null | undefined;
  const phone = meta?.phone;
  if (!phone) return;

  await sendSmsViaTermii({
    phone,
    message: `${notification.title}: ${notification.message}`,
  });
}


function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function sendNotification(notification: Notification) {
  if (notification.channel === "email") {
    await sendEmailChannel(notification);
  }

  if (notification.channel === "sms") {
    await sendSmsChannel(notification);
  }
}
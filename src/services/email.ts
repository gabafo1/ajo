import { Resend } from "resend";
import { notifications } from "@/db/schema";

const resend = new Resend(process.env.RESEND_API_KEY);

type Notification = typeof notifications.$inferSelect;

export async function sendTransactionalEmail(opts: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}) {
  await resend.emails.send({
    from: opts.from ?? "AjoPro <noreply@ajopro.com>",
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });
}

export async function sendEmail(notification: Notification) {
  const email = (notification.metadata as { email: string })?.email;

  if (!email) {
    throw new Error("No email address found in notification metadata");
  }

  await resend.emails.send({
    from: "AjoPro <noreply@ajopro.com>",
    to: email,
    subject: notification.title,
    html: `<p>${notification.message}</p>`,
  });
}
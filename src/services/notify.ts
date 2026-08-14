import { createNotification } from "./notifications";
import { sendTransactionalEmail } from "./email";
import { sendSMS } from "./sms";

export async function notifyUser({
  userId,
  email,
  phone,
  title,
  message,
}: {
  userId: string;
  email?: string;
  phone?: string;
  title: string;
  message: string;
}) {

  await createNotification({
    userId,
    title,
    message,
    type: "system",
  });

  if (email) {
    await sendTransactionalEmail({
      to: email,
      subject: title,
      html: `<p>${message}</p>`,
    });
  }

  if (phone) {
    await sendSMS({
      phone,
      message,
    });
  }

}
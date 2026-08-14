import axios from "axios";

export async function sendSMS({
  phone,
  message,
}: {
  phone: string;
  message: string;
}) {

  await axios.post(
    "https://api.termii.com/api/sms/send",
    {
      to: phone,
      from: "AjoPro",
      sms: message,
      type: "plain",
      channel: "generic",
      api_key: process.env.TERMII_API_KEY,
    }
  );

}
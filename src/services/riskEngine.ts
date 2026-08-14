import { adjustUserScore } from "./reputation";

export async function recordLatePayment(userId: string) {

  await adjustUserScore(userId, -10);

}
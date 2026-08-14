import { createTransaction } from "./transactions";
import { postLedgerTransaction } from "./ledger";
import { createContribution } from "./contributions";
import { getUserWallet } from "./accounts";

interface PaymentMetadata {
  userId: string;
  groupId: string;
  cycleId: string;
  groupPoolAccountId: string;
  [key: string]: unknown;
}

interface PaymentData {
  amount: number;
  reference: string;
  metadata: PaymentMetadata;
  [key: string]: unknown;
}

export async function handleSuccessfulPayment(data: PaymentData) {
  const metadata = data.metadata;

  const userId = metadata.userId;
  const groupId = metadata.groupId;
  const cycleId = metadata.cycleId;

  const amount = (data.amount / 100).toString(); // Paystack uses kobo

  const reference = data.reference;

  // 1️⃣ Create Transaction
  const txn = await createTransaction({
    userId,
    groupId,
    amount,
    reference,
    type: "contribution",
    paymentProvider: "paystack",
  });

  // 2️⃣ Get User Wallet
  const wallet = await getUserWallet(userId);

  if (!wallet) throw new Error("Wallet not found");

  // 3️⃣ Ledger Posting
  const ledgerTxn = await postLedgerTransaction({
    reference,
    description: "Group contribution payment",
    createdBy: userId,
    entries: [
      {
        accountId: wallet.id,
        type: "debit",
        amount,
      },
      {
        accountId: metadata.groupPoolAccountId,
        type: "credit",
        amount,
      },
    ],
  });

  // 4️⃣ Record Contribution
  await createContribution({
    groupId,
    userId,
    amount,
    cycleId,
    transactionId: txn.id,
  });

  return ledgerTxn;
}
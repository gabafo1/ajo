import axios from "axios";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getGroupPoolAccount } from "@/services/accounts";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { email, amount, groupId, cycleId, userId: bodyUserId } = body;

  if (typeof bodyUserId !== "string" || bodyUserId !== userId) {
    return NextResponse.json(
      { error: "userId must match the signed-in user" },
      { status: 403 }
    );
  }

  if (
    typeof email !== "string" ||
    typeof amount !== "number" ||
    typeof groupId !== "string"
  ) {
    return NextResponse.json(
      { error: "email, amount, groupId, and userId are required" },
      { status: 400 }
    );
  }

  const pool = await getGroupPoolAccount(groupId);
  if (!pool) {
    return NextResponse.json(
      {
        error:
          "Group pool account not found. The group may not be fully provisioned yet.",
      },
      { status: 400 }
    );
  }

  const secret = process.env.PAYSTACK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Payment provider not configured" },
      { status: 503 }
    );
  }

  const response = await axios.post(
    "https://api.paystack.co/transaction/initialize",
    {
      email,
      amount: amount * 100,
      metadata: {
        userId,
        groupId,
        cycleId: cycleId ?? null,
        groupPoolAccountId: pool.id,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${secret}`,
      },
    }
  );

  return NextResponse.json(response.data);
}

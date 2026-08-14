import { NextResponse } from "next/server";
import { db } from "@/db";
import { kyc } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET /api/kyc/status?userId=123
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  try {
    const result = await db
      .select()
      .from(kyc)
      .where(eq(kyc.userId, userId))
      .limit(1);

    return NextResponse.json(result[0] ?? {});
  } catch (err) {
    console.error("❌ Error fetching KYC:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST /api/kyc
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, firstName, lastName, bvn, nin, phone } = body;

    if (!userId || !firstName || !lastName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await db
      .insert(kyc)
      .values({ userId, firstName, lastName, bvn, nin, phone })
      .onConflictDoUpdate({
        target: kyc.userId,
        set: { firstName, lastName, bvn, nin, phone, status: "pending" },
      });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ Error saving KYC:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
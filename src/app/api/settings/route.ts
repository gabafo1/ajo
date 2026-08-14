import { NextResponse } from "next/server";
import { db } from "@/db";
import { kyc } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET /api/settings?userId=123
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  try {
    const result = await db
      .select({ groupName: kyc.groupName })
      .from(kyc)
      .where(eq(kyc.userId, userId))
      .limit(1);

    return NextResponse.json(result[0] ?? {});
  } catch (err) {
    console.error("❌ Error fetching settings:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST /api/settings
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, groupName } = body;

    if (!userId || !groupName) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    await db
      .insert(kyc)
      .values({ userId, groupName, firstName: "", lastName: "" }) // required cols
      .onConflictDoUpdate({
        target: kyc.userId,
        set: { groupName },
      });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ Error saving settings:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

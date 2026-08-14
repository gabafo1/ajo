import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { NextResponse } from "next/server";


export async function GET() {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ count: 0 });
    }

    const result = await db
        .select({
            count: sql<number>`count(*)`,
        })
        .from(notifications)
        .where(
            and(
                eq(notifications.userId, userId),
                eq(notifications.isRead, false)
            )
        );

    return NextResponse.json({ count: result[0].count });
}
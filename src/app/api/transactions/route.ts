import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { transactions } from "@/db/schema";
import { desc, and, eq, sql, or, ilike } from "drizzle-orm";

const TX_TYPES = ["contribution", "withdrawal", "refund"] as const;
type TxType = (typeof TX_TYPES)[number];

function isTxType(v: unknown): v is TxType {
  return typeof v === "string" && TX_TYPES.includes(v as TxType);
}

/** Dashboard form sends contribution | payout | fee */
const UI_TO_DB: Record<string, TxType> = {
  contribution: "contribution",
  payout: "withdrawal",
  fee: "refund",
};

function bodyTypeToDbType(v: unknown): TxType | undefined {
  if (typeof v !== "string") return undefined;
  if (isTxType(v)) return v;
  return UI_TO_DB[v];
}

/** Shape expected by dashboard `TransactionCard` */
function mapRowForClient(row: typeof transactions.$inferSelect) {
  const type =
    row.type === "withdrawal"
      ? ("payout" as const)
      : row.type === "refund"
        ? ("fee" as const)
        : ("contribution" as const);

  return {
    id: row.id,
    date: row.createdAt.toISOString(),
    amount: Number(row.amount),
    type,
    status: row.status as "completed" | "pending" | "failed",
    contributor: row.userId,
  };
}

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const typeParam = searchParams.get("type") || "all";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const offset = (page - 1) * limit;

    const conditions = [eq(transactions.userId, userId)];

    if (typeParam !== "all") {
      const uiToDb: Record<string, TxType | undefined> = {
        contribution: "contribution",
        payout: "withdrawal",
        fee: "refund",
      };
      const dbType = uiToDb[typeParam];
      if (dbType) {
        conditions.push(eq(transactions.type, dbType));
      }
    }

    if (search.trim()) {
      const pattern = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(transactions.userId, pattern),
          ilike(transactions.reference, pattern),
          sql`${transactions.createdAt}::text ILIKE ${pattern}`
        )!
      );
    }

    const whereClause = and(...conditions);

    const result = await db
      .select()
      .from(transactions)
      .where(whereClause)
      .orderBy(desc(transactions.createdAt))
      .limit(limit)
      .offset(offset);

    const totalQuery = await db
      .select({ count: sql<number>`count(*)` })
      .from(transactions)
      .where(whereClause);

    const total = Number(totalQuery[0]?.count || 0);
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      data: result.map(mapRowForClient),
      meta: { page, limit, total, totalPages },
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const amount = body?.amount;
    const typeRaw = body?.type;
    const status = body?.status;
    const groupId = body?.groupId ?? null;
    const reference = body?.reference ?? undefined;

    const type = bodyTypeToDbType(typeRaw);

    if (amount == null || !type || !status) {
      return NextResponse.json(
        { error: "amount, type, and status are required" },
        { status: 400 }
      );
    }

    const allowedStatus = ["pending", "completed", "failed"] as const;
    if (!allowedStatus.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const [newTransaction] = await db
      .insert(transactions)
      .values({
        userId,
        groupId: groupId || undefined,
        amount: String(amount),
        type,
        status,
        reference,
      })
      .returning();

    return NextResponse.json(mapRowForClient(newTransaction), { status: 201 });
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 }
    );
  }
}

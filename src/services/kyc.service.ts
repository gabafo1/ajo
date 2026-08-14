import { kyc } from "@/db/schema";
import { db } from "@/db";
import { eq } from "drizzle-orm";

export async function submitKyc(userId: string, data: {
    firstName: string;
    lastName: string;
    groupName: string;
    bvn?: string;
    nin?: string;
    phone?: string;
}) {
    const existing = await db
        .select()
        .from(kyc)
        .where(eq(kyc.userId, userId));

    if (existing.length > 0) {
        return db
            .update(kyc)
            .set({ ...data, status: "pending" })
            .where(eq(kyc.userId, userId));
    }

    return db.insert(kyc).values({
        userId,
        ...data,
    });
}

export async function verifyKyc(userId: string) {
    return db
        .update(kyc)
        .set({ status: "verified", verifiedAt: new Date() })
        .where(eq(kyc.userId, userId));
}

export async function rejectKyc(userId: string, reason: string) {
    return db
        .update(kyc)
        .set({ status: "rejected", rejectionReason: reason })
        .where(eq(kyc.userId, userId));
}

export async function requireVerifiedKyc(userId: string) {
    const [record] = await db
        .select()
        .from(kyc)
        .where(eq(kyc.userId, userId));

    if (!record || record.status !== "verified") {
        throw new Error("KYC verification required");
    }
}
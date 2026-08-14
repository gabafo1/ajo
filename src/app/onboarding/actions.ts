"use server";

import { db } from "@/db";
import { kyc, groups, groupMembers, users } from "@/db/schema";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { createAccount } from "@/services/accounts";
import { nanoid } from "nanoid";


export type OnboardingState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: Partial<
    Record<
      "firstName" | "lastName" | "phone" | "bvn" | "nin" | "groupName",
      string
    >
  >;
};

function validateKYC(data: {
  firstName: string;
  lastName: string;
  phone: string;
  bvn: string;
  nin: string;
  groupName: string;
}) {
  const errors: OnboardingState["errors"] = {};

  if (!data.firstName.trim()) errors.firstName = "First name is required";
  if (!data.lastName.trim()) errors.lastName = "Last name is required";

  if (!data.groupName.trim()) {
    errors.groupName = "Group name is required";
  }

  if (!data.phone.trim()) {
    errors.phone = "Phone number is required";
  } else if (!/^(\+234|0)[789][01]\d{8}$/.test(data.phone.replace(/\s/g, ""))) {
    errors.phone = "Enter a valid Nigerian phone number";
  }

  if (data.bvn && !/^\d{11}$/.test(data.bvn)) {
    errors.bvn = "BVN must be exactly 11 digits";
  }

  if (data.nin && !/^\d{11}$/.test(data.nin)) {
    errors.nin = "NIN must be exactly 11 digits";
  }

  return errors;
}

export async function submitKYC(
  _prev: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  const { userId } = await auth();

  if (!userId) {
    return { status: "error", message: "Unauthorized" };
  }

  const client = await clerkClient();
  const clerkUser = await client.users.getUser(userId);

  const fields = {
    firstName: (formData.get("firstName") as string) ?? "",
    lastName: (formData.get("lastName") as string) ?? "",
    phone: (formData.get("phone") as string) ?? "",
    bvn: (formData.get("bvn") as string) ?? "",
    nin: (formData.get("nin") as string) ?? "",
    groupName: (formData.get("groupName") as string) ?? "",
  };

  const errors = validateKYC(fields);

  if (Object.keys(errors).length > 0) {
    return {
      status: "error",
      message: "Please fix the errors below",
      errors,
    };
  }

  try {
    // 1️⃣ Save KYC
    await db
      .insert(kyc)
      .values({
        userId,
        firstName: fields.firstName.trim(),
        lastName: fields.lastName.trim(),
        phone: fields.phone.trim(),
        bvn: fields.bvn.trim() || null,
        nin: fields.nin.trim() || null,
        status: "pending",
      })
      .onConflictDoUpdate({
        target: kyc.userId,
        set: {
          firstName: fields.firstName.trim(),
          lastName: fields.lastName.trim(),
          phone: fields.phone.trim(),
          bvn: fields.bvn.trim() || null,
          nin: fields.nin.trim() || null,
          status: "pending",
        },
      });

    // 2️⃣ Ensure user exists in local DB
    await db
      .insert(users)
      .values({
        clerkId: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress ?? "",
        firstName: fields.firstName.trim(),
        lastName: fields.lastName.trim(),
        phone: fields.phone.trim(),
      })
      .onConflictDoUpdate({
        target: users.clerkId,
        set: {
          firstName: fields.firstName.trim(),
          lastName: fields.lastName.trim(),
          phone: fields.phone.trim(),
        },
      });

    // Fetch DB user (for FK safety)
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, userId));

    if (!dbUser) {
      throw new Error("User not found in database");
    }

    // 3️⃣ Create Group (SAFE SLUG)
    const slugBase = fields.groupName
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-");

    const [group] = await db
      .insert(groups)
      .values({
        groupName: fields.groupName.trim(),
        slug: `${slugBase}-${nanoid(6)}`,
        ownerId: userId,
        contributionAmount: "0.00",
        cycleDurationDays: 31,
        maxMembers: 10,
      })
      .returning();

    // 4️⃣ Add creator as group owner
    await db.insert(groupMembers).values({
      clerkId: userId,
      userId: dbUser.id,
      groupId: group.id,
      role: "owner",
    });

    // 5️⃣ Create group wallet/account
    await createAccount({
      type: "group_pool",
      groupId: group.id,
      name: `${fields.groupName.trim()} pool`,
    });


    // 6️⃣ Mark onboarding complete in Clerk
    // ✅ FIX: Preserve existing publicMetadata (especially `role`)
    //     instead of replacing the whole object.
    const existingMetadata = clerkUser.publicMetadata ?? {};
    await client.users.updateUser(userId, {
      publicMetadata: {
        ...existingMetadata,
        role: existingMetadata.role ?? "member",
        onboardingComplete: true,
      },
    });
  } catch (err: unknown) {
    console.error("FULL ERROR:", err);

    const errorMessage = err instanceof Error ? err.message : "Something went wrong. Please try again.";

    return {
      status: "error",
      message: errorMessage,
    };
  }

  // ✅ FIX: Return success instead of calling redirect().
  // redirect() causes a 303 which the middleware intercepts before
  // the client can reload the Clerk session — so the stale JWT
  // (without onboardingComplete: true) gets checked and bounces
  // the user back to /onboarding.
  // The onboarding page handles the actual navigation after
  // calling user.reload() to refresh the JWT.
  return { status: "success" };
}

export async function getKYCStatus() {
  const { userId } = await auth();

  if (!userId) return null;

  const [record] = await db
    .select({
      status: kyc.status,
      firstName: kyc.firstName,
      lastName: kyc.lastName,
    })
    .from(kyc)
    .where(eq(kyc.userId, userId));

  return record ?? null;
}
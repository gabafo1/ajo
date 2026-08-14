import {
    pgTable,
    pgEnum,
    uuid,
    text,
    timestamp,
    numeric,
    integer,
    boolean,
    index,
    uniqueIndex,
    jsonb,
    varchar,                          // FIX 1: added missing `date` import
    decimal
} from "drizzle-orm/pg-core";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const entryTypeEnum = pgEnum("entry_type", ["debit", "credit"]);

export const planEnum = pgEnum("plan", [
    "free",
    "community",
    "enterprise",
]);

export const accountTypeEnum = pgEnum("account_type", [
    "user_wallet",
    "group_pool",
    "platform_revenue",
    "escrow",
    "external_bank",
]);

export const feeTypeEnum = pgEnum("fee_type", [
    "contribution",
    "withdrawal",
    "subscription",
    "group_activation",   // NEW
]);

export const subscriptionTypeEnum = pgEnum("subscription_type", [
    "monthly",
    "yearly",
]);

export const groupRoleEnum = pgEnum("group_role", [
    "owner",
    "admin",
    "member",
]);

export const withdrawalStatusEnum = pgEnum("withdrawal_status", [
    "scheduled",
    "pending_approval",
    "approved",
    "processing",
    "paid",
    "failed",
    "cancelled",
]);

export const contributionStatusEnum = pgEnum("contribution_status", [
    "pending",
    "completed",
    "failed",
]);

export const transactionTypeEnum = pgEnum("transaction_type", [
    "contribution",
    "withdrawal",
    "refund",
    "group_activation",   // NEW
]);

export const transactionStatusEnum = pgEnum("transaction_status", [
    "pending",
    "completed",
    "failed",
]);

export const inviteStatusEnum = pgEnum("invite_status", [
    "pending",
    "accepted",
    "declined",
    "expired",
]);

export const auditActionEnum = pgEnum("audit_action", [
    "create",
    "update",
    "delete",
    "login",
    "logout",
    "contribution",
    "withdrawal",
    "subscription_change",
    "role_change",
    "kyc_update",
]);

export const cycleStatusEnum = pgEnum("cycle_status", [
    "pending",
    "active",
    "completed",
    "cancelled",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
    "transaction",
    "system",
    "admin",
]);

export const kycStatusEnum = pgEnum("kyc_status", [
    "pending",
    "verified",
    "rejected",
]);

// ─── Tables ───────────────────────────────────────────────────────────────────

export const idempotencyKeys = pgTable("idempotency_keys", {
    id: uuid("id").defaultRandom().primaryKey(),

    key: text("key").notNull(),

    responseTransactionId: uuid("response_transaction_id"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
    keyUnique: uniqueIndex("idempotency_key_unique").on(table.key),
}));

export const accountBalances = pgTable(
    "account_balances",
    {
        accountId: uuid("account_id")
            .primaryKey()
            .references(() => accounts.id, { onDelete: "cascade" }),

        balance: numeric("balance", {
            precision: 12,
            scale: 2,
        }).notNull().default("0"),

        updatedAt: timestamp("updated_at")
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    }
);

// FIX 2: Removed duplicate `subscriptionsTable` which shared the name
// "subscriptions" with the `subscriptions` table below and also referenced
// the non-existent `subscriptionEnum`. The canonical `subscriptions` table
// below covers all required columns.

export const platformFees = pgTable(
    "platform_fees",
    {
        id: uuid("id").defaultRandom().primaryKey(),

        feeType: feeTypeEnum("fee_type").notNull(),

        percentage: numeric("percentage", {
            precision: 5,
            scale: 2,
        }),

        fixedAmount: numeric("fixed_amount", {
            precision: 12,
            scale: 2,
        }),

        isActive: boolean("is_active").default(true).notNull(),

        createdAt: timestamp("created_at").defaultNow().notNull(),
    }
);

export const users = pgTable(
    "users",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        clerkId: text("clerk_id").notNull().unique(),
        email: text("email").notNull(),
        phone: text("phone"),
        firstName: text("first_name"),
        lastName: text("last_name"),
        isActive: boolean("is_active").default(true).notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => ({
        clerkIndex: index("user_clerk_idx").on(table.clerkId),
        emailIndex: index("user_email_idx").on(table.email),
    })
);

export const subscriptions = pgTable("subscriptions", {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: text("user_id").notNull().unique(), // Clerk ID

    plan: planEnum("plan").notNull().default("free"),
    type: subscriptionTypeEnum("type"),

    stripeCustomerId: text("stripe_customer_id"),
    stripeSubscriptionId: text("stripe_subscription_id"),

    currentPeriodStart: timestamp("current_period_start"),
    currentPeriodEnd: timestamp("current_period_end"),

    isActive: boolean("is_active").default(true).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
});

export const organizations = pgTable(
    "organizations",
    {
        id: uuid("id").defaultRandom().primaryKey(),

        name: text("name").notNull(),

        slug: text("slug").notNull().unique(),

        description: text("description"),

        ownerId: text("owner_id").notNull(),

        isActive: boolean("is_active").default(true).notNull(),

        createdAt: timestamp("created_at").defaultNow().notNull(),

        updatedAt: timestamp("updated_at")
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    }
);

export const accounts = pgTable(
    "accounts",
    {
        id: uuid("id").defaultRandom().primaryKey(),

        type: accountTypeEnum("type").notNull(),

        // Optional linkages
        userId: text("user_id"),
        groupId: uuid("group_id"),

        name: text("name").notNull(),

        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (table) => ({
        userIndex: index("account_user_idx").on(table.userId),
        groupIndex: index("account_group_idx").on(table.groupId),
    })
);

export const ledgerTransactions = pgTable("ledger_transactions", {
    id: uuid("id").defaultRandom().primaryKey(),

    reference: text("reference").notNull(),

    description: text("description"),

    status: text("status").default("posted").notNull(),

    reversedTransactionId: uuid("reversed_transaction_id"),

    createdBy: text("created_by"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
    referenceUnique: uniqueIndex("ledger_reference_unique").on(table.reference),
}));

export const ledgerEntries = pgTable(
    "ledger_entries",
    {
        id: uuid("id").defaultRandom().primaryKey(),

        transactionId: uuid("transaction_id")
            .notNull()
            .references(() => ledgerTransactions.id, { onDelete: "cascade" }),

        accountId: uuid("account_id")
            .notNull()
            .references(() => accounts.id),

        type: entryTypeEnum("type").notNull(),

        amount: numeric("amount", {
            precision: 12,
            scale: 2,
        }).notNull(),

        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (table) => ({
        txnIndex: index("entry_txn_idx").on(table.transactionId),
        accountIndex: index("entry_account_idx").on(table.accountId),
    })
);

export const groups = pgTable("groups", {
    id: uuid("id").defaultRandom().primaryKey(),

    groupName: varchar("name", { length: 255 }).notNull(),
    slug: text("slug").notNull().unique(),

    description: text("description"),

    organizationId: uuid("organization_id")
        .references(() => organizations.id),

    ownerId: text("owner_id")
        .notNull()
        .references(() => users.clerkId, { onDelete: "cascade" }),

    // In your schema file
    contributionAmount: decimal("contribution_amount", { precision: 10, scale: 2 }),
    cycleDurationDays: integer("cycle_duration_days").notNull(),

    maxMembers: integer("max_members")
        .default(10)
        .notNull(),

    isPublic: boolean("is_public").default(false).notNull(),

    isActive: boolean("is_active").default(true).notNull(),

    isEnabled: boolean("is_enabled").default(false).notNull(),
    
    enabledAt: timestamp("enabled_at"),

    createdAt: timestamp("created_at").defaultNow().notNull(),

    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),

}, (table) => ({
    ownerIdx: index("groups_owner_idx").on(table.ownerId)
}));

export const groupMembers = pgTable(
    "group_members",
    {
        id: uuid("id").defaultRandom().primaryKey(),

        // FIX 5: Removed erroneous .unique() from clerkId — a user can belong
        // to multiple groups, so clerkId must not be globally unique here.
        // The composite uniqueIndex on (groupId, userId) below is sufficient.
        clerkId: text("clerk_id").notNull(),
        groupId: uuid("group_id")
            .notNull()
            .references(() => groups.id, { onDelete: "cascade" }),

        userId: text("user_id").notNull(),

        role: groupRoleEnum("role").notNull().default("member"),

        rotationOrder: integer("rotation_order"),

        joinedAt: timestamp("joined_at").defaultNow().notNull(),
    },
    (table) => ({
        groupIndex: index("member_group_idx").on(table.groupId),
        userIndex: index("member_user_idx").on(table.userId),
        uniqueMember: uniqueIndex("member_group_user_unique").on(
            table.groupId,
            table.userId
        ),
    })
);

export const cycles = pgTable(
    "cycles",
    {
        id: uuid("id").defaultRandom().primaryKey(),

        groupId: uuid("group_id")
            .notNull()
            .references(() => groups.id, { onDelete: "cascade" }),

        cycleNumber: integer("cycle_number").notNull(),

        status: cycleStatusEnum("status").notNull().default("pending"),

        startDate: timestamp("start_date").notNull(),
        endDate: timestamp("end_date").notNull(),

        beneficiaryUserId: text("beneficiary_user_id").notNull(),

        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (table) => ({
        groupIndex: index("cycle_group_idx").on(table.groupId),
        uniqueCycle: uniqueIndex("cycle_group_number_unique").on(
            table.groupId,
            table.cycleNumber
        ),
    })
);

// FIX 4: Moved `bankAccounts` above `groupPayouts` to resolve the forward reference
export const bankAccounts = pgTable(
    "bank_accounts",
    {
        id: uuid("id").defaultRandom().primaryKey(),

        userId: text("user_id").notNull(),

        bankName: text("bank_name").notNull(),
        accountName: text("account_name").notNull(),
        accountNumber: text("account_number").notNull(),

        bankCode: text("bank_code"),

        isDefault: boolean("is_default").default(false).notNull(),
        isVerified: boolean("is_verified").default(false).notNull(),

        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (table) => ({
        userIndex: index("bank_account_user_idx").on(table.userId),
    })
);

export const groupPayouts = pgTable(
    "group_payouts",
    {
        id: uuid("id").defaultRandom().primaryKey(),

        groupId: uuid("group_id")
            .notNull()
            .references(() => groups.id, { onDelete: "cascade" }),

        cycleId: uuid("cycle_id")
            .references(() => cycles.id),

        beneficiaryUserId: text("beneficiary_user_id").notNull(),

        bankAccountId: uuid("bank_account_id")
            .references(() => bankAccounts.id),   // now resolves correctly

        cycleNumber: integer("cycle_number").notNull(),

        scheduledDate: timestamp("scheduled_date").notNull(),

        totalAmount: numeric("total_amount", {
            precision: 12,
            scale: 2,
        }).notNull(),

        status: withdrawalStatusEnum("status").default("scheduled").notNull(),

        ledgerTransactionId: uuid("ledger_transaction_id")
            .references(() => ledgerTransactions.id),

        approvedBy: text("approved_by"),
        approvedAt: timestamp("approved_at"),

        processedAt: timestamp("processed_at"),

        failureReason: text("failure_reason"),

        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (table) => ({
        groupIndex: index("payout_group_idx").on(table.groupId),
        beneficiaryIndex: index("payout_user_idx").on(table.beneficiaryUserId),
        dateIndex: index("payout_date_idx").on(table.scheduledDate),
    })
);

export const transactions = pgTable(
    "transactions",
    {
        id: uuid("id").defaultRandom().primaryKey(),

        groupId: uuid("group_id")
            .references(() => groups.id, { onDelete: "cascade" }),

        userId: text("user_id").notNull(),

        type: transactionTypeEnum("type").notNull(),
        status: transactionStatusEnum("status").notNull(),

        amount: numeric("amount", {
            precision: 12,
            scale: 2,
        }).notNull(),

        reference: text("reference").unique(),

        ledgerTransactionId: uuid("ledger_transaction_id")
            .references(() => ledgerTransactions.id),

        createdAt: timestamp("created_at").defaultNow().notNull(),

        paymentProvider: text("payment_provider"),

        providerReference: text("provider_reference"),

        providerResponse: jsonb("provider_response"),
    },
    (table) => ({
        userIndex: index("txn_user_idx").on(table.userId),
        groupIndex: index("txn_group_idx").on(table.groupId),
    })
);

export const contributions = pgTable(
    "contributions",
    {
        id: uuid("id").defaultRandom().primaryKey(),

        groupId: uuid("group_id")
            .notNull()
            .references(() => groups.id, { onDelete: "cascade" }),

        cycleId: uuid("cycle_id")
            .references(() => cycles.id),

        userId: text("user_id").notNull(),

        amount: numeric("amount", {
            precision: 12,
            scale: 2,
        }).notNull(),

        status: contributionStatusEnum("status").default("completed").notNull(),

        transactionId: uuid("transaction_id")
            .references(() => transactions.id),

        ledgerTransactionId: uuid("ledger_transaction_id")
            .references(() => ledgerTransactions.id),

        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (table) => ({
        groupIndex: index("contribution_group_idx").on(table.groupId),
        userIndex: index("contribution_user_idx").on(table.userId),
    })
);

export const groupInvites = pgTable(
    "group_invites",
    {
        id: uuid("id").defaultRandom().primaryKey(),

        groupId: uuid("group_id")
            .notNull()
            .references(() => groups.id, { onDelete: "cascade" }),

        invitedBy: text("invited_by").notNull(),

        email: text("email"),
        phone: text("phone"),

        status: inviteStatusEnum("status").default("pending").notNull(),

        expiresAt: timestamp("expires_at"),

        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (table) => ({
        groupIndex: index("invite_group_idx").on(table.groupId),
    })
);

export const auditLogs = pgTable(
    "audit_logs",
    {
        id: uuid("id").defaultRandom().primaryKey(),

        actorUserId: text("actor_user_id").notNull(),

        action: auditActionEnum("action").notNull(),

        entityType: text("entity_type").notNull(),
        entityId: text("entity_id").notNull(),

        groupId: uuid("group_id"),

        oldValues: jsonb("old_values"),
        newValues: jsonb("new_values"),

        ipAddress: text("ip_address"),
        userAgent: text("user_agent"),

        requestId: text("request_id"),

        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (table) => ({
        actorIndex: index("audit_actor_idx").on(table.actorUserId),
        entityIndex: index("audit_entity_idx").on(table.entityType, table.entityId),
        groupIndex: index("audit_group_idx").on(table.groupId),
        createdAtIndex: index("audit_created_at_idx").on(table.createdAt),
    })
);

export const notifications = pgTable(
    "notifications",
    {
        id: uuid("id").defaultRandom().primaryKey(),

        userId: text("user_id").notNull(),

        title: text("title").notNull(),
        message: text("message").notNull(),

        channel: text("channel").notNull(),

        status: text("status").default("pending"),

        metadata: jsonb("metadata"),

        type: notificationTypeEnum("type").notNull(),

        isRead: boolean("is_read").default(false).notNull(),

        sentAt: timestamp("sent_at"),

        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (table) => ({
        userIndex: index("notification_user_idx").on(table.userId),
        unreadIndex: index("notification_unread_idx").on(table.userId, table.isRead),
    })
);

export const notificationPreferences = pgTable(
    "notification_preferences",
    {
        userId: text("user_id").primaryKey(),

        email: boolean("email").default(true),

        sms: boolean("sms").default(true),

        push: boolean("push").default(true),
    }
);

export const userReputation = pgTable(
    "user_reputation",
    {
        id: uuid("id").defaultRandom().primaryKey(),

        userId: text("user_id").notNull().unique(),

        score: integer("score").default(100).notNull(),

        successfulCycles: integer("successful_cycles").default(0),

        missedPayments: integer("missed_payments").default(0),

        latePayments: integer("late_payments").default(0),

        lastUpdated: timestamp("last_updated")
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    }
);

export const collateralDeposits = pgTable(
    "collateral_deposits",
    {
        id: uuid("id").defaultRandom().primaryKey(),

        userId: text("user_id").notNull(),

        amount: numeric("amount", {
            precision: 12,
            scale: 2,
        }).notNull(),

        locked: boolean("locked").default(true).notNull(),

        createdAt: timestamp("created_at").defaultNow().notNull(),
    }
);

export const riskFlags = pgTable(
    "risk_flags",
    {
        id: uuid("id").defaultRandom().primaryKey(),

        userId: text("user_id").notNull(),

        reason: text("reason").notNull(),

        severity: integer("severity").default(1),

        resolved: boolean("resolved").default(false),

        createdAt: timestamp("created_at").defaultNow().notNull(),
    }
);

export const organizationMembers = pgTable(
    "organization_members",
    {
        id: uuid("id").defaultRandom().primaryKey(),

        organizationId: uuid("organization_id")
            .notNull()
            .references(() => organizations.id, { onDelete: "cascade" }),

        userId: text("user_id").notNull(),

        role: text("role").default("member"),

        joinedAt: timestamp("joined_at").defaultNow().notNull(),
    }
);

export const organizationWallets = pgTable(
    "organization_wallets",
    {
        id: uuid("id").defaultRandom().primaryKey(),

        organizationId: uuid("organization_id")
            .notNull()
            .references(() => organizations.id),

        accountId: uuid("account_id")
            .notNull()
            .references(() => accounts.id),

        createdAt: timestamp("created_at").defaultNow().notNull(),
    }
);

export const kyc = pgTable("kyc", {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: text("user_id").notNull().unique(),
    groupName: text("group_name"),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    bvn: text("bvn"),
    nin: text("nin"),
    phone: text("phone"),

    status: kycStatusEnum("status").notNull().default("pending"),

    verifiedAt: timestamp("verified_at"),
    rejectionReason: text("rejection_reason"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
});
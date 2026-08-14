"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createGroupAction,
  type CreateGroupState,
} from "@/app/(dashboard)/groups/actions";

const initial: CreateGroupState = { status: "idle" };

export default function NewGroupPage() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    createGroupAction,
    initial
  );

  useEffect(() => {
    if (state.status === "success") {
      router.push("/dashboard");
      router.refresh();
    }
  }, [state, router]);

  return (
    <div className="p-6 max-w-md">
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">
        Create a group
      </h1>
      <p className="text-sm text-gray-600 mb-6">
        Start another Ajo circle. A group pool ledger account is created
        automatically for Paystack contributions.
      </p>

      <form action={formAction} className="space-y-4">
        <div>
          <Label htmlFor="groupName">Group name</Label>
          <Input
            id="groupName"
            name="groupName"
            required
            placeholder="e.g. Office Ajo"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="contributionAmount">Contribution amount (per round)</Label>
          <Input
            id="contributionAmount"
            name="contributionAmount"
            type="text"
            placeholder="0.00"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="cycleDurationDays">Cycle length (days)</Label>
          <Input
            id="cycleDurationDays"
            name="cycleDurationDays"
            type="number"
            min={1}
            defaultValue={31}
            className="mt-1"
          />
        </div>

        {state.status === "error" && (
          <p className="text-sm text-red-600">{state.message}</p>
        )}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Creating…" : "Create group"}
        </Button>
      </form>

      <Link
        href="/dashboard"
        className="text-primary text-sm underline mt-6 inline-block"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
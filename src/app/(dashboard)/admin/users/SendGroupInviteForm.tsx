"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createGroupInvite,
  type GroupInviteFormState,
} from "@/app/(dashboard)/admin/actions";
import { useState } from "react";

const initial: GroupInviteFormState = {
  message: "",
  status: "default",
};

export function SendGroupInviteForm({
  groups,
}: {
  groups: { id: string; groupName: string }[];
}) {
  const [state, formAction, isPending] = useActionState(
    createGroupInvite,
    initial
  );
  const [groupId, setGroupId] = useState("");

  const statusClass =
    state.status === "success"
      ? "text-green-700"
      : state.status === "error"
        ? "text-red-600"
        : state.status === "warning"
          ? "text-amber-700"
          : "text-muted-foreground";

  if (groups.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No groups in the database yet. Complete onboarding or create a group
        from the dashboard first.
      </p>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      <div>
        <h4 className="font-medium text-foreground">Invite to a group (Ajo)</h4>
        <p className="text-sm text-muted-foreground mt-1">
          Creates a Balajo invite link. The recipient must sign in with the same
          email if one is stored on the invite. Resend sends an email when{" "}
          <code className="text-xs">RESEND_API_KEY</code> is set.
        </p>
      </div>

      <form action={formAction} className="space-y-3">
        <input type="hidden" name="groupId" value={groupId} />
        <div className="space-y-2">
          <Label>Group</Label>
          <Select
            required
            value={groupId}
            onValueChange={setGroupId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a group" />
            </SelectTrigger>
            <SelectContent>
              {groups.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.groupName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="group-invite-email">Invitee email</Label>
          <Input
            id="group-invite-email"
            name="email"
            type="email"
            placeholder="name@example.com"
            required
          />
        </div>
        <Button type="submit" disabled={isPending || !groupId}>
          {isPending ? "Creating…" : "Create invite & link"}
        </Button>
      </form>

      {state.message && (
        <p className={`text-sm ${statusClass}`}>{state.message}</p>
      )}

      {state.joinUrl && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Join link</Label>
          <div className="flex gap-2">
            <Input readOnly value={state.joinUrl} className="font-mono text-xs" />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void navigator.clipboard.writeText(state.joinUrl!)}
            >
              Copy
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

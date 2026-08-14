"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function JoinAjoContent() {
  const searchParams = useSearchParams();
  const [inviteId, setInviteId] = useState("");
  const [groupName, setGroupName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [joined, setJoined] = useState(false);

  const loadPreview = useCallback(async (raw: string) => {
    const id = raw.trim();
    setError(null);
    setGroupName(null);
    if (!id) {
      setError("Paste an invite ID or open your invite link.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/invites/${id}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Invalid invite");
      }
      setGroupName(data.groupName ?? "Group");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load invite");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const fromQuery = searchParams.get("invite")?.trim();
    if (fromQuery) {
      setInviteId(fromQuery);
      void loadPreview(fromQuery);
    }
  }, [searchParams, loadPreview]);

  const accept = async () => {
    const raw = inviteId.trim();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/invites/${raw}`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Could not join");
      }
      setJoined(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not join");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md">
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">Join an Ajo</h1>
      <p className="text-sm text-gray-600 mb-6">
        Use the link from your email or paste an invite ID. If the invite lists
        an email, sign in with that same address before accepting.
      </p>

      <div className="space-y-4">
        <div>
          <Label htmlFor="inviteId">Invite ID</Label>
          <Input
            id="inviteId"
            value={inviteId}
            onChange={(e) => setInviteId(e.target.value)}
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            className="mt-1 font-mono text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => loadPreview(inviteId)}
            disabled={loading}
          >
            Check invite
          </Button>
          <Button
            type="button"
            onClick={accept}
            disabled={loading || !groupName || joined}
          >
            {joined ? "Joined" : "Accept & join"}
          </Button>
        </div>
        {groupName && !joined && (
          <p className="text-sm text-green-700">
            You are invited to <strong>{groupName}</strong>.
          </p>
        )}
        {joined && (
          <p className="text-sm text-green-700">
            You have joined the group.{" "}
            <Link href="/dashboard" className="underline">
              Go to dashboard
            </Link>
          </p>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      <Link
        href="/dashboard"
        className="text-primary text-sm underline mt-8 inline-block"
      >
        Back to dashboard
      </Link>
    </div>
  );
}

export default function JoinAjoPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-gray-500">Loading invite…</div>
      }
    >
      <JoinAjoContent />
    </Suspense>
  );
}

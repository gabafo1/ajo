"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  getMyOwnedGroup,
  getJoinableGroups,
  configureMyGroup,
  joinGroup,
  activateMyGroup,
} from "./actions";
import { Loader2, Users, ShieldCheck, CheckCircle2 } from "lucide-react";

type Path = "choose" | "join" | "configure" | "activate" | "done";

export default function AjoSetupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Path>("choose");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [joinableGroups, setJoinableGroups] = useState<Awaited<ReturnType<typeof getJoinableGroups>>>([]);
  const [ownedGroup, setOwnedGroup] = useState<Awaited<ReturnType<typeof getMyOwnedGroup>>>(null);

  useEffect(() => {
    getMyOwnedGroup().then(setOwnedGroup);
  }, []);

  function goToJoin() {
    setError(null);
    startTransition(async () => {
      const list = await getJoinableGroups();
      setJoinableGroups(list);
      setStep("join");
    });
  }

  function handleJoin(groupId: string) {
    setError(null);
    startTransition(async () => {
      const res = await joinGroup(groupId);
      if (res.status === "error") {
        setError(res.message as string);
        return;
      }
      router.push("/dashboard");
    });
  }

  function handleConfigure(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await configureMyGroup(formData);
      if (res.status === "error") {
        setError(typeof res.message === "string" ? res.message : "Failed to save");
        return;
      }
      setStep("activate");
    });
  }

  function handleActivate() {
    setError(null);
    startTransition(async () => {
      const { authorizationUrl } = await activateMyGroup();
      window.location.href = authorizationUrl;
    });
  }

  return (
    <div className="max-w-lg mx-auto py-12 px-4">
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      {step === "choose" && (
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">Get started with Ajo</h1>
          <p className="text-gray-500 text-sm">Choose how you want to begin.</p>

          <button
            onClick={() => setStep("configure")}
            className="w-full text-left p-5 border rounded-xl hover:border-green-500 transition"
          >
            <div className="flex items-center gap-2 font-semibold">
              <ShieldCheck className="h-4 w-4 text-green-600" /> Set up my own group
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Configure contribution amount, cycle, and become admin after a one-time activation fee.
            </p>
          </button>

          <button
            onClick={goToJoin}
            disabled={isPending}
            className="w-full text-left p-5 border rounded-xl hover:border-green-500 transition"
          >
            <div className="flex items-center gap-2 font-semibold">
              <Users className="h-4 w-4 text-green-600" /> Join an existing group
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Browse public groups and join as a member.
            </p>
          </button>
        </div>
      )}

      {step === "join" && (
        <div className="space-y-4">
          <h1 className="text-xl font-bold">Choose a group to join</h1>
          {joinableGroups.length === 0 && (
            <p className="text-sm text-gray-500">No public groups available right now.</p>
          )}
          {joinableGroups.map((g) => (
            <button
              key={g.id}
              onClick={() => handleJoin(g.id)}
              disabled={isPending}
              className="w-full text-left p-4 border rounded-xl hover:border-green-500 transition flex justify-between items-center"
            >
              <div>
                <p className="font-medium">{g.groupName}</p>
                <p className="text-xs text-gray-500">
                  ₦{g.contributionAmount} · every {g.cycleDurationDays} days
                </p>
              </div>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            </button>
          ))}
          <button onClick={() => setStep("choose")} className="text-xs text-gray-400 underline">
            Back
          </button>
        </div>
      )}

      {step === "configure" && (
        <form action={handleConfigure} className="space-y-4">
          <h1 className="text-xl font-bold">Configure your group</h1>

          <div>
            <label className="text-sm font-medium">Group name</label>
            <input name="groupName" defaultValue={ownedGroup?.group.groupName} required
              className="w-full mt-1 px-4 py-2.5 border rounded-lg" />
          </div>

          <div>
            <label className="text-sm font-medium">Contribution amount (₦)</label>
            <input name="contributionAmount" type="number" min="1" step="0.01" required
              className="w-full mt-1 px-4 py-2.5 border rounded-lg" />
          </div>

          <div>
            <label className="text-sm font-medium">Cycle duration (days)</label>
            <input name="cycleDurationDays" type="number" min="1" defaultValue={31} required
              className="w-full mt-1 px-4 py-2.5 border rounded-lg" />
          </div>

          <div>
            <label className="text-sm font-medium">Max members</label>
            <input name="maxMembers" type="number" min="2" defaultValue={10} required
              className="w-full mt-1 px-4 py-2.5 border rounded-lg" />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isPublic" value="true" />
            Make this group discoverable to others
          </label>

          <button type="submit" disabled={isPending}
            className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold disabled:opacity-60">
            {isPending ? "Saving…" : "Continue"}
          </button>

          <button type="button" onClick={() => setStep("choose")} className="text-xs text-gray-400 underline block">
            Back
          </button>
        </form>
      )}

      {step === "activate" && (
        <div className="space-y-4 text-center">
          <CheckCircle2 className="h-10 w-10 text-green-600 mx-auto" />
          <h1 className="text-xl font-bold">Almost done</h1>
          <p className="text-sm text-gray-500">
            Pay a one-time activation fee to enable your group and become its admin.
          </p>
          <button onClick={handleActivate} disabled={isPending}
            className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold disabled:opacity-60">
            {isPending ? "Redirecting…" : "Pay & activate"}
          </button>
        </div>
      )}
    </div>
  );
}
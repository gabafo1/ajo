"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type CycleRow = {
  id: string;
  groupId: string;
  groupName: string;
  cycleNumber: number;
  status: string;
  startDate: string;
  endDate: string;
  beneficiaryUserId: string;
};

export default function SchedulePage() {
  const [cycles, setCycles] = useState<CycleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/cycles");
        const data = await res.json();
        if (!cancelled) {
          if (!res.ok) throw new Error(data.error || "Failed to load");
          setCycles(Array.isArray(data.cycles) ? data.cycles : []);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Error");
          setCycles([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">Schedule</h1>
      <p className="text-sm text-gray-600 mb-6">
        Cycles for groups you belong to. Add cycles via your admin tools or
        services when you start a round.
      </p>

      {loading && <p className="text-gray-500">Loading…</p>}
      {error && <p className="text-red-600 text-sm">{error}</p>}

      {!loading && !error && cycles.length === 0 && (
        <p className="text-gray-500">
          No cycles yet. Create a group and start a cycle from your backend or
          future UI.
        </p>
      )}

      {!loading && cycles.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Group</th>
                <th className="px-4 py-2 font-medium">Cycle #</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Start</th>
                <th className="px-4 py-2 font-medium">End</th>
                <th className="px-4 py-2 font-medium">Beneficiary</th>
              </tr>
            </thead>
            <tbody>
              {cycles.map((c) => (
                <tr key={c.id} className="border-t border-gray-100">
                  <td className="px-4 py-2">{c.groupName}</td>
                  <td className="px-4 py-2">{c.cycleNumber}</td>
                  <td className="px-4 py-2 capitalize">{c.status}</td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {new Date(c.startDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {new Date(c.endDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2 font-mono text-xs">{c.beneficiaryUserId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Link href="/dashboard" className="text-primary text-sm underline mt-8 inline-block">
        Back to dashboard
      </Link>
    </div>
  );
}

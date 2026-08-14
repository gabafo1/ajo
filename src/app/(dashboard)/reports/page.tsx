"use client";

import { useEffect, useState } from "react";
import AuditLogCard, {
  type AuditLogView,
} from "@/app/(dashboard)/components/AuditLogCard";

const ReportsPage: React.FC = () => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [logs, setLogs] = useState<AuditLogView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/audit-logs");
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error || res.statusText);
        }
        const data = await res.json();
        if (!cancelled && Array.isArray(data.logs)) {
          setLogs(data.logs);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load reports");
          setLogs([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const actions = Array.from(new Set(logs.map((l) => l.action))).sort();

  const filtered = logs.filter((log) => {
    const matchesFilter = filter === "all" || log.action === filter;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      log.user.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Ajo/Esusu audit report
        </h1>
        <p className="text-sm text-gray-600 mb-4">
          Admin-only activity from the database audit log.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Search by actor, action, or details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All actions</option>
            {actions.map((a) => (
              <option key={a} value={a}>
                {a.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>

        {loading && (
          <p className="text-gray-500 text-center">Loading audit logs…</p>
        )}
        {error && (
          <p className="text-red-600 text-center text-sm mb-4">{error}</p>
        )}

        {!loading && !error && (
          <div className="space-y-4">
            {filtered.length > 0 ? (
              filtered.map((log) => (
                <AuditLogCard key={log.id} log={log} />
              ))
            ) : (
              <p className="text-gray-500 text-center">No audit logs found.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;

"use client";

import { useEffect, useState, useCallback } from "react";
import TransactionCard from "@/app/(dashboard)/components/TransactionCard";

interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: "contribution" | "payout" | "fee";
  status: "completed" | "pending" | "failed";
  contributor: string;
}

const Transactions: React.FC = () => {
  const [transactionsData, setTransactionsData] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "contribution" | "payout" | "fee">("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // For new transaction form
  const [form, setForm] = useState({
    amount: "",
    type: "contribution",
    status: "completed",
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        type: filter,
        page: page.toString(),
        limit: "10",
      });
      const res = await fetch(`/api/transactions?${params.toString()}`);
      const json = await res.json();

      if (Array.isArray(json.data)) {
        setTransactionsData(json.data);
        setTotalPages(json.meta?.totalPages || 1);
      } else {
        setTransactionsData([]);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setTransactionsData([]);
    } finally {
      setLoading(false);
    }
  }, [search, filter, page]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // ✅ Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(form.amount),
          type: form.type,
          status: form.status,
        }),
      });

      if (!res.ok) throw new Error("Failed to create transaction");

      // Reset form and reload list
      setForm({ amount: "", type: "contribution", status: "completed" });
      fetchTransactions();
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Ajo/Esusu Transactions</h1>

        {/* ✅ Add Transaction Form */}
        <p className="text-sm text-gray-600 mb-2">
          New rows are recorded for your signed-in account (Clerk user id shown as
          contributor in the list).
        </p>
        <form
          onSubmit={handleSubmit}
          className="bg-white p-4 rounded-lg shadow-md mb-6 grid gap-3 sm:grid-cols-2"
        >
          <input
            type="number"
            placeholder="Amount"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            required
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="contribution">Contribution</option>
            <option value="payout">Payout</option>
            <option value="fee">Fee</option>
          </select>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>

          <button
            type="submit"
            disabled={submitting}
            className="sm:col-span-2 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Add Transaction"}
          </button>
        </form>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Search by user id, reference, or date..."
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={filter}
            onChange={(e) => {
              setPage(1);
              setFilter(e.target.value as "all" | "contribution" | "payout" | "fee");
            }}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="contribution">Contributions</option>
            <option value="payout">Payouts</option>
            <option value="fee">Fees</option>
          </select>
        </div>

        {/* Transaction List */}
        {loading ? (
          <p className="text-gray-500 text-center">Loading transactions...</p>
        ) : (
          <div className="space-y-4">
            {transactionsData.length > 0 ? (
              transactionsData.map((transaction) => (
                <TransactionCard key={transaction.id} transaction={transaction} />
              ))
            ) : (
              <p className="text-gray-500 text-center">No transactions found.</p>
            )}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50"
            >
              Prev
            </button>
            <span className="px-3 py-2 text-gray-700">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;
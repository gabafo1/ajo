"use client";

import React from "react";

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: "contribution" | "payout" | "fee";
  status: "completed" | "pending" | "failed";
  contributor: string;
}

interface TransactionCardProps {
  transaction: Transaction;
}

const TransactionCard: React.FC<TransactionCardProps> = ({ transaction }) => {
  const statusColors = {
    completed: "bg-green-100 text-green-800",
    pending: "bg-yellow-100 text-yellow-800",
    failed: "bg-red-100 text-red-800",
  };

  const typeLabels = {
    contribution: "Contribution",
    payout: "Payout",
    fee: "Service Fee",
  };

  if (!transaction) {
    return <div className="text-red-500 text-sm">Invalid transaction data</div>;
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex justify-between items-center">
      <div>
        <p className="text-sm font-medium text-gray-900">{transaction.contributor}</p>
        <p className="text-xs text-gray-500">{transaction.date}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold">
          {transaction.type === "payout" ? "-" : "+"}₦
          {transaction.amount.toLocaleString()}
        </p>
        <p
          className={`text-xs font-medium ${
            statusColors[transaction.status]
          } px-2 py-1 rounded-full mt-1 inline-block`}
        >
          {typeLabels[transaction.type]} •{" "}
          {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
        </p>
      </div>
    </div>
  );
};

export default TransactionCard;

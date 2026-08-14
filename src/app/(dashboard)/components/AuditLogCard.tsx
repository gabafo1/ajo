"use client";

export type AuditLogView = {
  id: string;
  timestamp: string;
  action: string;
  actionLabel?: string;
  status: "success" | "pending" | "failed";
  user: string;
  details: string;
};

function formatAction(action: string) {
  return action.replace(/_/g, " ");
}

const AuditLogCard: React.FC<{ log?: AuditLogView }> = ({ log }) => {
  const statusColors = {
    success: "bg-green-100 text-green-800",
    pending: "bg-yellow-100 text-yellow-800",
    failed: "bg-red-100 text-red-800",
  };

  if (!log?.id || !log.user) {
    return <div className="text-red-500 text-sm">Invalid audit log data</div>;
  }

  const title = log.actionLabel ?? formatAction(log.action);

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex justify-between items-center">
      <div>
        <p className="text-sm font-medium text-gray-900">{log.user}</p>
        <p className="text-xs text-gray-500">{log.timestamp}</p>
        <p className="text-xs text-gray-600 mt-1">{log.details}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold">{title}</p>
        <p
          className={`text-xs font-medium ${statusColors[log.status]} px-2 py-1 rounded-full mt-1 inline-block`}
        >
          {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
        </p>
      </div>
    </div>
  );
};

export default AuditLogCard;

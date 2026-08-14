import Link from "next/link";
import { Users, PiggyBank, CalendarDays, BarChart3, Plus } from "lucide-react";

function QuickActions() {
  const actions = [
    {
      title: 'Create Ajo Group',
      icon: Plus,
      color: 'bg-blue-600',
      href: '/groups/new'
    },
    {
      title: 'Join Existing Ajo',
      icon: Users,
      color: 'bg-green-600',
      href: '/ajo/join'
    },
    {
      title: 'View Schedule',
      icon: CalendarDays,
      color: 'bg-blue-600',
      href: '/schedule'
    },
    {
      title: 'View Reports',
      icon: BarChart3,
      color: 'bg-orange-600',
      href: '/reports'
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Link
              href={action.href}
              key={index}
              className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all text-left group"
            >
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg ${action.color} group-hover:scale-110 transition-transform`}>
                  <Icon size={20} className="text-white" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                    {action.title}
                  </h4>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default QuickActions;

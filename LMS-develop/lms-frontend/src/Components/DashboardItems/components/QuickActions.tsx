import { Play, Upload, Calendar } from 'lucide-react';

const QuickActions = () => {
  const actions = [
    {
      id: 1,
      title: 'Start Assessment',
      icon: Play,
      color: 'bg-gradient-to-r from-blue-500 to-blue-600',
      hoverColor: 'hover:from-blue-600 hover:to-blue-700',
    },
    {
      id: 2,
      title: 'Upload Project',
      icon: Upload,
      color: 'bg-gradient-to-r from-green-500 to-green-600',
      hoverColor: 'hover:from-green-600 hover:to-green-700',
    },
    {
      id: 3,
      title: 'View Schedule',
      icon: Calendar,
      color: 'bg-gradient-to-r from-orange-500 to-orange-600',
      hoverColor: 'hover:from-orange-600 hover:to-orange-700',
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Quick Actions</h2>

      <div className="space-y-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              className={`w-full ${action.color} ${action.hoverColor} text-white font-medium py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md`}
            >
              <Icon className="w-5 h-5" />
              {action.title}
            </button>
          );
        })}
      </div>

      <div className="mt-8 p-4 bg-gradient-to-br from-blue-50 to-green-50 rounded-lg border border-blue-100">
        <h3 className="font-semibold text-gray-800 mb-2">Need Help?</h3>
        <p className="text-sm text-gray-600 mb-3">
          Contact your teacher or visit our help center for assistance.
        </p>
        <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
          Get Support
        </button>
      </div>
    </div>
  );
};

export default QuickActions;

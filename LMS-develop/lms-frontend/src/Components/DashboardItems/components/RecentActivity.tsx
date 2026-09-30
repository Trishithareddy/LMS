import { Bell, FileText, FolderKanban } from 'lucide-react';

const RecentActivity = () => {
  const activities = [
    {
      id: 1,
      type: 'announcement',
      title: 'New Course Materials Available',
      description: 'Check out the latest resources for HappyCoder 2.0 Level 3',
      time: '2 hours ago',
      icon: Bell,
      color: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
    {
      id: 2,
      type: 'assessment',
      title: 'Mathematics Quiz Assigned',
      description: 'Complete the Chapter 5 assessment by Friday',
      time: '5 hours ago',
      icon: FileText,
      color: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      id: 3,
      type: 'project',
      title: 'Science Project Submitted',
      description: 'Your Solar System project has been received',
      time: '1 day ago',
      icon: FolderKanban,
      color: 'bg-orange-50',
      iconColor: 'text-orange-600',
    },
    {
      id: 4,
      type: 'announcement',
      title: 'Parent-Teacher Meeting Scheduled',
      description: 'Meeting scheduled for next Monday at 3 PM',
      time: '2 days ago',
      icon: Bell,
      color: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
    {
      id: 5,
      type: 'assessment',
      title: 'Creative Arts Assignment Due',
      description: 'Submit your digital artwork by Wednesday',
      time: '3 days ago',
      icon: FileText,
      color: 'bg-green-50',
      iconColor: 'text-green-600',
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Recent Activity</h2>

      <div className="relative">
        <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-gray-200"></div>

        <div className="space-y-6">
          {activities.map((activity, index) => {
            const Icon = activity.icon;
            return (
              <div key={activity.id} className="relative pl-12">
                <div className={`absolute left-0 top-0 ${activity.color} p-2 rounded-lg`}>
                  <Icon className={`w-5 h-5 ${activity.iconColor}`} />
                </div>

                <div className={index !== activities.length - 1 ? 'pb-6' : ''}>
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-semibold text-gray-800">{activity.title}</h3>
                    <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                      {activity.time}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{activity.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RecentActivity;

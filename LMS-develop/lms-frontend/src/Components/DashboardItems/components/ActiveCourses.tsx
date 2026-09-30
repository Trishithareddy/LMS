import { Play } from 'lucide-react';

const ActiveCourses = () => {
  const courses = [
    {
      id: 1,
      title: 'HappyCoder 2.0 Level 3',
      grade: 'Grade 3',
      progress: 75,
      thumbnail: 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=600',
      color: 'bg-blue-500',
    },
    {
      id: 2,
      title: 'Creative Arts & Design',
      grade: 'Grade 4',
      progress: 60,
      thumbnail: 'https://images.pexels.com/photos/1053687/pexels-photo-1053687.jpeg?auto=compress&cs=tinysrgb&w=600',
      color: 'bg-green-500',
    },
    {
      id: 3,
      title: 'Mathematics Advanced',
      grade: 'Grade 3',
      progress: 85,
      thumbnail: 'https://images.pexels.com/photos/3729557/pexels-photo-3729557.jpeg?auto=compress&cs=tinysrgb&w=600',
      color: 'bg-purple-500',
    },
    {
      id: 4,
      title: 'Science Explorers',
      grade: 'Grade 4',
      progress: 45,
      thumbnail: 'https://images.pexels.com/photos/2280547/pexels-photo-2280547.jpeg?auto=compress&cs=tinysrgb&w=600',
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Active Courses</h2>
        <button className="text-blue-600 font-medium text-sm hover:text-blue-700">
          View All Courses
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {courses.map((course) => (
          <div
            key={course.id}
            className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden"
          >
            <div className="relative h-40 overflow-hidden">
              <img
                src={course.thumbnail}
                alt={course.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 right-3">
                <span className={`${course.color} text-white text-xs font-semibold px-3 py-1.5 rounded-full`}>
                  {course.grade}
                </span>
              </div>
            </div>

            <div className="p-5">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {course.title}
              </h3>

              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-semibold text-gray-800">{course.progress}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className={`${course.color} h-2 rounded-full transition-all`}
                    style={{ width: `${course.progress}%` }}
                  ></div>
                </div>
              </div>

              <button className="w-full bg-gradient-to-r from-blue-500 to-green-500 text-white font-medium py-2.5 px-4 rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2">
                <Play className="w-4 h-4" />
                Continue Learning
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActiveCourses;

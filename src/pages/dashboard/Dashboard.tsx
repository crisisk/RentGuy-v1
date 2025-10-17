import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import projectStore from '../../stores/projectStore';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [projects, setProjects] = useState<number>(0);
  const [stats, setStats] = useState<{ totalTasks: number; completedTasks: number }>({ totalTasks: 0, completedTasks: 0 });
  const [activities, setActivities] = useState<Array<{ id: string; title: string; date: string; status: string }>>([]);
  const [revenueData, setRevenueData] = useState<number[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const projectData = await projectStore.getProjects();
        const statsData = await projectStore.getStats();
        const activitiesData = await projectStore.getRecentActivities();
        
        setProjects(projectData.length);
        setStats(statsData);
        setActivities(activitiesData);
        setRevenueData(generateRevenueData());
        setError('');
      } catch (err) {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const generateRevenueData = () => {
    return Array.from({ length: 12 }, () => Math.floor(Math.random() * 10000) + 5000);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  if (loading) return <div className="p-4 text-gray-500">Loading dashboard...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="p-4 space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-gray-500 text-sm">Total Projects</h3>
          <p className="text-2xl font-semibold">{projects}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-gray-500 text-sm">Total Tasks</h3>
          <p className="text-2xl font-semibold">{stats.totalTasks}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-gray-500 text-sm">Completed Tasks</h3>
          <p className="text-2xl font-semibold">{stats.completedTasks}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-gray-500 text-sm">Completion Rate</h3>
          <p className="text-2xl font-semibold">
            {stats.totalTasks ? `${Math.round((stats.completedTasks / stats.totalTasks) * 100)}%` : '0%'}
          </p>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Revenue Overview</h2>
        <div className="h-64">
          <svg width="100%" height="100%">
            {revenueData.map((value, index) => (
              <React.Fragment key={index}>
                <circle
                  cx={`${(index / (revenueData.length - 1)) * 100}%`}
                  cy={`${100 - (value / 15000) * 100}%`}
                  r="4"
                  className="fill-blue-500"
                />
                {index > 0 && (
                  <line
                    x1={`${((index - 1) / (revenueData.length - 1)) * 100}%`}
                    y1={`${100 - (revenueData[index - 1] / 15000) * 100}%`}
                    x2={`${(index / (revenueData.length - 1)) * 100}%`}
                    y2={`${100 - (value / 15000) * 100}%`}
                    className="stroke-blue-500 stroke-2"
                  />
                )}
              </React.Fragment>
            ))}
          </svg>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Recent Activities</h2>
        <div className="space-y-3">
          {activities.map(activity => (
            <div key={activity.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
              <div className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${activity.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                <span className="font-medium">{activity.title}</span>
              </div>
              <span className="text-sm text-gray-500">{formatDate(activity.date)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

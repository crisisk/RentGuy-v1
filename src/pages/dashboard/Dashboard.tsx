import { useEffect } from 'react';
import { useProjectStore } from '../stores/projectStore';
import { useFinanceStore } from '../stores/financeStore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Type definitions for dashboard data
interface DashboardData {
  upcomingProjects: Array<{
    id: string;
    name: string;
    deadline: string;
    status: 'planning' | 'active' | 'completed';
  }>;
  recentActivities: Array<{
    id: string;
    description: string;
    timestamp: string;
    type: 'update' | 'creation' | 'alert';
  }>;
  revenueData: Array<{
    date: string;
    amount: number;
  }>;
  crewSchedule: Array<{
    id: string;
    crewMember: string;
    project: string;
    shift: string;
  }>;
}

const Dashboard = () => {
  const { projects, loading: projectsLoading, error: projectsError } = useProjectStore();
  const { revenue, loading: financeLoading, error: financeError } = useFinanceStore();

  useEffect(() => {
    // Fetch initial data on mount
    useProjectStore.getState().fetchProjects();
    useFinanceStore.getState().fetchRevenue();
  }, []);

  // Combined loading state
  const isLoading = projectsLoading || financeLoading;
  const error = projectsError || financeError;

  if (error) {
    return (
      <div className="p-6 bg-red-50 text-red-600 rounded-lg">
        Error loading dashboard data: {error.message}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Quick Actions Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
          Create New Project
        </button>
        <button className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
          Generate Report
        </button>
        <button className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
          Schedule Meeting
        </button>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Revenue Chart */}
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Revenue Overview</h2>
            {isLoading ? (
              <div className="h-64 bg-gray-100 animate-pulse rounded" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#3b82f6"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Upcoming Projects */}
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Upcoming Projects</h2>
            {isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 animate-pulse rounded mb-2" />
              ))
            ) : (
              <table className="w-full">
                <tbody>
                  {projects.slice(0, 5).map((project) => (
                    <tr key={project.id} className="border-b last:border-0">
                      <td className="py-3">{project.name}</td>
                      <td className="py-3 text-gray-500">{project.deadline}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-sm ${
                          project.status === 'active' ? 'bg-blue-100 text-blue-800' :
                          project.status === 'completed' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {project.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Crew Schedule */}
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Crew Schedule</h2>
            {isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 animate-pulse rounded mb-2" />
              ))
            ) : (
              <div className="space-y-3">
                {projects[0]?.crewSchedule?.map((schedule) => (
                  <div key={schedule.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{schedule.crewMember}</p>
                      <p className="text-sm text-gray-500">{schedule.project}</p>
                    </div>
                    <span className="text-sm text-gray-600">{schedule.shift}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activities */}
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Recent Activities</h2>
            {isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 animate-pulse rounded mb-2" />
              ))
            ) : (
              <div className="space-y-3">
                {projects[0]?.recentActivities?.map((activity) => (
                  <div key={activity.id} className="flex items-start">
                    <div className={`w-2 h-2 mt-2 rounded-full ${
                      activity.type === 'update' ? 'bg-blue-500' :
                      activity.type === 'creation' ? 'bg-green-500' :
                      'bg-red-500'
                    }`} />
                    <div className="ml-3">
                      <p className="text-sm">{activity.description}</p>
                      <p className="text-xs text-gray-500">{activity.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

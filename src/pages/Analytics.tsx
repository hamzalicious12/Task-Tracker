import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { getAttendanceStats, getDepartmentAttendance } from '@/api/attendance';
import { getUsers } from '@/api/users';
import { getTasks } from '@/api/tasks';
import { format, subDays, isSameDay } from 'date-fns';
import { Task, User } from '@/types';
import DepartmentPerformanceChart from '@/components/Charts/DepartmentPerformanceChart';
import TaskStatusChart from '@/components/Charts/TaskStatusChart';

interface DepartmentStats {
  name: string;
  employeeCount: number;
  taskCompletion: number;
  attendanceRate: number;
  presentToday: number;
  performance: number;
}

const Analytics = () => {
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: getUsers
  });

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: () => getTasks()
  });

  const { data: departmentAttendance = [] } = useQuery({
    queryKey: ['department-attendance'],
    queryFn: () => getDepartmentAttendance()
  });

  const { data: attendanceStats } = useQuery({
    queryKey: ['attendance-stats'],
    queryFn: () => getAttendanceStats()
  });

  // Get unique departments
  const departments = Array.from(new Set(users.filter(u => u.department).map(user => user.department!)));

  // Calculate department-wise statistics
  const departmentStats: DepartmentStats[] = departments.map(dept => {
    const deptUsers = users.filter(user => user.department === dept);
    const deptTasks = tasks.filter(task => task.department === dept);
    const deptAttendance = departmentAttendance.find(stat => stat.department === dept) || {
      averageAttendance: 0,
      totalEmployees: deptUsers.length,
      presentToday: 0
    };

    const stats = {
      name: dept,
      employeeCount: deptUsers.length,
      taskCompletion: deptTasks.length > 0
        ? (deptTasks.filter(t => t.status === 'COMPLETED').length / deptTasks.length) * 100
        : 0,
      attendanceRate: deptAttendance.averageAttendance,
      presentToday: deptAttendance.presentToday,
      performance: 0
    };

    // Calculate performance score (weighted average of task completion and attendance)
    stats.performance = (stats.taskCompletion * 0.6) + (stats.attendanceRate * 0.4);
    return stats;
  });

  // Prepare chart data
  const taskStatusData = [
    { status: 'Pending', count: tasks.filter(t => t.status === 'PENDING').length },
    { status: 'In Progress', count: tasks.filter(t => t.status === 'IN_PROGRESS').length },
    { status: 'Completed', count: tasks.filter(t => t.status === 'COMPLETED').length },
    { status: 'Late', count: tasks.filter(t => t.status === 'LATE').length }
  ];

  const departmentChartData = departments.map(dept => ({
    department: dept,
    completed: tasks.filter(t => t.department === dept && t.status === 'COMPLETED').length,
    pending: tasks.filter(t => t.department === dept && t.status === 'PENDING').length,
    late: tasks.filter(t => t.department === dept && t.status === 'LATE').length
  }));

  // Calculate trend data for the last 7 days
  const getLast7DaysTrend = () => {
    const trend = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      const dayTasks = tasks.filter(task => {
        const updatedAt = new Date(task.updatedAt);
        return isSameDay(updatedAt, date);
      });
      
      const completed = dayTasks.filter(t => t.status === 'COMPLETED').length;
      const total = dayTasks.length;
      
      trend.push({
        date: format(date, 'MMM dd'),
        completed,
        total,
        rate: total > 0 ? (completed / total) * 100 : 0
      });
    }
    
    return trend;
  };
  
  const trendData = getLast7DaysTrend();

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <h1 className="text-2xl font-semibold text-gray-900">Organization Analytics</h1>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Total Employees</h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">{users.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Task Completion Rate</h3>
            <p className="mt-2 text-3xl font-semibold text-indigo-600">
              {tasks.length > 0
                ? `${Math.round((tasks.filter(t => t.status === 'COMPLETED').length / tasks.length) * 100)}%`
                : '0%'
              }
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Overall Attendance</h3>
            <p className="mt-2 text-3xl font-semibold text-green-600">
              {attendanceStats
                ? `${Math.round(attendanceStats.attendancePercentage)}%`
                : '0%'
              }
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Active Departments</h3>
            <p className="mt-2 text-3xl font-semibold text-purple-600">{departments.length}</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Task Status Overview</h2>
            <TaskStatusChart data={taskStatusData} />
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Department Performance</h2>
            <DepartmentPerformanceChart data={departmentChartData} />
          </div>
        </div>

        {/* Department Performance Table */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Department Statistics</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employees</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task Completion</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attendance Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Present Today</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Performance Score</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {departmentStats.map((dept, index) => (
                  <tr key={dept.name} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{dept.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{dept.employeeCount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{Math.round(dept.taskCompletion)}%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{Math.round(dept.attendanceRate)}%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{dept.presentToday}/{dept.employeeCount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{Math.round(dept.performance)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Task Completion Trend */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Task Completion Trend (Last 7 Days)</h2>
          </div>
          <div className="p-6">
            <div className="h-80">
              <div className="flex justify-between mb-4">
                {trendData.map((day, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div className="text-sm text-gray-500">{day.date}</div>
                    <div className="h-60 w-16 bg-gray-100 relative mt-2 rounded-t-md">
                      {day.total > 0 && (
                        <div
                          className="absolute bottom-0 w-full bg-indigo-500 rounded-t-md"
                          style={{ height: `${Math.min(day.rate, 100)}%` }}
                        ></div>
                      )}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">{Math.round(day.rate)}%</div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                {trendData.map((day, index) => (
                  <div key={index} className="text-center">
                    <div>{day.completed}/{day.total}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Analytics;

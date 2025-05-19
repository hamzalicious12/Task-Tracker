import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import TaskStatusChart from '@/components/Charts/TaskStatusChart';
import DepartmentPerformanceChart from '@/components/Charts/DepartmentPerformanceChart';
import { getTasks } from '@/api/tasks';
import { getUsers } from '@/api/users';
import { Task, User } from '@/types';
import { useNavigate } from 'react-router-dom';

const CEODashboard = () => {
  const navigate = useNavigate();
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: () => getTasks()
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => getUsers()
  });

  const taskStatusData = [
    { status: 'Pending', count: tasks.filter(t => t.status === 'PENDING').length },
    { status: 'In Progress', count: tasks.filter(t => t.status === 'IN_PROGRESS').length },
    { status: 'Completed', count: tasks.filter(t => t.status === 'COMPLETED').length },
    { status: 'Late', count: tasks.filter(t => t.status === 'LATE').length }
  ];

  const departments = Array.from(new Set(users.map(u => u.department).filter((d): d is string => !!d)));
  const departmentData = departments.map(dept => ({
    department: dept,
    completed: tasks.filter(t => t.department === dept && t.status === 'COMPLETED').length,
    pending: tasks.filter(t => t.department === dept && t.status === 'PENDING').length,
    late: tasks.filter(t => t.department === dept && t.status === 'LATE').length,
    employeeCount: users.filter(u => u.department === dept).length
  }));

  const selectedDepartmentData = selectedDepartment
    ? {
        tasks: tasks.filter(t => t.department === selectedDepartment),
        employees: users.filter(u => u.department === selectedDepartment),
      }
    : null;

  const handleDepartmentClick = (dept: string) => {
    setSelectedDepartment(selectedDepartment === dept ? null : dept);
  };

  const handleViewAnalytics = () => {
    navigate('/analytics');
  };
  
  const handleViewDepartments = () => {
    navigate('/ceo/departments');
  };

  if (tasksLoading || usersLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">CEO Dashboard</h1>
          <div className="flex space-x-2">
            <button
              onClick={handleViewAnalytics}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              View Analytics
            </button>
            {/* Removing duplicate buttons since they are already in the sidebar */}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Total Employees</h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">{users.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Total Tasks</h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">{tasks.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Departments</h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">{departments.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Completion Rate</h3>
            <p className="mt-2 text-3xl font-semibold text-indigo-600">
              {tasks.length > 0
                ? `${Math.round((tasks.filter(t => t.status === 'COMPLETED').length / tasks.length) * 100)}%`
                : '0%'
              }
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Task Status Overview</h2>
            <TaskStatusChart data={taskStatusData} />
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Department Performance</h2>
            <DepartmentPerformanceChart data={departmentData} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Department Overview</h2>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-600">Select a department to view more details</p>
            <button
              onClick={handleViewDepartments}
              className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
            >
              View All Departments
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {departmentData.map(dept => (
              <div
                key={dept.department}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  selectedDepartment === dept.department
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-indigo-500'
                }`}
                onClick={() => handleDepartmentClick(dept.department)}
              >
                <h3 className="font-medium text-gray-900">{dept.department}</h3>
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-gray-600">
                    Employees: {dept.employeeCount}
                  </p>
                  <p className="text-sm text-gray-600">
                    Tasks: {dept.completed + dept.pending + dept.late}
                  </p>
                  <div className="flex space-x-2 text-sm">
                    <span className="text-green-600">{dept.completed} completed</span>
                    <span className="text-yellow-600">{dept.pending} pending</span>
                    <span className="text-red-600">{dept.late} late</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedDepartmentData && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              {selectedDepartment} Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-2">Employees</h3>
                <div className="space-y-2">
                  {selectedDepartmentData.employees.map(employee => (
                    <div key={employee._id} className="p-2 bg-gray-50 rounded">
                      <p className="font-medium">{employee.name}</p>
                      <p className="text-sm text-gray-600">{employee.email}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-2">Recent Tasks</h3>
                <div className="space-y-2">
                  {selectedDepartmentData.tasks.slice(0, 5).map(task => (
                    <div key={task._id} className="p-2 bg-gray-50 rounded">
                      <p className="font-medium">{task.title}</p>
                      <p className="text-sm text-gray-600">
                        Status: <span className={
                          task.status === 'COMPLETED' ? 'text-green-600' :
                          task.status === 'LATE' ? 'text-red-600' :
                          'text-yellow-600'
                        }>{task.status}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CEODashboard;
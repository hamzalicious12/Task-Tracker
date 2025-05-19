import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { getDepartments } from '@/api/departments';
import { getUsers } from '@/api/users';
import { getTasks } from '@/api/tasks';
import { Department, User, Task } from '@/types';

interface DepartmentDetail extends Department {
  employees: User[];
  tasks: {
    total: number;
    completed: number;
    pending: number;
    late: number;
  };
  performanceScore: number;
}

const CEODepartments = () => {
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);

  const { data: departments = [], isLoading: isLoadingDepartments } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: getDepartments
  });

  const { data: users = [], isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: getUsers
  });

  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: getTasks
  });

  const isLoading = isLoadingDepartments || isLoadingUsers || isLoadingTasks;

  // Process department data with additional information
  const departmentDetails: DepartmentDetail[] = departments.map(dept => {
    const deptEmployees = users.filter(user => user.department === dept.name);
    const deptTasks = tasks.filter(task => task.department === dept.name);
    
    const tasksStats = {
      total: deptTasks.length,
      completed: deptTasks.filter(t => t.status === 'COMPLETED').length,
      pending: deptTasks.filter(t => t.status === 'PENDING').length,
      late: deptTasks.filter(t => t.status === 'LATE').length
    };
    
    const completionRate = tasksStats.total > 0 
      ? (tasksStats.completed / tasksStats.total) * 100 
      : 0;
    
    return {
      ...dept,
      employees: deptEmployees,
      tasks: tasksStats,
      performanceScore: completionRate
    };
  });

  const selectedDeptDetail = selectedDepartment 
    ? departmentDetails.find(d => d._id === selectedDepartment) 
    : null;

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <h1 className="text-2xl font-semibold text-gray-900">Department Management</h1>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-600">Loading...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Department List */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Departments</h2>
                </div>
                <div className="divide-y divide-gray-200">
                  {departmentDetails.map((dept) => (
                    <div
                      key={dept._id}
                      className={`px-6 py-4 cursor-pointer transition-colors ${
                        selectedDepartment === dept._id
                          ? 'bg-indigo-50'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedDepartment(
                        selectedDepartment === dept._id ? null : dept._id
                      )}
                    >
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-medium text-gray-900">{dept.name}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          dept.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {dept.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="mt-1 flex justify-between">
                        <span className="text-xs text-gray-500">
                          {dept.employees.length} Employees
                        </span>
                        <span className="text-xs text-gray-500">
                          {dept.tasks.total} Tasks
                        </span>
                      </div>
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-indigo-600 h-1.5 rounded-full"
                          style={{ width: `${Math.min(dept.performanceScore, 100)}%` }}
                        ></div>
                      </div>
                      <div className="mt-1 text-xs text-right text-gray-500">
                        {Math.round(dept.performanceScore)}% Performance
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Department Details */}
            <div className="lg:col-span-2">
              {selectedDeptDetail ? (
                <div className="bg-white rounded-lg shadow-sm">
                  <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-lg font-medium text-gray-900">{selectedDeptDetail.name} Details</h2>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      selectedDeptDetail.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedDeptDetail.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="p-6">
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Department Overview</h3>
                      <p className="text-sm text-gray-600">{selectedDeptDetail.description || 'No description available.'}</p>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                        <div className="bg-indigo-50 p-3 rounded-lg text-center">
                          <div className="text-2xl font-semibold text-indigo-600">
                            {selectedDeptDetail.employees.length}
                          </div>
                          <div className="text-xs text-gray-500">Employees</div>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg text-center">
                          <div className="text-2xl font-semibold text-green-600">
                            {selectedDeptDetail.tasks.completed}
                          </div>
                          <div className="text-xs text-gray-500">Completed Tasks</div>
                        </div>
                        <div className="bg-yellow-50 p-3 rounded-lg text-center">
                          <div className="text-2xl font-semibold text-yellow-600">
                            {selectedDeptDetail.tasks.pending}
                          </div>
                          <div className="text-xs text-gray-500">Pending Tasks</div>
                        </div>
                        <div className="bg-red-50 p-3 rounded-lg text-center">
                          <div className="text-2xl font-semibold text-red-600">
                            {selectedDeptDetail.tasks.late}
                          </div>
                          <div className="text-xs text-gray-500">Late Tasks</div>
                        </div>
                      </div>
                    </div>

                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Department Performance</h3>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                        <div
                          className="bg-indigo-600 h-2.5 rounded-full"
                          style={{ width: `${Math.min(selectedDeptDetail.performanceScore, 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>0%</span>
                        <span>Performance: {Math.round(selectedDeptDetail.performanceScore)}%</span>
                        <span>100%</span>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Department Members</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {selectedDeptDetail.employees.map(employee => (
                          <div key={employee._id} className="p-3 border border-gray-200 rounded-lg">
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                                <span className="text-indigo-600 font-medium text-sm">
                                  {employee.name.charAt(0)}
                                </span>
                              </div>
                              <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900">{employee.name}</p>
                                <p className="text-xs text-gray-500">{employee.email}</p>
                              </div>
                            </div>
                            <div className="mt-2 text-xs text-gray-500">
                              <span className="inline-block px-2 py-1 bg-indigo-50 text-indigo-600 rounded">
                                {employee.role}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm p-6 flex items-center justify-center h-64">
                  <p className="text-gray-500">Select a department to view details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CEODepartments;

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '../../../components/Layout/DashboardLayout';
import TaskCard from '../../../components/Tasks/TaskCard';
import { getTasks, updateTask } from '../../../api/tasks';
import { Task } from '../../../types';
import { useAuth } from '../../../context/AuthContext';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ['tasks', user?._id],
    queryFn: () => getTasks({ assignedTo: user?._id })
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, updates }: { taskId: string; updates: Partial<Task> }) =>
      updateTask(taskId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });

  const handleStatusChange = (taskId: string, status: Task['status']) => {
    updateTaskMutation.mutate({ taskId, updates: { status } });
  };

  const groupedTasks = {
    pending: tasks.filter(t => t.status === 'PENDING'),
    inProgress: tasks.filter(t => t.status === 'IN_PROGRESS'),
    completed: tasks.filter(t => t.status === 'COMPLETED')
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900">My Tasks</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Pending</h2>
            <div className="space-y-4">
              {groupedTasks.pending.map(task => (
                <TaskCard
                  key={task._id}
                  task={task}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">In Progress</h2>
            <div className="space-y-4">
              {groupedTasks.inProgress.map(task => (
                <TaskCard
                  key={task._id}
                  task={task}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Completed</h2>
            <div className="space-y-4">
              {groupedTasks.completed.map(task => (
                <TaskCard
                  key={task._id}
                  task={task}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EmployeeDashboard;
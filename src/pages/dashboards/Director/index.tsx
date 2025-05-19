import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import TaskCard from '@/components/Tasks/TaskCard';
import TaskForm from '@/components/Tasks/TaskForm';
import { getTasks, createTask, updateTask, deleteTask } from '@/api/tasks';
import { getUsers } from '@/api/users';
import { Task, User } from '@/types';
import { Plus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const DirectorDashboard = () => {
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ['tasks', user?.department],
    queryFn: () => getTasks({ department: user?.department }),
    enabled: !!user
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => getUsers({ department: user?.department }),
    enabled: !!user
  });

  const createTaskMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setNotification({ message: 'Task created successfully', type: 'success' });
      setShowTaskForm(false);
    },
    onError: (error: any) => {
      setNotification({ 
        message: error.response?.data?.message || 'Failed to create task', 
        type: 'error' 
      });
    }
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, updates }: { taskId: string; updates: Partial<Task> }) =>
      updateTask(taskId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setNotification({ message: 'Task updated successfully', type: 'success' });
    },
    onError: (error: any) => {
      setNotification({ 
        message: error.response?.data?.message || 'Failed to update task', 
        type: 'error' 
      });
    }
  });

  const deleteTaskMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setNotification({ message: 'Task deleted successfully', type: 'success' });
    },
    onError: (error: any) => {
      setNotification({ 
        message: error.response?.data?.message || 'Failed to delete task', 
        type: 'error' 
      });
    }
  });

  const handleStatusChange = (taskId: string, status: Task['status']) => {
    updateTaskMutation.mutate({ taskId, updates: { status } });
  };

  const handleCreateTask = (taskData: Partial<Task>) => {
    if (!user?._id || !user?.department) return;
    createTaskMutation.mutate({
      ...taskData,
      assignedBy: user._id,
      department: user.department
    });
  };

  const handleDeleteTask = (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      deleteTaskMutation.mutate(taskId);
    }
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

  const groupedTasks = {
    pending: tasks.filter(t => t.status === 'PENDING'),
    inProgress: tasks.filter(t => t.status === 'IN_PROGRESS'),
    completed: tasks.filter(t => t.status === 'COMPLETED'),
    late: tasks.filter(t => t.status === 'LATE')
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {notification && (
          <div className={`p-4 rounded-md ${
            notification.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {notification.message}
          </div>
        )}

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Director Dashboard</h1>
            <p className="text-gray-600 mt-1">Department: {user?.department}</p>
          </div>
          <button
            onClick={() => setShowTaskForm(true)}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Task
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {Object.entries(groupedTasks).map(([status, taskList]) => (
            <div key={status}>
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                {status.charAt(0).toUpperCase() + status.slice(1)} ({taskList.length})
              </h2>
              <div className="space-y-4">
                {taskList.map(task => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDeleteTask}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {showTaskForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">Create New Task</h2>
              <TaskForm
                users={users}
                onSubmit={handleCreateTask}
                onCancel={() => setShowTaskForm(false)}
              />
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DirectorDashboard;
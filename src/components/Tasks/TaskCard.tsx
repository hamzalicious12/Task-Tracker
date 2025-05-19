import React from 'react';
import { Task } from '@/types';
import { Clock, AlertCircle, Trash2 } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onStatusChange?: (taskId: string, status: Task['status']) => void;
  onDelete?: (taskId: string) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onStatusChange, onDelete }) => {
  const priorityColors = {
    HIGH: 'bg-red-100 text-red-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800',
    LOW: 'bg-green-100 text-green-800'
  } as const;

  const statusColors = {
    PENDING: 'bg-gray-100 text-gray-800',
    IN_PROGRESS: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-green-100 text-green-800',
    LATE: 'bg-red-100 text-red-800'
  } as const;

  const dueDate = new Date(task.dueDate);
  const isOverdue = dueDate < new Date() && task.status !== 'COMPLETED';

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[task.priority]}`}>
            {task.priority}
          </span>
          {onDelete && (
            <button
              onClick={() => onDelete(task._id)}
              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
              title="Delete task"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      
      <p className="text-gray-600 text-sm mb-4">{task.description}</p>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-500">
            {dueDate.toLocaleDateString()}
          </span>
          {isOverdue && (
            <div title="Task is overdue">
              <AlertCircle className="h-4 w-4 text-red-500" />
            </div>
          )}
        </div>
        
        {onStatusChange && (
          <select
            value={task.status}
            onChange={(e) => onStatusChange(task._id, e.target.value as Task['status'])}
            className={`text-sm font-medium px-3 py-1 rounded-full ${statusColors[task.status]}`}
          >
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="LATE">Late</option>
          </select>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
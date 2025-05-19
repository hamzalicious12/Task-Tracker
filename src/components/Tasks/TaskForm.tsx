import React, { useState, useEffect } from 'react';
import { User, Task, Department } from '@/types';
import { getDepartments } from '@/api/departments';

interface TaskFormProps {
  users: User[];
  onSubmit: (taskData: Partial<Task>) => void;
  onCancel: () => void;
}

const TaskForm: React.FC<TaskFormProps> = ({ users, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    department: '',
    priority: 'MEDIUM',
    dueDate: ''
  });
  const [dateError, setDateError] = useState('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchDepartments = async () => {
      setIsLoading(true);
      try {
        const data = await getDepartments();
        setDepartments(data);
      } catch (error) {
        console.error('Error fetching departments:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  const validateDueDate = (date: string) => {
    const selectedDate = new Date(date);
    const now = new Date();
    now.setSeconds(0, 0); // Reset seconds and milliseconds for fair comparison
    
    if (selectedDate < now) {
      setDateError('Due date cannot be in the past');
      return false;
    }
    setDateError('');
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateDueDate(formData.dueDate)) {
      onSubmit({
        ...formData,
        priority: formData.priority as 'LOW' | 'MEDIUM' | 'HIGH',
        dueDate: new Date(formData.dueDate)
      });
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setFormData({ ...formData, dueDate: newDate });
    validateDueDate(newDate);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Assign To</label>
        <select
          value={formData.assignedTo}
          onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          required
        >
          <option value="">Select User</option>
          {users.map((user) => (
            <option key={user._id} value={user._id}>
              {user.name} - {user.department}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Department</label>
        <select
          value={formData.department}
          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          required
          disabled={departments.length === 0}
        >
          <option value="">Select Department</option>
          {departments.map((department) => (
            <option key={department._id} value={department._id}>
              {department.name}
            </option>
          ))}
        </select>
        {departments.length === 0 && !isLoading && (
          <p className="mt-1 text-sm text-red-600">No departments available</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Priority</label>
        <select
          value={formData.priority}
          onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Due Date</label>
        <input
          type="datetime-local"
          value={formData.dueDate}
          onChange={handleDateChange}
          className={`mt-1 block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
            dateError ? 'border-red-300' : 'border-gray-300'
          }`}
          required
        />
        {dateError && (
          <p className="mt-1 text-sm text-red-600">{dateError}</p>
        )}
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          disabled={!!dateError}
        >
          Create Task
        </button>
      </div>
    </form>
  );
};

export default TaskForm;
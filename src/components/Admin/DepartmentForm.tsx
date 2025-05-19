import React, { useState } from 'react';

interface DepartmentFormInput {
  name: string;
  description?: string;
}

interface DepartmentFormProps {
  onSubmit: (department: DepartmentFormInput) => void;
  onCancel: () => void;
}

const DepartmentForm: React.FC<DepartmentFormProps> = ({ onSubmit, onCancel }) => {
  const [department, setDepartment] = useState<DepartmentFormInput>({
    name: '',
    description: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!department.name.trim()) {
      setError('Department name is required');
      return;
    }

    onSubmit(department);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Department Name</label>
          <input
            type="text"
            value={department.name}
            onChange={(e) => {
              setDepartment({ ...department, name: e.target.value });
              setError('');
            }}
            className={`mt-1 block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
              error ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="e.g., Marketing"
            required
          />
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            value={department.description}
            onChange={(e) => {
              setDepartment({ ...department, description: e.target.value });
            }}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="Department description"
            rows={3}
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3 mt-4">
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
        >
          Create Department
        </button>
      </div>
    </form>
  );
};

export default DepartmentForm;

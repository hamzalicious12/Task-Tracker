import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import DepartmentForm from '@/components/Admin/DepartmentForm';
import { getDepartments, createDepartment } from '@/api/departments';
import { Department } from '@/types';
import { Plus } from 'lucide-react';

interface DepartmentFormInput {
  name: string;
  description?: string;
}

const AdminDepartments = () => {
  const [showDepartmentForm, setShowDepartmentForm] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  const queryClient = useQueryClient();
  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: getDepartments
  });
  const createDepartmentMutation = useMutation({
    mutationFn: async (data: DepartmentFormInput) => {
      return await createDepartment(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setNotification({ message: 'Department created successfully', type: 'success' });
      setShowDepartmentForm(false);
    },
    onError: (error: any) => {
      setNotification({
        message: error.response?.data?.message || 'Failed to create department',
        type: 'error'
      });
    }
  });

  const handleCreateDepartment = (data: DepartmentFormInput) => {
    createDepartmentMutation.mutate(data);
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
          <h1 className="text-2xl font-semibold text-gray-900">Departments</h1>
          <button
            onClick={() => setShowDepartmentForm(true)}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Department
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {departments.map(department => (
            <div key={department._id} className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-medium text-gray-900">{department.name}</h2>
              <p className="text-sm text-gray-500 mt-2">{department.description || 'No description'}</p>
              <p className="text-sm text-gray-500 mt-2">
                {department.employeeCount || 0} members
              </p>
              {department.director && (
                <p className="text-sm text-gray-500 mt-2">
                  Director: {typeof department.director === 'string' ? department.director : department.director.name}
                </p>
              )}
            </div>
          ))}
        </div>

        {showDepartmentForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">Create New Department</h2>
              <DepartmentForm
                onSubmit={handleCreateDepartment}
                onCancel={() => setShowDepartmentForm(false)}
              />
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminDepartments;

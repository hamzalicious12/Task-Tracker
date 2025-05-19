import React from 'react';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/Layout/DashboardLayout';
import PasswordUpdate from '../components/Profile/PasswordUpdate';

const Profile = () => {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Profile</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500">Name</label>
              <p className="mt-1 text-lg">{user?.name}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500">Email</label>
              <p className="mt-1 text-lg">{user?.email}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500">Role</label>
              <p className="mt-1 text-lg">{user?.role}</p>
            </div>
            
            {user?.department && (
              <div>
                <label className="block text-sm font-medium text-gray-500">Department</label>
                <p className="mt-1 text-lg">{user.department}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-lg p-6">
          <PasswordUpdate />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
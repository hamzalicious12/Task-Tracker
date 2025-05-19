import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { getUsers } from '@/api/users';
import { User } from '@/types';

const Team: React.FC = () => {
  const { user } = useAuth();
  
  const { data: teamMembers, isLoading, error } = useQuery({
    queryKey: ['team', user?.department],
    queryFn: () => getUsers({ department: user?.department }),
    enabled: !!user?.department
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600">
        Error loading team members. Please try again later.
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Team</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teamMembers?.map((member: User) => (
          <div
            key={member._id}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-xl font-semibold text-gray-600">
                    {member.name.charAt(0)}
                  </span>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{member.name}</h3>
                <p className="text-sm text-gray-600">{member.email}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Role: {member.role.charAt(0) + member.role.slice(1).toLowerCase()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {teamMembers?.length === 0 && (
        <div className="text-center text-gray-600 mt-8">
          No team members found in your department.
        </div>
      )}
    </div>
  );
};

export default Team;

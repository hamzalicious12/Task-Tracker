import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import MeetingCard from '@/components/Meetings/MeetingCard';
import MeetingForm from '@/components/Meetings/MeetingForm';
import Notification from '@/components/common/Notification';
import { getMeetings, createMeeting } from '@/api/meetings';
import { getUsers } from '@/api/users';
import { Plus } from 'lucide-react';
import { Meeting } from '@/types';
import { useAuth } from '@/context/AuthContext';

const DirectorMeetings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  const { data: meetings = [], isLoading: isLoadingMeetings, error: meetingsError } = useQuery<Meeting[]>({
    queryKey: ['meetings', user?._id],
    queryFn: () => {
      if (!user?.department) {
        console.warn('User department is missing when fetching meetings');
        return Promise.resolve([]);
      }
      return getMeetings({ department: user.department });
    },
    enabled: !!user
  });

  const { data: users = [], isLoading: isLoadingUsers, error: usersError } = useQuery({
    queryKey: ['users'],
    queryFn: () => {
      if (!user?.department) {
        console.warn('User department is missing when fetching users');
        return Promise.resolve([]);
      }
      return getUsers({ department: user.department });
    },
    enabled: !!user
  });

  const createMeetingMutation = useMutation({
    mutationFn: (meetingData: Partial<Meeting>) => {
      if (!user?.department) {
        throw new Error('Department is required');
      }
      
      // Log for debugging
      console.log('Creating meeting with user:', { 
        id: user._id, 
        role: user.role, 
        department: user.department 
      });
      
      const meetingWithOrganizerAndDept = {
        ...meetingData,
        department: user.department,
        organizer: user._id
      };
      
      console.log('Meeting data being sent:', meetingWithOrganizerAndDept);
      
      return createMeeting(meetingWithOrganizerAndDept);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      setNotification({
        message: 'Meeting scheduled successfully',
        type: 'success'
      });
      setShowMeetingForm(false);
    },
    onError: (error: any) => {
      console.error('Meeting creation error:', error);
      console.error('Error response:', error.response?.data);
      setNotification({
        message: error.response?.data?.message || 'Failed to schedule meeting. Please try again.',
        type: 'error'
      });
    }
  });

  const handleCreateMeeting = (meetingData: Partial<Meeting>) => {
    createMeetingMutation.mutate({
      ...meetingData,
      department: user?.department
    });
  };

  if (isLoadingMeetings || isLoadingUsers) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (meetingsError || usersError) {
    return (
      <DashboardLayout>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p className="font-bold">Error loading data</p>
          <p>{(meetingsError as Error)?.message || (usersError as Error)?.message || 'An unexpected error occurred'}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {notification && (
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification(null)}
          />
        )}

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Department Meetings</h1>
            <p className="text-gray-600 mt-1">Department: {user?.department}</p>
          </div>
          <button
            onClick={() => setShowMeetingForm(true)}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            Schedule Meeting
          </button>
        </div>

        {meetings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No meetings scheduled yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {meetings.map(meeting => (
              <MeetingCard key={meeting._id} meeting={meeting} />
            ))}
          </div>
        )}

        {showMeetingForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">Schedule New Meeting</h2>
              <MeetingForm
                users={users}
                onSubmit={handleCreateMeeting}
                onCancel={() => setShowMeetingForm(false)}
              />
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DirectorMeetings;
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import MeetingCard from '@/components/Meetings/MeetingCard';
import MeetingForm from '@/components/Meetings/MeetingForm';
import Notification from '@/components/common/Notification';
import { getMeetings, createMeeting, deleteMeeting, updateMeeting } from '@/api/meetings';
import { getUsers } from '@/api/users';
import { Plus } from 'lucide-react';
import { Meeting, User } from '@/types';
import { useAuth } from '@/context/AuthContext';

const CEOMeetings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  const { data: meetings = [], isLoading: isLoadingMeetings } = useQuery<Meeting[]>({
    queryKey: ['meetings'],
    queryFn: async () => {
      try {
        return await getMeetings();
      } catch (error) {
        console.error("Error loading meetings:", error);
        return [];
      }
    },
    enabled: !!user
  });

  const { data: users = [], isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      try {
        return await getUsers();
      } catch (error) {
        console.error("Error loading users:", error);
        return [];
      }
    },
    enabled: !!user
  });

  const createMeetingMutation = useMutation({
    mutationFn: createMeeting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      setNotification({
        message: 'Meeting scheduled successfully',
        type: 'success'
      });
      setShowMeetingForm(false);
      setSelectedMeeting(null);
    },
    onError: (error: any) => {
      setNotification({
        message: error.response?.data?.message || 'Failed to schedule meeting',
        type: 'error'
      });
    }
  });
  
  const updateMeetingMutation = useMutation({
    mutationFn: (data: { id: string; updates: Partial<Meeting> }) => 
      updateMeeting(data.id, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      setNotification({
        message: 'Meeting updated successfully',
        type: 'success'
      });
      setShowMeetingForm(false);
      setSelectedMeeting(null);
    },
    onError: (error: any) => {
      setNotification({
        message: error.response?.data?.message || 'Failed to update meeting',
        type: 'error'
      });
    }
  });
  
  const deleteMeetingMutation = useMutation({
    mutationFn: deleteMeeting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      setNotification({
        message: 'Meeting cancelled successfully',
        type: 'success'
      });
    },
    onError: (error: any) => {
      setNotification({
        message: error.response?.data?.message || 'Failed to cancel meeting',
        type: 'error'
      });
    }
  });

  const handleCreateMeeting = (meetingData: Partial<Meeting>) => {
    if (selectedMeeting) {
      updateMeetingMutation.mutate({
        id: selectedMeeting._id,
        updates: meetingData
      });
    } else {
      createMeetingMutation.mutate(meetingData);
    }
  };
  
  const handleEditMeeting = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setShowMeetingForm(true);
  };
  
  const handleDeleteMeeting = (meetingId: string) => {
    deleteMeetingMutation.mutate(meetingId);
  };
  
  const handleCancelForm = () => {
    setShowMeetingForm(false);
    setSelectedMeeting(null);
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
          <h1 className="text-2xl font-semibold text-gray-900">Organization Meetings</h1>
          <button
            onClick={() => {
              setSelectedMeeting(null);
              setShowMeetingForm(true);
            }}
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
            {meetings.map(meeting => {
              // Ensure meeting has all required properties for MeetingCard
              const meetingWithParticipants = {
                ...meeting,
                participants: Array.isArray(meeting.participants) ? meeting.participants : [],
                organizer: meeting.organizer || { _id: '', name: 'Unknown', email: '', role: 'EMPLOYEE' }
              };
              
              return (
                <MeetingCard 
                  key={meeting._id} 
                  meeting={meetingWithParticipants as any}
                  onEdit={handleEditMeeting}
                  onDelete={handleDeleteMeeting}
                  canEdit={user?.role === 'CEO'}
                />
              );
            })}
          </div>
        )}

        {showMeetingForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">
                {selectedMeeting ? 'Update Meeting' : 'Schedule New Meeting'}
              </h2>
              <MeetingForm
                users={users}
                onSubmit={handleCreateMeeting}
                onCancel={handleCancelForm}
                initialData={selectedMeeting || undefined}
              />
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CEOMeetings;
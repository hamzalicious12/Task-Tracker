import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { getMeetings, createMeeting, deleteMeeting, updateMeeting } from '@/api/meetings';
import { getUsers } from '@/api/users';
import { Plus, Calendar, Clock, MapPin, Users } from 'lucide-react';
import { Meeting, User } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';

// Simple notification component
const SimpleNotification = ({ message, type, onClose }: { 
  message: string; 
  type: 'success' | 'error'; 
  onClose: () => void 
}) => {
  return (
    <div className={`flex items-center justify-between p-4 mb-4 rounded-md ${
      type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
    }`}>
      <p>{message}</p>
      <button onClick={onClose} className="ml-4">
        &times;
      </button>
    </div>
  );
};

// Simple meeting card component
const SimpleMeetingCard = ({ 
  meeting, 
  onEdit, 
  onDelete,
  canEdit
}: { 
  meeting: Meeting; 
  onEdit?: (meeting: Meeting) => void; 
  onDelete?: (id: string) => void;
  canEdit?: boolean;
}) => {
  const startDate = new Date(meeting.startTime);
  const endDate = new Date(meeting.endTime);
  
  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
      <div className="flex justify-between items-start">
        <h3 className="font-medium text-lg text-gray-900">{meeting.title}</h3>
        {canEdit && (
          <div className="flex space-x-2">
            {onEdit && (
              <button 
                onClick={() => onEdit(meeting)}
                className="text-indigo-600 hover:text-indigo-800"
              >
                Edit
              </button>
            )}
            {onDelete && (
              <button 
                onClick={() => onDelete(meeting._id)}
                className="text-red-600 hover:text-red-800"
              >
                Cancel
              </button>
            )}
          </div>
        )}
      </div>
      
      <div className="mt-2 text-sm text-gray-600">
        {meeting.description}
      </div>
      
      <div className="mt-4 space-y-2">
        <div className="flex items-center text-sm">
          <Calendar className="h-4 w-4 mr-2 text-gray-500" />
          <span>{format(startDate, 'MMMM d, yyyy')}</span>
        </div>
        
        <div className="flex items-center text-sm">
          <Clock className="h-4 w-4 mr-2 text-gray-500" />
          <span>
            {format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')}
          </span>
        </div>
        
        <div className="flex items-center text-sm">
          <MapPin className="h-4 w-4 mr-2 text-gray-500" />
          <span>{meeting.location}</span>
        </div>
        
        <div className="flex items-center text-sm">
          <Users className="h-4 w-4 mr-2 text-gray-500" />
          <span>{typeof meeting.participants === 'object' && Array.isArray(meeting.participants) ? 
            meeting.participants.length : '0'} participants</span>
        </div>
      </div>
    </div>
  );
};

// Simple meeting form component
const SimpleMeetingForm = ({ 
  users, 
  onSubmit, 
  onCancel, 
  initialData
}: {
  users: User[];
  onSubmit: (data: Partial<Meeting>) => void;
  onCancel: () => void;
  initialData?: Partial<Meeting>;
}) => {  // Get the current user's department as default if available
  const { user } = useAuth();
  const defaultDepartment = user?.department || '';
  
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    location: initialData?.location || '',
    startTime: initialData?.startTime ? format(new Date(initialData.startTime), "yyyy-MM-dd'T'HH:mm") : '',
    endTime: initialData?.endTime ? format(new Date(initialData.endTime), "yyyy-MM-dd'T'HH:mm") : '',
    department: initialData?.department || defaultDepartment,
    participants: Array.isArray(initialData?.participants) 
      ? initialData?.participants.map(p => typeof p === 'string' ? p : p._id)
      : []
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleParticipantChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map(opt => opt.value);
    setFormData(prev => ({ ...prev, participants: selectedOptions }));
  };    const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    if (!formData.title || !formData.description || !formData.startTime || 
        !formData.endTime || !formData.location || formData.participants.length === 0) {
      alert('Please fill in all required fields and select at least one participant.');
      return;
    }
    
    // Make sure department is set - default to "General" if nothing selected
    const finalData = {
      ...formData,
      department: formData.department || 'General'
    };
    
    console.log('Submitting meeting data:', finalData);
    onSubmit(finalData);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Time</label>
            <input
              type="datetime-local"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">End Time</label>
            <input
              type="datetime-local"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Location</label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          />
        </div>
          <div>
          <label className="block text-sm font-medium text-gray-700">Department</label>
          <select
            name="department"
            value={formData.department}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          >
            <option value="General">All Departments</option>
            {Array.from(new Set(users.map(u => u.department).filter(Boolean))).map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
          <div className="text-xs text-gray-500 mt-1">
            Department is required
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Participants</label>
          <select
            multiple
            name="participants"
            value={formData.participants as string[]}
            onChange={handleParticipantChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            size={5}
          >
            {users.map(user => (
              <option key={user._id} value={user._id}>
                {user.name} ({user.department || 'No Department'})
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="mt-6 flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          {initialData ? 'Update Meeting' : 'Schedule Meeting'}
        </button>
      </div>
    </form>
  );
};

const CEOMeetingsFixed = () => {
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
          <SimpleNotification
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
            {meetings.map(meeting => (
              <SimpleMeetingCard 
                key={meeting._id} 
                meeting={meeting}
                onEdit={handleEditMeeting}
                onDelete={handleDeleteMeeting}
                canEdit={user?.role === 'CEO'}
              />
            ))}
          </div>
        )}

        {showMeetingForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4">
                {selectedMeeting ? 'Update Meeting' : 'Schedule New Meeting'}
              </h2>
              <SimpleMeetingForm
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

export default CEOMeetingsFixed;

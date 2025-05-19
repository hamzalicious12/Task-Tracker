import React, { useState } from 'react';
import { User, Meeting } from '@/types';
import { format, addHours } from 'date-fns';

interface MeetingFormProps {
  users: User[];
  onSubmit: (meetingData: Partial<Meeting>) => void;
  onCancel: () => void;
  initialData?: Partial<Meeting>;
  error?: string;
}

const MeetingForm: React.FC<MeetingFormProps> = ({ 
  users, 
  onSubmit, 
  onCancel, 
  initialData,
  error 
}) => {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    startTime: initialData?.startTime ? format(new Date(initialData.startTime), "yyyy-MM-dd'T'HH:mm") : '',
    endTime: initialData?.endTime ? format(new Date(initialData.endTime), "yyyy-MM-dd'T'HH:mm") : '',
    location: initialData?.location || '',
    participants: initialData?.participants || [] as string[]
  });

  const [formErrors, setFormErrors] = useState({
    title: '',
    description: '',
    time: '',
    location: '',
    participants: ''
  });

  const validateForm = () => {
    const newErrors = {
      title: '',
      description: '',
      time: '',
      location: '',
      participants: ''
    };

    let isValid = true;

    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
      isValid = false;
    }

    // Description validation
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
      isValid = false;
    }

    // Time validation
    if (!formData.startTime || !formData.endTime) {
      newErrors.time = 'Both start and end time are required';
      isValid = false;
    } else {
      const start = new Date(formData.startTime);
      const end = new Date(formData.endTime);
      const now = new Date();
      now.setSeconds(0, 0); // Reset seconds and milliseconds for fair comparison

      if (start < now) {
        newErrors.time = 'Meeting start time cannot be in the past';
        isValid = false;
      } else if (end <= start) {
        newErrors.time = 'Meeting end time must be after start time';
        isValid = false;
      } else {
        const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        if (durationHours > 8) {
          newErrors.time = 'Meeting duration cannot exceed 8 hours';
          isValid = false;
        }
      }
    }

    // Location validation
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
      isValid = false;
    }

    // Participants validation
    if (formData.participants.length === 0) {
      newErrors.participants = 'Please select at least one participant';
      isValid = false;
    }

    setFormErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleParticipantChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value);
    setFormData(prev => ({ ...prev, participants: selectedOptions }));
    setFormErrors(prev => ({ ...prev, participants: '' }));
  };

  const suggestEndTime = (startTime: string) => {
    if (!startTime) return '';
    const suggestedEnd = addHours(new Date(startTime), 1);
    return format(suggestedEnd, "yyyy-MM-dd'T'HH:mm");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => {
            setFormData(prev => ({ ...prev, title: e.target.value }));
            setFormErrors(prev => ({ ...prev, title: '' }));
          }}
          className={`mt-1 block w-full rounded-md ${
            formErrors.title ? 'border-red-300' : 'border-gray-300'
          } shadow-sm focus:border-indigo-500 focus:ring-indigo-500`}
        />
        {formErrors.title && (
          <p className="mt-1 text-sm text-red-600">{formErrors.title}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => {
            setFormData(prev => ({ ...prev, description: e.target.value }));
            setFormErrors(prev => ({ ...prev, description: '' }));
          }}
          rows={3}
          className={`mt-1 block w-full rounded-md ${
            formErrors.description ? 'border-red-300' : 'border-gray-300'
          } shadow-sm focus:border-indigo-500 focus:ring-indigo-500`}
        />
        {formErrors.description && (
          <p className="mt-1 text-sm text-red-600">{formErrors.description}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Start Time</label>
          <input
            type="datetime-local"
            value={formData.startTime}
            onChange={(e) => {
              const newStartTime = e.target.value;
              setFormData(prev => ({
                ...prev,
                startTime: newStartTime,
                endTime: prev.endTime || suggestEndTime(newStartTime)
              }));
              setFormErrors(prev => ({ ...prev, time: '' }));
            }}
            className={`mt-1 block w-full rounded-md ${
              formErrors.time ? 'border-red-300' : 'border-gray-300'
            } shadow-sm focus:border-indigo-500 focus:ring-indigo-500`}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">End Time</label>
          <input
            type="datetime-local"
            value={formData.endTime}
            min={formData.startTime}
            onChange={(e) => {
              setFormData(prev => ({ ...prev, endTime: e.target.value }));
              setFormErrors(prev => ({ ...prev, time: '' }));
            }}
            className={`mt-1 block w-full rounded-md ${
              formErrors.time ? 'border-red-300' : 'border-gray-300'
            } shadow-sm focus:border-indigo-500 focus:ring-indigo-500`}
          />
        </div>
      </div>
      {formErrors.time && (
        <p className="mt-1 text-sm text-red-600">{formErrors.time}</p>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">Location</label>
        <input
          type="text"
          value={formData.location}
          onChange={(e) => {
            setFormData(prev => ({ ...prev, location: e.target.value }));
            setFormErrors(prev => ({ ...prev, location: '' }));
          }}
          className={`mt-1 block w-full rounded-md ${
            formErrors.location ? 'border-red-300' : 'border-gray-300'
          } shadow-sm focus:border-indigo-500 focus:ring-indigo-500`}
          placeholder="Room name or virtual meeting link"
        />
        {formErrors.location && (
          <p className="mt-1 text-sm text-red-600">{formErrors.location}</p>
        )}
      </div>      <div>
        <label className="block text-sm font-medium text-gray-700">Participants</label>
        <select
          multiple
          value={formData.participants}
          onChange={handleParticipantChange}
          className={`mt-1 block w-full rounded-md ${
            formErrors.participants ? 'border-red-300' : 'border-gray-300'
          } shadow-sm focus:border-indigo-500 focus:ring-indigo-500`}
          size={5}
        >
          {users && users.length > 0 ? (
            users.map((user) => (
              <option key={user._id} value={user._id}>
                {user.name} {user.department ? `- ${user.department}` : ''}
              </option>
            ))
          ) : (
            <option disabled>No users available</option>
          )}
        </select>
        {formErrors.participants && (
          <p className="mt-1 text-sm text-red-600">{formErrors.participants}</p>
        )}
        <p className="mt-1 text-sm text-gray-500">
          Hold Ctrl/Cmd to select multiple participants
        </p>
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
        >
          {initialData ? 'Update Meeting' : 'Schedule Meeting'}
        </button>
      </div>
    </form>
  );
};

export default MeetingForm;

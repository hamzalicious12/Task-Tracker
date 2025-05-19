import React from 'react';
import { Meeting, User } from '@/types';
import { format } from 'date-fns';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';

interface MeetingCardProps {
  meeting: Meeting;
  onEdit?: (meeting: Meeting) => void;
  onDelete?: (meetingId: string) => void;
  canEdit?: boolean;
}

const MeetingCard: React.FC<MeetingCardProps> = ({
  meeting,
  onEdit,
  onDelete,
  canEdit = false
}) => {
  const startTime = new Date(meeting.startTime);
  const endTime = new Date(meeting.endTime);
  const isUpcoming = startTime > new Date();
  const isOngoing = startTime <= new Date() && endTime >= new Date();
  const isPast = endTime < new Date();

  const getStatusColor = () => {
    if (isOngoing) return 'bg-green-100 text-green-800';
    if (isUpcoming) return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusText = () => {
    if (isOngoing) return 'In Progress';
    if (isUpcoming) return 'Upcoming';
    return 'Completed';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-medium text-gray-900">{meeting.title || 'Untitled Meeting'}</h3>
          <p className="text-sm text-gray-500 mt-1">{meeting.description || 'No description provided'}</p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-gray-400" />
          <span className="text-sm text-gray-600">
            {format(startTime, 'MMM d, yyyy')}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Clock className="h-5 w-5 text-gray-400" />
          <span className="text-sm text-gray-600">
            {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
          </span>
        </div>
      </div>

      <div className="flex items-start space-x-2">
        <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
        <span className="text-sm text-gray-600 break-all">{meeting.location || 'Location not specified'}</span>
      </div>

      <div className="flex items-start space-x-2">
        <Users className="h-5 w-5 text-gray-400 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">Participants</p>
          <div className="mt-1 text-sm text-gray-500">
            {Array.isArray(meeting.participants) && meeting.participants.length > 0 ? (
              meeting.participants.map(participant => 
                typeof participant === 'string' 
                  ? participant 
                  : (participant?.name || 'Unknown participant')
              ).join(', ')
            ) : 'No participants'}
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Organizer: {typeof meeting.organizer === 'string' 
              ? meeting.organizer 
              : (meeting.organizer?.name || 'Unknown')}
          </p>
        </div>
      </div>

      {canEdit && !isPast && (
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
          <button
            onClick={() => onEdit?.(meeting)}
            className="px-3 py-1 text-sm text-indigo-600 hover:text-indigo-900"
          >
            Edit
          </button>
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to cancel this meeting?')) {
                onDelete?.(meeting._id);
              }
            }}
            className="px-3 py-1 text-sm text-red-600 hover:text-red-900"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default MeetingCard;
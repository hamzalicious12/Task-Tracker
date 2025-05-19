import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { checkIn, checkOut, getAttendance } from '@/api/attendance';
import { format } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import AttendanceHeatmap from '@/components/Attendance/AttendanceHeatmap';
import { AttendanceData } from '@/types';

interface AttendanceResponse extends AttendanceData {
  message: string;
}

const EmployeeAttendance = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { data: attendanceRecords = [] } = useQuery<AttendanceData[]>({
    queryKey: ['attendance', user?._id],
    queryFn: () => getAttendance({ userId: user?._id }),
    enabled: !!user?._id
  });

  const checkInMutation = useMutation<AttendanceResponse, Error>({
    mutationFn: checkIn,
    onMutate: () => {
      // Clear previous messages
      setError(null);
      setSuccess(null);
      console.log('Starting check-in mutation...');
    },
    onSuccess: (response) => {
      console.log('Check-in successful:', response);
      setSuccess(response.message || 'Checked in successfully');
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
    onError: (error: any) => {
      console.error('Check-in mutation error:', error);
      
      // Handle different types of errors for better user feedback
      if (error.message?.includes('Already checked in')) {
        setError('You have already checked in for today');
      } else if (error.message?.includes('Already checked out')) {
        setError('You have already completed your attendance for today');
      } else if (error.message?.includes('No response from server')) {
        setError('Server connection error. Please check your network and try again.');
      } else {
        setError(error.message || 'Failed to check in');
      }
      
      setSuccess(null);
    }
  });

  const checkOutMutation = useMutation<AttendanceResponse, Error>({
    mutationFn: checkOut,
    onMutate: () => {
      // Clear previous messages
      setError(null);
      setSuccess(null);
      console.log('Starting check-out mutation...');
    },
    onSuccess: (response) => {
      console.log('Check-out successful:', response);
      setSuccess(response.message || 'Checked out successfully');
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
    onError: (error: any) => {
      console.error('Check-out mutation error:', error);
      
      // Handle different types of errors for better user feedback
      if (error.message?.includes('No check-in record')) {
        setError('You need to check in first before checking out');
      } else if (error.message?.includes('Already checked out')) {
        setError('You have already checked out for today');
      } else if (error.message?.includes('No response from server')) {
        setError('Server connection error. Please check your network and try again.');
      } else {
        setError(error.message || 'Failed to check out');
      }
      
      setSuccess(null);
    }
  });

  // Get today's attendance
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayAttendance = attendanceRecords.find(record => {
    const recordDate = new Date(record.date);
    recordDate.setHours(0, 0, 0, 0);
    return recordDate.getTime() === today.getTime();
  }) as AttendanceData | undefined;

  const handleCheckIn = () => {
    try {
      console.log('Handling check-in click');
      if (!user || !user._id) {
        setError('User information missing. Please log in again.');
        return;
      }
      checkInMutation.mutate();
    } catch (err) {
      console.error('Error in handleCheckIn:', err);
      setError('An unexpected error occurred while checking in.');
    }
  };

  const handleCheckOut = () => {
    try {
      console.log('Handling check-out click');
      if (!user || !user._id) {
        setError('User information missing. Please log in again.');
        return;
      }
      if (!todayAttendance?.checkIn) {
        setError('You need to check in first before checking out');
        return;
      }
      checkOutMutation.mutate();
    } catch (err) {
      console.error('Error in handleCheckOut:', err);
      setError('An unexpected error occurred while checking out.');
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">My Attendance</h1>
          <div className="space-x-4">
            <button
              onClick={handleCheckIn}
              disabled={!!todayAttendance?.checkIn}
              className={`px-4 py-2 rounded-md ${
                todayAttendance?.checkIn
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              Check In
            </button>
            <button
              onClick={handleCheckOut}
              disabled={!todayAttendance?.checkIn || !!todayAttendance?.checkOut}
              className={`px-4 py-2 rounded-md ${
                !todayAttendance?.checkIn || todayAttendance?.checkOut
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              Check Out
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
            {checkInMutation.isError && (
              <div className="mt-1 text-sm">
                {checkInMutation.error instanceof Error && checkInMutation.error.message.includes('Network') && (
                  <p>⚠️ Network issue detected. Please check your connection to the server.</p>
                )}
              </div>
            )}
            <button 
              className="absolute top-0 right-0 mt-2 mr-2" 
              onClick={() => setError(null)}
              aria-label="Close alert"
            >
              <span className="text-red-500">×</span>
            </button>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Success: </strong>
            <span className="block sm:inline">{success}</span>
            <button 
              className="absolute top-0 right-0 mt-2 mr-2" 
              onClick={() => setSuccess(null)}
              aria-label="Close alert"
            >
              <span className="text-green-500">×</span>
            </button>
          </div>
        )}
        
        {(checkInMutation.isPending || checkOutMutation.isPending) && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700 mr-2"></div>
            <span>Processing your request...</span>
          </div>
        )}

        {/* Today's Status */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Today's Status</h2>
          {todayAttendance ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Check In</p>
                <p className="text-lg font-medium">
                  {format(new Date(todayAttendance.checkIn), 'hh:mm a')}
                </p>
                <p className={`text-sm ${
                  todayAttendance.status === 'PRESENT'
                    ? 'text-green-600'
                    : todayAttendance.status === 'LATE'
                    ? 'text-red-600'
                    : todayAttendance.status === 'HALF_DAY'
                    ? 'text-yellow-600'
                    : 'text-red-600'
                }`}>
                  {todayAttendance.status === 'PRESENT'
                    ? 'On Time'
                    : todayAttendance.status === 'LATE'
                    ? 'Late'
                    : todayAttendance.status === 'HALF_DAY'
                    ? 'Half Day'
                    : 'Absent'}
                </p>
              </div>
              {todayAttendance.checkOut && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Check Out</p>
                  <p className="text-lg font-medium">
                    {format(new Date(todayAttendance.checkOut), 'hh:mm a')}
                  </p>
                  <p className={`text-sm ${
                    todayAttendance.status === 'HALF_DAY' ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {todayAttendance.status === 'HALF_DAY' ? 'Half Day' : 'Complete'}
                  </p>
                </div>
              )}
              {todayAttendance.workHours && todayAttendance.workHours > 0 && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Hours Worked</p>
                  <p className="text-lg font-medium">
                    {Math.round(todayAttendance.workHours * 10) / 10} hours
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500">No attendance recorded for today</p>
          )}
        </div>

        {/* Attendance History */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Attendance History</h2>
          <AttendanceHeatmap data={attendanceRecords} />
          <div className="mt-6 space-y-2">
            {attendanceRecords.slice(0, 5).map((record) => (
              <div
                key={record._id}
                className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium">{format(new Date(record.date), 'MMMM d, yyyy')}</p>
                  <p className="text-sm text-gray-500">
                    {format(new Date(record.checkIn), 'hh:mm a')}
                    {record.checkOut && ` - ${format(new Date(record.checkOut), 'hh:mm a')}`}
                  </p>
                </div>
                <div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      record.status === 'PRESENT'
                        ? 'bg-green-100 text-green-700'
                        : record.status === 'LATE'
                        ? 'bg-orange-100 text-orange-700'
                        : record.status === 'HALF_DAY'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {record.status === 'PRESENT'
                      ? 'On Time'
                      : record.status === 'LATE'
                      ? 'Late'
                      : record.status === 'HALF_DAY'
                      ? 'Half Day'
                      : 'Absent'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EmployeeAttendance;
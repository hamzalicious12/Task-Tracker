import { AttendanceData } from '@/types';
import api from '@/api/api';

export interface AttendanceStats {
  totalDays: number;
  presentDays: number;
  lateDays: number;
  absentDays: number;
  attendancePercentage: number;
  attendanceByDate: {
    date: string;
    status: 'PRESENT' | 'LATE' | 'ABSENT' | 'HALF_DAY';
    checkIn?: string;
    checkOut?: string;
  }[];
}

export interface DepartmentAttendance {
  department: string;
  averageAttendance: number;
  totalEmployees: number;
  presentToday: number;
}

export interface AttendanceFilter {
  userId?: string;
  department?: string;
  startDate?: Date;
  endDate?: Date;
}

export const getAttendance = async (filter: AttendanceFilter = {}) => {
  const { userId, department, startDate, endDate } = filter;
  const response = await api.get<AttendanceData[]>('/attendance', {
    params: {
      userId,
      department,
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString()
    }
  });
  return response.data;
};

interface AttendanceResponse extends AttendanceData {
  message: string;
}

export const checkIn = async () => {
  try {
    console.log('Frontend: Making check-in API call');
    const response = await api.post<AttendanceResponse>('/attendance/check-in');
    console.log('Frontend: Check-in success response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Frontend: Check-in API error:', error);
    
    if (error.response) {
      // The server responded with a status code outside the 2xx range
      console.error('Frontend: Server error response:', error.response.data);
      throw new Error(error.response.data.message || 'Failed to check in');
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Frontend: No response received:', error.request);
      throw new Error('No response from server. Please check your connection.');
    } else {
      // Something happened in setting up the request
      console.error('Frontend: Request setup error:', error.message);
      throw new Error('Error setting up request: ' + error.message);
    }
  }
};

export const checkOut = async () => {
  try {
    console.log('Frontend: Making check-out API call');
    const response = await api.post<AttendanceResponse>('/attendance/check-out');
    console.log('Frontend: Check-out success response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Frontend: Check-out API error:', error);
    
    if (error.response) {
      // The server responded with a status code outside the 2xx range
      console.error('Frontend: Server error response:', error.response.data);
      throw new Error(error.response.data.message || 'Failed to check out');
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Frontend: No response received:', error.request);
      throw new Error('No response from server. Please check your connection.');
    } else {
      // Something happened in setting up the request
      console.error('Frontend: Request setup error:', error.message);
      throw new Error('Error setting up request: ' + error.message);
    }
  }
};

export const getAttendanceStats = async (filter: AttendanceFilter = {}): Promise<AttendanceStats> => {
  const { userId, department, startDate, endDate } = filter;
  console.log('Calling getAttendanceStats with params:', filter);
  
  const response = await api.get<AttendanceStats>('/attendance/stats', {
    params: {
      userId,
      department,
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString()
    }
  });
  return response.data;
};

export const getDepartmentAttendance = async (): Promise<DepartmentAttendance[]> => {
  const response = await api.get<DepartmentAttendance[]>('/attendance/departments');
  return response.data;
};

export const getAttendanceStatus = async () => {
  try {
    const response = await api.get('/attendance/status');
    return response.data;
  } catch (error) {
    console.error('Error fetching attendance status:', error);
    throw error;
  }
};

/**
 * Get diagnostic information for debugging attendance issues
 * Only available for admin users
 */
export const getAttendanceDiagnostics = async () => {
  try {
    const response = await api.get('/attendance/diagnostics');
    return response.data;
  } catch (error) {
    console.error('Error fetching attendance diagnostics:', error);
    throw error;
  }
};

export interface User {
  _id: string;
  email: string;
  name: string;
  role: 'CEO' | 'DIRECTOR' | 'EMPLOYEE' | 'ADMIN';
  department?: string;
}

export interface Task {
  _id: string;
  title: string;
  description: string;
  assignedTo: string;
  assignedBy: string;
  department: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'LATE';
  dueDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  _id: string;
  recipient: string;
  type: 'MEETING_SCHEDULED' | 'MEETING_UPDATED' | 'MEETING_CANCELLED' | 'MEETING_REMINDER' |
        'TASK_ASSIGNED' | 'TASK_UPDATED' | 'TASK_DUE_SOON' | 'ATTENDANCE_REMINDER';
  title: string;
  message: string;
  relatedId: string;
  read: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Meeting {
  _id: string;
  title: string;
  description: string;
  startTime: string | Date;
  endTime: string | Date;
  location: string;
  department: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
  participants: string[] | User[];
  organizer: string | User;
}

export interface Department {
  _id: string;
  name: string;
  description?: string;
  director?: string | User;
  isActive: boolean;
  employeeCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export type AttendanceStatus = 'PRESENT' | 'LATE' | 'HALF_DAY' | 'ABSENT';

export interface AttendanceData {
  _id: string;
  userId: string;
  department: string;
  date: string;
  checkIn: string;
  checkOut?: string;
  status: AttendanceStatus;
  workHours?: number;
  isLate?: boolean;
}
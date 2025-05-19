import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import AttendanceHeatmap from '@/components/Attendance/AttendanceHeatmap';
import { getAttendance, getAttendanceStats, AttendanceStats } from '@/api/attendance';
import { format, startOfMonth, endOfMonth } from 'date-fns';

interface AttendanceCount {
  present: number;
  total: number;
}

interface AttendanceStat {
  _id: string;
  count: number;
}

const DirectorAttendance = () => {
  const { user } = useAuth();
  const currentMonth = new Date();

  const { data: attendanceRecords = [] } = useQuery({
    queryKey: ['attendance', user?.department],
    queryFn: () => getAttendance({
      department: user?.department,
      startDate: startOfMonth(currentMonth),
      endDate: endOfMonth(currentMonth)
    })
  });

  const { data: stats = [] as AttendanceStat[], error: statsError } = useQuery({
    queryKey: ['attendance-stats', user?.department],
    queryFn: async () => {
      try {
        const result = await getAttendanceStats({
          department: user?.department,
          startDate: startOfMonth(currentMonth),
          endDate: endOfMonth(currentMonth)
        });
        
        // Format the data if it's not in the expected format
        if (Array.isArray(result)) {
          return result as AttendanceStat[];
        } else if (result.attendanceByDate) {
          // Extract stats from attendanceByDate
          const statusCounts: Record<string, number> = {};
          result.attendanceByDate.forEach(item => {
            statusCounts[item.status] = (statusCounts[item.status] || 0) + 1;
          });
          return Object.entries(statusCounts).map(([status, count]) => ({
            _id: status,
            count
          }));
        }
        console.warn('Unexpected stats format:', result);
        return [] as AttendanceStat[];
      } catch (error) {
        console.error('Error fetching attendance stats:', error);
        return [] as AttendanceStat[];
      }
    }
  });

  if (statsError) {
    console.error('Error in attendance stats query:', statsError);
  }

  // Calculate department attendance rate
  const totalAttendance = stats.reduce((acc: number, stat: AttendanceStat) => acc + stat.count, 0);
  const presentCount = stats.find((stat: AttendanceStat) => stat._id === 'PRESENT')?.count || 0;
  const attendanceRate = totalAttendance ? (presentCount / totalAttendance) * 100 : 0;

  // Transform attendance data for heatmap
  const heatmapData = attendanceRecords.reduce<Record<string, AttendanceCount>>((acc, record) => {
    if (!record || !record.date) {
      console.warn('Invalid attendance record:', record);
      return acc;
    }
    
    try {
      // Handle both string dates and Date objects
      const dateObj = typeof record.date === 'string' ? new Date(record.date) : record.date;
      
      if (isNaN(dateObj.getTime())) {
        console.warn('Invalid date in attendance record:', record.date);
        return acc;
      }
      
      const date = format(dateObj, 'yyyy-MM-dd');
      
      if (!acc[date]) {
        acc[date] = { present: 0, total: 0 };
      }
      
      acc[date].total++;
      if (record.status === 'PRESENT') {
        acc[date].present++;
      }
    } catch (err) {
      console.error('Error processing attendance record:', record, err);
    }
    return acc;
  }, {});

  // Handle possible empty data
  const heatmapDataArray = Object.entries(heatmapData).map(([date, data]) => ({
    date,
    value: data.total > 0 ? data.present / data.total : 0
  }));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">
            Department Attendance - {user?.department}
          </h1>
          <div className="text-right">
            <p className="text-sm text-gray-500">Monthly Attendance Rate</p>
            <p className="text-2xl font-semibold text-indigo-600">
              {attendanceRate.toFixed(1)}%
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Present', status: 'PRESENT', color: 'bg-green-100 text-green-800' },
            { label: 'Late', status: 'LATE', color: 'bg-yellow-100 text-yellow-800' },
            { label: 'Half Day', status: 'HALF_DAY', color: 'bg-orange-100 text-orange-800' },
            { label: 'Absent', status: 'ABSENT', color: 'bg-red-100 text-red-800' }
          ].map(item => {
            const count = stats.find((stat: AttendanceStat) => stat._id === item.status)?.count || 0;
            return (
              <div key={item.status} className={`p-4 rounded-lg ${item.color}`}>
                <h3 className="text-sm font-medium">{item.label}</h3>
                <p className="mt-2 text-2xl font-semibold">{count}</p>
              </div>
            );
          })}
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <AttendanceHeatmap
            title="Department Attendance Overview"
            data={heatmapDataArray}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DirectorAttendance;
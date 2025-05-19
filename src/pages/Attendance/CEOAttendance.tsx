import React from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import AttendanceHeatmap from '@/components/Attendance/AttendanceHeatmap';
import { getAttendance } from '@/api/attendance';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { getUsers } from '@/api/users';

interface AttendanceCount {
  present: number;
  total: number;
}

interface DepartmentStat {
  present: number;
  late: number;
  halfDay: number;
  absent: number;
  total: number;
}

interface DepartmentStats {
  [key: string]: DepartmentStat;
}

const CEOAttendance = () => {
  const currentMonth = new Date();

  const { data: attendanceRecords = [] } = useQuery({
    queryKey: ['attendance'],
    queryFn: async () => {
      try {
        return await getAttendance({
          startDate: startOfMonth(currentMonth),
          endDate: endOfMonth(currentMonth)
        });
      } catch (error) {
        console.error("Error loading attendance:", error);
        return [];
      }
    }
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      try {
        const users = await getUsers();
        return Array.from(new Set(users.map(user => user.department))).filter(Boolean) as string[];
      } catch (error) {
        console.error("Error loading departments:", error);
        return [];
      }
    }
  });

  // Calculate department-wise statistics
  const departmentStats = attendanceRecords.reduce<DepartmentStats>((acc, record) => {
    const dept = record.department;
    if (!acc[dept]) {
      acc[dept] = { present: 0, late: 0, halfDay: 0, absent: 0, total: 0 };
    }
    
    acc[dept].total++;
    switch (record.status) {
      case 'PRESENT':
        acc[dept].present++;
        break;
      case 'LATE':
        acc[dept].late++;
        break;
      case 'HALF_DAY':
        acc[dept].halfDay++;
        break;
      case 'ABSENT':
        acc[dept].absent++;
        break;
    }
    
    return acc;
  }, {});

  // Calculate overall attendance rate
  const totalAttendance = Object.values(departmentStats).reduce((acc, dept) => acc + dept.total, 0);
  const totalPresent = Object.values(departmentStats).reduce((acc, dept) => acc + dept.present, 0);
  const overallAttendanceRate = totalAttendance ? (totalPresent / totalAttendance) * 100 : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Organization Attendance</h1>
          <div className="text-right">
            <p className="text-sm text-gray-500">Overall Attendance Rate</p>
            <p className="text-2xl font-semibold text-indigo-600">
              {overallAttendanceRate.toFixed(1)}%
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map(dept => {
            if (!dept) return null;
            
            const stats = departmentStats[dept] || { present: 0, late: 0, halfDay: 0, absent: 0, total: 0 };
            const deptAttendanceRate = stats.total ? (stats.present / stats.total) * 100 : 0;

            return (
              <div key={dept} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-lg font-medium text-gray-900">{dept}</h2>
                  <span className="text-sm font-medium text-indigo-600">
                    {deptAttendanceRate.toFixed(1)}%
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 p-3 rounded">
                    <p className="text-sm text-green-700">Present</p>
                    <p className="text-xl font-semibold text-green-900">{stats.present}</p>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded">
                    <p className="text-sm text-yellow-700">Late</p>
                    <p className="text-xl font-semibold text-yellow-900">{stats.late}</p>
                  </div>
                  <div className="bg-orange-50 p-3 rounded">
                    <p className="text-sm text-orange-700">Half Day</p>
                    <p className="text-xl font-semibold text-orange-900">{stats.halfDay}</p>
                  </div>
                  <div className="bg-red-50 p-3 rounded">
                    <p className="text-sm text-red-700">Absent</p>
                    <p className="text-xl font-semibold text-red-900">{stats.absent}</p>
                  </div>
                </div>

                <div className="mt-4">
                  <AttendanceHeatmap
                    title={`${dept} Attendance`}
                    data={Object.entries(
                      attendanceRecords
                        .filter(record => record.department === dept)
                        .reduce<Record<string, AttendanceCount>>((acc, record) => {
                          const date = format(new Date(record.date), 'yyyy-MM-dd');
                          if (!acc[date]) {
                            acc[date] = { present: 0, total: 0 };
                          }
                          acc[date].total++;
                          if (record.status === 'PRESENT') {
                            acc[date].present++;
                          }
                          return acc;
                        }, {})
                    ).map(([date, data]) => ({
                      date,
                      value: data.total > 0 ? data.present / data.total : 0
                    }))}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CEOAttendance;
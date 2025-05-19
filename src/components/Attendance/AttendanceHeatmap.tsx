import React from 'react';
import { AttendanceData } from '@/types';
import { format } from 'date-fns';

interface AttendanceHeatmapProps {
  title?: string;
  data: Array<{ date: string; value: number } | AttendanceData>;
}

const AttendanceHeatmap: React.FC<AttendanceHeatmapProps> = ({ title, data }) => {
  // Group by month for display - handle different data structures
  const months = Array.from(new Set(data.map(d => {
    const dateStr = 'date' in d ? d.date : '';
    return format(new Date(dateStr), 'yyyy-MM');
  })))
    .sort()
    .slice(-3); // Show last 3 months

  return (
    <div className="space-y-4">
      {title && <h2 className="text-lg font-medium text-gray-900">{title}</h2>}
      {months.map(month => (
        <div key={month} className="space-y-2">
          <h3 className="text-sm font-medium text-gray-900">
            {format(new Date(month), 'MMMM yyyy')}
          </h3>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={`header-${i}`} className="h-8 flex items-center justify-center">
                <span className="text-xs text-gray-500">
                  {format(new Date(2024, 0, i + 1), 'EEE')}
                </span>
              </div>
            ))}
            {data
              .filter(d => {
                const dateObj = new Date('date' in d ? d.date : '');
                return format(dateObj, 'yyyy-MM') === month;
              })
              .sort((a, b) => {
                const dateA = new Date('date' in a ? a.date : '');
                const dateB = new Date('date' in b ? b.date : '');
                return dateA.getTime() - dateB.getTime();
              })
              .map(item => {
                // Check if it's AttendanceData type
                if ('status' in item) {
                  const attendance = item;
                  return (
                    <div
                      key={attendance._id || attendance.date}
                      className={`h-8 rounded-md ${
                        attendance.status === 'PRESENT'
                          ? 'bg-green-100'
                          : attendance.status === 'HALF_DAY'
                          ? 'bg-yellow-100'
                          : attendance.status === 'LATE'
                          ? 'bg-orange-100'
                          : 'bg-red-100'
                      } flex items-center justify-center`}
                      title={`${format(new Date(attendance.date), 'yyyy-MM-dd')}: ${attendance.status.replace('_', ' ').toLowerCase()}`}
                    >
                      <span className="text-xs">
                        {format(new Date(attendance.date), 'd')}
                      </span>
                    </div>
                  );
                } else {
                  // It's a value-based data point
                  const dataPoint = item;
                  let colorClass = 'bg-gray-100';
                  if (dataPoint.value > 0.8) colorClass = 'bg-green-500';
                  else if (dataPoint.value > 0.6) colorClass = 'bg-green-300';
                  else if (dataPoint.value > 0.4) colorClass = 'bg-yellow-300';
                  else if (dataPoint.value > 0) colorClass = 'bg-red-300';

                  return (
                    <div
                      key={dataPoint.date}
                      className={`h-8 rounded-md ${colorClass} flex items-center justify-center`}
                      title={`${dataPoint.date}: ${Math.round(dataPoint.value * 100)}% present`}
                    >
                      <span className="text-xs">
                        {format(new Date(dataPoint.date), 'd')}
                      </span>
                    </div>
                  );
                }
              })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AttendanceHeatmap;
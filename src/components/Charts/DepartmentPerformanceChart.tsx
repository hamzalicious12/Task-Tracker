import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface DepartmentPerformanceChartProps {
  data: {
    department: string;
    completed: number;
    pending: number;
    late: number;
  }[];
}

const DepartmentPerformanceChart: React.FC<DepartmentPerformanceChartProps> = ({ data }) => {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="department" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="completed" fill="#10B981" name="Completed" />
          <Bar dataKey="pending" fill="#3B82F6" name="Pending" />
          <Bar dataKey="late" fill="#EF4444" name="Late" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DepartmentPerformanceChart;
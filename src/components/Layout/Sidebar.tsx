import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Calendar,
  PieChart,
  UserCircle,
  Clock
} from 'lucide-react';

interface SidebarProps {
  userRole?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ userRole }) => {
  const location = useLocation();

  const menuItems = {
    CEO: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/ceo' },
      { icon: PieChart, label: 'Analytics', path: '/analytics' },
      { icon: Users, label: 'Departments', path: '/ceo/departments' },
      { icon: Clock, label: 'Attendance', path: '/ceo/attendance' },
      { icon: Calendar, label: 'Meetings', path: '/ceo/meetings' },
      { icon: UserCircle, label: 'Profile', path: '/profile' }
    ],
    DIRECTOR: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/director' },
      { icon: Clock, label: 'Attendance', path: '/director/attendance' },
      { icon: Calendar, label: 'Meetings', path: '/director/meetings' },
      { icon: Users, label: 'Team', path: '/director/team' },
      { icon: UserCircle, label: 'Profile', path: '/profile' }
    ],
    EMPLOYEE: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/employee' },
      { icon: Clock, label: 'My Attendance', path: '/employee/attendance' },
      { icon: UserCircle, label: 'Profile', path: '/profile' }
    ],
    ADMIN: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
      { icon: Clock, label: 'My Attendance', path: '/admin/attendance' },
      { icon: Users, label: 'Departments', path: '/admin/departments' },
      { icon: UserCircle, label: 'Profile', path: '/profile' }
    ]
  };

  const items = userRole ? menuItems[userRole as keyof typeof menuItems] : [];

  return (
    <aside className="w-64 bg-white shadow-sm min-h-screen">
      <nav className="mt-5 px-2">
        <div className="space-y-1">
          {items.map(({ icon: Icon, label, path }) => {
            const isActive = location.pathname === path;
            
            return (
              <Link
                key={path}
                to={path}
                className={`
                  group flex items-center px-2 py-2 text-sm font-medium rounded-md
                  ${isActive
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <Icon
                  className={`
                    mr-3 h-5 w-5
                    ${isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-500'}
                  `}
                />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
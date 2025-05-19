import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { LogOut, User } from 'lucide-react';
import NotificationBell from '@/components/Notifications/NotificationBell';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">Task Tracker</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <NotificationBell />
            
            <div className="flex items-center space-x-2">
              <User className="h-6 w-6 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">{user?.name}</span>
            </div>
            
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-gray-500"
            >
              <LogOut className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
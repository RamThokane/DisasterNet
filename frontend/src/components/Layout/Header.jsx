import { Radio, LogOut, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

const Header = () => {
  const { user, logout } = useAuth();
  const { connected } = useSocket();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex items-center justify-between h-full px-4 sm:px-5">
      <div className="flex items-center gap-2.5">
        <Radio className="w-5 h-5 text-white flex-shrink-0" />
        <div>
          <p className="text-sm sm:text-base font-semibold text-white leading-tight">
            DisasterNet
          </p>
          <p className="text-[10px] sm:text-xs text-gray-400 leading-tight">
            Emergency Network
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Connection status */}
        <div className="flex items-center gap-1.5">
          {connected ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              <span className="text-xs text-gray-400 hidden sm:inline">Connected</span>
            </>
          ) : (
            <>
              <span className="h-2 w-2 rounded-full bg-red-500" />
              <span className="text-xs text-gray-400 hidden sm:inline">Offline</span>
            </>
          )}
        </div>

        {/* User info */}
        {user && (
          <div className="flex items-center gap-2 pl-3 border-l border-gray-700">
            <span className="text-xs text-gray-300 hidden sm:inline max-w-[100px] truncate">
              {user.username}
            </span>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-md hover:bg-gray-700 text-gray-400 hover:text-white transition"
              title="Leave"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Header;

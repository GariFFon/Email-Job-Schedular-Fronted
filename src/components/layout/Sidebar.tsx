import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { ActiveTab, StatsResponse } from '../../types';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onCompose: () => void;
  stats: StatsResponse | null;
}

export default function Sidebar({
  activeTab,
  onTabChange,
  onCompose,
  stats,
}: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Avatar initials fallback
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '??';

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="px-4 pt-4 pb-3">
        <span className="text-2xl font-black tracking-tight text-gray-900 select-none">
          ONB
        </span>
      </div>

      {/* User profile card */}
      <div className="px-3 mb-4">
        <div className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50 cursor-pointer group relative">
          {/* Avatar */}
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#22C55E] flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-semibold">{initials}</span>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.name ?? 'User'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.email ?? ''}
            </p>
          </div>

          {/* Dropdown chevron */}
          <svg
            className="w-4 h-4 text-gray-400 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>

          {/* Logout dropdown */}
          <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 hidden group-hover:block">
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Compose button */}
      <div className="px-3 mb-5">
        <button
          id="compose-btn"
          onClick={onCompose}
          className="btn-compose w-full flex items-center justify-center gap-2"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Compose
        </button>
      </div>

      {/* Navigation */}
      <div className="px-3">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-1 mb-2">
          Core
        </p>

        {/* Scheduled */}
        <button
          id="nav-scheduled"
          onClick={() => onTabChange('scheduled')}
          className={`nav-item w-full ${activeTab === 'scheduled' ? 'active' : ''}`}
        >
          <div className="flex items-center gap-2.5">
            <svg
              className="w-4 h-4 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Scheduled</span>
          </div>
          {stats && stats.scheduled > 0 && (
            <span className="text-xs font-medium text-gray-500">
              {stats.scheduled}
            </span>
          )}
        </button>

        {/* Sent */}
        <button
          id="nav-sent"
          onClick={() => onTabChange('sent')}
          className={`nav-item w-full mt-0.5 ${activeTab === 'sent' ? 'active' : ''}`}
        >
          <div className="flex items-center gap-2.5">
            <svg
              className="w-4 h-4 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
            <span>Sent</span>
          </div>
          {stats && stats.sent > 0 && (
            <span className="text-xs font-medium text-gray-500">
              {stats.sent}
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}

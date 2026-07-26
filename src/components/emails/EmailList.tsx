import { format } from 'date-fns';
import type { EmailJob } from '../../types';
import Spinner from '../ui/Spinner';
import EmptyState from '../ui/EmptyState';
import { emailsApi } from '../../services/api';
import toast from 'react-hot-toast';

interface EmailListProps {
  emails: EmailJob[];
  isLoading: boolean;
  activeTab: 'scheduled' | 'sent';
  onCompose: () => void;
  onEmailClick: (email: EmailJob) => void;
  onRefresh: () => void;
  onStarToggle: (id: string, current: boolean) => void;
}

export default function EmailList({
  emails,
  isLoading,
  activeTab,
  onCompose,
  onEmailClick,
  onRefresh,
  onStarToggle,
}: EmailListProps) {
  const formatScheduledTime = (iso: string) => {
    try {
      const date = new Date(iso);
      const dayAbbr = format(date, 'EEE'); // Mon, Tue, etc.
      const time = format(date, 'h:mm:ss a');
      return `${dayAbbr} ${time}`;
    } catch {
      return iso;
    }
  };

  const formatSentTime = (iso: string | null) => {
    if (!iso) return '—';
    try {
      return format(new Date(iso), 'EEE h:mm:ss a');
    } catch {
      return iso;
    }
  };

  const handleStarClick = async (e: React.MouseEvent, email: EmailJob) => {
    e.stopPropagation();
    try {
      await emailsApi.toggleStar(email.id);
      onStarToggle(email.id, email.isStarred);
    } catch {
      toast.error('Failed to update star');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <EmptyState
        title={activeTab === 'scheduled' ? 'No scheduled emails' : 'No sent emails'}
        description={
          activeTab === 'scheduled'
            ? 'Schedule your first email campaign to get started.'
            : 'Your sent emails will appear here once emails are delivered.'
        }
        actionLabel={activeTab === 'scheduled' ? 'Compose New Email' : undefined}
        onAction={activeTab === 'scheduled' ? onCompose : undefined}
      />
    );
  }

  return (
    <div className="flex flex-col">
      {/* Search + controls bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
        <div className="relative flex-1 max-w-lg">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search"
            className="search-input"
            id="email-search"
          />
        </div>

        {/* Filter icon */}
        <button
          onClick={onRefresh}
          className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
          title="Filter"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
          </svg>
        </button>

        {/* Refresh icon */}
        <button
          onClick={onRefresh}
          className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
          title="Refresh"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Email rows */}
      <div className="divide-y divide-gray-100">
        {emails.map((email) => (
          <div
            key={email.id}
            className="email-row fade-in"
            onClick={() => onEmailClick(email)}
          >
            {/* Recipient */}
            <div className="w-36 flex-shrink-0">
              <span className="text-sm font-medium text-gray-900 truncate block">
                To: {email.toEmail.split('@')[0]}
              </span>
            </div>

            {/* Time badge */}
            <div className="flex-shrink-0">
              {activeTab === 'scheduled' ? (
                <span className="badge-scheduled">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {formatScheduledTime(email.scheduledAt)}
                </span>
              ) : (
                <span className={email.status === 'failed' ? 'badge-failed' : 'badge-sent'}>
                  {email.status === 'failed' ? 'Failed' : 'Sent'}
                </span>
              )}
            </div>

            {/* Subject + preview */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900 truncate">
                <span className="font-medium">{email.subject}</span>
                <span className="text-gray-400 mx-1">-</span>
                <span className="text-gray-500">
                  {email.body.replace(/<[^>]*>/g, '').slice(0, 80)}
                </span>
              </p>
              {activeTab === 'sent' && email.sentAt && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatSentTime(email.sentAt)}
                </p>
              )}
            </div>

            {/* Star */}
            <button
              onClick={(e) => handleStarClick(e, email)}
              className={`flex-shrink-0 p-1 rounded transition-colors ${
                email.isStarred
                  ? 'text-yellow-400'
                  : 'text-gray-300 hover:text-gray-400'
              }`}
            >
              <svg
                className="w-4 h-4"
                fill={email.isStarred ? 'currentColor' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

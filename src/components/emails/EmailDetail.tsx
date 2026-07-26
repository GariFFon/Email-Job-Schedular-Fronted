import { format } from 'date-fns';
import type { EmailJob } from '../../types';

interface EmailDetailProps {
  email: EmailJob;
  userName: string;
  userAvatar: string | null;
  onBack: () => void;
}

export default function EmailDetail({
  email,
  userName,
  userAvatar,
  onBack,
}: EmailDetailProps) {
  const sentOrScheduledTime = email.sentAt
    ? format(new Date(email.sentAt), 'MMM d, h:mm a')
    : format(new Date(email.scheduledAt), 'MMM d, h:mm a');

  const senderInitial = email.fromName?.[0]?.toUpperCase() || 'S';

  return (
    <div className="flex flex-col h-full fade-in">
      {/* Detail header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            id="back-btn"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-base font-semibold text-gray-900 truncate max-w-xl">
            {userName}, hello there! | {email.id.toUpperCase().slice(0, 14)}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Star */}
          <button className="p-1.5 text-gray-400 hover:text-yellow-400 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </button>

          {/* Archive */}
          <button className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
          </button>

          {/* Trash */}
          <button className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>

          {/* User avatar */}
          <div className="w-8 h-8 rounded-full bg-[#22C55E] flex items-center justify-center overflow-hidden flex-shrink-0">
            {userAvatar ? (
              <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white text-xs font-semibold">
                {userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Email body */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {/* From / To info */}
        <div className="flex items-start gap-3 mb-6">
          <div className="w-9 h-9 rounded-full bg-[#22C55E] flex items-center justify-center flex-shrink-0 text-white font-semibold text-sm">
            {senderInitial}
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-gray-900">
                  {email.fromName}
                </span>
                <span className="text-sm text-gray-500 ml-1">
                  &lt;{email.fromEmail}&gt;
                </span>
              </div>
              <span className="text-xs text-gray-500">{sentOrScheduledTime}</span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              to{' '}
              <button className="text-gray-700 hover:text-gray-900">
                {email.toEmail}
              </button>
            </p>
          </div>
        </div>

        {/* Email content */}
        <div
          className="text-sm text-gray-800 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: email.body }}
        />

        {/* Ethereal preview link */}
        {email.etherealPreviewUrl && (
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-blue-800 mb-1">
              📧 Ethereal Email Preview Available
            </p>
            <a
              href={email.etherealPreviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 underline break-all"
            >
              {email.etherealPreviewUrl}
            </a>
          </div>
        )}

        {/* Error message */}
        {email.status === 'failed' && email.errorMessage && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-medium text-red-700 mb-1">Delivery failed</p>
            <p className="text-sm text-red-600">{email.errorMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
}

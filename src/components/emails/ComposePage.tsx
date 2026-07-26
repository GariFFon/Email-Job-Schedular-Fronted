import { useState, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { emailsApi } from '../../services/api';
import Spinner from '../ui/Spinner';
import type { ScheduleFormData } from '../../types';

interface ComposePageProps {
  userEmail: string;
  userName: string;
  onBack: () => void;
  onSuccess: () => void;
}

export default function ComposePage({
  userEmail,
  userName,
  onBack,
  onSuccess,
}: ComposePageProps) {
  const [recipients, setRecipients] = useState<string[]>([]);
  const [recipientInput, setRecipientInput] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [scheduledStartAt, setScheduledStartAt] = useState('');
  const [delayBetweenEmailsMs, setDelayBetweenEmailsMs] = useState(2000);
  const [hourlyLimit, setHourlyLimit] = useState(200);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvCount, setCsvCount] = useState<number | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add email chip on Enter or comma
  const handleRecipientKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addRecipient(recipientInput.trim());
    }
  };

  const addRecipient = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && emailRegex.test(email) && !recipients.includes(email)) {
      setRecipients((prev) => [...prev, email.toLowerCase()]);
      setRecipientInput('');
    } else if (email && !emailRegex.test(email)) {
      toast.error('Invalid email address');
    }
  };

  const removeRecipient = (email: string) => {
    setRecipients((prev) => prev.filter((r) => r !== email));
  };

  // CSV file upload
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    setIsParsing(true);

    try {
      const result = await emailsApi.parseCsv(file);
      setRecipients(result.emails);
      setCsvCount(result.count);
      toast.success(`Found ${result.count} email addresses`);
    } catch {
      toast.error('Failed to parse CSV file');
    } finally {
      setIsParsing(false);
    }
  }, []);

  const handleSendLater = async () => {
    if (!scheduledStartAt) {
      toast.error('Please set a scheduled start time');
      return;
    }
    await handleSubmit();
  };

  const handleSubmit = async () => {
    if (recipients.length === 0) {
      toast.error('Please add at least one recipient');
      return;
    }
    if (!subject.trim()) {
      toast.error('Please enter a subject');
      return;
    }
    if (!body.trim()) {
      toast.error('Please enter an email body');
      return;
    }
    if (!scheduledStartAt) {
      toast.error('Please set a scheduled start time');
      return;
    }

    const data: ScheduleFormData = {
      fromEmail: userEmail,
      fromName: userName,
      recipients,
      subject,
      body,
      scheduledStartAt: new Date(scheduledStartAt).toISOString(),
      delayBetweenEmailsMs,
      hourlyLimit,
    };

    setIsSubmitting(true);
    try {
      await emailsApi.schedule(data);
      toast.success(`Scheduled ${recipients.length} email(s) successfully!`);
      onSuccess();
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Failed to schedule emails';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Minimal rich-text commands
  const execCommand = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
  };

  const displayedRecipients = recipients.slice(0, 3);
  const extraCount = recipients.length - 3;

  // Format delay for display
  const delayDisplay = String(Math.round(delayBetweenEmailsMs / 1000)).padStart(2, '0');
  const hourlyDisplay = String(hourlyLimit).padStart(2, '0');

  return (
    <div className="flex flex-col h-full fade-in">
      {/* Compose header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-base font-semibold text-gray-900">
            Compose New Email
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Attachment icon */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-[#22C55E] hover:bg-[#F0FDF4] rounded-lg transition-colors"
            title="Upload recipient list"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>

          {/* Schedule time icon */}
          <button className="p-2 text-[#22C55E] hover:bg-[#F0FDF4] rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          {/* Send Later button */}
          <button
            id="send-later-btn"
            onClick={handleSendLater}
            disabled={isSubmitting}
            className="btn-secondary flex items-center gap-2"
          >
            {isSubmitting ? (
              <Spinner size="sm" />
            ) : null}
            Send Later
          </button>
        </div>
      </div>

      {/* Compose form */}
      <div className="flex-1 overflow-y-auto">
        {/* From field */}
        <div className="flex items-center px-6 py-3 border-b border-gray-100">
          <span className="text-sm text-gray-500 w-16 flex-shrink-0">From</span>
          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-sm text-gray-800">{userEmail}</span>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* To field */}
        <div className="flex items-center flex-wrap px-6 py-3 border-b border-gray-100 gap-1.5 min-h-[52px]">
          <span className="text-sm text-gray-500 w-16 flex-shrink-0">To</span>

          {/* Email chips */}
          {displayedRecipients.map((email) => (
            <span key={email} className="email-chip">
              {email}
              <button
                onClick={() => removeRecipient(email)}
                className="ml-1 text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </span>
          ))}

          {extraCount > 0 && (
            <span className="email-chip bg-gray-100 text-gray-600">
              +{extraCount}
            </span>
          )}

          {/* Input for manual entry */}
          <input
            type="text"
            value={recipientInput}
            onChange={(e) => setRecipientInput(e.target.value)}
            onKeyDown={handleRecipientKeyDown}
            onBlur={() => recipientInput && addRecipient(recipientInput.trim())}
            placeholder={recipients.length === 0 ? 'Add recipients...' : ''}
            className="flex-1 min-w-[120px] text-sm outline-none text-gray-700 bg-transparent"
            id="recipient-input"
          />

          {/* Upload List */}
          <div className="ml-auto flex-shrink-0">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              onChange={handleFileChange}
              className="hidden"
              id="csv-upload"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 text-xs text-[#22C55E] hover:text-[#16A34A] font-medium transition-colors"
            >
              {isParsing ? (
                <Spinner size="sm" />
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Upload List
                </>
              )}
            </button>
            {csvCount !== null && (
              <span className="text-xs text-gray-500 ml-1">
                ({csvCount} emails)
              </span>
            )}
          </div>
        </div>

        {/* Subject field */}
        <div className="flex items-center px-6 py-3 border-b border-gray-100">
          <span className="text-sm text-gray-500 w-16 flex-shrink-0">Subject</span>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            className="flex-1 ml-2 text-sm outline-none text-gray-800 bg-transparent placeholder-gray-400"
            id="subject-input"
          />
        </div>

        {/* Scheduled time + Delay + Hourly Limit */}
        <div className="flex items-center flex-wrap gap-4 px-6 py-3 border-b border-gray-100">
          {/* Scheduled start */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Send at</span>
            <input
              type="datetime-local"
              value={scheduledStartAt}
              onChange={(e) => setScheduledStartAt(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-2 py-1 text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#22C55E]"
              id="scheduled-at-input"
            />
          </div>

          {/* Delay between emails */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Delay between 2 emails</span>
            <input
              type="number"
              value={Math.round(delayBetweenEmailsMs / 1000)}
              onChange={(e) =>
                setDelayBetweenEmailsMs(
                  Math.max(0, parseInt(e.target.value || '0') * 1000),
                )
              }
              min={0}
              max={3600}
              className="w-16 text-sm border border-gray-200 rounded-lg px-2 py-1 text-gray-800 text-center focus:outline-none focus:ring-1 focus:ring-[#22C55E]"
              id="delay-input"
            />
            <span className="text-xs text-gray-400">sec</span>
          </div>

          {/* Hourly limit */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Hourly Limit</span>
            <input
              type="number"
              value={hourlyLimit}
              onChange={(e) =>
                setHourlyLimit(
                  Math.max(1, Math.min(10000, parseInt(e.target.value || '1'))),
                )
              }
              min={1}
              max={10000}
              className="w-20 text-sm border border-gray-200 rounded-lg px-2 py-1 text-gray-800 text-center focus:outline-none focus:ring-1 focus:ring-[#22C55E]"
              id="hourly-limit-input"
            />
          </div>
        </div>

        {/* Body / Rich text editor */}
        <div className="px-6 py-4">
          {/* Content editable area */}
          <div
            contentEditable
            suppressContentEditableWarning
            onInput={(e) => setBody((e.target as HTMLElement).innerHTML)}
            className="min-h-[240px] text-sm text-gray-700 outline-none leading-relaxed"
            data-placeholder="Type Your Reply..."
            id="email-body"
            style={{
              caretColor: '#22C55E',
            }}
          />

          {/* Toolbar */}
          <div className="flex items-center gap-0.5 mt-4 pt-3 border-t border-gray-100 flex-wrap">
            {/* Undo */}
            <ToolbarBtn onClick={() => execCommand('undo')} title="Undo">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </ToolbarBtn>

            {/* Redo */}
            <ToolbarBtn onClick={() => execCommand('redo')} title="Redo">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
            </ToolbarBtn>

            <div className="w-px h-4 bg-gray-200 mx-1" />

            {/* Bold */}
            <ToolbarBtn onClick={() => execCommand('bold')} title="Bold">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 4h8a4 4 0 010 8H6z M6 12h9a4 4 0 010 8H6z" />
            </ToolbarBtn>

            {/* Italic */}
            <button
              onClick={() => execCommand('italic')}
              title="Italic"
              className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded text-sm italic font-serif transition-colors"
            >
              I
            </button>

            {/* Underline */}
            <button
              onClick={() => execCommand('underline')}
              title="Underline"
              className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded text-sm underline transition-colors"
            >
              U
            </button>

            <div className="w-px h-4 bg-gray-200 mx-1" />

            {/* Align left */}
            <ToolbarBtn onClick={() => execCommand('justifyLeft')} title="Align Left">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h12" />
            </ToolbarBtn>

            {/* Ordered list */}
            <ToolbarBtn onClick={() => execCommand('insertOrderedList')} title="Ordered List">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5h7M9 10h7M9 15h7M4 5v.01M4 10v.01M4 15v.01" />
            </ToolbarBtn>

            {/* Unordered list */}
            <ToolbarBtn onClick={() => execCommand('insertUnorderedList')} title="Unordered List">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </ToolbarBtn>

            <div className="w-px h-4 bg-gray-200 mx-1" />

            {/* Blockquote */}
            <ToolbarBtn onClick={() => execCommand('formatBlock', 'blockquote')} title="Quote">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </ToolbarBtn>

            {/* Strikethrough */}
            <ToolbarBtn onClick={() => execCommand('strikeThrough')} title="Strikethrough">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 15l6-6m-6 6l6 6M3 12h18" />
            </ToolbarBtn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Toolbar Button ───────────────────────────────────────────────────────────
function ToolbarBtn({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {children}
      </svg>
    </button>
  );
}

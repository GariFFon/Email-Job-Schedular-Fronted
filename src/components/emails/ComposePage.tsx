import { useState, useRef, useCallback, useEffect } from 'react';
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

interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  file?: File;
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
  
  // Scheduling state
  const [scheduledStartAt, setScheduledStartAt] = useState('');
  const [showSchedulePopover, setShowSchedulePopover] = useState(false);
  const [tempScheduledAt, setTempScheduledAt] = useState('');

  // Delay & Limit state
  const [delaySecondsStr, setDelaySecondsStr] = useState('00');
  const [hourlyLimitStr, setHourlyLimitStr] = useState('00');

  // Submitting & parsing state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [csvCount, setCsvCount] = useState<number | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  // Attachments state
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  // Refs
  const csvInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setShowSchedulePopover(false);
      }
    };
    if (showSchedulePopover) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSchedulePopover]);

  // Add email chip on Enter or comma
  const handleRecipientKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addRecipient(recipientInput.trim());
    }
  };

  const addRecipient = (email: string) => {
    const cleanEmail = email.replace(/,/g, '').trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (cleanEmail && emailRegex.test(cleanEmail) && !recipients.includes(cleanEmail.toLowerCase())) {
      setRecipients((prev) => [...prev, cleanEmail.toLowerCase()]);
      setRecipientInput('');
    } else if (cleanEmail && !emailRegex.test(cleanEmail)) {
      toast.error('Invalid email address');
    }
  };

  const removeRecipient = (email: string) => {
    setRecipients((prev) => prev.filter((r) => r !== email));
  };

  // CSV file upload
  const handleCsvChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    try {
      const result = await emailsApi.parseCsv(file);
      setRecipients((prev) => {
        const combined = new Set([...prev, ...result.emails]);
        return Array.from(combined);
      });
      setCsvCount(result.count);
      toast.success(`Uploaded ${result.count} email addresses`);
    } catch {
      toast.error('Failed to parse CSV file');
    } finally {
      setIsParsing(false);
      if (csvInputRef.current) csvInputRef.current.value = '';
    }
  }, []);

  // Attachment upload via paperclip icon
  const handleAttachmentChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const url = URL.createObjectURL(file);
      setAttachments((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(2, 9),
          name: file.name,
          url,
          type: file.type,
          file,
        },
      ]);
    });
    toast.success('Attachment added');
    if (attachmentInputRef.current) attachmentInputRef.current.value = '';
  }, []);

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  // Demo attachment helper (to quickly preview the tennis image like in screenshots)
  const addDemoAttachment = () => {
    const demoUrl = 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=600&auto=format&fit=crop';
    setAttachments((prev) => [
      ...prev,
      {
        id: 'demo-tennis',
        name: 'tennis_player.jpg',
        url: demoUrl,
        type: 'image/jpeg',
      },
    ]);
    toast.success('Demo image attached');
  };

  // Helper for preset dates in Send Later popover
  const getPresetDateStr = (type: string): string => {
    const d = new Date();
    d.setDate(d.getDate() + 1); // tomorrow
    if (type === 'Tomorrow') d.setHours(9, 0, 0, 0);
    else if (type === 'Tomorrow, 10:00 AM') d.setHours(10, 0, 0, 0);
    else if (type === 'Tomorrow, 11:00 AM') d.setHours(11, 0, 0, 0);
    else if (type === 'Tomorrow, 3:00 PM') d.setHours(15, 0, 0, 0);
    
    // Format as YYYY-MM-DDTHH:mm for datetime-local
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${mins}`;
  };

  const handlePresetClick = (type: string) => {
    const str = getPresetDateStr(type);
    setTempScheduledAt(str);
  };

  const handleScheduleDone = () => {
    if (!tempScheduledAt) {
      toast.error('Please pick a date and time');
      return;
    }
    setScheduledStartAt(new Date(tempScheduledAt).toISOString());
    setShowSchedulePopover(false);
    toast.success('Send Later schedule confirmed');
  };

  const handleSend = async () => {
    let finalScheduledAt = scheduledStartAt;
    // If no schedule was chosen and user clicks Send, default to immediately (now)
    if (!finalScheduledAt) {
      finalScheduledAt = new Date().toISOString();
    }
    await handleSubmit(finalScheduledAt);
  };

  const handleSubmit = async (scheduleTimeIso: string) => {
    if (recipients.length === 0) {
      toast.error('Please add at least one recipient');
      return;
    }
    if (!subject.trim()) {
      toast.error('Please enter a subject');
      return;
    }
    if (!body.trim() && attachments.length === 0) {
      toast.error('Please enter an email body or attachment');
      return;
    }

    // Embed image attachment previews in HTML body if any
    let finalBody = body;
    if (attachments.length > 0) {
      const imagesHtml = attachments
        .filter((a) => a.type.startsWith('image/') || a.url.includes('http'))
        .map((a) => `<div style="margin-top: 16px;"><img src="${a.url}" alt="${a.name}" style="max-width: 300px; border-radius: 8px; border: 1px solid #e5e7eb;" /></div>`)
        .join('');
      finalBody += imagesHtml;
    }

    const delayMs = Math.max(0, parseInt(delaySecondsStr || '0', 10) * 1000);
    const limit = Math.max(1, Math.min(10000, parseInt(hourlyLimitStr || '20', 10)));

    const data: ScheduleFormData = {
      fromEmail: userEmail,
      fromName: userName,
      recipients,
      subject,
      body: finalBody || '<p></p>',
      scheduledStartAt: scheduleTimeIso,
      delayBetweenEmailsMs: delayMs,
      hourlyLimit: limit,
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

  // Rich text commands
  const execCommand = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
    if (editorRef.current) {
      setBody(editorRef.current.innerHTML);
    }
  };

  const displayedRecipients = recipients.slice(0, 3);
  const extraCount = recipients.length - 3;
  const isScheduled = Boolean(scheduledStartAt);

  return (
    <div className="flex flex-col h-full w-full bg-white fade-in relative overflow-hidden">
      {/* Hidden file inputs */}
      <input
        ref={csvInputRef}
        type="file"
        accept=".csv,.txt"
        onChange={handleCsvChange}
        className="hidden"
        id="csv-upload"
      />
      <input
        ref={attachmentInputRef}
        type="file"
        accept="image/*,.pdf,.doc,.docx,.txt"
        multiple
        onChange={handleAttachmentChange}
        className="hidden"
        id="attachment-upload"
      />

      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 flex-shrink-0 bg-white z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-lg font-medium text-gray-800 hover:text-gray-600 transition-colors group cursor-pointer"
          >
            <svg className="w-5 h-5 text-gray-700 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Compose New Email</span>
          </button>
        </div>

        <div className="flex items-center gap-4 relative">
          {/* Attachment Icon */}
          <button
            onClick={() => attachmentInputRef.current?.click()}
            onContextMenu={(e) => {
              e.preventDefault();
              addDemoAttachment();
            }}
            className="p-2 text-gray-500 hover:text-[#22C55E] hover:bg-[#F0FDF4] rounded-lg transition-colors relative cursor-pointer"
            title="Attach file or picture (Right-click to add demo tennis picture)"
          >
            <svg className="w-5 h-5 -rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            {attachments.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#22C55E] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {attachments.length}
              </span>
            )}
          </button>

          {/* Clock Icon / Send Later Trigger */}
          <div className="relative" ref={popoverRef}>
            <button
              onClick={() => {
                if (!showSchedulePopover && scheduledStartAt) {
                  // Pre-fill temp with existing
                  setTempScheduledAt(scheduledStartAt.slice(0, 16));
                }
                setShowSchedulePopover(!showSchedulePopover);
              }}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                isScheduled || showSchedulePopover
                  ? 'text-[#22C55E] bg-[#F0FDF4]'
                  : 'text-gray-500 hover:text-[#22C55E] hover:bg-[#F0FDF4]'
              }`}
              title="Schedule Send Later"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>

            {/* Send Later Popover Card */}
            {showSchedulePopover && (
              <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 p-5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <h3 className="text-base font-semibold text-gray-900 mb-3">Send Later</h3>
                
                {/* Date & Time Picker */}
                <div className="relative mb-4">
                  <input
                    type="datetime-local"
                    value={tempScheduledAt}
                    onChange={(e) => setTempScheduledAt(e.target.value)}
                    className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-gray-700 outline-none focus:ring-2 focus:ring-[#22C55E] transition-all"
                  />
                  {!tempScheduledAt && (
                    <span className="absolute left-3 top-2.5 text-sm text-gray-400 pointer-events-none">
                      Pick date & time
                    </span>
                  )}
                  <svg className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>

                {/* Presets List */}
                <div className="space-y-2 mb-6">
                  {['Tomorrow', 'Tomorrow, 10:00 AM', 'Tomorrow, 11:00 AM', 'Tomorrow, 3:00 PM'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handlePresetClick(preset)}
                      className="w-full text-left text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-2.5 py-1.5 rounded-lg transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <span>{preset}</span>
                    </button>
                  ))}
                </div>

                {/* Cancel / Done Buttons */}
                <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowSchedulePopover(false)}
                    className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-1.5 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleScheduleDone}
                    className="text-sm font-medium px-4 py-1.5 rounded-full border border-[#22C55E] text-[#22C55E] hover:bg-[#F0FDF4] transition-colors cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Send / Send Later Action Button */}
          <button
            onClick={handleSend}
            disabled={isSubmitting}
            className="px-6 py-2 rounded-full border border-[#22C55E] text-[#22C55E] hover:bg-[#F0FDF4] font-medium text-sm transition-all flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
          >
            {isSubmitting && <Spinner size="sm" />}
            <span>{isScheduled ? 'Send Later' : 'Send'}</span>
          </button>
        </div>
      </div>

      {/* Main Form Content Area */}
      <div className="flex-1 overflow-y-auto px-8 py-4 max-w-6xl w-full mx-auto flex flex-col">
        {/* From Field */}
        <div className="flex items-center py-4 border-b border-gray-100 gap-4">
          <span className="text-sm font-medium text-gray-700 w-24 flex-shrink-0">From</span>
          <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-800 text-sm font-medium px-3.5 py-1.5 rounded-lg cursor-default">
            <span>{userEmail}</span>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* To Field with Green Pills & Upload List */}
        <div className="flex items-center flex-wrap py-4 border-b border-gray-100 gap-2 min-h-[60px]">
          <span className="text-sm font-medium text-gray-700 w-24 flex-shrink-0">To</span>

          {/* Green Pill Badges */}
          {displayedRecipients.map((email) => (
            <span
              key={email}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F0FDF4] border border-[#22C55E] text-[#15803D] rounded-full text-xs font-medium animate-in fade-in duration-150"
            >
              <span>{email}</span>
              <button
                type="button"
                onClick={() => removeRecipient(email)}
                className="text-[#15803D] hover:text-red-600 font-bold ml-0.5 focus:outline-none cursor-pointer"
              >
                ×
              </button>
            </span>
          ))}

          {extraCount > 0 && (
            <span className="inline-flex items-center px-2.5 py-1 bg-[#F0FDF4] border border-[#22C55E] text-[#15803D] rounded-full text-xs font-medium">
              +{extraCount}
            </span>
          )}

          {/* Input for typing manual emails */}
          <input
            type="text"
            value={recipientInput}
            onChange={(e) => setRecipientInput(e.target.value)}
            onKeyDown={handleRecipientKeyDown}
            onBlur={() => recipientInput && addRecipient(recipientInput.trim())}
            placeholder={recipients.length === 0 ? 'recipient@example.com' : ''}
            className="flex-1 min-w-[180px] text-sm outline-none text-gray-700 bg-transparent placeholder-gray-400 py-1"
          />

          {/* Upload List Button */}
          <div className="ml-auto flex-shrink-0 pl-4">
            <button
              type="button"
              onClick={() => csvInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 text-sm text-[#22C55E] hover:text-[#16A34A] font-medium transition-colors cursor-pointer"
            >
              {isParsing ? (
                <Spinner size="sm" />
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span>Upload List</span>
                </>
              )}
            </button>
            {csvCount !== null && (
              <span className="text-xs text-gray-500 ml-1.5 font-normal">
                ({csvCount} added)
              </span>
            )}
          </div>
        </div>

        {/* Subject Field */}
        <div className="flex items-center py-4 border-b border-gray-100 gap-4">
          <span className="text-sm font-medium text-gray-700 w-24 flex-shrink-0">Subject</span>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            className="flex-1 text-sm outline-none text-gray-800 bg-transparent placeholder-gray-400 py-1"
          />
        </div>

        {/* Delay & Hourly Limit Row (Notice: NO inline "Send at" input!) */}
        <div className="flex items-center py-4 border-b border-gray-100 gap-8">
          {/* Delay between 2 emails */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Delay between 2 emails</span>
            <input
              type="text"
              value={delaySecondsStr}
              onChange={(e) => setDelaySecondsStr(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="00"
              maxLength={3}
              className="w-16 text-sm border border-gray-200 rounded-lg py-1.5 px-2 text-gray-800 text-center outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E] transition-all shadow-sm"
            />
          </div>

          {/* Hourly Limit */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Hourly Limit</span>
            <input
              type="text"
              value={hourlyLimitStr}
              onChange={(e) => setHourlyLimitStr(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="00"
              maxLength={4}
              className="w-16 text-sm border border-gray-200 rounded-lg py-1.5 px-2 text-gray-800 text-center outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E] transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Rich Text Editor Card with TOP Toolbar */}
        <div className="mt-6 bg-[#F9FAFB] rounded-2xl border border-gray-200/70 p-5 flex flex-col flex-1 min-h-[420px] shadow-sm relative">
          {/* TOP Toolbar */}
          <div className="flex items-center gap-1 pb-3 mb-4 border-b border-gray-200/80 flex-wrap">
            {/* Undo */}
            <ToolbarBtn onClick={() => execCommand('undo')} title="Undo">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </ToolbarBtn>

            {/* Redo */}
            <ToolbarBtn onClick={() => execCommand('redo')} title="Redo">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
            </ToolbarBtn>

            <div className="w-px h-4 bg-gray-300 mx-1.5" />

            {/* Font / Typography */}
            <button
              type="button"
              onClick={() => execCommand('fontSize', '4')}
              className="flex items-center gap-1 px-2 py-1 text-gray-600 hover:text-gray-900 hover:bg-gray-200/60 rounded text-sm font-serif transition-colors cursor-pointer"
              title="Typography"
            >
              <span className="text-base font-serif">T</span><span className="text-xs font-serif">T</span>
              <svg className="w-3 h-3 text-gray-400 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <div className="w-px h-4 bg-gray-300 mx-1.5" />

            {/* Bold */}
            <ToolbarBtn onClick={() => execCommand('bold')} title="Bold">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 4h8a4 4 0 010 8H6z M6 12h9a4 4 0 010 8H6z" />
            </ToolbarBtn>

            {/* Italic */}
            <button
              type="button"
              onClick={() => execCommand('italic')}
              className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200/60 rounded text-sm italic font-serif transition-colors w-7 h-7 flex items-center justify-center font-bold cursor-pointer"
              title="Italic"
            >
              I
            </button>

            {/* Underline */}
            <button
              type="button"
              onClick={() => execCommand('underline')}
              className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200/60 rounded text-sm underline transition-colors w-7 h-7 flex items-center justify-center font-bold cursor-pointer"
              title="Underline"
            >
              U
            </button>

            <div className="w-px h-4 bg-gray-300 mx-1.5" />

            {/* Align left */}
            <ToolbarBtn onClick={() => execCommand('justifyLeft')} title="Align Left">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h12" />
            </ToolbarBtn>

            {/* Align center */}
            <ToolbarBtn onClick={() => execCommand('justifyCenter')} title="Align Center">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M4 18h16" />
            </ToolbarBtn>

            <div className="w-px h-4 bg-gray-300 mx-1.5" />

            {/* Ordered list */}
            <ToolbarBtn onClick={() => execCommand('insertOrderedList')} title="Ordered List">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5h7M9 10h7M9 15h7M4 5v.01M4 10v.01M4 15v.01" />
            </ToolbarBtn>

            {/* Unordered list */}
            <ToolbarBtn onClick={() => execCommand('insertUnorderedList')} title="Unordered List">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </ToolbarBtn>

            {/* Indent / Outdent */}
            <ToolbarBtn onClick={() => execCommand('indent')} title="Indent">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </ToolbarBtn>

            <div className="w-px h-4 bg-gray-300 mx-1.5" />

            {/* Blockquote */}
            <ToolbarBtn onClick={() => execCommand('formatBlock', 'blockquote')} title="Quote">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </ToolbarBtn>

            {/* Strikethrough */}
            <ToolbarBtn onClick={() => execCommand('strikeThrough')} title="Strikethrough">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 15l6-6m-6 6l6 6M3 12h18" />
            </ToolbarBtn>
          </div>

          {/* Content Editable Area */}
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={(e) => setBody((e.target as HTMLElement).innerHTML)}
            className="flex-1 text-sm text-gray-700 outline-none leading-relaxed min-h-[220px]"
            data-placeholder="Type Your Reply..."
            id="email-body"
            style={{ caretColor: '#22C55E' }}
          />

          {/* Attachments Preview Section at Bottom (Matching tennis player picture in screenshots) */}
          {attachments.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-200/80 flex items-center gap-4 flex-wrap">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="relative group rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm w-48 h-32 flex-shrink-0 animate-in fade-in zoom-in-95 duration-150"
                >
                  {att.type.startsWith('image/') || att.url.includes('http') ? (
                    <img src={att.url} alt={att.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-gray-50">
                      <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-xs font-medium text-gray-700 truncate w-full px-1">{att.name}</span>
                    </div>
                  )}

                  {/* Remove Button Overlay */}
                  <button
                    type="button"
                    onClick={() => removeAttachment(att.id)}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80 text-sm font-bold cursor-pointer"
                    title="Remove attachment"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Toolbar Button Helper ────────────────────────────────────────────────────────
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
      type="button"
      onClick={onClick}
      title={title}
      className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200/60 rounded transition-colors w-7 h-7 flex items-center justify-center cursor-pointer"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {children}
      </svg>
    </button>
  );
}

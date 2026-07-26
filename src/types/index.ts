// ─── API Response Types ───────────────────────────────────────────────────────

export type EmailStatus =
  | 'scheduled'
  | 'processing'
  | 'sent'
  | 'failed'
  | 'rate_limited'
  | 'cancelled';

export interface EmailJob {
  id: string;
  batchId: string;
  toEmail: string;
  fromEmail: string;
  fromName: string;
  subject: string;
  body: string;
  status: EmailStatus;
  scheduledAt: string;
  sentAt: string | null;
  failedAt: string | null;
  errorMessage: string | null;
  etherealPreviewUrl: string | null;
  isStarred: boolean;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface StatsResponse {
  scheduled: number;
  sent: number;
  failed: number;
  rateLimited: number;
  total: number;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
}

// ─── Form Types ───────────────────────────────────────────────────────────────

export interface ScheduleFormData {
  fromEmail: string;
  fromName: string;
  recipients: string[];
  subject: string;
  body: string;
  scheduledStartAt: string;
  delayBetweenEmailsMs: number;
  hourlyLimit: number;
}

// ─── Navigation ───────────────────────────────────────────────────────────────

export type ActiveTab = 'scheduled' | 'sent';

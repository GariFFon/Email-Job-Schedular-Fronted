import type { EmailStatus } from '../../types';

interface StatusBadgeProps {
  status: EmailStatus;
}

const statusConfig: Record<
  EmailStatus,
  { label: string; className: string; icon: string }
> = {
  scheduled: {
    label: 'Scheduled',
    className: 'badge-scheduled',
    icon: '⏰',
  },
  processing: {
    label: 'Processing',
    className: 'badge-scheduled',
    icon: '⏳',
  },
  sent: {
    label: 'Sent',
    className: 'badge-sent',
    icon: '',
  },
  failed: {
    label: 'Failed',
    className: 'badge-failed',
    icon: '',
  },
  rate_limited: {
    label: 'Rate Limited',
    className: 'badge-rate-limited',
    icon: '⏱',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'badge-failed',
    icon: '',
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] ?? statusConfig.scheduled;
  return (
    <span className={config.className}>
      {config.icon && <span>{config.icon}</span>}
      {config.label}
    </span>
  );
}

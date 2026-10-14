import { DonationStatus } from '../types';

/**
 * Valid state transitions for the Food Donation Lifecycle:
 * Draft -> Available
 * Available -> Requested
 * Requested -> Accepted | Rejected | Cancelled
 * Accepted -> Pickup Scheduled | Cancelled
 * Pickup Scheduled -> Collected | Cancelled
 * Collected -> Distributed
 * Any active pre-collected state -> Expired (when pickup deadline passes)
 */
export const VALID_STATUS_TRANSITIONS: Record<DonationStatus, DonationStatus[]> = {
  Draft: ['Available', 'Cancelled'],
  Available: ['Requested', 'Expired', 'Cancelled'],
  Requested: ['Accepted', 'Rejected', 'Cancelled', 'Expired'],
  Accepted: ['Pickup Scheduled', 'Cancelled', 'Expired'],
  'Pickup Scheduled': ['Collected', 'Cancelled', 'Expired'],
  Collected: ['Distributed'],
  Distributed: [], // Terminal state
  Expired: [], // Terminal state
  Cancelled: [], // Terminal state
  Rejected: ['Available'], // Can be returned to pool if rejection was due to NGO scheduling
};

export function canTransition(current: DonationStatus, next: DonationStatus): boolean {
  return VALID_STATUS_TRANSITIONS[current]?.includes(next) ?? false;
}

export const LIFECYCLE_STEPS: DonationStatus[] = [
  'Available',
  'Requested',
  'Accepted',
  'Pickup Scheduled',
  'Collected',
  'Distributed',
];

export function getStatusStepIndex(status: DonationStatus): number {
  return LIFECYCLE_STEPS.indexOf(status);
}

export function formatTimeRemaining(isoDateString: string): { text: string; isUrgent: boolean; isExpired: boolean } {
  const target = new Date(isoDateString).getTime();
  const now = new Date().getTime();
  const diffMs = target - now;

  if (diffMs <= 0) {
    return { text: 'Deadline Passed', isUrgent: true, isExpired: true };
  }

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffHours < 2) {
    return {
      text: `${diffHours > 0 ? `${diffHours}h ` : ''}${diffMins}m remaining`,
      isUrgent: true,
      isExpired: false,
    };
  }

  return {
    text: `${diffHours}h ${diffMins}m remaining`,
    isUrgent: false,
    isExpired: false,
  };
}

export function getStatusColorClass(status: DonationStatus): { bg: string; text: string; border: string } {
  switch (status) {
    case 'Available':
      return { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-300' };
    case 'Requested':
      return { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-300' };
    case 'Accepted':
      return { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-300' };
    case 'Pickup Scheduled':
      return { bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-300' };
    case 'Collected':
      return { bg: 'bg-teal-50', text: 'text-teal-800', border: 'border-teal-300' };
    case 'Distributed':
      return { bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-300' };
    case 'Expired':
      return { bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-300' };
    case 'Cancelled':
      return { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' };
    case 'Rejected':
      return { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-300' };
    case 'Draft':
    default:
      return { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };
  }
}

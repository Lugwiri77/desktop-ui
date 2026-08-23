'use client';

import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { Inbox, UserCheck, Users, CheckCircle2 } from 'lucide-react';
import { listThreads, SupportStatus, SupportThread } from '@/lib/support-api';

/**
 * Which slice of the inbox is on screen.
 *
 * `unassigned` is the queue to pick work from — an unassigned thread is `open` with no
 * agent, not a distinct status. `mine` and `all` are the other two views an agent
 * actually switches between; anything finer is a filter, not a tab.
 */
export type QueueView = 'unassigned' | 'mine' | 'all';

const VIEWS: { id: QueueView; label: string; icon: typeof Inbox }[] = [
  { id: 'unassigned', label: 'Unassigned', icon: Inbox },
  { id: 'mine', label: 'Mine', icon: UserCheck },
  { id: 'all', label: 'All', icon: Users },
];

const STATUS_STYLE: Record<SupportStatus, string> = {
  open: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
  // Amber rather than green: pending means we are waiting on the customer, so it needs
  // no action from us but should not read as "handled" either.
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  resolved: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-500/15 dark:text-zinc-300',
  closed: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-500/10 dark:text-zinc-400',
};

interface Props {
  view: QueueView;
  onViewChange: (v: QueueView) => void;
  selectedRoomId: string | null;
  onSelect: (thread: SupportThread) => void;
}

export default function ThreadQueue({ view, onViewChange, selectedRoomId, onSelect }: Props) {
  const { data: threads = [], isLoading, error } = useQuery({
    queryKey: ['supportThreads', view],
    queryFn: () =>
      listThreads(
        view === 'unassigned' ? { unassigned: true } :
        view === 'mine' ? { assignedToMe: true } :
        {}
      ),
    // Polled rather than pushed. The WebSocket delivers new *messages* into the open
    // thread, but assignment and status changes made by colleagues have no event yet, so
    // the queue would otherwise go stale during a shift.
    refetchInterval: 15_000,
  });

  return (
    <div className="flex h-full w-80 shrink-0 flex-col border-r border-zinc-200 dark:border-zinc-800">
      <div className="flex gap-1 border-b border-zinc-200 p-2 dark:border-zinc-800">
        {VIEWS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onViewChange(id)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium transition ${
              view === id
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <p className="p-4 text-sm text-zinc-500">Loading threads…</p>
        )}

        {error && (
          <p className="p-4 text-sm text-red-600">
            Could not load the queue. {(error as Error).message}
          </p>
        )}

        {!isLoading && !error && threads.length === 0 && (
          <div className="flex flex-col items-center gap-2 p-8 text-center">
            <CheckCircle2 className="h-10 w-10 text-zinc-300 dark:text-zinc-700" />
            <p className="text-sm text-zinc-500">
              {view === 'unassigned' ? 'Nothing waiting to be picked up.'
                : view === 'mine' ? 'No threads assigned to you.'
                : 'No support threads yet.'}
            </p>
          </div>
        )}

        {threads.map((t) => (
          <button
            key={t.room_id}
            onClick={() => onSelect(t)}
            className={`w-full border-b border-zinc-100 p-3 text-left transition dark:border-zinc-800/60 ${
              selectedRoomId === t.room_id
                ? 'bg-zinc-100 dark:bg-zinc-800'
                : 'hover:bg-zinc-50 dark:hover:bg-zinc-900'
            }`}
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="truncate text-sm font-semibold text-zinc-900 dark:text-white">
                {t.customer_name || 'Customer'}
              </span>
              <span className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium ${STATUS_STYLE[t.status]}`}>
                {t.status}
              </span>
            </div>

            <p className="mt-0.5 truncate text-sm text-zinc-600 dark:text-zinc-400">
              {t.subject}
            </p>

            <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-zinc-500">
              <span className="truncate">
                {t.assigned_agent_name
                  ? t.assigned_agent_name
                  : t.assigned_agent_id
                    // Assigned to someone whose name did not resolve — usually an agent
                    // who has since been stood down.
                    ? 'Assigned'
                    : 'Unassigned'}
              </span>
              <span className="shrink-0">
                {formatDistanceToNow(new Date(t.updated_at), { addSuffix: true })}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

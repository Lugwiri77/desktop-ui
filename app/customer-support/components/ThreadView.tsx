'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Send, UserPlus, Check, Lock, ShieldOff } from 'lucide-react';
import {
  assignThread,
  listAgents,
  listMessages,
  replyAsOrganisation,
  setThreadStatus,
  SupportStatus,
  SupportThread,
} from '@/lib/support-api';

interface Props {
  thread: SupportThread;
  /** The signed-in agent, used to tell "mine" from "someone else's". */
  currentUserId: string;
  /** Administrators may hand a thread to another agent; staff may only take it. */
  isAdmin: boolean;
  onChanged: (updated: SupportThread) => void;
}

const NEXT_STATUS: { status: SupportStatus; label: string }[] = [
  { status: 'resolved', label: 'Mark resolved' },
  { status: 'closed', label: 'Close' },
  { status: 'open', label: 'Reopen' },
];

export default function ThreadView({ thread, currentUserId, isAdmin, onChanged }: Props) {
  const qc = useQueryClient();
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showHandoff, setShowHandoff] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const isMine = thread.assigned_agent_id === currentUserId;
  // The server refuses replies from anyone but the assignee or an administrator, so the
  // composer is disabled to match rather than letting the send fail.
  const canReply = isMine || isAdmin;

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['supportMessages', thread.room_id],
    queryFn: () => listMessages(thread.room_id),
    refetchInterval: 10_000,
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['supportAgents'],
    queryFn: listAgents,
    enabled: showHandoff,
  });

  // Anchored to the newest message on load and on each arrival, which is what an agent
  // working a thread expects.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, thread.room_id]);

  const reply = useMutation({
    mutationFn: (content: string) => replyAsOrganisation(thread.room_id, content),
    onSuccess: () => {
      setDraft('');
      setError(null);
      qc.invalidateQueries({ queryKey: ['supportMessages', thread.room_id] });
      // Replying moves an open thread to pending server-side, so the queue's status
      // badge is now stale.
      qc.invalidateQueries({ queryKey: ['supportThreads'] });
    },
    onError: (e: Error) => setError(e.message),
  });

  const assign = useMutation({
    mutationFn: (agentId?: string) => assignThread(thread.room_id, agentId),
    onSuccess: (updated) => {
      setShowHandoff(false);
      setError(null);
      onChanged(updated);
      qc.invalidateQueries({ queryKey: ['supportThreads'] });
    },
    onError: (e: Error) => setError(e.message),
  });

  const changeStatus = useMutation({
    mutationFn: (status: SupportStatus) => setThreadStatus(thread.room_id, status),
    onSuccess: (updated) => {
      setError(null);
      onChanged(updated);
      qc.invalidateQueries({ queryKey: ['supportThreads'] });
    },
    onError: (e: Error) => setError(e.message),
  });

  const submit = () => {
    const body = draft.trim();
    if (body) reply.mutate(body);
  };

  return (
    <div className="flex h-full flex-1 flex-col">
      {/* Header */}
      <div className="border-b border-zinc-200 px-5 py-3 dark:border-zinc-800">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-zinc-900 dark:text-white">
              {thread.customer_name || 'Customer'}
            </h2>
            <p className="truncate text-sm text-zinc-500">{thread.subject}</p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {!thread.assigned_agent_id && (
              <button
                onClick={() => assign.mutate(undefined)}
                disabled={assign.isPending}
                className="flex items-center gap-1.5 rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-zinc-900"
              >
                <Check className="h-4 w-4" />
                Take
              </button>
            )}

            {isAdmin && (
              <button
                onClick={() => setShowHandoff((v) => !v)}
                className="flex items-center gap-1.5 rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
              >
                <UserPlus className="h-4 w-4" />
                {thread.assigned_agent_id ? 'Hand off' : 'Assign'}
              </button>
            )}

            {NEXT_STATUS.filter((s) => s.status !== thread.status).map((s) => (
              <button
                key={s.status}
                onClick={() => changeStatus.mutate(s.status)}
                disabled={changeStatus.isPending}
                className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-2 flex items-center gap-3 text-xs text-zinc-500">
          <span>
            {thread.assigned_agent_name
              ? `Assigned to ${isMine ? 'you' : thread.assigned_agent_name}`
              : 'Unassigned'}
          </span>
          <span>·</span>
          <span>{thread.status}</span>
          <span>·</span>
          {/* Stated plainly rather than implied. Support threads are server-visible by
              design (§15.3) and agents should know the customer has no E2EE promise here. */}
          <span className="flex items-center gap-1">
            <ShieldOff className="h-3.5 w-3.5" />
            Not end-to-end encrypted
          </span>
        </div>

        {showHandoff && (
          <div className="mt-3 rounded-md border border-zinc-200 p-2 dark:border-zinc-800">
            <p className="mb-2 text-xs font-medium text-zinc-500">Assign to</p>
            <div className="flex flex-wrap gap-2">
              {agents.filter((a) => a.is_active).map((a) => (
                <button
                  key={a.agent_id}
                  onClick={() => assign.mutate(a.agent_id)}
                  disabled={assign.isPending || a.agent_id === thread.assigned_agent_id}
                  className="rounded border border-zinc-300 px-2 py-1 text-sm disabled:opacity-40 dark:border-zinc-700"
                >
                  {a.agent_name || a.agent_id.slice(0, 8)}
                </button>
              ))}
              {agents.filter((a) => a.is_active).length === 0 && (
                <p className="text-sm text-zinc-500">
                  Nobody is assigned to this desk yet.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* History */}
      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {isLoading && <p className="text-sm text-zinc-500">Loading conversation…</p>}

        {!isLoading && messages.length === 0 && (
          <p className="text-sm text-zinc-500">
            No messages yet. The customer opened this thread but has not written.
          </p>
        )}

        {messages.map((m) => {
          // Anything carrying an agent id came from our side, whoever wrote it. Falling
          // back to sender_id would misattribute after a handoff, since the sender is
          // always the organisation.
          const fromUs = !!m.sender_agent_id || m.sender_type?.toLowerCase() !== 'personal';
          return (
            <div key={m.id} className={`flex ${fromUs ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] rounded-lg px-3 py-2 ${
                fromUs
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                  : 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white'
              }`}>
                <p className="whitespace-pre-wrap text-sm">{m.content ?? ''}</p>
                <p className={`mt-1 text-[11px] ${fromUs ? 'opacity-60' : 'text-zinc-500'}`}>
                  {format(new Date(m.sent_at), 'HH:mm')}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">
        {error && <p className="mb-2 text-sm text-red-600">{error}</p>}

        {!canReply ? (
          <div className="flex items-center gap-2 rounded-md bg-zinc-50 px-3 py-2.5 text-sm text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
            <Lock className="h-4 w-4 shrink-0" />
            Take this thread before replying to it.
          </div>
        ) : (
          <div className="flex items-end gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                // Enter sends, Shift+Enter breaks the line — the convention agents will
                // already have from every other chat tool.
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              rows={2}
              placeholder={`Reply as ${thread.customer_name ? 'your organisation' : 'the organisation'}…`}
              className="flex-1 resize-none rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            />
            <button
              onClick={submit}
              disabled={reply.isPending || !draft.trim()}
              className="flex items-center gap-1.5 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-zinc-900"
            >
              <Send className="h-4 w-4" />
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

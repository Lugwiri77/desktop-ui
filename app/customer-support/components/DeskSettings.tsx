'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, AlertTriangle, UserMinus, UserPlus } from 'lucide-react';
import { addAgent, getDesk, listAgents, removeAgent, setOwnBreak, updateDesk, SupportAccessPolicy } from '@/lib/support-api';
import { useStaffList } from '@/lib/hooks/use-cached-api';
import { useSupportAccess } from '@/lib/hooks/use-support-access';

interface Props {
  organizationId: string;
  /** Organisation administrator. Implies canManage. */
  isAdmin: boolean;
  /** The signed-in user, so they can put themselves on the desk and set their own break. */
  currentUserId: string;
}

/** A row from /auth/staff — only the fields the picker needs. */
interface StaffOption {
  id: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  department?: string;
  designation?: string;
  is_active?: boolean;
}

export default function DeskSettings({ organizationId, isAdmin, currentUserId }: Props) {
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [staffQuery, setStaffQuery] = useState('');
  const [grantManage, setGrantManage] = useState(false);

  // An administrator, or a staff member they have delegated to. A plain agent sees only
  // their own availability — none of the desk-wide controls.
  const { canManage, me } = useSupportAccess(currentUserId, isAdmin);

  const { data: desk } = useQuery({
    queryKey: ['supportDesk', organizationId],
    queryFn: () => getDesk(organizationId),
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['supportAgents'],
    queryFn: listAgents,
  });

  // The organisation's own staff, so agents are chosen by name rather than pasted as an
  // id. Reuses the app's existing cached hook rather than adding a second staff fetch.
  const { data: staffResponse } = useStaffList();
  const staff: StaffOption[] = staffResponse?.staff ?? [];

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['supportDesk', organizationId] });
    qc.invalidateQueries({ queryKey: ['supportAgents'] });
  };

  const toggle = useMutation({
    mutationFn: (enabled: boolean) => updateDesk({ is_enabled: enabled }),
    onSuccess: () => { setError(null); refresh(); },
    onError: (e: Error) => setError(e.message),
  });

  const breakToggle = useMutation({
    mutationFn: (onBreak: boolean) => setOwnBreak(onBreak),
    onSuccess: () => { setError(null); refresh(); },
    onError: (e: Error) => setError(e.message),
  });

  const add = useMutation({
    mutationFn: (id: string) => addAgent(id, grantManage),
    onSuccess: () => { setStaffQuery(''); setError(null); refresh(); },
    onError: (e: Error) => setError(e.message),
  });

  const setPolicy = useMutation({
    mutationFn: (policy: SupportAccessPolicy) => updateDesk({ access_policy: policy }),
    onSuccess: () => { setError(null); refresh(); },
    onError: (e: Error) => setError(e.message),
  });

  const standDown = useMutation({
    mutationFn: (id: string) => removeAgent(id),
    onSuccess: () => { setError(null); refresh(); },
    onError: (e: Error) => setError(e.message),
  });

  if (!desk) return <p className="p-6 text-sm text-zinc-500">Loading desk…</p>;

  const active = agents.filter((a) => a.is_active);
  const assignedIds = new Set(active.map((a) => a.agent_id));
  const selfAssigned = assignedIds.has(currentUserId);

  const staffLabel = (s: StaffOption) =>
    [s.first_name, s.last_name].filter(Boolean).join(' ') || s.username || s.id;

  // Everyone not already on the desk, matching the typed text.
  //
  // Inactive staff are listed but not selectable. Filtering them out silently is what
  // made a newly created colleague look absent: they are returned by /auth/staff with
  // is_active = false until they have signed in, so hiding them gave no clue why.
  // Assigning one anyway would be worse — they cannot log in, so the desk would report
  // itself staffed with nobody able to answer.
  const candidates = staff
    .filter((s) => !assignedIds.has(s.id))
    .filter((s) => {
      const q = staffQuery.trim().toLowerCase();
      if (!q) return true;
      return staffLabel(s).toLowerCase().includes(q)
        || (s.username ?? '').toLowerCase().includes(q)
        || (s.department ?? '').toLowerCase().includes(q);
    })
    .slice(0, 10);

  return (
    <div className="max-w-2xl space-y-6 p-6">
      {/* Contactability. Two conditions, shown separately, because an org that has
          switched support on but assigned nobody is the confusing case and deserves to
          be told exactly what is missing. */}
      <div className={`flex items-start gap-3 rounded-lg border p-4 ${
        desk.accepting_threads
          ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10'
          : 'border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10'
      }`}>
        {desk.accepting_threads
          ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          : <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />}
        <div className="text-sm">
          <p className="font-medium text-zinc-900 dark:text-white">
            {desk.accepting_threads
              ? 'Customers can reach you'
              : 'Customers cannot reach you yet'}
          </p>
          <p className="mt-0.5 text-zinc-600 dark:text-zinc-300">
            {desk.accepting_threads
              ? `Support is on and ${desk.active_agent_count} ${desk.active_agent_count === 1 ? 'person is' : 'people are'} assigned.`
              : !desk.is_enabled
                ? 'Support chat is switched off.'
                : 'Support is on, but nobody is assigned to answer. Assign at least one person below.'}
          </p>
        </div>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </p>
      )}

      {/* Availability. Shown to anyone on the desk, managers included.
          Worth being precise about what this does: nothing routes threads to an
          individual — they are picked from a shared queue — so a break does not hold
          anything up. It tells colleagues and the administrator that you have stepped
          away, and it is what auto-assignment would skip if that is ever added. */}
      {me && (
        <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-white">
              {me.is_on_break ? 'You are on a break' : 'You are at the desk'}
            </p>
            <p className="text-sm text-zinc-500">
              {me.is_on_break
                ? 'Colleagues and your administrator can see you have stepped away.'
                : 'Threads are picked from the shared queue, so a break holds nothing up.'}
            </p>
          </div>
          <button
            onClick={() => breakToggle.mutate(!me.is_on_break)}
            disabled={breakToggle.isPending}
            className={`shrink-0 rounded-md px-3 py-1.5 text-sm font-medium disabled:opacity-50 ${
              me.is_on_break
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                : 'border border-zinc-300 text-zinc-700 dark:border-zinc-700 dark:text-zinc-200'
            }`}
          >
            {me.is_on_break ? 'Back to the desk' : 'Take a break'}
          </button>
        </div>
      )}

      {/* Desk-wide configuration. Hidden entirely, not merely disabled, for agents who
          cannot change it — a greyed-out "Turn off support" is noise to someone whose job
          is answering threads. */}
      {!canManage ? (
        <p className="text-sm text-zinc-500">
          Your administrator manages this desk&apos;s settings.
        </p>
      ) : (
      <>
      {/* Enable */}
      <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <div>
          <p className="text-sm font-medium text-zinc-900 dark:text-white">Support chat</p>
          <p className="text-sm text-zinc-500">
            Lets customers open a conversation with your organisation.
          </p>
        </div>
        <button
          onClick={() => toggle.mutate(!desk.is_enabled)}
          disabled={toggle.isPending}
          className={`rounded-md px-3 py-1.5 text-sm font-medium disabled:opacity-50 ${
            desk.is_enabled
              ? 'border border-zinc-300 text-zinc-700 dark:border-zinc-700 dark:text-zinc-200'
              : 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
          }`}
        >
          {desk.is_enabled ? 'Turn off' : 'Turn on'}
        </button>
      </div>

      {/* Who may open a thread. Presented as two named choices rather than a switch,
          because "anyone" and "existing customers only" are both legitimate defaults
          depending on the organisation — a shop wants the first, a school the second. */}
      <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <p className="text-sm font-medium text-zinc-900 dark:text-white">Who can contact you</p>
        <div className="mt-3 space-y-2">
          {([
            {
              value: 'anyone' as SupportAccessPolicy,
              title: 'Anyone',
              blurb: 'Any Spreang user can start a conversation with you.',
            },
            {
              value: 'connected_only' as SupportAccessPolicy,
              title: 'Existing customers only',
              blurb: 'Enrolled students, tenants of your properties, and anyone you have already replied to.',
            },
          ]).map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPolicy.mutate(opt.value)}
              disabled={setPolicy.isPending}
              className={`flex w-full items-start gap-3 rounded-md border p-3 text-left disabled:opacity-60 ${
                desk.access_policy === opt.value
                  ? 'border-zinc-900 bg-zinc-50 dark:border-white dark:bg-zinc-800'
                  : 'border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900'
              }`}
            >
              <span className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 ${
                desk.access_policy === opt.value
                  ? 'border-zinc-900 bg-zinc-900 dark:border-white dark:bg-white'
                  : 'border-zinc-300 dark:border-zinc-600'
              }`} />
              <span className="min-w-0">
                <span className="block text-sm font-medium text-zinc-900 dark:text-white">{opt.title}</span>
                <span className="block text-sm text-zinc-500">{opt.blurb}</span>
              </span>
            </button>
          ))}
        </div>

        {/* Said before it bites, not after. The check fails closed, so an organisation
            that keeps no student or tenant records will lock everyone out. */}
        {desk.access_policy === 'connected_only' && (
          <p className="mt-3 flex items-start gap-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              If we hold no student, tenant or prior-conversation record for someone, they
              cannot reach you at all. Choose “Anyone” if you want new enquiries.
            </span>
          </p>
        )}
      </div>

      {/* Agents */}
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800">
        <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <p className="text-sm font-medium text-zinc-900 dark:text-white">
            Assigned to support ({active.length})
          </p>
          <p className="text-sm text-zinc-500">
            Administrators and staff of your organisation.
          </p>
        </div>

        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
          {agents.length === 0 && (
            <li className="px-4 py-3 text-sm text-zinc-500">Nobody assigned yet.</li>
          )}
          {agents.map((a) => (
            <li key={a.agent_id} className="flex items-center justify-between px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm text-zinc-900 dark:text-white">
                  {a.agent_name || a.agent_id}
                </p>
                <p className="text-xs text-zinc-500">
                  {a.agent_type.replace('_', ' ')}
                  {/* Stood-down agents stay listed: their past threads still resolve to
                      their name, and re-assigning them is a single click. */}
                  {!a.is_active && ' · stood down'}
                </p>
              </div>
              {canManage && (
                a.is_active ? (
                  <button
                    onClick={() => standDown.mutate(a.agent_id)}
                    disabled={standDown.isPending}
                    className="flex items-center gap-1.5 rounded-md border border-zinc-300 px-2.5 py-1 text-sm text-zinc-700 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200"
                  >
                    <UserMinus className="h-3.5 w-3.5" />
                    Stand down
                  </button>
                ) : (
                  <button
                    onClick={() => add.mutate(a.agent_id)}
                    disabled={add.isPending}
                    className="flex items-center gap-1.5 rounded-md border border-zinc-300 px-2.5 py-1 text-sm text-zinc-700 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    Reassign
                  </button>
                )
              )}
            </li>
          ))}
        </ul>

        {canManage && (
          <div className="space-y-3 border-t border-zinc-200 p-4 dark:border-zinc-800">
            {/* Self-assign is its own button because "put me on the desk" is the fastest
                way to make an enabled desk contactable, and it does not depend on the
                administrator appearing in the staff directory. */}
            {!selfAssigned && (
              <button
                onClick={() => add.mutate(currentUserId)}
                disabled={add.isPending}
                className="flex w-full items-center justify-center gap-1.5 rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-zinc-900"
              >
                <UserPlus className="h-4 w-4" />
                Handle support myself
              </button>
            )}

            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">
                Add a staff member
              </label>
              <input
                value={staffQuery}
                onChange={(e) => setStaffQuery(e.target.value)}
                placeholder="Search your staff by name, username or department"
                className="w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
              />

              {/* Only an administrator may delegate this on; a delegated staff member
                  cannot mint further managers, which stops the permission spreading
                  sideways without the administrator knowing. */}
              {isAdmin && (
                <label className="mt-2 flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                  <input
                    type="checkbox"
                    checked={grantManage}
                    onChange={(e) => setGrantManage(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span>
                    Let them run the desk — turn support on or off, change who can contact
                    you, and assign other staff.
                  </span>
                </label>
              )}

              <ul className="mt-2 space-y-1">
                {candidates.map((s) => {
                  const inactive = s.is_active === false;
                  return (
                    <li key={s.id}>
                      <button
                        onClick={() => !inactive && add.mutate(s.id)}
                        disabled={add.isPending || inactive}
                        title={inactive ? 'This person has not activated their account yet' : undefined}
                        className="flex w-full items-center justify-between gap-2 rounded-md border border-zinc-200 px-3 py-2 text-left text-sm hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent dark:border-zinc-800 dark:hover:bg-zinc-900"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-zinc-900 dark:text-white">
                            {staffLabel(s)}
                          </span>
                          <span className="block truncate text-xs text-zinc-500">
                            {inactive
                              ? 'Not activated yet — they must sign in first'
                              : [s.designation, s.department].filter(Boolean).join(' · ') || s.username}
                          </span>
                        </span>
                        {!inactive && <UserPlus className="h-4 w-4 shrink-0 text-zinc-400" />}
                      </button>
                    </li>
                  );
                })}

                {candidates.length === 0 && (
                  <li className="px-1 py-2 text-sm text-zinc-500">
                    {staff.length === 0
                      ? 'No staff records found for this organisation.'
                      : staffQuery.trim()
                        ? 'No staff match that search.'
                        : 'Everyone is already assigned.'}
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}
      </div>
      </>
      )}
    </div>
  );
}

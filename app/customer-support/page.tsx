'use client';

/**
 * Customer support console (§15).
 *
 * Desktop-only by design: triaging a queue of threads is a desk job, and mobile carries
 * only the customer side of the same conversation.
 *
 * A "channel" here is not one room — it is the set of per-customer `customer_support`
 * rooms this organisation has. Each row in the queue is one customer's thread.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessagesSquare, Settings } from 'lucide-react';
import { ApplicationLayout } from '../components/application-layout';
import { Heading } from '../components/heading';
import { isAuthenticated } from '@/lib/api';
import { loadUserInfo, getUserRoleDisplayName, isAdministrator, UserInfo } from '@/lib/roles';
import { createLayoutUserInfo } from '@/lib/layout-utils';
import { SupportThread } from '@/lib/support-api';
import { useSupportAccess } from '@/lib/hooks/use-support-access';
import ThreadQueue, { QueueView } from './components/ThreadQueue';
import ThreadView from './components/ThreadView';
import DeskSettings from './components/DeskSettings';

type Tab = 'inbox' | 'settings';

export default function CustomerSupportPage() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [tab, setTab] = useState<Tab>('inbox');
  const [view, setView] = useState<QueueView>('unassigned');
  const [selected, setSelected] = useState<SupportThread | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    const info = loadUserInfo();
    if (!info) {
      router.push('/login');
      return;
    }
    setUserInfo(info);
  }, [router]);

  if (!userInfo) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-sm text-zinc-500">Loading…</p>
      </div>
    );
  }

  const isAdmin = isAdministrator(userInfo.userRole);

  // Every support endpoint resolves the organisation from the caller's own staff record,
  // so a missing organizationId means this account is not attached to one — there is no
  // desk to show and no sensible fallback.
  if (!userInfo.organizationId) {
    return (
      <ApplicationLayout
        userInfo={createLayoutUserInfo(userInfo)}
        onLogout={() => { localStorage.clear(); router.push('/login'); }}
        roleDisplayName={getUserRoleDisplayName(userInfo.userRole)}
        isAdmin={isAdmin}
      >
        <Heading>Customer Support</Heading>
        <p className="mt-3 text-sm text-zinc-500">
          This account is not linked to an organisation, so it has no support desk.
        </p>
      </ApplicationLayout>
    );
  }

  return (
    <ApplicationLayout
      userInfo={createLayoutUserInfo(userInfo)}
      onLogout={() => { localStorage.clear(); router.push('/login'); }}
      roleDisplayName={getUserRoleDisplayName(userInfo.userRole)}
      isAdmin={isAdmin}
    >
      <SupportConsole userInfo={userInfo} isAdmin={isAdmin} tab={tab} setTab={setTab}
                      view={view} setView={setView} selected={selected} setSelected={setSelected} />
    </ApplicationLayout>
  );
}

/**
 * Split from the page so the access check runs inside the layout, which is what renders
 * the sidebar the check also drives.
 */
function SupportConsole({ userInfo, isAdmin, tab, setTab, view, setView, selected, setSelected }: {
  userInfo: UserInfo;
  isAdmin: boolean;
  tab: Tab;
  setTab: (t: Tab) => void;
  view: QueueView;
  setView: (v: QueueView) => void;
  selected: SupportThread | null;
  setSelected: (t: SupportThread | null) => void;
}) {
  const { isAgent, isLoading } = useSupportAccess(userInfo.userId, isAdmin);

  if (isLoading) {
    return <p className="text-sm text-zinc-500">Loading…</p>;
  }

  // Reached by URL rather than the menu, which is hidden for them. Says who to ask
  // rather than just refusing.
  if (!isAgent) {
    return (
      <>
        <Heading>Customer Support</Heading>
        <p className="mt-3 max-w-prose text-sm text-zinc-500">
          You have not been assigned to handle customer support. An administrator at{' '}
          {userInfo.organizationName ?? 'your organisation'} can add you to the support desk.
        </p>
      </>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <Heading>Customer Support</Heading>
        <div className="flex gap-1">
          <button
            onClick={() => setTab('inbox')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium ${
              tab === 'inbox'
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
            }`}
          >
            <MessagesSquare className="h-4 w-4" />
            Inbox
          </button>
          <button
            onClick={() => setTab('settings')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium ${
              tab === 'settings'
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
            }`}
          >
            <Settings className="h-4 w-4" />
            Desk
          </button>
        </div>
      </div>

      {tab === 'settings' ? (
        <DeskSettings organizationId={userInfo.organizationId!} isAdmin={isAdmin} currentUserId={userInfo.userId} />
      ) : (
        <div className="mt-4 flex h-[calc(100vh-12rem)] overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
          <ThreadQueue
            view={view}
            onViewChange={setView}
            selectedRoomId={selected?.room_id ?? null}
            onSelect={setSelected}
          />

          {selected ? (
            <ThreadView
              // Keyed by room so switching threads remounts rather than carrying the
              // previous draft and scroll position across.
              key={selected.room_id}
              thread={selected}
              currentUserId={userInfo.userId}
              isAdmin={isAdmin}
              onChanged={setSelected}
            />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
              <MessagesSquare className="h-10 w-10 text-zinc-300 dark:text-zinc-700" />
              <p className="text-sm text-zinc-500">Select a thread to read it.</p>
            </div>
          )}
        </div>
      )}
    </>
  );
}

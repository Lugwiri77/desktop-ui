/**
 * Customer Support Desk & Threads (REST)
 *
 * Backend: backend/src/spreang_chat/support_threads.rs, documented in
 * backend/SPREANG_CHAT_DOCUMENTATION.md §15.
 *
 * Unlike groups-api.ts this is REST rather than GraphQL, because the support endpoints
 * live in the chat module alongside the room and message routes it has to interoperate
 * with.
 *
 * Model worth understanding before touching this: a support "channel" is not a room. It
 * is the set of `customer_support` rooms an organisation has, one per customer. Privacy
 * comes from room membership, so a thread is just a room that the customer and the
 * organisation both participate in.
 *
 * Reading history therefore uses the ordinary message endpoint, but *replying* does not —
 * see replyAsOrganisation below for why.
 */

import { get, post, patch, del } from './api';

const BASE = '/api/spreang-chat';

// ============================================================================
// TYPES
// ============================================================================

/**
 * `pending` means awaiting the *customer*, not awaiting assignment. An unassigned thread
 * is `open` with `assignedAgentId === null`, which is what the unassigned queue filters
 * on.
 */
export type SupportStatus = 'open' | 'pending' | 'resolved' | 'closed';

export interface SupportThread {
  room_id: string;
  subject: string;
  status: SupportStatus;
  organization_id: string;
  customer_id: string | null;
  customer_name: string | null;
  assigned_agent_id: string | null;
  assigned_agent_name: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Who may open a thread (§15.8).
 *
 * `connected_only` is enforced against relationship records the platform actually holds —
 * enrolled students, tenants of a property the business owns, and anyone the organisation
 * has already corresponded with. It fails CLOSED: an organisation with no such records
 * admits nobody, which is why the UI warns before enabling it.
 */
export type SupportAccessPolicy = 'anyone' | 'connected_only';

export interface SupportDesk {
  organization_id: string;
  organization_type: string;
  is_enabled: boolean;
  display_name: string | null;
  greeting: string | null;
  access_policy: SupportAccessPolicy;
  /**
   * Derived server-side as `is_enabled AND at least one active agent`. Never stored — an
   * enabled desk with nobody assigned cannot serve anyone, so this is the flag that
   * decides whether customers can reach us.
   */
  accepting_threads: boolean;
  active_agent_count: number;
}

export interface SupportAgent {
  agent_id: string;
  agent_type: string;
  agent_name: string | null;
  is_active: boolean;
  /** Delegated desk management: may turn support on, set the policy, assign others. */
  can_manage_agents: boolean;
  /**
   * Availability, not access. Nothing routes work to an agent automatically — threads are
   * picked from a queue — so a break strands nothing. It tells the administrator who is
   * actually at the desk.
   */
  is_on_break: boolean;
}

export interface ThreadFilter {
  status?: SupportStatus;
  /** Only threads assigned to the calling agent. */
  assignedToMe?: boolean;
  /** Only threads with no agent yet — the queue to pick work from. */
  unassigned?: boolean;
}

// ============================================================================
// THREADS
// ============================================================================

/**
 * The organisation's inbox.
 *
 * The same endpoint serves customers their own threads; which one you get depends on the
 * caller's role, not on a parameter.
 */
export async function listThreads(filter: ThreadFilter = {}): Promise<SupportThread[]> {
  const params = new URLSearchParams();
  if (filter.status) params.set('status', filter.status);
  if (filter.assignedToMe) params.set('assigned_to_me', 'true');
  if (filter.unassigned) params.set('unassigned', 'true');

  const qs = params.toString();
  const res = await get<{ threads: SupportThread[] }>(
    `${BASE}/support-threads${qs ? `?${qs}` : ''}`
  );
  return res.threads ?? [];
}

/**
 * Takes a thread, or hands it to someone else.
 *
 * Omitting `agentId` self-assigns, which is the common case. Handing a thread to another
 * person is administrator-only server-side, so a staff agent cannot offload their queue.
 */
export async function assignThread(roomId: string, agentId?: string): Promise<SupportThread> {
  return post<SupportThread>(`${BASE}/support-threads/${roomId}/assign`, agentId ? { agent_id: agentId } : {});
}

/**
 * Moves a thread through its lifecycle.
 *
 * Reopening a resolved thread is allowed, so a customer coming back keeps their history
 * rather than starting a second thread.
 */
export async function setThreadStatus(roomId: string, status: SupportStatus): Promise<SupportThread> {
  return patch<SupportThread>(`${BASE}/support-threads/${roomId}/status`, { status });
}

// ============================================================================
// DESK
// ============================================================================

export async function getDesk(organizationId: string): Promise<SupportDesk> {
  return get<SupportDesk>(`${BASE}/support-desks/${organizationId}`);
}

/** Partial update: omitted fields are left as they are. Administrators only. */
export async function updateDesk(changes: {
  is_enabled?: boolean;
  display_name?: string;
  greeting?: string;
  access_policy?: SupportAccessPolicy;
}): Promise<SupportDesk> {
  return patch<SupportDesk>(`${BASE}/support-desks`, changes);
}

export async function listAgents(): Promise<SupportAgent[]> {
  const res = await get<{ agents: SupportAgent[] }>(`${BASE}/support-desks/agents`);
  return res.agents ?? [];
}

/**
 * Assigning the first agent is what makes an enabled desk contactable.
 *
 * `canManageAgents` delegates desk management — turning support on, the access policy, and
 * assigning others — without making the person an administrator of the organisation.
 */
export async function addAgent(agentId: string, canManageAgents = false): Promise<SupportAgent[]> {
  const res = await post<{ agents: SupportAgent[] }>(`${BASE}/support-desks/agents`, {
    agent_id: agentId,
    can_manage_agents: canManageAgents,
  });
  return res.agents ?? [];
}

/** Marks the signed-in agent away from the desk, or back. Self-service. */
export async function setOwnBreak(onBreak: boolean): Promise<SupportAgent[]> {
  const res = await post<{ agents: SupportAgent[] }>(`${BASE}/support-desks/agents/me/break`, {
    on_break: onBreak,
  });
  return res.agents ?? [];
}

/**
 * Stands an agent down.
 *
 * Deactivates rather than deletes, so threads they handled still resolve to a name. Their
 * open threads keep their assignment and show up as needing reassignment.
 */
export async function removeAgent(agentId: string): Promise<SupportAgent[]> {
  const res = await del<{ agents: SupportAgent[] }>(`${BASE}/support-desks/agents/${agentId}`);
  return res.agents ?? [];
}

// ============================================================================
// MESSAGES
// ============================================================================
//
// A thread is a room, so these are the ordinary chat endpoints. Nothing
// support-specific: support threads are deliberately not end-to-end encrypted (§15.3),
// so unlike personal groups the plaintext is on the server and no client-side
// decryption is involved.

export interface ThreadMessage {
  id: string;
  room_id: string;
  sender_id: string;
  sender_type: string;
  content: string | null;
  sender_name?: string | null;
  sender_agent_id?: string | null;
  sent_at: string;
}

export async function listMessages(roomId: string, limit = 50): Promise<ThreadMessage[]> {
  const res = await get<any>(`${BASE}/rooms/${roomId}/messages/paginated?limit=${limit}`);
  // The paginated endpoint has grown a couple of envelope shapes over time; accept
  // either rather than breaking when it is called from a new surface.
  const raw = res?.messages ?? res?.data ?? res ?? [];
  return Array.isArray(raw) ? raw : [];
}

/**
 * Replies as the organisation.
 *
 * Deliberately not the generic `POST /messages`. Two reasons, both server-side: that
 * endpoint checks room *participation* and the participant is the organisation rather
 * than the agent, so it refuses agents outright; and the row has to record the
 * organisation as sender with the agent noted separately, so a handoff does not change
 * who the customer appears to be talking to.
 *
 * Replying also moves an `open` thread to `pending` — the ball is now with the customer.
 */
export async function replyAsOrganisation(roomId: string, content: string): Promise<{ message: ThreadMessage }> {
  return post<{ message: ThreadMessage }>(`${BASE}/support-threads/${roomId}/reply`, { content });
}

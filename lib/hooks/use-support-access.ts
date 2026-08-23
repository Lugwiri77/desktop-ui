'use client';

import { useQuery } from '@tanstack/react-query';
import { listAgents, SupportAgent } from '@/lib/support-api';

/**
 * What the signed-in user may do with the support desk (§15.9).
 *
 * Three distinct answers, not one flag:
 *
 *   isAgent     may read customer conversations at all
 *   canManage   may turn support on, set the access policy, assign or stand down agents
 *   me          their own agent row, which carries their break state
 *
 * Employment is not enough for any of them. An administrator is an agent implicitly —
 * they are accountable for the desk — but a staff member has to be put on it, otherwise a
 * caretaker could read the complaints queue.
 *
 * The server is authoritative; this only decides what to render. Every endpoint re-checks.
 */
export function useSupportAccess(userId: string | undefined, isAdmin: boolean) {
  const query = useQuery({
    queryKey: ['supportAgents'],
    queryFn: listAgents,
    // 403 is the expected answer for staff who are not on the desk, so it is not worth
    // retrying — and retrying would delay hiding the menu item.
    retry: false,
    staleTime: 60_000,
  });

  const agents: SupportAgent[] = query.data ?? [];
  const me = userId ? agents.find((a) => a.agent_id === userId && a.is_active) : undefined;

  return {
    // The list request itself is the permission check: it 403s for non-agents, so data
    // arriving at all means the caller is on the desk.
    isAgent: isAdmin || (!query.isError && !!me),
    canManage: isAdmin || !!me?.can_manage_agents,
    me,
    agents,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}

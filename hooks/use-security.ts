import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import {
  // Types
  InternalSecurityStaff,
  ExternalSecurityStaff,
  SecurityCompany,
  ShiftAssignment,
  SecurityRole as SecurityRoleType,
  SecurityPermission,
  StaffActivity,
  PerformanceMetrics,
  SecurityRole,
  GateLocation,
  StaffStatus,
  ShiftStatus,
  RegistrationSource,
  // Queries
  getInternalSecurityStaff,
  getInternalSecurityStaffById,
  getExternalSecurityStaff,
  getExternalSecurityStaffById,
  getSecurityCompanies,
  getSecurityCompanyById,
  getShiftAssignments,
  getShiftAssignmentById,
  getStaffActivity,
  getPerformanceMetrics,
  getSecurityRoles,
  getAvailablePermissions,
  // Mutations
  registerExternalStaff,
  assignShift,
  bulkAssignShifts,
  updateShift,
  cancelShift,
  updateStaffRole,
  assignGate,
  updateStaffStatus,
  createSecurityRole,
  updateSecurityRole,
  deleteSecurityRole,
  RegisterExternalStaffInput,
  AssignShiftInput,
  BulkAssignShiftsInput,
  UpdateShiftInput,
  UpdateStaffRoleInput,
  AssignGateInput,
  UpdateStaffStatusInput,
  CreateRoleInput,
  UpdateRoleInput,
} from '@/lib/security-api';

// ============================================================================
// Query Keys
// ============================================================================

export const securityKeys = {
  all: ['security'] as const,

  // Internal Staff
  internalStaff: () => [...securityKeys.all, 'internal-staff'] as const,
  internalStaffList: (filters?: any) => [...securityKeys.internalStaff(), 'list', filters] as const,
  internalStaffDetail: (id: string) => [...securityKeys.internalStaff(), 'detail', id] as const,

  // External Staff
  externalStaff: () => [...securityKeys.all, 'external-staff'] as const,
  externalStaffList: (filters?: any) => [...securityKeys.externalStaff(), 'list', filters] as const,
  externalStaffDetail: (id: string) => [...securityKeys.externalStaff(), 'detail', id] as const,

  // Companies
  companies: () => [...securityKeys.all, 'companies'] as const,
  companiesList: (filters?: any) => [...securityKeys.companies(), 'list', filters] as const,
  companyDetail: (id: string) => [...securityKeys.companies(), 'detail', id] as const,

  // Shifts
  shifts: () => [...securityKeys.all, 'shifts'] as const,
  shiftsList: (filters?: any) => [...securityKeys.shifts(), 'list', filters] as const,
  shiftDetail: (id: string) => [...securityKeys.shifts(), 'detail', id] as const,

  // Activity & Performance
  activity: (staffId: string) => [...securityKeys.all, 'activity', staffId] as const,
  performance: (staffId: string, period: string) => [...securityKeys.all, 'performance', staffId, period] as const,

  // Roles & Permissions
  roles: () => [...securityKeys.all, 'roles'] as const,
  permissions: () => [...securityKeys.all, 'permissions'] as const,
};

// ============================================================================
// Internal Security Staff Hooks
// ============================================================================

export function useInternalSecurityStaff(filters?: {
  role?: SecurityRole;
  status?: StaffStatus;
  department?: string;
  searchQuery?: string;
}) {
  return useQuery({
    queryKey: securityKeys.internalStaffList(filters),
    queryFn: () => getInternalSecurityStaff(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useInternalSecurityStaffById(staffId: string, options?: Omit<UseQueryOptions<InternalSecurityStaff>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: securityKeys.internalStaffDetail(staffId),
    queryFn: () => getInternalSecurityStaffById(staffId),
    enabled: !!staffId,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

// ============================================================================
// External Security Staff Hooks
// ============================================================================

export function useExternalSecurityStaff(filters?: {
  role?: SecurityRole;
  gate?: GateLocation;
  companyId?: string;
  status?: StaffStatus;
  source?: RegistrationSource;
  searchQuery?: string;
}) {
  return useQuery({
    queryKey: securityKeys.externalStaffList(filters),
    queryFn: () => getExternalSecurityStaff(filters),
    staleTime: 5 * 60 * 1000,
  });
}

export function useExternalSecurityStaffById(staffId: string, options?: Omit<UseQueryOptions<ExternalSecurityStaff>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: securityKeys.externalStaffDetail(staffId),
    queryFn: () => getExternalSecurityStaffById(staffId),
    enabled: !!staffId,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

export function useRegisterExternalStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RegisterExternalStaffInput) => registerExternalStaff(input),
    onSuccess: () => {
      // Invalidate external staff queries
      queryClient.invalidateQueries({ queryKey: securityKeys.externalStaff() });
    },
  });
}

// ============================================================================
// Security Companies Hooks
// ============================================================================

export function useSecurityCompanies(filters?: {
  status?: StaffStatus;
  searchQuery?: string;
}) {
  return useQuery({
    queryKey: securityKeys.companiesList(filters),
    queryFn: () => getSecurityCompanies(filters),
    staleTime: 10 * 60 * 1000, // 10 minutes (companies change less frequently)
  });
}

export function useSecurityCompanyById(companyId: string, options?: Omit<UseQueryOptions<SecurityCompany>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: securityKeys.companyDetail(companyId),
    queryFn: () => getSecurityCompanyById(companyId),
    enabled: !!companyId,
    staleTime: 10 * 60 * 1000,
    ...options,
  });
}

// ============================================================================
// Shift Assignment Hooks
// ============================================================================

export function useShiftAssignments(filters?: {
  staffId?: string;
  gate?: GateLocation;
  status?: ShiftStatus;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: securityKeys.shiftsList(filters),
    queryFn: () => getShiftAssignments(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes (shifts are more time-sensitive)
    refetchOnWindowFocus: true, // Refetch when user returns to window
  });
}

export function useShiftAssignmentById(assignmentId: string, options?: Omit<UseQueryOptions<ShiftAssignment>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: securityKeys.shiftDetail(assignmentId),
    queryFn: () => getShiftAssignmentById(assignmentId),
    enabled: !!assignmentId,
    staleTime: 2 * 60 * 1000,
    ...options,
  });
}

export function useAssignShift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AssignShiftInput) => assignShift(input),
    onSuccess: () => {
      // Invalidate shift queries
      queryClient.invalidateQueries({ queryKey: securityKeys.shifts() });
      // Also invalidate staff queries as their assignments may have changed
      queryClient.invalidateQueries({ queryKey: securityKeys.externalStaff() });
      queryClient.invalidateQueries({ queryKey: securityKeys.internalStaff() });
    },
  });
}

export function useBulkAssignShifts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: BulkAssignShiftsInput) => bulkAssignShifts(input),
    onSuccess: () => {
      // Invalidate all shift and staff queries
      queryClient.invalidateQueries({ queryKey: securityKeys.shifts() });
      queryClient.invalidateQueries({ queryKey: securityKeys.externalStaff() });
      queryClient.invalidateQueries({ queryKey: securityKeys.internalStaff() });
    },
  });
}

export function useUpdateShift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateShiftInput) => updateShift(input),
    onSuccess: (_, variables) => {
      // Invalidate specific shift and lists
      queryClient.invalidateQueries({ queryKey: securityKeys.shiftDetail(variables.assignmentId) });
      queryClient.invalidateQueries({ queryKey: securityKeys.shifts() });
    },
  });
}

export function useCancelShift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ assignmentId, reason }: { assignmentId: string; reason?: string }) =>
      cancelShift(assignmentId, reason),
    onSuccess: (_, variables) => {
      // Invalidate specific shift and lists
      queryClient.invalidateQueries({ queryKey: securityKeys.shiftDetail(variables.assignmentId) });
      queryClient.invalidateQueries({ queryKey: securityKeys.shifts() });
    },
  });
}

// ============================================================================
// Staff Management Hooks
// ============================================================================

export function useUpdateStaffRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateStaffRoleInput) => updateStaffRole(input),
    onSuccess: (_, variables) => {
      // Invalidate specific staff detail and lists
      queryClient.invalidateQueries({ queryKey: securityKeys.internalStaffDetail(variables.staffId) });
      queryClient.invalidateQueries({ queryKey: securityKeys.externalStaffDetail(variables.staffId) });
      queryClient.invalidateQueries({ queryKey: securityKeys.internalStaff() });
      queryClient.invalidateQueries({ queryKey: securityKeys.externalStaff() });
    },
  });
}

export function useAssignGate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AssignGateInput) => assignGate(input),
    onSuccess: (_, variables) => {
      // Invalidate specific staff detail and lists
      queryClient.invalidateQueries({ queryKey: securityKeys.internalStaffDetail(variables.staffId) });
      queryClient.invalidateQueries({ queryKey: securityKeys.externalStaffDetail(variables.staffId) });
      queryClient.invalidateQueries({ queryKey: securityKeys.internalStaff() });
      queryClient.invalidateQueries({ queryKey: securityKeys.externalStaff() });
    },
  });
}

export function useUpdateStaffStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateStaffStatusInput) => updateStaffStatus(input),
    onSuccess: (_, variables) => {
      // Invalidate specific staff detail and lists
      queryClient.invalidateQueries({ queryKey: securityKeys.internalStaffDetail(variables.staffId) });
      queryClient.invalidateQueries({ queryKey: securityKeys.externalStaffDetail(variables.staffId) });
      queryClient.invalidateQueries({ queryKey: securityKeys.internalStaff() });
      queryClient.invalidateQueries({ queryKey: securityKeys.externalStaff() });
    },
  });
}

// ============================================================================
// Activity & Performance Hooks
// ============================================================================

export function useStaffActivity(staffId: string, limit?: number) {
  return useQuery({
    queryKey: securityKeys.activity(staffId),
    queryFn: () => getStaffActivity(staffId, limit),
    enabled: !!staffId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function usePerformanceMetrics(staffId: string, period: 'week' | 'month' | 'year') {
  return useQuery({
    queryKey: securityKeys.performance(staffId, period),
    queryFn: () => getPerformanceMetrics(staffId, period),
    enabled: !!staffId,
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================================================
// Roles & Permissions Hooks
// ============================================================================

export function useSecurityRoles() {
  return useQuery({
    queryKey: securityKeys.roles(),
    queryFn: () => getSecurityRoles(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useAvailablePermissions() {
  return useQuery({
    queryKey: securityKeys.permissions(),
    queryFn: () => getAvailablePermissions(),
    staleTime: 10 * 60 * 1000,
  });
}

export function useCreateSecurityRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateRoleInput) => createSecurityRole(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: securityKeys.roles() });
    },
  });
}

export function useUpdateSecurityRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateRoleInput) => updateSecurityRole(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: securityKeys.roles() });
      // Also invalidate staff lists as their roles may have changed
      queryClient.invalidateQueries({ queryKey: securityKeys.internalStaff() });
      queryClient.invalidateQueries({ queryKey: securityKeys.externalStaff() });
    },
  });
}

export function useDeleteSecurityRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roleId: string) => deleteSecurityRole(roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: securityKeys.roles() });
    },
  });
}

// ============================================================================
// Combined/Aggregate Hooks
// ============================================================================

/**
 * Hook to get all staff (internal + external) combined
 */
export function useAllSecurityStaff(filters?: {
  role?: SecurityRole;
  gate?: GateLocation;
  status?: StaffStatus;
  searchQuery?: string;
}) {
  const internalQuery = useInternalSecurityStaff({
    role: filters?.role,
    status: filters?.status,
    searchQuery: filters?.searchQuery,
  });

  const externalQuery = useExternalSecurityStaff({
    role: filters?.role,
    gate: filters?.gate,
    status: filters?.status,
    searchQuery: filters?.searchQuery,
  });

  return {
    data: {
      internal: internalQuery.data || [],
      external: externalQuery.data || [],
      all: [...(internalQuery.data || []), ...(externalQuery.data || [])],
    },
    isLoading: internalQuery.isLoading || externalQuery.isLoading,
    isError: internalQuery.isError || externalQuery.isError,
    error: internalQuery.error || externalQuery.error,
  };
}

/**
 * Hook to get staff availability for shift assignment
 */
export function useStaffAvailability(date: string, startTime: string, endTime: string) {
  const shiftsQuery = useShiftAssignments({
    startDate: date,
    endDate: date,
    status: 'scheduled',
  });

  const allStaffQuery = useAllSecurityStaff({ status: 'active' });

  const getAvailableStaff = () => {
    if (!shiftsQuery.data || !allStaffQuery.data) return [];

    const scheduledStaffIds = shiftsQuery.data.map(shift => shift.securityStaffId);
    const allStaff = allStaffQuery.data.all;

    return allStaff.filter(staff => !scheduledStaffIds.includes(staff.id));
  };

  return {
    data: getAvailableStaff(),
    isLoading: shiftsQuery.isLoading || allStaffQuery.isLoading,
    isError: shiftsQuery.isError || allStaffQuery.isError,
  };
}

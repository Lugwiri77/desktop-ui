/**
 * React Query Hooks for Security Department Manager
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import {
  // Types
  SecurityDepartmentOverview,
  DepartmentVisitor,
  SecurityIncident,
  DepartmentAnalytics,
  RegisterExternalStaffWithPasswordInput,
  ResetExternalStaffPasswordInput,
  // Queries
  getSecurityDepartmentOverview,
  getDepartmentInternalStaff,
  getDepartmentExternalStaff,
  getDepartmentVisitors,
  getSecurityIncidents,
  getDepartmentAnalytics,
  // Mutations
  registerExternalStaffByDepartmentManager,
  resetExternalStaffPassword,
  assignGateToExternalStaff,
  deactivateExternalStaff,
  reactivateExternalStaff,
  assignVisitorToStaff,
  markVisitorServed,
  resolveIncident,
  exportDepartmentReport,
} from '@/lib/security-department-api';
import { SecurityRole, GateLocation, ExternalSecurityStaff, InternalSecurityStaff } from '@/lib/security-api';

// ============================================================================
// Query Keys
// ============================================================================

export const securityDepartmentKeys = {
  all: ['securityDepartment'] as const,

  // Overview
  overview: () => [...securityDepartmentKeys.all, 'overview'] as const,

  // Internal Staff
  internalStaff: () => [...securityDepartmentKeys.all, 'internalStaff'] as const,
  internalStaffList: (filters?: any) => [...securityDepartmentKeys.internalStaff(), 'list', filters] as const,

  // External Staff
  externalStaff: () => [...securityDepartmentKeys.all, 'externalStaff'] as const,
  externalStaffList: (filters?: any) => [...securityDepartmentKeys.externalStaff(), 'list', filters] as const,

  // Visitors
  visitors: () => [...securityDepartmentKeys.all, 'visitors'] as const,
  visitorsList: (filters?: any) => [...securityDepartmentKeys.visitors(), 'list', filters] as const,

  // Incidents
  incidents: () => [...securityDepartmentKeys.all, 'incidents'] as const,
  incidentsList: (filters?: any) => [...securityDepartmentKeys.incidents(), 'list', filters] as const,

  // Analytics
  analytics: (period: string, startDate?: string, endDate?: string) =>
    [...securityDepartmentKeys.all, 'analytics', period, startDate, endDate] as const,
};

// ============================================================================
// Department Overview Hooks
// ============================================================================

export function useSecurityDepartmentOverview() {
  return useQuery({
    queryKey: securityDepartmentKeys.overview(),
    queryFn: getSecurityDepartmentOverview,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    refetchOnWindowFocus: true,
  });
}

// ============================================================================
// Department Staff Hooks
// ============================================================================

export function useDepartmentInternalStaff(filters?: {
  role?: SecurityRole;
  searchQuery?: string;
}) {
  return useQuery({
    queryKey: securityDepartmentKeys.internalStaffList(filters),
    queryFn: () => getDepartmentInternalStaff(filters),
    staleTime: 5 * 60 * 1000,
  });
}

export function useDepartmentExternalStaff(filters?: {
  role?: SecurityRole;
  gate?: GateLocation;
  companyId?: string;
  status?: 'active' | 'inactive' | 'suspended';
  searchQuery?: string;
}) {
  return useQuery({
    queryKey: securityDepartmentKeys.externalStaffList(filters),
    queryFn: () => getDepartmentExternalStaff(filters),
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================================================
// External Staff Registration with Password
// ============================================================================

export function useRegisterExternalStaffByDept() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RegisterExternalStaffWithPasswordInput) =>
      registerExternalStaffByDepartmentManager(input),
    onSuccess: () => {
      // Invalidate external staff and overview queries
      queryClient.invalidateQueries({ queryKey: securityDepartmentKeys.externalStaff() });
      queryClient.invalidateQueries({ queryKey: securityDepartmentKeys.overview() });
    },
  });
}

// ============================================================================
// Password Management Hooks
// ============================================================================

export function useResetExternalStaffPassword() {
  return useMutation({
    mutationFn: (input: ResetExternalStaffPasswordInput) => resetExternalStaffPassword(input),
  });
}

// ============================================================================
// Gate Assignment Hooks
// ============================================================================

export function useAssignGateToExternalStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { staffId: string; gateLocation: GateLocation }) =>
      assignGateToExternalStaff(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: securityDepartmentKeys.externalStaff() });
      queryClient.invalidateQueries({ queryKey: securityDepartmentKeys.overview() });
    },
  });
}

// ============================================================================
// Staff Status Management Hooks
// ============================================================================

export function useDeactivateExternalStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ staffId, reason }: { staffId: string; reason?: string }) =>
      deactivateExternalStaff(staffId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: securityDepartmentKeys.externalStaff() });
      queryClient.invalidateQueries({ queryKey: securityDepartmentKeys.overview() });
    },
  });
}

export function useReactivateExternalStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (staffId: string) => reactivateExternalStaff(staffId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: securityDepartmentKeys.externalStaff() });
      queryClient.invalidateQueries({ queryKey: securityDepartmentKeys.overview() });
    },
  });
}

// ============================================================================
// Visitor Management Hooks
// ============================================================================

export function useDepartmentVisitors(filters: {
  startDate?: string;
  endDate?: string;
  status?: 'checked_in' | 'checked_out' | 'pending' | 'served';
  gate?: GateLocation;
  searchQuery?: string;
}) {
  return useQuery({
    queryKey: securityDepartmentKeys.visitorsList(filters),
    queryFn: () => getDepartmentVisitors(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 3 * 60 * 1000, // Refetch every 3 minutes
  });
}

export function useAssignVisitorToStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { visitorId: string; staffId: string }) => assignVisitorToStaff(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: securityDepartmentKeys.visitors() });
    },
  });
}

export function useMarkVisitorServed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ visitorId, notes }: { visitorId: string; notes?: string }) =>
      markVisitorServed(visitorId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: securityDepartmentKeys.visitors() });
      queryClient.invalidateQueries({ queryKey: securityDepartmentKeys.overview() });
    },
  });
}

// ============================================================================
// Incident Management Hooks
// ============================================================================

export function useSecurityIncidents(filters?: {
  severity?: 'low' | 'medium' | 'high' | 'critical';
  status?: 'open' | 'investigating' | 'resolved' | 'closed';
  gate?: GateLocation;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: securityDepartmentKeys.incidentsList(filters),
    queryFn: () => getSecurityIncidents(filters),
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}

export function useResolveIncident() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { incidentId: string; resolutionNotes: string }) => resolveIncident(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: securityDepartmentKeys.incidents() });
      queryClient.invalidateQueries({ queryKey: securityDepartmentKeys.overview() });
    },
  });
}

// ============================================================================
// Analytics & Reports Hooks
// ============================================================================

export function useDepartmentAnalytics(
  period: 'day' | 'week' | 'month' | 'year',
  startDate?: string,
  endDate?: string
) {
  return useQuery({
    queryKey: securityDepartmentKeys.analytics(period, startDate, endDate),
    queryFn: () => getDepartmentAnalytics(period, startDate, endDate),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useExportDepartmentReport() {
  return useMutation({
    mutationFn: (input: {
      reportType: 'visitors' | 'staff_performance' | 'gate_coverage' | 'incidents';
      format: 'pdf' | 'csv' | 'excel';
      startDate: string;
      endDate: string;
    }) => exportDepartmentReport(input),
  });
}

// ============================================================================
// Permission Hooks
// ============================================================================

/**
 * Check if current user is a Security Department Manager
 */
export function useIsSecurityDepartmentManager() {
  // This would integrate with your auth context
  // For now, returning a placeholder implementation
  // You'll need to integrate with your actual auth system

  return {
    isManager: true, // Replace with actual check
    isLoading: false,
    department: 'Security',
  };
}

/**
 * Check if user has specific department permission
 */
export function useDepartmentPermission(permission: string) {
  const { isManager } = useIsSecurityDepartmentManager();

  // Department managers have all permissions within their department
  return isManager;
}

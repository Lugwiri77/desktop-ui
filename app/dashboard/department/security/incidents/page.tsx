'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, AlertTriangle, Filter, FileText, CheckCircle, Clock, MapPin, RefreshCw } from 'lucide-react';
import { ApplicationLayout } from '@/app/components/application-layout';
import { Heading } from '@/app/components/heading';
import { Text } from '@/app/components/text';
import { Button } from '@/app/components/button';
import { Divider } from '@/app/components/divider';
import { Badge } from '@/app/components/badge';
import { Field, Label } from '@/app/components/fieldset';
import { logout, isAuthenticated } from '@/lib/api';
import {
  loadUserInfo,
  isAdministrator,
  getUserRoleDisplayName,
  UserInfo,
} from '@/lib/roles';
import { getIncidents, resolveIncident, type IncidentSeverity, type SecurityIncident } from '@/lib/security-queries-api';
import { getDepartmentExternalStaff } from '@/lib/security-department-api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function IncidentsPage() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedIncident, setSelectedIncident] = useState<string | null>(null);
  const [resolvingIncidentId, setResolvingIncidentId] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [showResolveModal, setShowResolveModal] = useState(false);

  const queryClient = useQueryClient();

  // Build query params based on filters
  const queryParams = {
    ...(severityFilter !== 'all' && { severity: severityFilter.toUpperCase() as IncidentSeverity }),
    ...(statusFilter === 'resolved' && { resolved: true }),
    ...(statusFilter === 'open' && { resolved: false }),
  };

  // Use React Query for real-time incident data (auto-refreshes every 20 seconds)
  const {
    data: incidents = [],
    isLoading: loading,
    error: queryError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['organizationIncidents', queryParams],
    queryFn: () => getIncidents(queryParams),
    staleTime: 20 * 1000, // 20 seconds - critical security data
    refetchInterval: 20 * 1000,
    refetchOnWindowFocus: true,
  });

  const resolveMutation = useMutation({
    mutationFn: ({ incidentId, resolutionNotes }: { incidentId: string; resolutionNotes: string }) =>
      resolveIncident(incidentId, resolutionNotes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizationIncidents'] });
    },
  });

  const error = queryError ? (queryError instanceof Error ? queryError.message : 'Failed to load incidents') : null;

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

    // Check if user has access to Security Department
    if (info.staffRole !== 'DepartmentManager' || info.department !== 'Security') {
      router.push('/dashboard');
      return;
    }

    setUserInfo(info);
  }, [router]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      localStorage.clear();
      router.push('/login');
    } finally {
      setLoggingOut(false);
    }
  };

  const handleResolveIncident = async () => {
    if (!resolvingIncidentId || !resolutionNotes.trim()) {
      return;
    }

    resolveMutation.mutate(
      {
        incidentId: resolvingIncidentId,
        resolutionNotes,
      },
      {
        onSuccess: () => {
          // Close modal and reset state
          setShowResolveModal(false);
          setResolvingIncidentId(null);
          setResolutionNotes('');
          setSelectedIncident(null); // Collapse the incident card
        },
        onError: (err: any) => {
          console.error('Failed to resolve incident:', err);
        },
      }
    );
  };

  const openResolveModal = (incidentId: string) => {
    setResolvingIncidentId(incidentId);
    setShowResolveModal(true);
    setResolutionNotes('');
  };

  if (!userInfo) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  const isAdmin = isAdministrator(userInfo.userRole);
  const roleDisplayName = getUserRoleDisplayName(userInfo.userRole);

  const layoutUserInfo = {
    username: userInfo.username,
    email: userInfo.email,
    profilePicUrl: userInfo.profilePicUrl,
    logoUrl: userInfo.logoUrl,
    organizationName: userInfo.organizationName,
    accountType: userInfo.accountType,
    organizationType: userInfo.organizationType,
    isAdministrator: isAdmin,
    staffRole: userInfo.staffRole,
    department: userInfo.department,
  };

  const filteredIncidents = incidents.filter((incident) => {
    const matchesSeverity = severityFilter === 'all' || incident.severity.toLowerCase() === severityFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'resolved' && incident.resolved) ||
      (statusFilter === 'open' && !incident.resolved);
    return matchesSeverity && matchesStatus;
  });

  const stats = {
    total: incidents.length,
    open: incidents.filter((i) => !i.resolved).length,
    investigating: 0, // Not currently tracked by backend
    resolved: incidents.filter((i) => i.resolved).length,
  };

  // Helper to format time ago
  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const incidentTime = new Date(timestamp);
    const diffMs = now.getTime() - incidentTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  return (
    <ApplicationLayout
      userInfo={layoutUserInfo}
      onLogout={handleLogout}
      roleDisplayName={roleDisplayName}
      isAdmin={isAdmin}
    >
      <div className="space-y-6">
        {/* Back Button */}
        <Button
          outline
          onClick={() => router.push('/dashboard/department/security')}
          className="group"
        >
          <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </Button>

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <Heading>Security Incidents</Heading>
              {isFetching && (
                <span className="text-sm font-normal text-blue-600 flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Updating...
                </span>
              )}
            </div>
            <Text className="mt-2">
              Monitor and manage security incidents across all gates • Auto-refreshes every 20 seconds
            </Text>
          </div>
          <Button
            outline
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh Now
          </Button>
        </div>

        <Divider />

        {/* Error Display */}
        {error && (
          <div className="rounded-lg bg-red-50 p-4 border border-red-200">
            <p className="text-sm text-red-700">
              <strong>Error:</strong> {error}
            </p>
            <Button outline className="mt-2" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        )}

        {/* Loading State */}
        {loading && !error && (
          <div className="rounded-lg bg-white p-12 text-center shadow-sm ring-1 ring-zinc-950/5">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-zinc-600">Loading incidents...</p>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-zinc-950/5">
                <p className="text-sm text-zinc-600 mb-1">Total Incidents</p>
                <p className="text-2xl font-bold text-zinc-900">{stats.total}</p>
              </div>
              <div className="rounded-lg bg-red-50 p-4 border border-red-200">
                <p className="text-sm text-red-700 mb-1">Open</p>
                <p className="text-2xl font-bold text-red-900">{stats.open}</p>
              </div>
              <div className="rounded-lg bg-yellow-50 p-4 border border-yellow-200">
                <p className="text-sm text-yellow-700 mb-1">Investigating</p>
                <p className="text-2xl font-bold text-yellow-900">{stats.investigating}</p>
              </div>
              <div className="rounded-lg bg-green-50 p-4 border border-green-200">
                <p className="text-sm text-green-700 mb-1">Resolved</p>
                <p className="text-2xl font-bold text-green-900">{stats.resolved}</p>
              </div>
            </div>

            {/* Filters */}
            <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-zinc-950/5">
              <div className="flex items-center gap-4">
                <Filter className="h-4 w-4 text-zinc-500" />
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none"
                >
                  <option value="all">All Severities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
            </div>

            {/* Incidents List */}
            <div className="space-y-4">
              {filteredIncidents.length > 0 ? (
                filteredIncidents.map((incident) => {
              const isExpanded = selectedIncident === incident.id;

              return (
                <div
                  key={incident.id}
                  className={`rounded-lg border transition-all ${
                    isExpanded
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-zinc-200 bg-white shadow-sm ring-1 ring-zinc-950/5'
                  }`}
                >
                  <div
                    className="p-6 cursor-pointer"
                    onClick={() => setSelectedIncident(isExpanded ? null : incident.id)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-start gap-3">
                          <AlertTriangle
                            className={`h-5 w-5 ${
                              incident.severity === 'critical'
                                ? 'text-red-600'
                                : incident.severity === 'high'
                                ? 'text-orange-600'
                                : incident.severity === 'medium'
                                ? 'text-yellow-600'
                                : 'text-blue-600'
                            }`}
                          />
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-zinc-900 mb-1">
                              {incident.incidentType}
                            </h3>
                            <p className="text-sm text-zinc-600">{incident.description}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          color={
                            incident.severity === 'CRITICAL' || incident.severity === 'HIGH'
                              ? 'red'
                              : incident.severity === 'MEDIUM'
                              ? 'yellow'
                              : 'blue'
                          }
                        >
                          {incident.severity}
                        </Badge>
                        <Badge color={incident.resolved ? 'green' : 'red'}>
                          {incident.resolved ? 'RESOLVED' : 'OPEN'}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-zinc-600">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {incident.location}
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Reported by Staff ID: {incident.reportedByStaffId}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {formatTimeAgo(incident.incidentTime)}
                      </div>
                    </div>
                  </div>

                  {/* Expanded View */}
                  {isExpanded && (
                    <div className="border-t border-zinc-200 p-6 space-y-4">
                      {!incident.resolved && (
                        <div className="space-y-3">
                          <Button color="green" onClick={() => openResolveModal(incident.id)}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark as Resolved
                          </Button>
                        </div>
                      )}

                      {incident.resolved && incident.resolutionNotes && (
                        <div className="rounded-lg bg-green-50 border border-green-200 p-4">
                          <p className="text-sm font-medium text-green-900 mb-2">Resolution:</p>
                          <p className="text-sm text-green-800">{incident.resolutionNotes}</p>
                          {incident.resolvedAt && (
                            <p className="text-xs text-green-700 mt-2">
                              Resolved: {formatTimeAgo(incident.resolvedAt)}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="rounded-lg bg-white p-12 text-center shadow-sm ring-1 ring-zinc-950/5">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <Text className="text-zinc-900 mb-1 font-semibold">No incidents to display</Text>
              <Text className="text-zinc-600">
                All clear! No security incidents match your filters.
              </Text>
            </div>
          )}
        </div>
      </>
    )}

    {/* Resolve Incident Modal */}
    {showResolveModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
          <h3 className="text-lg font-semibold text-zinc-900 mb-4">
            Resolve Security Incident
          </h3>
          <p className="text-sm text-zinc-600 mb-4">
            Please provide details about how this incident was resolved.
          </p>

          <div className="space-y-4">
            <Field>
              <Label>Resolution Notes *</Label>
              <textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Describe how the incident was handled and resolved..."
                rows={4}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none"
                required
              />
            </Field>

            <div className="flex gap-3 justify-end">
              <Button
                outline
                onClick={() => {
                  setShowResolveModal(false);
                  setResolvingIncidentId(null);
                  setResolutionNotes('');
                }}
              >
                Cancel
              </Button>
              <Button
                color="green"
                onClick={handleResolveIncident}
                disabled={!resolutionNotes.trim() || loading}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {loading ? 'Resolving...' : 'Resolve Incident'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )}
    </div>
    </ApplicationLayout>
  );
}

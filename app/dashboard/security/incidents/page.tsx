'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Shield,
  CheckCircle,
  Clock,
  User,
  MapPin,
  Calendar,
  Filter,
  ChevronDown,
  XCircle,
  Loader2,
  FileText,
  Search,
} from 'lucide-react';
import {
  getSecurityIncidents,
  resolveSecurityIncident,
  type SecurityIncident,
} from '@/lib/security-approval';

type SeverityFilter = 'all' | 'low' | 'medium' | 'high' | 'critical';
type StatusFilter = 'all' | 'open' | 'investigating' | 'resolved' | 'closed';

export default function SecurityIncidentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [resolveModal, setResolveModal] = useState<{
    incident: SecurityIncident | null;
    isOpen: boolean;
  }>({ incident: null, isOpen: false });
  const [viewModal, setViewModal] = useState<{
    incident: SecurityIncident | null;
    isOpen: boolean;
  }>({ incident: null, isOpen: false });

  const queryClient = useQueryClient();

  // Fetch incidents
  const { data: incidents = [], isLoading } = useQuery({
    queryKey: ['securityIncidents', severityFilter, statusFilter],
    queryFn: () =>
      getSecurityIncidents({
        severity: severityFilter !== 'all' ? severityFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      }),
    refetchInterval: 30000,
  });

  // Resolve incident mutation
  const resolveMutation = useMutation({
    mutationFn: resolveSecurityIncident,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['securityIncidents'] });
      setResolveModal({ incident: null, isOpen: false });
    },
  });

  // Filter incidents by search
  const filteredIncidents = useMemo(() => {
    if (!searchQuery) return incidents;
    const query = searchQuery.toLowerCase();
    return incidents.filter(
      (i) =>
        i.incidentType.toLowerCase().includes(query) ||
        i.description.toLowerCase().includes(query) ||
        i.reportedByName.toLowerCase().includes(query) ||
        i.relatedVisitorName?.toLowerCase().includes(query)
    );
  }, [incidents, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: incidents.length,
      open: incidents.filter((i) => i.status === 'open').length,
      investigating: incidents.filter((i) => i.status === 'investigating').length,
      critical: incidents.filter((i) => i.severity === 'critical').length,
    };
  }, [incidents]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/10 text-red-400 border-red-500/50';
      case 'high':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/50';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/50';
      case 'low':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/50';
      default:
        return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-red-500/10 text-red-400 border-red-500/50';
      case 'investigating':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/50';
      case 'resolved':
        return 'bg-green-500/10 text-green-400 border-green-500/50';
      case 'closed':
        return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/50';
      default:
        return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/50';
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Security Incidents</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Track and manage security incidents and alerts
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-zinc-900 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Total Incidents</p>
                <p className="mt-2 text-3xl font-bold text-white">{stats.total}</p>
              </div>
              <div className="rounded-xl bg-blue-500/10 p-3">
                <Shield className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-zinc-900 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Open</p>
                <p className="mt-2 text-3xl font-bold text-white">{stats.open}</p>
              </div>
              <div className="rounded-xl bg-red-500/10 p-3">
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-zinc-900 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Investigating</p>
                <p className="mt-2 text-3xl font-bold text-white">{stats.investigating}</p>
              </div>
              <div className="rounded-xl bg-orange-500/10 p-3">
                <Clock className="h-6 w-6 text-orange-400" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-zinc-900 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Critical</p>
                <p className="mt-2 text-3xl font-bold text-white">{stats.critical}</p>
              </div>
              <div className="rounded-xl bg-red-500/10 p-3">
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="rounded-xl border border-white/10 bg-zinc-900 p-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by type, description, or reporter..."
                  className="w-full rounded-lg border border-white/10 bg-white/5 pl-10 pr-4 py-2 text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white flex items-center gap-2 transition-colors"
              >
                <Filter className="h-5 w-5" />
                Filters
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    showFilters ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </div>

            {showFilters && (
              <div className="grid gap-3 sm:grid-cols-2 pt-4 border-t border-white/10">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-2">
                    Severity
                  </label>
                  <select
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value as SeverityFilter)}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="all">All Severity</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-2">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="all">All Status</option>
                    <option value="open">Open</option>
                    <option value="investigating">Investigating</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Incidents List */}
        <div className="space-y-3">
          {filteredIncidents.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-zinc-900 py-12 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <Shield className="h-8 w-8 text-zinc-500" />
              </div>
              <p className="text-zinc-400 text-sm">No incidents found</p>
              <p className="text-zinc-500 text-xs mt-1">
                {searchQuery
                  ? 'Try adjusting your search or filters'
                  : 'All clear - no incidents reported'}
              </p>
            </div>
          ) : (
            filteredIncidents.map((incident) => (
              <div
                key={incident.id}
                className={`rounded-xl border bg-zinc-900 p-6 hover:bg-white/5 transition-colors ${
                  incident.severity === 'critical'
                    ? 'border-red-500/50'
                    : 'border-white/10'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-start gap-3 mb-3">
                      <div
                        className={`rounded-lg p-2 ${
                          incident.severity === 'critical'
                            ? 'bg-red-500/20'
                            : incident.severity === 'high'
                            ? 'bg-orange-500/20'
                            : 'bg-blue-500/20'
                        }`}
                      >
                        <AlertTriangle
                          className={`h-5 w-5 ${
                            incident.severity === 'critical'
                              ? 'text-red-400'
                              : incident.severity === 'high'
                              ? 'text-orange-400'
                              : 'text-blue-400'
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-white">
                            {incident.incidentType}
                          </h3>
                          <div
                            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium border ${getSeverityColor(
                              incident.severity
                            )}`}
                          >
                            {incident.severity.toUpperCase()}
                          </div>
                          <div
                            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium border ${getStatusColor(
                              incident.status
                            )}`}
                          >
                            {incident.status.charAt(0).toUpperCase() +
                              incident.status.slice(1)}
                          </div>
                        </div>
                        <p className="text-sm text-zinc-300">{incident.description}</p>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div>
                        <p className="text-xs text-zinc-400 flex items-center gap-1 mb-1">
                          <Calendar className="h-3 w-3" />
                          Time
                        </p>
                        <p className="text-xs text-white">
                          {formatDateTime(incident.incidentTime)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-400 flex items-center gap-1 mb-1">
                          <User className="h-3 w-3" />
                          Reported By
                        </p>
                        <p className="text-xs text-white">{incident.reportedByName}</p>
                      </div>
                      {incident.gateLocation && (
                        <div>
                          <p className="text-xs text-zinc-400 flex items-center gap-1 mb-1">
                            <MapPin className="h-3 w-3" />
                            Location
                          </p>
                          <p className="text-xs text-white">
                            {incident.gateLocation
                              .split('_')
                              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                              .join(' ')}
                          </p>
                        </div>
                      )}
                      {incident.relatedVisitorName && (
                        <div>
                          <p className="text-xs text-zinc-400 flex items-center gap-1 mb-1">
                            <User className="h-3 w-3" />
                            Related Visitor
                          </p>
                          <p className="text-xs text-white">
                            {incident.relatedVisitorName}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Resolution */}
                    {incident.resolution && (
                      <div className="mt-4 rounded-lg border border-green-500/50 bg-green-500/10 p-3">
                        <p className="text-xs font-medium text-green-400 mb-1">
                          Resolution
                        </p>
                        <p className="text-xs text-zinc-300">{incident.resolution}</p>
                        {incident.resolvedByName && (
                          <p className="text-xs text-zinc-400 mt-2">
                            Resolved by {incident.resolvedByName} on{' '}
                            {incident.resolvedAt && formatDateTime(incident.resolvedAt)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setViewModal({ incident, isOpen: true })}
                      className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-medium transition-colors flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      Details
                    </button>
                    {(incident.status === 'open' || incident.status === 'investigating') && (
                      <button
                        onClick={() => setResolveModal({ incident, isOpen: true })}
                        className="px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-medium transition-colors flex items-center gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Resolve Modal */}
      {resolveModal.isOpen && resolveModal.incident && (
        <ResolveIncidentModal
          incident={resolveModal.incident}
          onClose={() => setResolveModal({ incident: null, isOpen: false })}
          onResolve={(resolution, status) => {
            resolveMutation.mutate({
              incidentId: resolveModal.incident!.id,
              resolution,
              status,
            });
          }}
          isLoading={resolveMutation.isPending}
        />
      )}

      {/* View Modal */}
      {viewModal.isOpen && viewModal.incident && (
        <ViewIncidentModal
          incident={viewModal.incident}
          onClose={() => setViewModal({ incident: null, isOpen: false })}
        />
      )}
    </div>
  );
}

// Resolve Incident Modal
function ResolveIncidentModal({
  incident,
  onClose,
  onResolve,
  isLoading,
}: {
  incident: SecurityIncident;
  onClose: () => void;
  onResolve: (resolution: string, status: 'resolved' | 'closed') => void;
  isLoading: boolean;
}) {
  const [resolution, setResolution] = useState('');
  const [status, setStatus] = useState<'resolved' | 'closed'>('resolved');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-xl border border-white/10 max-w-lg w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-400" />
            Resolve Incident
          </h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <XCircle className="h-6 w-6" />
          </button>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/5 p-4 mb-6">
          <h3 className="text-sm font-semibold text-white mb-2">
            {incident.incidentType}
          </h3>
          <p className="text-xs text-zinc-400">{incident.description}</p>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Resolution *
            </label>
            <textarea
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              placeholder="Describe how the incident was resolved..."
              rows={4}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-zinc-500 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'resolved' | 'closed')}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
            >
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white font-medium transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onResolve(resolution, status)}
            disabled={isLoading || !resolution.trim()}
            className="flex-1 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Resolving...
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5" />
                Confirm Resolution
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// View Incident Modal
function ViewIncidentModal({
  incident,
  onClose,
}: {
  incident: SecurityIncident;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-xl border border-white/10 max-w-2xl w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-400" />
            Incident Details
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <XCircle className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-xs text-zinc-400 mb-1">Type</p>
            <p className="text-sm text-white">{incident.incidentType}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400 mb-1">Description</p>
            <p className="text-sm text-white">{incident.description}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-zinc-400 mb-1">Severity</p>
              <p className="text-sm text-white capitalize">{incident.severity}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-400 mb-1">Status</p>
              <p className="text-sm text-white capitalize">{incident.status}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-400 mb-1">Reported By</p>
              <p className="text-sm text-white">{incident.reportedByName}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-400 mb-1">Time</p>
              <p className="text-sm text-white">
                {new Date(incident.incidentTime).toLocaleString()}
              </p>
            </div>
          </div>
          {incident.resolution && (
            <div>
              <p className="text-xs text-zinc-400 mb-1">Resolution</p>
              <p className="text-sm text-white">{incident.resolution}</p>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 px-4 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white font-medium transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

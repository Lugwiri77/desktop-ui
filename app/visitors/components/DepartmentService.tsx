'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/app/components/button';
import { Textarea } from '@/app/components/textarea';
import { Badge } from '@/app/components/badge';
import { Dialog, DialogActions, DialogBody, DialogDescription, DialogTitle } from '@/app/components/dialog';
import { Listbox, ListboxLabel, ListboxOption } from '@/app/components/listbox';
import { CheckCircleIcon, ArrowPathIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import {
  startService,
  completeService,
  transferVisitor,
  getMyAssignedVisitors,
  getVisitorJourney,
  VisitorLog,
  VisitorJourneyEntry,
} from '@/lib/visitor-management';
import { getDepartments } from '@/lib/graphql';
import { GranularPermissions } from '@/lib/graphql';

interface DepartmentServiceProps {
  permissions: GranularPermissions | null;
}

export default function DepartmentService({ permissions }: DepartmentServiceProps) {
  const queryClient = useQueryClient();
  const [selectedVisitor, setSelectedVisitor] = useState<VisitorLog | null>(null);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [showJourneyDialog, setShowJourneyDialog] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');
  const [transferDepartmentId, setTransferDepartmentId] = useState('');
  const [transferStaffId, setTransferStaffId] = useState('');
  const [transferNotes, setTransferNotes] = useState('');

  // Get my assigned visitors
  const { data: assignedVisitors = [] } = useQuery({
    queryKey: ['myAssignedVisitors'],
    queryFn: getMyAssignedVisitors,
    enabled: permissions?.can_view_assigned_visitors ?? false,
    refetchInterval: 20000,
  });

  // Get departments
  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: getDepartments,
  });

  // Get visitor journey
  const { data: journey = [] } = useQuery({
    queryKey: ['visitorJourney', selectedVisitor?.id],
    queryFn: () => getVisitorJourney(selectedVisitor!.id),
    enabled: showJourneyDialog && selectedVisitor !== null,
  });

  // Start service mutation
  const startServiceMutation = useMutation({
    mutationFn: startService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myAssignedVisitors'] });
      queryClient.invalidateQueries({ queryKey: ['activeVisitors'] });
    },
  });

  // Complete service mutation
  const completeServiceMutation = useMutation({
    mutationFn: ({ visitorLogId, notes }: { visitorLogId: string; notes?: string }) =>
      completeService(visitorLogId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myAssignedVisitors'] });
      queryClient.invalidateQueries({ queryKey: ['activeVisitors'] });
      queryClient.invalidateQueries({ queryKey: ['visitorStats'] });
      setShowCompleteDialog(false);
      setCompletionNotes('');
      setSelectedVisitor(null);
    },
  });

  // Transfer visitor mutation
  const transferMutation = useMutation({
    mutationFn: transferVisitor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myAssignedVisitors'] });
      queryClient.invalidateQueries({ queryKey: ['activeVisitors'] });
      setShowTransferDialog(false);
      setTransferDepartmentId('');
      setTransferStaffId('');
      setTransferNotes('');
      setSelectedVisitor(null);
    },
  });

  const handleStartService = (visitor: VisitorLog) => {
    if (window.confirm(`Start serving ${visitor.visitorFullName}?`)) {
      startServiceMutation.mutate(visitor.id);
    }
  };

  const handleCompleteService = () => {
    if (!selectedVisitor) return;

    completeServiceMutation.mutate({
      visitorLogId: selectedVisitor.id,
      notes: completionNotes.trim() || undefined,
    });
  };

  const handleTransferVisitor = () => {
    if (!selectedVisitor || !transferNotes.trim()) {
      alert('Please provide transfer notes');
      return;
    }

    if (!transferDepartmentId && !transferStaffId) {
      alert('Please select a transfer destination');
      return;
    }

    transferMutation.mutate({
      visitorLogId: selectedVisitor.id,
      toDepartmentId: transferDepartmentId || undefined,
      toStaffId: transferStaffId || undefined,
      notes: transferNotes.trim(),
    });
  };

  const handleViewJourney = (visitor: VisitorLog) => {
    setSelectedVisitor(visitor);
    setShowJourneyDialog(true);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-zinc-950/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-900">
        <h3 className="text-lg font-semibold text-zinc-950 dark:text-white">
          My Assigned Visitors
        </h3>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Visitors assigned to you for service
        </p>

        <div className="mt-6">
          {assignedVisitors.length === 0 ? (
            <div className="rounded-md bg-zinc-50 p-8 text-center dark:bg-zinc-800">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                No visitors assigned to you
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {assignedVisitors.map((visitor) => (
                <div
                  key={visitor.id}
                  className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <p className="font-medium text-zinc-950 dark:text-white">
                          {visitor.visitorFullName}
                        </p>
                        <Badge
                          color={
                            visitor.status === 'in_service' ? 'blue' :
                            visitor.status === 'routed' ? 'amber' :
                            visitor.status === 'completed' ? 'green' :
                            'zinc'
                          }
                        >
                          {visitor.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          Phone: {visitor.visitorPhoneNumber}
                        </p>
                        {visitor.purposeOfVisit && (
                          <p className="text-sm text-zinc-600 dark:text-zinc-400">
                            Purpose: {visitor.purposeOfVisit}
                          </p>
                        )}
                        {visitor.destinationOfficeLocation && (
                          <p className="text-sm text-zinc-600 dark:text-zinc-400">
                            Location: {visitor.destinationOfficeLocation}
                          </p>
                        )}
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          Arrived: {new Date(visitor.entryTime).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {visitor.status === 'routed' && permissions?.can_mark_visitor_served && (
                      <Button
                        color="blue"
                        onClick={() => handleStartService(visitor)}
                        disabled={startServiceMutation.isPending}
                      >
                        <ArrowRightIcon />
                        Start Service
                      </Button>
                    )}

                    {visitor.status === 'in_service' && permissions?.can_mark_visitor_served && (
                      <Button
                        color="green"
                        onClick={() => {
                          setSelectedVisitor(visitor);
                          setShowCompleteDialog(true);
                        }}
                      >
                        <CheckCircleIcon />
                        Complete Service
                      </Button>
                    )}

                    {(visitor.status === 'routed' || visitor.status === 'in_service') &&
                     permissions?.can_transfer_visitors && (
                      <Button
                        outline
                        onClick={() => {
                          setSelectedVisitor(visitor);
                          setShowTransferDialog(true);
                        }}
                      >
                        <ArrowPathIcon />
                        Transfer
                      </Button>
                    )}

                    {permissions?.can_view_visitor_history && (
                      <Button
                        plain
                        onClick={() => handleViewJourney(visitor)}
                      >
                        View Journey
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Complete Service Dialog */}
      <Dialog open={showCompleteDialog} onClose={() => setShowCompleteDialog(false)}>
        <DialogTitle>Complete Service</DialogTitle>
        <DialogDescription>
          Mark service as completed for {selectedVisitor?.visitorFullName}
        </DialogDescription>
        <DialogBody>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-950 dark:text-white">
                Completion Notes (Optional)
              </label>
              <Textarea
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                rows={3}
                placeholder="Any notes about the service provided..."
                className="mt-1"
              />
            </div>

            {completeServiceMutation.isError && (
              <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
                <p className="text-sm text-red-800 dark:text-red-200">
                  Error: {completeServiceMutation.error.message}
                </p>
              </div>
            )}
          </div>
        </DialogBody>
        <DialogActions>
          <Button plain onClick={() => setShowCompleteDialog(false)}>
            Cancel
          </Button>
          <Button
            color="green"
            onClick={handleCompleteService}
            disabled={completeServiceMutation.isPending}
          >
            {completeServiceMutation.isPending ? 'Completing...' : 'Complete Service'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Transfer Visitor Dialog */}
      <Dialog open={showTransferDialog} onClose={() => setShowTransferDialog(false)}>
        <DialogTitle>Transfer Visitor</DialogTitle>
        <DialogDescription>
          Transfer {selectedVisitor?.visitorFullName} to another department or staff
        </DialogDescription>
        <DialogBody>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-950 dark:text-white">
                Transfer to Department
              </label>
              <Listbox
                value={transferDepartmentId}
                onChange={setTransferDepartmentId}
                className="mt-1"
              >
                <ListboxOption value="">
                  <ListboxLabel>Select a department...</ListboxLabel>
                </ListboxOption>
                {departments.filter(d => d.isActive).map((dept) => (
                  <ListboxOption key={dept.id} value={dept.id}>
                    <ListboxLabel>{dept.name}</ListboxLabel>
                  </ListboxOption>
                ))}
              </Listbox>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-950 dark:text-white">
                Specific Staff ID (Optional)
              </label>
              <input
                type="text"
                value={transferStaffId}
                onChange={(e) => setTransferStaffId(e.target.value)}
                placeholder="Leave blank for department transfer"
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-950 dark:text-white">
                Transfer Notes *
              </label>
              <Textarea
                value={transferNotes}
                onChange={(e) => setTransferNotes(e.target.value)}
                rows={3}
                placeholder="Reason for transfer..."
                className="mt-1"
              />
            </div>

            {transferMutation.isError && (
              <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
                <p className="text-sm text-red-800 dark:text-red-200">
                  Error: {transferMutation.error.message}
                </p>
              </div>
            )}
          </div>
        </DialogBody>
        <DialogActions>
          <Button plain onClick={() => setShowTransferDialog(false)}>
            Cancel
          </Button>
          <Button
            color="indigo"
            onClick={handleTransferVisitor}
            disabled={transferMutation.isPending || !transferNotes.trim()}
          >
            {transferMutation.isPending ? 'Transferring...' : 'Transfer Visitor'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Visitor Journey Dialog */}
      <Dialog open={showJourneyDialog} onClose={() => setShowJourneyDialog(false)} size="2xl">
        <DialogTitle>Visitor Journey</DialogTitle>
        <DialogDescription>
          Complete history for {selectedVisitor?.visitorFullName}
        </DialogDescription>
        <DialogBody>
          <div className="space-y-3">
            {journey.map((entry, index) => (
              <div
                key={entry.id}
                className="relative flex gap-4 pb-4"
              >
                {index < journey.length - 1 && (
                  <div className="absolute left-2 top-8 h-full w-0.5 bg-zinc-200 dark:bg-zinc-700" />
                )}
                <div className="relative z-10 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 ring-4 ring-white dark:ring-zinc-900" />
                <div className="flex-1">
                  <p className="font-medium text-zinc-950 dark:text-white">
                    {entry.action.replace('_', ' ')}
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {new Date(entry.timestamp).toLocaleString()}
                  </p>
                  {entry.performedByStaff && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      By: {entry.performedByStaff.firstName} {entry.performedByStaff.lastName}
                    </p>
                  )}
                  {entry.notes && (
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      Notes: {entry.notes}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </DialogBody>
        <DialogActions>
          <Button onClick={() => setShowJourneyDialog(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

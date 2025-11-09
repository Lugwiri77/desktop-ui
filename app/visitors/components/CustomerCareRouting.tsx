'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/app/components/button';
import { Input } from '@/app/components/input';
import { Textarea } from '@/app/components/textarea';
import { Badge } from '@/app/components/badge';
import { Dialog, DialogActions, DialogBody, DialogDescription, DialogTitle } from '@/app/components/dialog';
import { Listbox, ListboxLabel, ListboxOption } from '@/app/components/listbox';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { routeVisitor, getActiveVisitors, VisitorLog } from '@/lib/visitor-management';
import { getDepartments, Department } from '@/lib/graphql';
import { GranularPermissions } from '@/lib/graphql';

interface CustomerCareRoutingProps {
  permissions: GranularPermissions | null;
}

export default function CustomerCareRouting({ permissions }: CustomerCareRoutingProps) {
  const queryClient = useQueryClient();
  const [selectedVisitor, setSelectedVisitor] = useState<VisitorLog | null>(null);
  const [showRoutingDialog, setShowRoutingDialog] = useState(false);
  const [destinationDepartmentId, setDestinationDepartmentId] = useState('');
  const [destinationStaffId, setDestinationStaffId] = useState('');
  const [destinationOfficeLocation, setDestinationOfficeLocation] = useState('');
  const [purposeOfVisit, setPurposeOfVisit] = useState('');

  // Get visitors that need routing
  const { data: visitors = [] } = useQuery({
    queryKey: ['activeVisitors', 'pending_routing'],
    queryFn: () => getActiveVisitors('pending_routing'),
    refetchInterval: 15000, // Refetch every 15 seconds
  });

  // Get departments
  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: getDepartments,
  });

  // Route visitor mutation
  const routeMutation = useMutation({
    mutationFn: routeVisitor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeVisitors'] });
      queryClient.invalidateQueries({ queryKey: ['visitorStats'] });
      setShowRoutingDialog(false);
      resetForm();
    },
  });

  const resetForm = () => {
    setSelectedVisitor(null);
    setDestinationDepartmentId('');
    setDestinationStaffId('');
    setDestinationOfficeLocation('');
    setPurposeOfVisit('');
  };

  const handleOpenRouting = (visitor: VisitorLog) => {
    setSelectedVisitor(visitor);
    setShowRoutingDialog(true);
  };

  const handleRouteVisitor = () => {
    if (!selectedVisitor || !purposeOfVisit.trim()) {
      alert('Please provide purpose of visit');
      return;
    }

    if (!destinationDepartmentId && !destinationStaffId && !destinationOfficeLocation) {
      alert('Please select at least one destination (department, staff, or location)');
      return;
    }

    routeMutation.mutate({
      visitorLogId: selectedVisitor.id,
      destinationDepartmentId: destinationDepartmentId || undefined,
      destinationStaffId: destinationStaffId || undefined,
      destinationOfficeLocation: destinationOfficeLocation || undefined,
      purposeOfVisit: purposeOfVisit.trim(),
    });
  };

  const selectedDepartment = departments.find(d => d.id === destinationDepartmentId);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-zinc-950/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-900">
        <h3 className="text-lg font-semibold text-zinc-950 dark:text-white">
          Visitors Awaiting Routing
        </h3>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Route visitors to their destinations
        </p>

        <div className="mt-6">
          {visitors.length === 0 ? (
            <div className="rounded-md bg-zinc-50 p-8 text-center dark:bg-zinc-800">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                No visitors awaiting routing
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {visitors.map((visitor) => (
                <div
                  key={visitor.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-700"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <p className="font-medium text-zinc-950 dark:text-white">
                        {visitor.visitorFullName}
                      </p>
                      <Badge color="amber">Pending Routing</Badge>
                    </div>
                    <div className="mt-1 space-y-1">
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Phone: {visitor.visitorPhoneNumber}
                      </p>
                      {visitor.visitorEmail && (
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          Email: {visitor.visitorEmail}
                        </p>
                      )}
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Type: {visitor.visitorType.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Checked in: {new Date(visitor.entryTime).toLocaleString()}
                      </p>
                      {visitor.otpVerified && (
                        <Badge color="green" className="text-xs">
                          OTP Verified
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    color="indigo"
                    onClick={() => handleOpenRouting(visitor)}
                    disabled={!permissions?.can_route_visitors}
                  >
                    <ArrowRightIcon />
                    Route Visitor
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Routing Dialog */}
      <Dialog open={showRoutingDialog} onClose={() => setShowRoutingDialog(false)} size="2xl">
        <DialogTitle>Route Visitor</DialogTitle>
        <DialogDescription>
          Assign {selectedVisitor?.visitorFullName} to a destination
        </DialogDescription>
        <DialogBody>
          <div className="space-y-4">
            {/* Purpose of Visit */}
            <div>
              <label className="block text-sm font-medium text-zinc-950 dark:text-white">
                Purpose of Visit *
              </label>
              <Input
                type="text"
                value={purposeOfVisit}
                onChange={(e) => setPurposeOfVisit(e.target.value)}
                placeholder="e.g., Meeting, Delivery, Interview"
                className="mt-1"
              />
            </div>

            {/* Department Selection */}
            <div>
              <label className="block text-sm font-medium text-zinc-950 dark:text-white">
                Destination Department
              </label>
              <Listbox
                value={destinationDepartmentId}
                onChange={setDestinationDepartmentId}
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
              {selectedDepartment && (
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  Manager: {selectedDepartment.manager?.firstName} {selectedDepartment.manager?.lastName}
                </p>
              )}
            </div>

            {/* Staff ID (Optional - for specific staff member) */}
            <div>
              <label className="block text-sm font-medium text-zinc-950 dark:text-white">
                Specific Staff Member ID (Optional)
              </label>
              <Input
                type="text"
                value={destinationStaffId}
                onChange={(e) => setDestinationStaffId(e.target.value)}
                placeholder="Leave blank for department routing"
                className="mt-1"
              />
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Enter staff ID if visitor needs to see a specific person
              </p>
            </div>

            {/* Office Location */}
            <div>
              <label className="block text-sm font-medium text-zinc-950 dark:text-white">
                Office Location (Optional)
              </label>
              <Input
                type="text"
                value={destinationOfficeLocation}
                onChange={(e) => setDestinationOfficeLocation(e.target.value)}
                placeholder="e.g., Building A, Floor 3, Room 305"
                className="mt-1"
              />
            </div>

            {routeMutation.isError && (
              <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
                <p className="text-sm text-red-800 dark:text-red-200">
                  Error: {routeMutation.error.message}
                </p>
              </div>
            )}
          </div>
        </DialogBody>
        <DialogActions>
          <Button plain onClick={() => setShowRoutingDialog(false)}>
            Cancel
          </Button>
          <Button
            color="indigo"
            onClick={handleRouteVisitor}
            disabled={routeMutation.isPending || !purposeOfVisit.trim()}
          >
            {routeMutation.isPending ? 'Routing...' : 'Route Visitor'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

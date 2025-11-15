'use client';

import { useState } from 'react';
import { Search, Eye, Filter, UserCheck, RefreshCw } from 'lucide-react';
import { useDepartmentVisitors } from '@/hooks/use-security-department';
import { Badge } from '@/app/components/badge';
import { format } from 'date-fns';

export default function DepartmentVisitorsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'checked_in' | 'checked_out' | 'pending' | 'served' | ''>('');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const { data: visitors = [], isLoading, refetch, isFetching } = useDepartmentVisitors({
    searchQuery: searchQuery || undefined,
    status: filterStatus || undefined,
    startDate,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'checked_in':
        return 'green';
      case 'checked_out':
        return 'zinc';
      case 'pending':
        return 'yellow';
      case 'served':
        return 'blue';
      default:
        return 'zinc';
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Eye className="h-8 w-8 text-purple-400" />
              Department Visitors
              {isFetching && (
                <span className="text-sm font-normal text-blue-400 flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Updating...
                </span>
              )}
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Manage visitors routed to the Security department • Auto-refreshes every 30 seconds
            </p>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh Now
          </button>
        </div>

        {/* Filters */}
        <div className="rounded-xl border border-white/10 bg-zinc-900 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search visitors..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-white/10 bg-white/5 text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="">All Status</option>
              <option value="checked_in">Checked In</option>
              <option value="pending">Pending</option>
              <option value="served">Served</option>
              <option value="checked_out">Checked Out</option>
            </select>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-white focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="rounded-lg border border-white/10 bg-zinc-900 p-4">
            <p className="text-sm text-zinc-400">Total Today</p>
            <p className="text-2xl font-bold text-white mt-1">{visitors.length}</p>
          </div>
          <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-4">
            <p className="text-sm text-green-400">Checked In</p>
            <p className="text-2xl font-bold text-white mt-1">
              {visitors.filter((v) => v.status === 'checked_in').length}
            </p>
          </div>
          <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4">
            <p className="text-sm text-yellow-400">Pending</p>
            <p className="text-2xl font-bold text-white mt-1">
              {visitors.filter((v) => v.status === 'pending').length}
            </p>
          </div>
          <div className="rounded-lg border border-blue-500/50 bg-blue-500/10 p-4">
            <p className="text-sm text-blue-400">Served</p>
            <p className="text-2xl font-bold text-white mt-1">
              {visitors.filter((v) => v.status === 'served').length}
            </p>
          </div>
        </div>

        {/* Visitors Table */}
        <div className="rounded-xl border border-white/10 bg-zinc-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-800/50 border-b border-white/10">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-zinc-300">Visitor</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-zinc-300">Contact</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-zinc-300">Purpose</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-zinc-300">Check-in Time</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-zinc-300">Assigned To</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-zinc-300">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-zinc-400">
                      Loading visitors...
                    </td>
                  </tr>
                ) : visitors.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-zinc-400">
                      No visitors found for the selected filters
                    </td>
                  </tr>
                ) : (
                  visitors.map((visitor) => (
                    <tr key={visitor.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {visitor.profilePicUrl ? (
                            <img
                              src={visitor.profilePicUrl}
                              alt={`${visitor.firstName} ${visitor.lastName}`}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                              <span className="text-sm font-medium text-purple-400">
                                {visitor.firstName[0]}
                                {visitor.lastName[0]}
                              </span>
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-white">
                              {visitor.firstName} {visitor.lastName}
                            </p>
                            <p className="text-xs text-zinc-400">ID: {visitor.idNumber}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-white">{visitor.phoneNumber}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-white">{visitor.purpose}</p>
                        {visitor.destination && (
                          <p className="text-xs text-zinc-400">{visitor.destination}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-white">
                          {visitor.checkInTime
                            ? format(new Date(visitor.checkInTime), 'HH:mm')
                            : '-'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {visitor.assignedToStaffName ? (
                            <>
                              <UserCheck className="h-4 w-4 text-blue-400" />
                              <span className="text-sm text-white">
                                {visitor.assignedToStaffName}
                              </span>
                            </>
                          ) : (
                            <span className="text-sm text-zinc-500 italic">Unassigned</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge color={getStatusColor(visitor.status)}>
                          {visitor.status.replace('_', ' ')}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

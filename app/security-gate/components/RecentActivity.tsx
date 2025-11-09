'use client';

import { useState, useMemo } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, Clock, MapPin, User, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import type { VisitorActivity } from '@/lib/security-gate';

interface RecentActivityProps {
  activity: VisitorActivity[];
}

type FilterType = 'all' | 'entry' | 'exit';

const ITEMS_PER_PAGE = 20;

export default function RecentActivity({ activity = [] }: RecentActivityProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter activity based on selected filter
  const filteredActivity = useMemo(() => {
    if (filter === 'all') return activity;
    return activity.filter(item => item.type === filter);
  }, [activity, filter]);

  // Paginate filtered activity
  const totalPages = Math.ceil(filteredActivity.length / ITEMS_PER_PAGE);
  const paginatedActivity = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredActivity.slice(startIndex, endIndex);
  }, [filteredActivity, currentPage]);

  // Reset to page 1 when filter changes
  const handleFilterChange = (newFilter: FilterType) => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  // Mask visitor name for privacy (show first name + masked last name)
  const maskName = (fullName: string): string => {
    const parts = fullName.split(' ');
    if (parts.length === 1) {
      return fullName;
    }
    const firstName = parts[0];
    const lastName = parts[parts.length - 1];
    const maskedLastName = lastName.charAt(0) + '*'.repeat(lastName.length - 1);
    return `${firstName} ${maskedLastName}`;
  };

  // Mask phone number (show last 4 digits)
  const maskPhone = (phone: string): string => {
    if (!phone || phone.length < 4) return '****';
    return `****${phone.slice(-4)}`;
  };

  // Format timestamp to relative time
  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  if (activity.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
          <Clock className="h-8 w-8 text-zinc-500" />
        </div>
        <p className="text-zinc-400 text-sm">No activity yet</p>
        <p className="text-zinc-500 text-xs mt-1">
          Recent visitor entries and exits will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Buttons */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-zinc-400" />
        <div className="flex gap-2 flex-1">
          <button
            onClick={() => handleFilterChange('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white border border-white/10'
            }`}
          >
            All ({activity.length})
          </button>
          <button
            onClick={() => handleFilterChange('entry')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === 'entry'
                ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white border border-white/10'
            }`}
          >
            Entries ({activity.filter(a => a.type === 'entry').length})
          </button>
          <button
            onClick={() => handleFilterChange('exit')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === 'exit'
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white border border-white/10'
            }`}
          >
            Exits ({activity.filter(a => a.type === 'exit').length})
          </button>
        </div>
      </div>

      {/* Activity List */}
      <div className="space-y-2 max-h-[600px] overflow-y-auto">
        {paginatedActivity.map((item) => (
          <div
            key={item.id}
            className="rounded-lg border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition-colors"
          >
            <div className="flex items-start gap-3">
              {/* Type Icon */}
              <div
                className={`rounded-lg p-2 flex-shrink-0 ${
                  item.type === 'entry'
                    ? 'bg-green-500/10'
                    : 'bg-blue-500/10'
                }`}
              >
                {item.type === 'entry' ? (
                  <ArrowDownToLine className="h-5 w-5 text-green-400" />
                ) : (
                  <ArrowUpFromLine className="h-5 w-5 text-blue-400" />
                )}
              </div>

              {/* Activity Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-semibold ${
                        item.type === 'entry' ? 'text-green-400' : 'text-blue-400'
                      }`}
                    >
                      {item.type === 'entry' ? 'Entry' : 'Exit'}
                    </span>
                    <span className="text-xs text-zinc-500">•</span>
                    <span className="text-xs text-zinc-400">
                      {formatTime(item.timestamp)}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  {/* Visitor Info */}
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-3.5 w-3.5 text-zinc-500 flex-shrink-0" />
                    <span className="text-white font-medium">
                      {maskName(item.visitorName)}
                    </span>
                    <span className="text-zinc-500">•</span>
                    <span className="text-zinc-400">{maskPhone(item.visitorPhone)}</span>
                  </div>

                  {/* Gate Location */}
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span>{item.gate}</span>
                  </div>

                  {/* Scanned By */}
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <span>Scanned by:</span>
                    <span className="text-zinc-400 font-medium">{item.scannedBy}</span>
                  </div>
                </div>
              </div>

              {/* Timestamp Badge */}
              <div className="flex-shrink-0">
                <div className="px-2 py-1 rounded bg-white/5 border border-white/10">
                  <p className="text-xs text-zinc-400 font-mono">
                    {new Date(item.timestamp).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <div className="text-xs text-zinc-400">
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
            {Math.min(currentPage * ITEMS_PER_PAGE, filteredActivity.length)} of{' '}
            {filteredActivity.length} activities
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4 text-zinc-400" />
            </button>
            <div className="text-xs text-zinc-400">
              Page {currentPage} of {totalPages}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4 text-zinc-400" />
            </button>
          </div>
        </div>
      )}

      {/* Real-time indicator */}
      <div className="flex items-center justify-center gap-2 text-xs text-zinc-500 pt-2">
        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        <span>Live updates enabled</span>
      </div>
    </div>
  );
}

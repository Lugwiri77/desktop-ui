'use client';

import { useState } from 'react';
import { BarChart3, ArrowLeft, Download, Calendar, TrendingUp, Users, MapPin, AlertTriangle, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useDepartmentAnalytics, useExportDepartmentReport } from '@/hooks/use-security-department';
import { format, subDays, startOfWeek, startOfMonth, startOfYear } from 'date-fns';

export default function ReportsAnalyticsPage() {
  const router = useRouter();
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('week');
  const [reportType, setReportType] = useState<'visitors' | 'staff_performance' | 'gate_coverage' | 'incidents'>('visitors');
  const [exportFormat, setExportFormat] = useState<'pdf' | 'csv' | 'excel'>('pdf');

  const getDateRange = (period: string) => {
    const now = new Date();
    switch (period) {
      case 'day':
        return { start: format(now, 'yyyy-MM-dd'), end: format(now, 'yyyy-MM-dd') };
      case 'week':
        return { start: format(startOfWeek(now), 'yyyy-MM-dd'), end: format(now, 'yyyy-MM-dd') };
      case 'month':
        return { start: format(startOfMonth(now), 'yyyy-MM-dd'), end: format(now, 'yyyy-MM-dd') };
      case 'year':
        return { start: format(startOfYear(now), 'yyyy-MM-dd'), end: format(now, 'yyyy-MM-dd') };
      default:
        return { start: format(subDays(now, 7), 'yyyy-MM-dd'), end: format(now, 'yyyy-MM-dd') };
    }
  };

  const dateRange = getDateRange(period);
  const { data: analytics, isLoading } = useDepartmentAnalytics(period, dateRange.start, dateRange.end);
  const exportMutation = useExportDepartmentReport();

  const handleExport = async () => {
    try {
      const result = await exportMutation.mutateAsync({
        reportType,
        format: exportFormat,
        startDate: dateRange.start,
        endDate: dateRange.end,
      });

      if (result.success && result.downloadUrl) {
        window.open(result.downloadUrl, '_blank');
      } else {
        alert(result.message || 'Export failed');
      }
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export report');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-zinc-800 rounded w-64" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-zinc-800 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-purple-400" />
              Reports & Analytics
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Department performance insights and data exports
            </p>
          </div>
        </div>

        {/* Period Selector */}
        <div className="rounded-xl border border-white/10 bg-zinc-900 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-zinc-400" />
              <span className="text-sm text-zinc-400">Period:</span>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as any)}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="day">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
            </div>
            <div className="text-sm text-zinc-400">
              {format(new Date(dateRange.start), 'MMM d')} - {format(new Date(dateRange.end), 'MMM d, yyyy')}
            </div>
          </div>
        </div>

        {analytics && (
          <>
            {/* Visitor Analytics */}
            <div className="rounded-xl border border-white/10 bg-zinc-900 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/50">
                    <Eye className="h-5 w-5 text-blue-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Visitor Analytics</h2>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-lg bg-zinc-800/50 p-4 border border-white/5">
                  <p className="text-sm text-zinc-400 mb-1">Total Visitors</p>
                  <p className="text-2xl font-bold text-white">{analytics.visitorStats.total}</p>
                </div>
                <div className="rounded-lg bg-zinc-800/50 p-4 border border-white/5">
                  <p className="text-sm text-zinc-400 mb-1">Check-ins</p>
                  <p className="text-2xl font-bold text-green-400">{analytics.visitorStats.checkIns}</p>
                </div>
                <div className="rounded-lg bg-zinc-800/50 p-4 border border-white/5">
                  <p className="text-sm text-zinc-400 mb-1">Check-outs</p>
                  <p className="text-2xl font-bold text-blue-400">{analytics.visitorStats.checkOuts}</p>
                </div>
                <div className="rounded-lg bg-zinc-800/50 p-4 border border-white/5">
                  <p className="text-sm text-zinc-400 mb-1">Avg Duration</p>
                  <p className="text-2xl font-bold text-purple-400">
                    {Math.round(analytics.visitorStats.averageDuration / 60)}m
                  </p>
                </div>
              </div>

              {/* Peak Hours */}
              {analytics.visitorStats.peakHours && analytics.visitorStats.peakHours.length > 0 && (
                <div className="mt-6">
                  <p className="text-sm font-medium text-white mb-3">Peak Hours</p>
                  <div className="grid grid-cols-12 gap-1">
                    {analytics.visitorStats.peakHours.map((hourData) => {
                      const maxCount = Math.max(...analytics.visitorStats.peakHours.map(h => h.count));
                      const heightPercentage = (hourData.count / maxCount) * 100;
                      return (
                        <div key={hourData.hour} className="flex flex-col items-center gap-1">
                          <div className="w-full bg-zinc-800 rounded overflow-hidden" style={{ height: '100px' }}>
                            <div
                              className="w-full bg-blue-500 transition-all"
                              style={{ height: `${heightPercentage}%`, marginTop: `${100 - heightPercentage}%` }}
                            />
                          </div>
                          <span className="text-xs text-zinc-500">{hourData.hour}h</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Staff Performance */}
            <div className="rounded-xl border border-white/10 bg-zinc-900 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/50">
                  <Users className="h-5 w-5 text-green-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Staff Performance</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-lg bg-zinc-800/50 p-4 border border-white/5">
                  <p className="text-sm text-zinc-400 mb-1">Shifts Completed</p>
                  <p className="text-2xl font-bold text-white">{analytics.staffPerformance.shiftsCompleted}</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    of {analytics.staffPerformance.shiftsScheduled} scheduled
                  </p>
                </div>
                <div className="rounded-lg bg-zinc-800/50 p-4 border border-white/5">
                  <p className="text-sm text-zinc-400 mb-1">On-Time Rate</p>
                  <p className="text-2xl font-bold text-green-400">
                    {Math.round(analytics.staffPerformance.onTimeRate * 100)}%
                  </p>
                </div>
                <div className="rounded-lg bg-zinc-800/50 p-4 border border-white/5">
                  <p className="text-sm text-zinc-400 mb-1">Incidents Reported</p>
                  <p className="text-2xl font-bold text-yellow-400">
                    {analytics.staffPerformance.incidentsReported}
                  </p>
                </div>
                <div className="rounded-lg bg-zinc-800/50 p-4 border border-white/5">
                  <p className="text-sm text-zinc-400 mb-1">Completion Rate</p>
                  <p className="text-2xl font-bold text-blue-400">
                    {Math.round((analytics.staffPerformance.shiftsCompleted / analytics.staffPerformance.shiftsScheduled) * 100)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Gate Coverage */}
            <div className="rounded-xl border border-white/10 bg-zinc-900 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/50">
                  <MapPin className="h-5 w-5 text-purple-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Gate Coverage</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-lg bg-zinc-800/50 p-4 border border-white/5">
                  <p className="text-sm text-zinc-400 mb-1">Total Shifts</p>
                  <p className="text-2xl font-bold text-white">{analytics.gateCoverage.totalShifts}</p>
                </div>
                <div className="rounded-lg bg-zinc-800/50 p-4 border border-white/5">
                  <p className="text-sm text-zinc-400 mb-1">Covered Shifts</p>
                  <p className="text-2xl font-bold text-green-400">{analytics.gateCoverage.coveredShifts}</p>
                </div>
                <div className="rounded-lg bg-zinc-800/50 p-4 border border-white/5">
                  <p className="text-sm text-zinc-400 mb-1">Coverage Rate</p>
                  <p className="text-2xl font-bold text-blue-400">
                    {Math.round(analytics.gateCoverage.coverageRate * 100)}%
                  </p>
                </div>
                <div className="rounded-lg bg-zinc-800/50 p-4 border border-white/5">
                  <p className="text-sm text-zinc-400 mb-1">Gaps Detected</p>
                  <p className="text-2xl font-bold text-red-400">{analytics.gateCoverage.gapsDetected}</p>
                </div>
              </div>
            </div>

            {/* Incident Analysis */}
            <div className="rounded-xl border border-white/10 bg-zinc-900 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/50">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Incident Analysis</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-lg bg-zinc-800/50 p-4 border border-white/5">
                  <p className="text-sm text-zinc-400 mb-1">Total Incidents</p>
                  <p className="text-2xl font-bold text-white">{analytics.incidentAnalysis.total}</p>
                </div>
                <div className="rounded-lg bg-zinc-800/50 p-4 border border-white/5">
                  <p className="text-sm text-zinc-400 mb-1">Resolved</p>
                  <p className="text-2xl font-bold text-green-400">{analytics.incidentAnalysis.resolvedCount}</p>
                </div>
                <div className="rounded-lg bg-zinc-800/50 p-4 border border-white/5">
                  <p className="text-sm text-zinc-400 mb-1">Avg Resolution Time</p>
                  <p className="text-2xl font-bold text-blue-400">
                    {Math.round(analytics.incidentAnalysis.averageResolutionTime / 60)}m
                  </p>
                </div>
                <div className="rounded-lg bg-zinc-800/50 p-4 border border-white/5">
                  <p className="text-sm text-zinc-400 mb-1">Resolution Rate</p>
                  <p className="text-2xl font-bold text-purple-400">
                    {analytics.incidentAnalysis.total > 0
                      ? Math.round((analytics.incidentAnalysis.resolvedCount / analytics.incidentAnalysis.total) * 100)
                      : 0}%
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Export Section */}
        <div className="rounded-xl border border-white/10 bg-zinc-900 p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Download className="h-5 w-5 text-green-400" />
            Export Reports
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Report Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as any)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="visitors">Visitor Report</option>
                <option value="staff_performance">Staff Performance</option>
                <option value="gate_coverage">Gate Coverage</option>
                <option value="incidents">Incident Report</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Format</label>
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as any)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="pdf">PDF</option>
                <option value="csv">CSV</option>
                <option value="excel">Excel</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleExport}
                disabled={exportMutation.isPending}
                className="w-full px-6 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {exportMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5" />
                    Export Report
                  </>
                )}
              </button>
            </div>
          </div>

          <p className="text-sm text-zinc-400">
            Export data for the selected period ({format(new Date(dateRange.start), 'MMM d')} - {format(new Date(dateRange.end), 'MMM d, yyyy')})
          </p>
        </div>
      </div>
    </div>
  );
}

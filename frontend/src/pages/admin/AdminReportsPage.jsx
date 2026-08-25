import React, { useState, useEffect } from 'react';
import { ScrollText, BarChart3, PieChart, Download, Calendar, Layers } from 'lucide-react';
import { adminService } from '../../services/itemService';
import { StatCard, LoadingSpinner, EmptyState, Badge } from '../../components/UIComponents';

export const AdminReportsPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const res = await adminService.getStats();
        setStats(res || {});
      } catch (err) {
        console.error('Failed to load reports summary:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Campus Analytics & Recovery Reports</h2>
          <p className="text-xs text-slate-400 mt-1">
            Statistical summaries, item recovery rate metrics, and security station reports.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 hover:text-white font-semibold transition"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Summary Report</span>
        </button>
      </div>

      {loading ? (
        <LoadingSpinner text="Compiling metrics and incident reports..." />
      ) : stats ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="Total Campus Incident Reports"
              value={stats.totalItems || 0}
              icon={ScrollText}
              color="blue"
            />
            <StatCard
              title="Resolved & Handed Off"
              value={stats.resolvedCount || 0}
              icon={BarChart3}
              color="emerald"
            />
            <StatCard
              title="Active Unclaimed Items"
              value={Math.max(0, (stats.totalItems || 0) - (stats.resolvedCount || 0))}
              icon={Layers}
              color="amber"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category breakdown */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-blue-400" />
                <span>Incident Breakdown by Category</span>
              </h3>

              <div className="space-y-3 pt-2 text-xs">
                {[
                  { label: 'Electronics & Laptops', count: stats.categories?.['Electronics & Laptops'] || 0 },
                  { label: 'Student IDs & Cards', count: stats.categories?.['Student IDs & Cards'] || 0 },
                  { label: 'Keys & Keychains', count: stats.categories?.['Keys & Keychains'] || 0 },
                  { label: 'Backpacks & Bags', count: stats.categories?.['Backpacks & Bags'] || 0 },
                  { label: 'Other Items', count: stats.categories?.['Others'] || 0 },
                ].map((cat, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-300 font-medium">{cat.label}</span>
                    <Badge variant="default">{cat.count} logged</Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Location hotspots */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                <span>Top Campus Hotspot Areas</span>
              </h3>

              <div className="space-y-3 pt-2 text-xs">
                {[
                  { spot: 'Central Library', count: stats.locations?.['Central Library'] || 0 },
                  { spot: 'Main Cafeteria', count: stats.locations?.['Main Cafeteria & Food Court'] || 0 },
                  { spot: 'Student Union Building', count: stats.locations?.['Student Union Building'] || 0 },
                  { spot: 'Science Complex', count: stats.locations?.['Science Complex / Labs'] || 0 },
                ].map((spot, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-300 font-medium">{spot.spot}</span>
                    <Badge variant="purple">{spot.count} incidents</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={ScrollText}
          title="No reports data available"
          description="Analytics will automatically compute as items and claims are registered."
        />
      )}
    </div>
  );
};

export default AdminReportsPage;

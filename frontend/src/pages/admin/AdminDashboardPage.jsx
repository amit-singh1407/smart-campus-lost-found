import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Package,
  FileCheck2,
  CheckCircle,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Activity,
  PieChart,
} from 'lucide-react';
import { adminService } from '../../services/itemService';
import { StatCard, LoadingSpinner, EmptyState, Badge } from '../../components/UIComponents';

export const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [recentClaims, setRecentClaims] = useState([]);
  const [recentItems, setRecentItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminDashboard = async () => {
      setLoading(true);
      try {
        const [statsRes, claimsRes, itemsRes] = await Promise.allSettled([
          adminService.getStats(),
          adminService.getAdminClaims({ status: 'pending' }),
          adminService.getAdminItems({ limit: 5 }),
        ]);

        if (statsRes.status === 'fulfilled') {
          setStats(statsRes.value || {});
        }
        if (claimsRes.status === 'fulfilled') {
          setRecentClaims(claimsRes.value?.claims || []);
        }
        if (itemsRes.status === 'fulfilled') {
          setRecentItems(itemsRes.value?.items || []);
        }
      } catch (err) {
        console.error('Error loading admin dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminDashboard();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Compiling campus analytics & claims queue..." />;
  }

  const totalUsers = stats?.totalUsers || 0;
  const lostItems = stats?.lostItems || 0;
  const foundItems = stats?.foundItems || 0;
  const pendingClaims = stats?.pendingClaims || 0;
  const approvedClaims = stats?.approvedClaims || 0;
  const returnedItems = stats?.returnedItems || 0;
  const recoveryRate = stats?.recoveryRate || 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Admin Top Banner */}
      <div className="rounded-3xl border border-amber-500/20 bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Campus Security & Custody Authority</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-100">
            Administrative Control Panel
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mt-1">
            Real-time management for campus lost & found intake, student identity audits, and custody dispute verifications.
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            to="/admin/claims"
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 transition"
          >
            Review Pending Claims ({pendingClaims})
          </Link>
          <Link
            to="/admin/items"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            Manage Inventory
          </Link>
        </div>
      </div>

      {/* Metrics Row (Real MongoDB Aggregated Figures) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Registered Campus Users"
          value={totalUsers}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Lost Items Logged"
          value={lostItems}
          icon={Package}
          color="rose"
        />
        <StatCard
          title="Found Items Turned In"
          value={foundItems}
          icon={Package}
          color="emerald"
        />
        <StatCard
          title="Pending Claims"
          value={pendingClaims}
          icon={FileCheck2}
          color="amber"
        />
      </div>

      {/* Secondary Metrics Bar: Recovery Rate & Resolutions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">Recovery Rate</span>
            <h3 className="text-2xl font-bold text-emerald-400 mt-1">{recoveryRate}%</h3>
          </div>
          <TrendingUp className="w-8 h-8 text-emerald-400/40" />
        </div>

        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">Approved Claims</span>
            <h3 className="text-2xl font-bold text-blue-400 mt-1">{approvedClaims}</h3>
          </div>
          <CheckCircle className="w-8 h-8 text-blue-400/40" />
        </div>

        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">Returned to Owners</span>
            <h3 className="text-2xl font-bold text-purple-400 mt-1">{returnedItems}</h3>
          </div>
          <Activity className="w-8 h-8 text-purple-400/40" />
        </div>
      </div>

      {/* Two Columns: Pending Claims Moderation & Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Claims Moderation Box */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Claims Awaiting Verification ({recentClaims.length})</span>
            </h3>
            <Link
              to="/admin/claims"
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentClaims.length > 0 ? (
            <div className="space-y-3">
              {recentClaims.slice(0, 5).map((claim) => (
                <div
                  key={claim._id || claim.id}
                  className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">
                      {claim.item_title || 'Item Claim'}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Claimant: {claim.user_email || 'Campus Member'}
                    </p>
                  </div>
                  <Link
                    to="/admin/claims"
                    className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-semibold hover:bg-amber-500/20"
                  >
                    Review
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={FileCheck2}
              title="No pending claims"
              description="All submitted student claims have been reviewed."
            />
          )}
        </div>

        {/* Category Breakdown Aggregation */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-blue-400" />
              <span>Category Breakdown (Live)</span>
            </h3>
          </div>

          {stats?.categories && Object.keys(stats.categories).length > 0 ? (
            <div className="space-y-2.5">
              {Object.entries(stats.categories).map(([category, count]) => {
                const totalItemsCount = stats.totalItems || 1;
                const pct = Math.round((count / totalItemsCount) * 100);
                return (
                  <div key={category} className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-300">
                      <span>{category}</span>
                      <span className="font-semibold text-slate-400">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                        style={{ width: `${Math.max(5, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={Package}
              title="No category metrics"
              description="Category analytics will show as items are logged."
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;

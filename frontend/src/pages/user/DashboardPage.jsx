import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PackageSearch,
  PlusCircle,
  Sparkles,
  Layers,
  FileText,
  Bell,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { itemService } from '../../services/itemService';
import { StatCard, LoadingSpinner, EmptyState } from '../../components/UIComponents';
import ItemCard from '../../components/ItemCard';

export const DashboardPage = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const res = await itemService.getDashboard();
        setDashboardData(res);
      } catch (err) {
        console.error('Error fetching live dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Loading your campus dashboard metrics..." />;
  }

  const stats = dashboardData?.stats || {
    my_lost_count: 0,
    my_found_count: 0,
    matches_count: 0,
    pending_claims_count: 0,
  };

  const myLostItems = dashboardData?.my_lost_items || [];
  const myFoundItems = dashboardData?.my_found_items || [];
  const matches = dashboardData?.possible_matches || [];
  const recentCombined = [...myLostItems, ...myFoundItems].slice(0, 4);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
            <span>Verified Campus Member</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Hello, {user?.name || dashboardData?.user?.name || 'Student'} 👋
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl leading-relaxed">
            Welcome to your campus lost and found control center. Submit new reports, review notifications, and track your active item requests in one place.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/report-lost"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/20 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Report Lost</span>
          </Link>
          <Link
            to="/report-found"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition"
          >
            <PackageSearch className="w-4 h-4" />
            <span>Report Found</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row (Real MongoDB Aggregated Data) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="My Lost Reports"
          value={stats.my_lost_count}
          icon={FileText}
          color="rose"
        />
        <StatCard
          title="My Found Submissions"
          value={stats.my_found_count}
          icon={PackageSearch}
          color="emerald"
        />
        <StatCard
          title="Reports Tracking"
          value={stats.matches_count + stats.pending_claims_count}
          icon={Sparkles}
          color="blue"
        />
        <StatCard
          title="Notifications"
          value={stats.unread_notifications_count || 0}
          icon={Layers}
          color="purple"
        />
      </div>

      {/* Related report alert if candidate items are detected */}
      {matches.length > 0 && (
        <div className="p-5 rounded-3xl border border-blue-500/30 bg-blue-500/5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-100">
                {matches.length} Related {matches.length === 1 ? 'Report' : 'Reports'} Found
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Campus listings may match your lost item description and are ready to review.
              </p>
            </div>
          </div>
          <Link
            to="/browse"
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow transition whitespace-nowrap"
          >
            Check Related Reports
          </Link>
        </div>
      )}

      {/* Recent User Reports */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-100">My Recent Submissions</h3>
          <Link
            to="/my-reports"
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentCombined.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentCombined.map((item) => (
              <ItemCard key={item._id || item.id} item={item} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={FileText}
            title="No reports submitted yet"
            description="You have not reported any lost or found items yet. Use the action buttons above to submit an item."
            action={
              <Link
                to="/browse"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-200 hover:bg-slate-700 transition"
              >
                <span>Browse Campus Directory</span>
              </Link>
            }
          />
        )}
      </div>
    </div>
  );
};

export default DashboardPage;

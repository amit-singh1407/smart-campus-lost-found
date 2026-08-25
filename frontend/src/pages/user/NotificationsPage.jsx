import React, { useState, useEffect } from 'react';
import { Bell, Check, Sparkles, FileCheck2, Info } from 'lucide-react';
import { claimService } from '../../services/itemService';
import { LoadingSpinner, EmptyState, Badge } from '../../components/UIComponents';

export const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await claimService.getNotifications();
      setNotifications(res.notifications || []);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await claimService.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id || n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'match':
        return <Sparkles className="w-4 h-4 text-blue-400" />;
      case 'claim':
        return <FileCheck2 className="w-4 h-4 text-emerald-400" />;
      default:
        return <Info className="w-4 h-4 text-purple-400" />;
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Notifications</h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time updates on your lost & found reports, matches, and claim decisions.
          </p>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Fetching notifications..." />
      ) : notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div
              key={notif._id || notif.id}
              className={`p-4 rounded-2xl border transition ${
                notif.read
                  ? 'border-slate-800/60 bg-slate-900/40 text-slate-400'
                  : 'border-blue-500/30 bg-slate-900/80 text-slate-200 shadow-md'
              } flex items-start gap-4`}
            >
              <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 shrink-0">
                {getIcon(notif.type)}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-100">{notif.title}</h4>
                  <span className="text-[10px] text-slate-500">
                    {notif.created_at
                      ? new Date(notif.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Just now'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{notif.message}</p>
              </div>

              {!notif.read && (
                <button
                  onClick={() => handleMarkAsRead(notif._id || notif.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-blue-400 hover:bg-slate-800 transition"
                  title="Mark as read"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Bell}
          title="No notifications yet"
          description="You are all caught up! When there are updates regarding your items, claims, or potential matches, they will appear right here."
        />
      )}
    </div>
  );
};

export default NotificationsPage;

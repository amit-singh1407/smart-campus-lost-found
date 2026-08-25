import React, { useState, useEffect } from 'react';
import { Users, Search, Shield, ShieldCheck, UserX, UserCheck, Loader2 } from 'lucide-react';
import { adminService } from '../../services/itemService';
import { LoadingSpinner, EmptyState, Badge } from '../../components/UIComponents';

export const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await adminService.getUsers({ search });
      setUsers(res.users || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleToggle = async (userId, currentRole) => {
    const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
    if (!window.confirm(`Change user role to ${newRole}?`)) return;

    setActionLoading(userId);
    try {
      await adminService.updateUserRole(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u._id === userId || u.id === userId ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user role');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusToggle = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    setActionLoading(userId);
    try {
      await adminService.updateUserStatus(userId, newStatus);
      setUsers((prev) =>
        prev.map((u) => (u._id === userId || u.id === userId ? { ...u, status: newStatus } : u))
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user status');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Campus User Management</h2>
          <p className="text-xs text-slate-400 mt-1">
            Directory of registered students, faculty, and administrative security staff.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchUsers();
          }}
          className="flex gap-2"
        >
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Search className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition"
          >
            Search
          </button>
        </form>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading campus user directory..." />
      ) : users.length > 0 ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Campus ID & Dept</th>
                  <th className="px-6 py-4">Verification</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map((u) => {
                  const uid = u._id || u.id;
                  const isSuspended = u.status === 'suspended';
                  return (
                    <tr key={uid} className="hover:bg-slate-800/30 transition">
                      <td className="px-6 py-4 font-semibold text-slate-100">
                        <div>{u.name || 'Unnamed'}</div>
                        <div className="text-[11px] text-slate-500 font-normal">{u.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div>{u.student_id || '—'}</div>
                        <div className="text-[11px] text-slate-500">{u.department || 'General'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={u.email_verified ? 'success' : 'warning'}>
                          {u.email_verified ? 'Verified' : 'Pending OTP'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={u.role === 'ADMIN' || u.role === 'SUPER_ADMIN' ? 'purple' : 'default'}>
                          {u.role || 'USER'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={isSuspended ? 'danger' : 'success'}>
                          {isSuspended ? 'Suspended' : 'Active'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => handleRoleToggle(uid, u.role)}
                          disabled={actionLoading === uid}
                          className="px-2.5 py-1 rounded-lg border border-slate-700 hover:border-amber-500/50 text-[11px] font-medium text-slate-300 hover:text-amber-400 transition"
                        >
                          {u.role === 'ADMIN' ? 'Revoke Admin' : 'Make Admin'}
                        </button>
                        <button
                          onClick={() => handleStatusToggle(uid, u.status)}
                          disabled={actionLoading === uid}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
                            isSuspended
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20'
                          }`}
                        >
                          {isSuspended ? 'Unsuspend' : 'Suspend'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title="No campus users found"
          description="No student or staff accounts match the search query."
        />
      )}
    </div>
  );
};

export default AdminUsersPage;

import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'

function AdminPage() {
  const { data: dashboardResponse } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: api.admin.getDashboard,
  })
  const { data: usersResponse } = useQuery({
    queryKey: ['admin-users'],
    queryFn: api.admin.getUsers,
  })
  const { data: claimsResponse } = useQuery({
    queryKey: ['admin-claims'],
    queryFn: api.admin.getClaims,
  })

  const stats = dashboardResponse?.data || {}
  const users = usersResponse?.data?.users || []
  const claims = claimsResponse?.data?.claims || []

  return (
    <div className="page-shell">
      <section className="section-block">
        <p className="eyebrow accent">Admin console</p>
        <h2>Review ownership requests and manage records</h2>

        <div className="stats-grid">
          <div className="stat-card">
            <p>Total users</p>
            <strong>{stats.total_users ?? 0}</strong>
          </div>
          <div className="stat-card">
            <p>Pending requests</p>
            <strong>{stats.pending_claims ?? 0}</strong>
          </div>
          <div className="stat-card">
            <p>Active reports</p>
            <strong>{stats.active_reports ?? 0}</strong>
          </div>
          <div className="stat-card">
            <p>Returned items</p>
            <strong>{stats.returned_items ?? 0}</strong>
          </div>
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <h3>Ownership request queue</h3>
        </div>
        <div className="list-stack">
          {claims.length ? (
            claims.map((claim) => (
              <div className="list-row" key={claim._id}>
                <span>Request: {claim.item_name}</span>
                <span>{claim.status}</span>
                <button type="button" className="ghost-btn dark small-btn">Review</button>
              </div>
            ))
          ) : (
            <p className="empty-state">No claims are waiting for review.</p>
          )}
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <h3>Campus users</h3>
        </div>
        <div className="list-stack">
          {users.map((user) => (
            <div className="list-row" key={user._id}>
              <span>{user.name}</span>
              <span>{user.email}</span>
              <span>{user.role}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default AdminPage

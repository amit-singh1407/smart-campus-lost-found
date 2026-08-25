import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'

function DashboardPage() {
  const currentUser = JSON.parse(localStorage.getItem('current_user') || '{}')
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', currentUser.email],
    queryFn: () => api.dashboard.get(currentUser.email),
  })

  const payload = data?.data || {}
  const stats = payload.stats || {}
  const statCards = [
    { label: 'My lost items', value: stats.lost_items ?? 0 },
    { label: 'My found items', value: stats.found_items ?? 0 },
    { label: 'Possible matches', value: stats.possible_matches ?? 0 },
    { label: 'Pending claims', value: stats.pending_claims ?? 0 },
  ]

  return (
    <div className="page-shell">
      <section className="section-block">
        <p className="eyebrow accent">Student dashboard</p>
        <h2>{payload.welcome || 'Welcome'}{currentUser.name ? `, ${currentUser.name}` : ''}</h2>
        <div className="stats-grid">
          {statCards.map((item) => (
            <div key={item.label} className="stat-card">
              <p>{item.label}</p>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <h3>Recent reports</h3>
        </div>
        <div className="list-stack">
          {isLoading ? (
            <p className="empty-state">Loading dashboard...</p>
          ) : payload.recent_reports?.length ? (
            payload.recent_reports.map((item) => (
              <div className="list-row" key={item._id}>
                <span>{item.type}: {item.item_name}</span>
                <span>{item.location}</span>
                <span>{item.status}</span>
              </div>
            ))
          ) : (
            <p className="empty-state">No reports for this account yet.</p>
          )}
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <h3>Possible matches</h3>
        </div>
        <div className="list-stack">
          {payload.possible_matches?.length ? (
            payload.possible_matches.map((match) => (
              <div className="list-row" key={`${match.lost_item_id}-${match.found_item_id}`}>
                <span>{match.status}</span>
                <span>{match.reason}</span>
                <strong>{match.score}%</strong>
              </div>
            ))
          ) : (
            <p className="empty-state">No strong matches yet.</p>
          )}
        </div>
      </section>
    </div>
  )
}

export default DashboardPage

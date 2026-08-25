import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../services/api'

function HomePage() {
  const { data: statsResponse } = useQuery({
    queryKey: ['public-statistics'],
    queryFn: api.public.getStats,
  })
  const { data: recentResponse } = useQuery({
    queryKey: ['recent-items'],
    queryFn: api.public.getRecentItems,
  })

  const stats = statsResponse?.data || {}
  const recentItems = recentResponse?.data?.items || []
  const statCards = [
    { label: 'Lost reports', value: stats.lost_reports ?? 0 },
    { label: 'Found reports', value: stats.found_reports ?? 0 },
    { label: 'Returned items', value: stats.resolved_items ?? 0 },
    { label: 'Campus users', value: stats.campus_users ?? 0 },
  ]

  return (
    <div className="page-shell">
      <section className="hero-panel large">
        <div>
          <p className="eyebrow accent">Campus support system</p>
          <h1>Recover lost belongings with confidence.</h1>
          <p className="lead">
            Report missing items, browse campus finds, and let the smart matching system surface likely matches based on real evidence.
          </p>
          <div className="cta-row">
            <Link to="/register" className="primary-btn">Create account</Link>
            <Link to="/browse" className="secondary-btn">Browse items</Link>
          </div>
        </div>

        <div className="summary-stack">
          <div className="summary-card highlight">
            <span>Open reports</span>
            <strong>{stats.total_reports ?? 0} active records</strong>
            <small>Updated from the API</small>
          </div>
          <div className="summary-card">
            <span>Found inventory</span>
            <strong>{stats.found_reports ?? 0} found items</strong>
            <small>Ready for review and claims</small>
          </div>
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">How it works</p>
            <h3>Simple steps for recovery</h3>
          </div>
        </div>

        <div className="info-grid">
          <article className="info-card">
            <span className="step-badge">01</span>
            <h4>Report the item</h4>
            <p>Add item details, category, location, date, and identifying notes.</p>
          </article>
          <article className="info-card">
            <span className="step-badge">02</span>
            <h4>Smart matching</h4>
            <p>Matching compares category, brand, color, location, and item name overlap.</p>
          </article>
          <article className="info-card">
            <span className="step-badge">03</span>
            <h4>Claim and verify</h4>
            <p>Admins can review users, reports, and pending claim evidence.</p>
          </article>
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading split-heading">
          <div>
            <p className="eyebrow">Recent found items</p>
            <h3>Fresh campus reports</h3>
          </div>
          <Link to="/browse" className="text-link">View all</Link>
        </div>

        {recentItems.length === 0 ? (
          <p className="empty-state">No found items have been reported yet.</p>
        ) : (
          <div className="list-grid three-col">
            {recentItems.map((item) => (
              <article className="item-card" key={item._id}>
                <div className="item-art art-one" />
                <div className="item-body">
                  <div className="item-row">
                    <span className="badge found">Found</span>
                    <span className="meta">{item.location}</span>
                  </div>
                  <h4>{item.item_name}</h4>
                  <p>{item.category}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Campus statistics</p>
            <h3>Live portal overview</h3>
          </div>
        </div>

        <div className="stats-grid">
          {statCards.map((stat) => (
            <div className="stat-card" key={stat.label}>
              <p>{stat.label}</p>
              <strong>{stat.value}</strong>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default HomePage

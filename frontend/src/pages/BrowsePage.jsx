import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { api } from '../services/api'

const initialReport = {
  type: 'lost',
  item_name: '',
  category: '',
  brand: '',
  color: '',
  location: '',
  lost_date: '',
  description: '',
}

function BrowsePage() {
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState({ q: '', category: '', type: '' })
  const [report, setReport] = useState(initialReport)

  const queryString = useMemo(() => {
    const params = new URLSearchParams()
    if (filters.q) params.set('q', filters.q)
    if (filters.type) params.set('type', filters.type)
    return params.toString() ? `?${params.toString()}` : ''
  }, [filters])

  const { data, isLoading } = useQuery({
    queryKey: ['items', queryString],
    queryFn: () => api.items.list(queryString),
  })

  const createReport = useMutation({
    mutationFn: api.items.create,
    onSuccess: (response) => {
      setReport(initialReport)
      queryClient.invalidateQueries({ queryKey: ['items'] })
      queryClient.invalidateQueries({ queryKey: ['public-statistics'] })
      queryClient.invalidateQueries({ queryKey: ['recent-items'] })
      toast.success(response.message || 'Report submitted.')
      if (response.data.matches?.length) {
        toast.message(`${response.data.matches.length} possible match found.`)
      }
    },
    onError: (error) => toast.error(error.message || 'Could not submit report.'),
  })

  const items = (data?.data?.items || []).filter((item) => (
    !filters.category || item.category.toLowerCase() === filters.category
  ))

  const updateReport = (event) => {
    const { name, value } = event.target
    setReport((current) => ({ ...current, [name]: value }))
  }

  const submitReport = (event) => {
    event.preventDefault()
    const currentUser = JSON.parse(localStorage.getItem('current_user') || '{}')
    createReport.mutate({ ...report, owner_email: currentUser.email || 'student@campus.edu' })
  }

  return (
    <div className="page-shell">
      <section className="section-block">
        <div className="section-heading split-heading">
          <div>
            <p className="eyebrow">Browse items</p>
            <h3>Search and filter real reports</h3>
          </div>
        </div>

        <div className="filters-bar">
          <input
            type="text"
            placeholder="Search item or keyword"
            value={filters.q}
            onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))}
          />
          <select
            value={filters.category}
            onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))}
          >
            <option value="">Category</option>
            <option value="electronics">Electronics</option>
            <option value="documents">Documents</option>
            <option value="accessories">Accessories</option>
            <option value="bags">Bags</option>
          </select>
          <select
            value={filters.type}
            onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value }))}
          >
            <option value="">Type</option>
            <option value="lost">Lost</option>
            <option value="found">Found</option>
          </select>
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Report item</p>
            <h3>Create a lost or found report</h3>
          </div>
        </div>

        <form className="report-form" onSubmit={submitReport}>
          <select name="type" value={report.type} onChange={updateReport}>
            <option value="lost">Lost</option>
            <option value="found">Found</option>
          </select>
          <input name="item_name" value={report.item_name} onChange={updateReport} placeholder="Item name" required />
          <input name="category" value={report.category} onChange={updateReport} placeholder="Category" required />
          <input name="brand" value={report.brand} onChange={updateReport} placeholder="Brand" />
          <input name="color" value={report.color} onChange={updateReport} placeholder="Color" />
          <input name="location" value={report.location} onChange={updateReport} placeholder="Location" required />
          <input name="lost_date" type="date" value={report.lost_date} onChange={updateReport} />
          <textarea name="description" value={report.description} onChange={updateReport} placeholder="Description and identifying details" />
          <button type="submit" className="primary-btn" disabled={createReport.isPending}>
            {createReport.isPending ? 'Submitting...' : 'Submit report'}
          </button>
        </form>
      </section>

      <section className="section-block">
        {isLoading ? (
          <p className="empty-state">Loading reports...</p>
        ) : items.length === 0 ? (
          <p className="empty-state">No reports match the current filters.</p>
        ) : (
          <div className="list-grid three-col">
            {items.map((item) => (
              <article className="item-card" key={item._id}>
                <div className="item-art art-two" />
                <div className="item-body">
                  <div className="item-row">
                    <span className={`badge ${item.type}`}>{item.type}</span>
                    <span className="meta">{item.location}</span>
                  </div>
                  <h4>{item.item_name}</h4>
                  <p>{item.category}</p>
                  <p className="meta">{item.description}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default BrowsePage

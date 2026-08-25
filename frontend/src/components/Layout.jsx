import { NavLink, Outlet } from 'react-router-dom'
import { Bell, Home, LogOut, Search, ShieldCheck, UserRound } from 'lucide-react'
import { toast } from 'sonner'

function Layout() {
  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('current_user')
    toast.success('Logged out locally.')
  }

  const navItems = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/browse', label: 'Browse', icon: Search },
    { to: '/dashboard', label: 'Dashboard', icon: UserRound },
    { to: '/admin', label: 'Admin', icon: ShieldCheck },
  ]

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="brand-box">
          <div className="brand-mark">SC</div>
          <div>
            <p className="eyebrow">Smart Campus</p>
            <strong>Lost & Found</strong>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button type="button" className="ghost-btn small-btn">
            <Bell size={16} />
            Alerts
          </button>
          <button type="button" className="ghost-btn small-btn" onClick={logout}>
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      <main className="content-panel">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout

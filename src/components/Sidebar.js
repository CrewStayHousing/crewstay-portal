import { useAuth } from '../context/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'

const NAV_ITEMS = [
  { path: '/dashboard', icon: '⊞', label: 'Dashboard' },
  { path: '/projects', icon: '📋', label: 'Projects' },
  { path: '/properties', icon: '🏠', label: 'Properties' },
  { path: '/crew', icon: '👷', label: 'Crew Roster' },
  { path: '/assignments', icon: '🛏', label: 'Assignments' },
  { path: '/invoices', icon: '🧾', label: 'Invoices' },
  { path: '/maintenance', icon: '🔧', label: 'Maintenance' },
  { path: '/reports', icon: '📊', label: 'Reports' },
]

export default function Sidebar() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div style={styles.sidebar}>
      {/* LOGO */}
      <div style={styles.logoArea}>
        <div style={styles.logoIcon}>🏠</div>
        <div>
          <div style={styles.logoText}>CREWSTAY</div>
          <div style={styles.logoSub}>HOUSING</div>
        </div>
      </div>

      {/* USER */}
      <div style={styles.userCard}>
        <div style={styles.userAvatar}>
          {profile?.full_name?.charAt(0) || 'U'}
        </div>
        <div>
          <div style={styles.userName}>{profile?.full_name || 'User'}</div>
          <div style={styles.userRole}>{profile?.role?.replace('_', ' ').toUpperCase()}</div>
        </div>
      </div>

      {/* NAV */}
      <nav style={styles.nav}>
        {NAV_ITEMS.map(item => {
          const active = location.pathname === item.path
          return (
            <button
              key={item.path}
              style={{ ...styles.navItem, ...(active ? styles.navItemActive : {}) }}
              onClick={() => navigate(item.path)}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
              {active && <div style={styles.activeDot} />}
            </button>
          )
        })}
      </nav>

      {/* SIGN OUT */}
      <button style={styles.signOut} onClick={handleSignOut}>
        ← Sign Out
      </button>
    </div>
  )
}

const styles = {
  sidebar: {
    width: 240, minHeight: '100vh', background: '#0F1E38',
    display: 'flex', flexDirection: 'column', padding: '24px 0',
    borderRight: '1px solid rgba(255,255,255,0.06)', flexShrink: 0
  },
  logoArea: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '0 20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)'
  },
  logoIcon: { fontSize: 24 },
  logoText: { fontFamily: "'Oswald', sans-serif", fontSize: 16, fontWeight: 700, color: 'white', lineHeight: 1 },
  logoSub: { fontSize: 9, fontWeight: 700, letterSpacing: 2.5, color: '#E8883A' },
  userCard: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '16px 20px', margin: '16px 12px',
    background: 'rgba(255,255,255,0.04)', borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.06)'
  },
  userAvatar: {
    width: 36, height: 36, borderRadius: '50%',
    background: '#E8883A', color: 'white',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Oswald', sans-serif", fontSize: 16, fontWeight: 700, flexShrink: 0
  },
  userName: { fontSize: 13, fontWeight: 600, color: 'white', lineHeight: 1.2 },
  userRole: { fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: 1, marginTop: 2 },
  nav: { flex: 1, padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 2 },
  navItem: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 12px', borderRadius: 8, border: 'none',
    background: 'none', color: 'rgba(255,255,255,0.5)',
    fontSize: 14, fontFamily: "'Source Sans 3', sans-serif",
    cursor: 'pointer', width: '100%', textAlign: 'left',
    transition: 'all 0.15s', position: 'relative'
  },
  navItemActive: {
    background: 'rgba(232,136,58,0.12)',
    color: 'white', fontWeight: 600
  },
  navIcon: { fontSize: 16, width: 20, textAlign: 'center', flexShrink: 0 },
  activeDot: {
    width: 4, height: 4, borderRadius: '50%',
    background: '#E8883A', marginLeft: 'auto'
  },
  signOut: {
    margin: '0 12px', padding: '10px 12px', borderRadius: 8,
    background: 'none', border: '1px solid rgba(255,255,255,0.08)',
    color: 'rgba(255,255,255,0.35)', fontSize: 13,
    fontFamily: "'Source Sans 3', sans-serif",
    cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s'
  }
}

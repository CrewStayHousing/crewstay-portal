import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({ projects: 0, beds: 0, occupied: 0, maintenance: 0 })
  const [assignments, setAssignments] = useState([])
  const [maintenance, setMaintenance] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadDashboard() }, [])

  async function loadDashboard() {
    const [proj, assign, maint] = await Promise.all([
      supabase.from('projects').select('id', { count: 'exact' }).eq('status', 'active'),
      supabase.from('v_active_assignments').select('*').limit(5),
      supabase.from('v_open_maintenance').select('*').limit(5),
    ])
    const totalBeds = assign.data?.length || 0
    setStats({ projects: proj.count || 0, beds: totalBeds, occupied: totalBeds, maintenance: maint.data?.length || 0 })
    setAssignments(assign.data || [])
    setMaintenance(maint.data || [])
    setLoading(false)
  }

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const firstName = profile?.full_name?.split(' ')[0] || 'there'
  const severityColor = { low: '#27AE60', medium: '#F59E0B', high: '#EF4444' }
  const STAT_CARDS = [
    { label: 'Active Projects', value: stats.projects, icon: '🏗️', color: '#3B82F6', bg: '#EFF6FF', link: '/projects' },
    { label: 'Beds Occupied', value: stats.occupied, icon: '🛏️', color: '#E8883A', bg: '#FFF7ED', link: '/assignments' },
    { label: 'Open Maintenance', value: stats.maintenance, icon: '🔧', color: stats.maintenance > 0 ? '#EF4444' : '#27AE60', bg: stats.maintenance > 0 ? '#FEF2F2' : '#F0FDF4', link: '/maintenance' },
    { label: 'Monthly Cost', value: loading ? '—' : '$' + (stats.occupied * 600).toLocaleString(), icon: '💰', color: '#8B5CF6', bg: '#F5F3FF', link: '/invoices' },
  ]

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>{greeting()}, {firstName} 👋</h1>
          <p style={s.sub}>Here is what is happening across your projects today.</p>
        </div>
        <button style={s.assignBtn} onClick={() => navigate('/assignments')}>+ New Assignment</button>
      </div>
      <div style={s.statsGrid}>
        {STAT_CARDS.map(card => (
          <div key={card.label} style={{ ...s.statCard, borderTop: '4px solid ' + card.color, background: card.bg }} onClick={() => navigate(card.link)}>
            <div style={s.statTop}>
              <span style={s.statIcon}>{card.icon}</span>
              <span style={{ ...s.statValue, color: card.color }}>{loading ? '—' : card.value}</span>
            </div>
            <div style={s.statLabel}>{card.label}</div>
          </div>
        ))}
      </div>
      <div style={s.quickActions}>
        {[
          { label: '+ Add Crew Member', path: '/crew' },
          { label: '📋 View Projects', path: '/projects' },
          { label: '🏠 Properties', path: '/properties' },
          { label: '📄 Invoices', path: '/invoices' },
        ].map(a => (
          <button key={a.label} style={s.quickBtn} onClick={() => navigate(a.path)}>{a.label}</button>
        ))}
      </div>
      <div style={s.grid}>
        <div style={s.panel}>
          <div style={s.panelHeader}>
            <div style={s.panelTitle}>Active Assignments</div>
            <button style={s.viewAll} onClick={() => navigate('/assignments')}>View All →</button>
          </div>
          {loading ? <div style={s.empty}>Loading...</div> : assignments.length === 0 ? <div style={s.empty}>No active assignments.</div> : assignments.map(a => (
            <div key={a.assignment_id} style={s.assignRow}>
              <div style={s.assignAvatar}>{a.first_name?.charAt(0)}{a.last_name?.charAt(0)}</div>
              <div style={{ flex: 1 }}>
                <div style={s.assignName}>{a.first_name} {a.last_name}</div>
                <div style={s.assignDetail}>{a.trade} · Room {a.room_number} · {a.property_address}</div>
              </div>
              <div style={s.assignProject}>{a.project_code}</div>
            </div>
          ))}
        </div>
        <div style={s.panel}>
          <div style={s.panelHeader}>
            <div style={s.panelTitle}>Open Maintenance</div>
            <button style={s.viewAll} onClick={() => navigate('/maintenance')}>View All →</button>
          </div>
          {loading ? <div style={s.empty}>Loading...</div> : maintenance.length === 0 ? <div style={s.empty}>✅ No open maintenance requests.</div> : maintenance.map(m => (
            <div key={m.id} style={s.maintRow}>
              <div style={{ ...s.severityDot, background: severityColor[m.severity] }} />
              <div style={{ flex: 1 }}>
                <div style={s.maintTitle}>{m.title}</div>
                <div style={s.maintDetail}>{m.property_address} · {m.room_number}</div>
              </div>
              <div style={{ ...s.severityBadge, background: severityColor[m.severity] + '22', color: severityColor[m.severity] }}>{m.severity}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const s = {
  page: { flex: 1, padding: 32, background: '#F7F8FA', minHeight: '100vh', overflowY: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  title: { fontFamily: 'Oswald, sans-serif', fontSize: 28, fontWeight: 700, color: '#0F1E38', margin: 0 },
  sub: { fontSize: 15, color: '#6B7A99', margin: '4px 0 0' },
  assignBtn: { background: '#E8883A', color: 'white', border: 'none', padding: '12px 24px', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 20 },
  statCard: { borderRadius: 14, padding: '20px 24px', border: '1px solid #E8ECF2', cursor: 'pointer' },
  statTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  statIcon: { fontSize: 24 },
  statValue: { fontFamily: 'Oswald, sans-serif', fontSize: 34, fontWeight: 700, lineHeight: 1 },
  statLabel: { fontSize: 13, color: '#6B7A99', fontWeight: 500 },
  quickActions: { display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' },
  quickBtn: { background: 'white', border: '1.5px solid #0F1E38', color: '#0F1E38', padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 },
  panel: { background: 'white', borderRadius: 14, border: '1px solid #E8ECF2', overflow: 'hidden' },
  panelHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #F0F2F7' },
  panelTitle: { fontFamily: 'Oswald, sans-serif', fontSize: 15, fontWeight: 700, color: '#0F1E38', textTransform: 'uppercase', letterSpacing: 0.5 },
  viewAll: { background: 'none', border: 'none', color: '#E8883A', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  empty: { padding: '32px 20px', textAlign: 'center', color: '#6B7A99', fontSize: 14 },
  assignRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '1px solid #F7F8FA' },
  assignAvatar: { width: 36, height: 36, borderRadius: '50%', background: '#1B2A4A', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 },
  assignName: { fontSize: 14, fontWeight: 600, color: '#1B2A4A', lineHeight: 1.2 },
  assignDetail: { fontSize: 12, color: '#6B7A99', marginTop: 2 },
  assignProject: { fontSize: 11, fontWeight: 700, color: '#E8883A', background: '#FFF3E8', padding: '3px 8px', borderRadius: 4 },
  maintRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '1px solid #F7F8FA' },
  severityDot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  maintTitle: { fontSize: 14, fontWeight: 600, color: '#1B2A4A' },
  maintDetail: { fontSize: 12, color: '#6B7A99', marginTop: 2 },
  severityBadge: { fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4, textTransform: 'uppercase' },
}
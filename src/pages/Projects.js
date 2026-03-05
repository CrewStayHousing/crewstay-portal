import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function Projects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const navigate = useNavigate()

  useEffect(() => { loadProjects() }, [])

  async function loadProjects() {
    const { data } = await supabase
      .from('projects')
      .select('*, organizations(name)')
      .order('created_at', { ascending: false })
    setProjects(data || [])
    setLoading(false)
  }

  const statusColor = { active: '#27AE60', pending: '#F59E0B', completed: '#6B7A99', cancelled: '#EF4444' }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Projects</h1>
          <p style={styles.sub}>{projects.length} total projects</p>
        </div>
        <button style={styles.addBtn} onClick={() => setShowNew(true)}>+ New Project</button>
      </div>

      {loading ? <div style={styles.empty}>Loading projects...</div> :
        projects.length === 0 ? <div style={styles.empty}>No projects yet. Create your first project.</div> :
        <div style={styles.grid}>
          {projects.map(p => (
            <div key={p.id} style={styles.card} onClick={() => navigate(`/projects/${p.id}`)}>
              <div style={styles.cardTop}>
                <div style={styles.code}>{p.project_code}</div>
                <div style={{ ...styles.status, background: statusColor[p.status] + '20', color: statusColor[p.status] }}>
                  {p.status}
                </div>
              </div>
              <div style={styles.name}>{p.name}</div>
              <div style={styles.company}>{p.organizations?.name}</div>
              <div style={styles.site}>📍 {p.job_site_city}, {p.job_site_state}</div>
              <div style={styles.cardFooter}>
                <div style={styles.footerItem}>
                  <div style={styles.footerLabel}>Start</div>
                  <div style={styles.footerValue}>{p.start_date || '—'}</div>
                </div>
                <div style={styles.footerItem}>
                  <div style={styles.footerLabel}>End</div>
                  <div style={styles.footerValue}>{p.end_date || 'Ongoing'}</div>
                </div>
                <div style={styles.footerItem}>
                  <div style={styles.footerLabel}>Billing</div>
                  <div style={styles.footerValue}>{p.billing_contact_name || '—'}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      }

      {showNew && <NewProjectModal onClose={() => setShowNew(false)} onSave={() => { setShowNew(false); loadProjects() }} />}
    </div>
  )
}

function NewProjectModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name: '', project_code: '', job_site_city: '', job_site_state: 'GA', start_date: '', billing_contact_name: '', billing_contact_email: '' })
  const [orgs, setOrgs] = useState([])
  const [orgId, setOrgId] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('organizations').select('id, name').eq('type', 'epc_company').then(({ data }) => setOrgs(data || []))
  }, [])

  async function handleSave() {
    setSaving(true)
    await supabase.from('projects').insert({ ...form, organization_id: orgId, status: 'active' })
    setSaving(false)
    onSave()
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div style={modal.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={modal.box}>
        <div style={modal.header}>
          <div style={modal.title}>New Project</div>
          <button style={modal.close} onClick={onClose}>✕</button>
        </div>
        <div style={modal.body}>
          <Field label="EPC Company">
            <select style={modal.input} value={orgId} onChange={e => setOrgId(e.target.value)}>
              <option value="">Select company...</option>
              {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </Field>
          <Field label="Project Name"><input style={modal.input} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Hyundai Metaplant Phase 2"/></Field>
          <Field label="Project Code"><input style={modal.input} value={form.project_code} onChange={e => set('project_code', e.target.value)} placeholder="HMP-2026-001"/></Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="Job Site City"><input style={modal.input} value={form.job_site_city} onChange={e => set('job_site_city', e.target.value)} placeholder="Savannah"/></Field>
            <Field label="State"><input style={modal.input} value={form.job_site_state} onChange={e => set('job_site_state', e.target.value)} placeholder="GA"/></Field>
          </div>
          <Field label="Start Date"><input style={modal.input} type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)}/></Field>
          <Field label="Billing Contact Name"><input style={modal.input} value={form.billing_contact_name} onChange={e => set('billing_contact_name', e.target.value)} placeholder="Jane Smith"/></Field>
          <Field label="Billing Contact Email"><input style={modal.input} value={form.billing_contact_email} onChange={e => set('billing_contact_email', e.target.value)} placeholder="billing@company.com"/></Field>
        </div>
        <div style={modal.footer}>
          <button style={modal.cancel} onClick={onClose}>Cancel</button>
          <button style={modal.save} onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Create Project'}</button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#6B7A99', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  )
}

const styles = {
  page: { flex: 1, padding: 32, background: '#F7F8FA', minHeight: '100vh' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  title: { fontFamily: "'Oswald', sans-serif", fontSize: 28, fontWeight: 700, color: '#1B2A4A', margin: 0 },
  sub: { fontSize: 14, color: '#6B7A99', margin: '4px 0 0' },
  addBtn: { background: '#E8883A', color: 'white', border: 'none', padding: '12px 24px', borderRadius: 8, fontFamily: "'Oswald', sans-serif", fontSize: 16, fontWeight: 700, cursor: 'pointer' },
  empty: { textAlign: 'center', padding: '60px 20px', color: '#6B7A99', fontSize: 15 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 },
  card: { background: 'white', borderRadius: 16, padding: 24, border: '2px solid #E8ECF2', cursor: 'pointer', transition: 'all 0.2s' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  code: { fontFamily: "'Oswald', sans-serif", fontSize: 13, fontWeight: 700, color: '#E8883A', background: '#FFF4EE', padding: '3px 10px', borderRadius: 4 },
  status: { fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4, textTransform: 'uppercase' },
  name: { fontFamily: "'Oswald', sans-serif", fontSize: 20, fontWeight: 700, color: '#1B2A4A', marginBottom: 4 },
  company: { fontSize: 14, color: '#6B7A99', marginBottom: 6 },
  site: { fontSize: 13, color: '#6B7A99', marginBottom: 16 },
  cardFooter: { display: 'flex', gap: 20, paddingTop: 16, borderTop: '1px solid #E8ECF2' },
  footerItem: {},
  footerLabel: { fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#6B7A99' },
  footerValue: { fontSize: 13, fontWeight: 600, color: '#1B2A4A', marginTop: 2 },
}

const modal = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 },
  box: { background: 'white', borderRadius: 20, width: '100%', maxWidth: 520, maxHeight: '90vh', overflow: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #E8ECF2' },
  title: { fontFamily: "'Oswald', sans-serif", fontSize: 20, fontWeight: 700, color: '#1B2A4A' },
  close: { background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#6B7A99' },
  body: { padding: 24 },
  input: { width: '100%', padding: '10px 14px', borderRadius: 8, border: '2px solid #E8ECF2', fontSize: 14, fontFamily: "'Source Sans 3', sans-serif", color: '#1B2A4A', boxSizing: 'border-box', outline: 'none' },
  footer: { display: 'flex', gap: 12, padding: '16px 24px', borderTop: '1px solid #E8ECF2', justifyContent: 'flex-end' },
  cancel: { padding: '10px 20px', borderRadius: 8, border: '2px solid #E8ECF2', background: 'none', fontSize: 14, cursor: 'pointer', color: '#6B7A99' },
  save: { padding: '10px 24px', borderRadius: 8, background: '#E8883A', color: 'white', border: 'none', fontFamily: "'Oswald', sans-serif", fontSize: 16, fontWeight: 700, cursor: 'pointer' }
}

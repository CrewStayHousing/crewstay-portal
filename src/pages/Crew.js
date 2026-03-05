import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const TRADES = ['electrician','pipefitter','ironworker','operator','laborer','superintendent','foreman','welder','instrumentation','hvac','plumber','carpenter','painter','other']

export default function Crew() {
  const [crew, setCrew] = useState([])
  const [orgs, setOrgs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [search, setSearch] = useState('')
  const [filterTrade, setFilterTrade] = useState('')

  useEffect(() => { loadCrew() }, [])

  async function loadCrew() {
    const [c, o] = await Promise.all([
      supabase.from('crew_members').select('*, organizations(name)').order('last_name'),
      supabase.from('organizations').select('id, name').eq('type', 'epc_company')
    ])
    setCrew(c.data || [])
    setOrgs(o.data || [])
    setLoading(false)
  }

  const filtered = crew.filter(c => {
    const name = `${c.first_name} ${c.last_name}`.toLowerCase()
    const matchSearch = !search || name.includes(search.toLowerCase())
    const matchTrade = !filterTrade || c.trade === filterTrade
    return matchSearch && matchTrade
  })

  const tradeColor = {
    electrician: '#3B82F6', pipefitter: '#8B5CF6', ironworker: '#EF4444',
    operator: '#F59E0B', laborer: '#6B7A99', superintendent: '#1B2A4A',
    foreman: '#0F1E38', welder: '#E8883A', other: '#6B7A99'
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Crew Roster</h1>
          <p style={styles.sub}>{crew.length} crew members</p>
        </div>
        <button style={styles.addBtn} onClick={() => setShowNew(true)}>+ Add Crew Member</button>
      </div>

      <div style={styles.filters}>
        <input style={styles.search} placeholder="🔍 Search by name..." value={search} onChange={e => setSearch(e.target.value)}/>
        <select style={styles.filter} value={filterTrade} onChange={e => setFilterTrade(e.target.value)}>
          <option value="">All Trades</option>
          {TRADES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {loading ? <div style={styles.empty}>Loading...</div> :
        filtered.length === 0 ? <div style={styles.empty}>No crew members found.</div> :
        <div style={styles.table}>
          <div style={styles.thead}>
            <div style={styles.th}>Name</div>
            <div style={styles.th}>Trade</div>
            <div style={styles.th}>Company</div>
            <div style={styles.th}>Employee ID</div>
            <div style={styles.th}>Phone</div>
            <div style={styles.th}>Status</div>
          </div>
          {filtered.map(c => (
            <div key={c.id} style={styles.row}>
              <div style={styles.td}>
                <div style={styles.avatar}>{c.first_name?.charAt(0)}{c.last_name?.charAt(0)}</div>
                <div>
                  <div style={styles.name}>{c.first_name} {c.last_name}</div>
                  <div style={styles.email}>{c.email || '—'}</div>
                </div>
              </div>
              <div style={styles.td}>
                <span style={{ ...styles.trade, background: (tradeColor[c.trade] || '#6B7A99') + '15', color: tradeColor[c.trade] || '#6B7A99' }}>
                  {c.trade}
                </span>
              </div>
              <div style={{ ...styles.td, color: '#6B7A99', fontSize: 14 }}>{c.organizations?.name || '—'}</div>
              <div style={{ ...styles.td, color: '#6B7A99', fontSize: 14 }}>{c.employee_id || '—'}</div>
              <div style={{ ...styles.td, color: '#6B7A99', fontSize: 14 }}>{c.phone || '—'}</div>
              <div style={styles.td}>
                <span style={{ ...styles.status, background: c.is_active ? '#DCFCE7' : '#FEE2E2', color: c.is_active ? '#16A34A' : '#DC2626' }}>
                  {c.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))}
        </div>
      }

      {showNew && <NewCrewModal orgs={orgs} onClose={() => setShowNew(false)} onSave={() => { setShowNew(false); loadCrew() }}/>}
    </div>
  )
}

function NewCrewModal({ orgs, onClose, onSave }) {
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', trade: 'other', employee_id: '', emergency_contact_name: '', emergency_contact_phone: '' })
  const [orgId, setOrgId] = useState('')
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSave() {
    setSaving(true)
    await supabase.from('crew_members').insert({ ...form, organization_id: orgId, is_active: true })
    setSaving(false)
    onSave()
  }

  return (
    <div style={modal.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={modal.box}>
        <div style={modal.header}>
          <div style={modal.title}>Add Crew Member</div>
          <button style={modal.close} onClick={onClose}>✕</button>
        </div>
        <div style={modal.body}>
          <Field label="EPC Company">
            <select style={modal.input} value={orgId} onChange={e => setOrgId(e.target.value)}>
              <option value="">Select company...</option>
              {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="First Name"><input style={modal.input} value={form.first_name} onChange={e => set('first_name', e.target.value)} placeholder="John"/></Field>
            <Field label="Last Name"><input style={modal.input} value={form.last_name} onChange={e => set('last_name', e.target.value)} placeholder="Smith"/></Field>
          </div>
          <Field label="Trade">
            <select style={modal.input} value={form.trade} onChange={e => set('trade', e.target.value)}>
              {TRADES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="Email"><input style={modal.input} value={form.email} onChange={e => set('email', e.target.value)} placeholder="john@company.com"/></Field>
            <Field label="Phone"><input style={modal.input} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="(912) 555-0100"/></Field>
          </div>
          <Field label="Employee ID"><input style={modal.input} value={form.employee_id} onChange={e => set('employee_id', e.target.value)} placeholder="EMP-001"/></Field>
          <Field label="Emergency Contact Name"><input style={modal.input} value={form.emergency_contact_name} onChange={e => set('emergency_contact_name', e.target.value)}/></Field>
          <Field label="Emergency Contact Phone"><input style={modal.input} value={form.emergency_contact_phone} onChange={e => set('emergency_contact_phone', e.target.value)}/></Field>
        </div>
        <div style={modal.footer}>
          <button style={modal.cancel} onClick={onClose}>Cancel</button>
          <button style={modal.save} onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Add Crew Member'}</button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#6B7A99', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  )
}

const styles = {
  page: { flex: 1, padding: 32, background: '#F7F8FA', minHeight: '100vh' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  title: { fontFamily: "'Oswald', sans-serif", fontSize: 28, fontWeight: 700, color: '#1B2A4A', margin: 0 },
  sub: { fontSize: 14, color: '#6B7A99', margin: '4px 0 0' },
  addBtn: { background: '#E8883A', color: 'white', border: 'none', padding: '12px 24px', borderRadius: 8, fontFamily: "'Oswald', sans-serif", fontSize: 16, fontWeight: 700, cursor: 'pointer' },
  filters: { display: 'flex', gap: 12, marginBottom: 20 },
  search: { flex: 1, padding: '10px 16px', borderRadius: 8, border: '2px solid #E8ECF2', fontSize: 14, fontFamily: "'Source Sans 3', sans-serif", outline: 'none' },
  filter: { padding: '10px 16px', borderRadius: 8, border: '2px solid #E8ECF2', fontSize: 14, fontFamily: "'Source Sans 3', sans-serif", outline: 'none', minWidth: 160 },
  empty: { textAlign: 'center', padding: '60px', color: '#6B7A99' },
  table: { background: 'white', borderRadius: 16, border: '2px solid #E8ECF2', overflow: 'hidden' },
  thead: { display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr 1fr 1fr 0.8fr', padding: '12px 20px', background: '#F7F8FA', borderBottom: '1px solid #E8ECF2' },
  th: { fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#6B7A99' },
  row: { display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr 1fr 1fr 0.8fr', padding: '14px 20px', borderBottom: '1px solid #F7F8FA', alignItems: 'center' },
  td: { display: 'flex', alignItems: 'center', gap: 10 },
  avatar: { width: 34, height: 34, borderRadius: '50%', background: '#1B2A4A', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Oswald', sans-serif", fontSize: 12, fontWeight: 700, flexShrink: 0 },
  name: { fontSize: 14, fontWeight: 600, color: '#1B2A4A' },
  email: { fontSize: 12, color: '#6B7A99' },
  trade: { fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4, textTransform: 'uppercase' },
  status: { fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4 }
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

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const SEVERITIES = ['low', 'medium', 'high', 'emergency']
export default function Maintenance() {
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [filterStatus, setFilterStatus] = useState('open')

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    const [r, p] = await Promise.all([
      supabase.from('maintenance_requests').select('*, properties(address, city), bedrooms(room_number)').order('reported_at', { ascending: false }),
      supabase.from('properties').select('id, address, city, bedrooms(id, room_number)').eq('status', 'active')
    ])
    setRequests(r.data || [])
    setProperties(p.data || [])
    setLoading(false)
  }

  async function updateStatus(id, status) {
    await supabase.from('maintenance_requests').update({ status, resolved_at: status === 'resolved' ? new Date().toISOString() : null }).eq('id', id)
    loadAll()
  }

  const filtered = filterStatus === 'all' ? requests : requests.filter(r => r.status === filterStatus)

  const severityColor = { low: '#27AE60', medium: '#F59E0B', high: '#EF4444', emergency: '#DC2626' }
  const statusColor = { open: '#EF4444', in_progress: '#F59E0B', resolved: '#27AE60', closed: '#6B7A99' }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Maintenance</h1>
          <p style={styles.sub}>{requests.filter(r => r.status === 'open').length} open requests</p>
        </div>
        <button style={styles.addBtn} onClick={() => setShowNew(true)}>+ New Request</button>
      </div>

      <div style={styles.tabs}>
        {['open', 'in_progress', 'resolved', 'closed', 'all'].map(s => (
          <button key={s} style={{ ...styles.tab, ...(filterStatus === s ? styles.tabActive : {}) }} onClick={() => setFilterStatus(s)}>
            {s.replace('_', ' ')}
            <span style={styles.tabCount}>{s === 'all' ? requests.length : requests.filter(r => r.status === s).length}</span>
          </button>
        ))}
      </div>

      {loading ? <div style={styles.empty}>Loading...</div> :
        filtered.length === 0 ? <div style={styles.empty}>✅ No {filterStatus} requests.</div> :
        <div style={styles.list}>
          {filtered.map(r => (
            <div key={r.id} style={styles.card}>
              <div style={styles.cardLeft}>
                <div style={{ ...styles.sevDot, background: severityColor[r.severity] }}/>
              </div>
              <div style={{ flex: 1 }}>
                <div style={styles.cardTop}>
                  <div style={styles.reqTitle}>{r.title}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{ ...styles.badge, background: severityColor[r.severity] + '20', color: severityColor[r.severity] }}>{r.severity}</span>
                    <span style={{ ...styles.badge, background: statusColor[r.status] + '20', color: statusColor[r.status] }}>{r.status.replace('_', ' ')}</span>
                  </div>
                </div>
                <div style={styles.location}>
                  📍 {r.properties?.address}, {r.properties?.city}
                  {r.bedrooms?.room_number ? ` · Room ${r.bedrooms.room_number}` : ' · Whole Property'}
                </div>
                {r.description && <div style={styles.desc}>{r.description}</div>}
                <div style={styles.cardFooter}>
                  <div style={styles.reported}>Reported {new Date(r.reported_at).toLocaleDateString()}</div>
                  <div style={styles.actions}>
                    {r.status === 'open' && <button style={styles.actionBtn} onClick={() => updateStatus(r.id, 'in_progress')}>Mark In Progress</button>}
                    {r.status === 'in_progress' && <button style={{ ...styles.actionBtn, background: '#27AE60' }} onClick={() => updateStatus(r.id, 'resolved')}>Mark Resolved</button>}
                    {r.status === 'resolved' && <button style={{ ...styles.actionBtn, background: '#6B7A99' }} onClick={() => updateStatus(r.id, 'closed')}>Close</button>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      }

      {showNew && <NewRequestModal properties={properties} userId={user?.id} onClose={() => setShowNew(false)} onSave={() => { setShowNew(false); loadAll() }}/>}
    </div>
  )
}

function NewRequestModal({ properties, userId, onClose, onSave }) {
  const [form, setForm] = useState({ title: '', description: '', severity: 'medium' })
  const [propertyId, setPropertyId] = useState('')
  const [bedroomId, setBedroomId] = useState('')
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const selectedProp = properties.find(p => p.id === propertyId)

  async function handleSave() {
    setSaving(true)
    await supabase.from('maintenance_requests').insert({
      ...form, property_id: propertyId,
      bedroom_id: bedroomId || null,
      reported_by: userId, status: 'open'
    })
    setSaving(false)
    onSave()
  }

  return (
    <div style={modal.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={modal.box}>
        <div style={modal.header}>
          <div style={modal.title}>New Maintenance Request</div>
          <button style={modal.close} onClick={onClose}>✕</button>
        </div>
        <div style={modal.body}>
          <Field label="Property">
            <select style={modal.input} value={propertyId} onChange={e => { setPropertyId(e.target.value); setBedroomId('') }}>
              <option value="">Select property...</option>
              {properties.map(p => <option key={p.id} value={p.id}>{p.address}, {p.city}</option>)}
            </select>
          </Field>
          {selectedProp?.bedrooms?.length > 0 && (
            <Field label="Bedroom (optional)">
              <select style={modal.input} value={bedroomId} onChange={e => setBedroomId(e.target.value)}>
                <option value="">Whole property</option>
                {selectedProp.bedrooms.map(b => <option key={b.id} value={b.id}>Room {b.room_number}</option>)}
              </select>
            </Field>
          )}
          <Field label="Issue Title"><input style={modal.input} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Hot water not working"/></Field>
          <Field label="Severity">
            <select style={modal.input} value={form.severity} onChange={e => set('severity', e.target.value)}>
              {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Description">
            <textarea style={{ ...modal.input, height: 100, resize: 'vertical' }} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describe the issue in detail..."/>
          </Field>
        </div>
        <div style={modal.footer}>
          <button style={modal.cancel} onClick={onClose}>Cancel</button>
          <button style={modal.save} onClick={handleSave} disabled={saving || !propertyId || !form.title}>{saving ? 'Submitting...' : 'Submit Request'}</button>
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
  tabs: { display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' },
  tab: { padding: '8px 16px', borderRadius: 8, border: '2px solid #E8ECF2', background: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#6B7A99', display: 'flex', alignItems: 'center', gap: 8, textTransform: 'capitalize' },
  tabActive: { background: '#1B2A4A', color: 'white', borderColor: '#1B2A4A' },
  tabCount: { background: 'rgba(255,255,255,0.2)', borderRadius: 10, padding: '1px 6px', fontSize: 11, fontWeight: 700 },
  empty: { textAlign: 'center', padding: '60px', color: '#6B7A99' },
  list: { display: 'flex', flexDirection: 'column', gap: 12 },
  card: { background: 'white', borderRadius: 14, border: '2px solid #E8ECF2', padding: '20px 24px', display: 'flex', gap: 16 },
  cardLeft: { paddingTop: 4 },
  sevDot: { width: 10, height: 10, borderRadius: '50%', flexShrink: 0 },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  reqTitle: { fontFamily: "'Oswald', sans-serif", fontSize: 17, fontWeight: 700, color: '#1B2A4A' },
  badge: { fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4, textTransform: 'uppercase' },
  location: { fontSize: 13, color: '#6B7A99', marginBottom: 6 },
  desc: { fontSize: 14, color: '#6B7A99', marginBottom: 10 },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  reported: { fontSize: 12, color: '#6B7A99' },
  actions: { display: 'flex', gap: 8 },
  actionBtn: { padding: '6px 14px', borderRadius: 6, background: '#E8883A', color: 'white', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer' }
}

const modal = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 },
  box: { background: 'white', borderRadius: 20, width: '100%', maxWidth: 480, maxHeight: '90vh', overflow: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #E8ECF2' },
  title: { fontFamily: "'Oswald', sans-serif", fontSize: 20, fontWeight: 700, color: '#1B2A4A' },
  close: { background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#6B7A99' },
  body: { padding: 24 },
  input: { width: '100%', padding: '10px 14px', borderRadius: 8, border: '2px solid #E8ECF2', fontSize: 14, fontFamily: "'Source Sans 3', sans-serif", color: '#1B2A4A', boxSizing: 'border-box', outline: 'none' },
  footer: { display: 'flex', gap: 12, padding: '16px 24px', borderTop: '1px solid #E8ECF2', justifyContent: 'flex-end' },
  cancel: { padding: '10px 20px', borderRadius: 8, border: '2px solid #E8ECF2', background: 'none', fontSize: 14, cursor: 'pointer', color: '#6B7A99' },
  save: { padding: '10px 24px', borderRadius: 8, background: '#E8883A', color: 'white', border: 'none', fontFamily: "'Oswald', sans-serif", fontSize: 16, fontWeight: 700, cursor: 'pointer' }
}

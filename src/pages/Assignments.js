import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function Assignments() {
  const { user } = useAuth()
  const [assignments, setAssignments] = useState([])
  const [projects, setProjects] = useState([])
  const [properties, setProperties] = useState([])
  const [crew, setCrew] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAssign, setShowAssign] = useState(false)
  const [swapTarget, setSwapTarget] = useState(null)
  const [filterProject, setFilterProject] = useState('')

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    const [a, p, props, c] = await Promise.all([
      supabase.from('v_active_assignments').select('*').order('property_address'),
      supabase.from('projects').select('id, name, project_code').eq('status', 'active'),
      supabase.from('properties').select('id, address, city, bedrooms').eq('status', 'active'),
      supabase.from('crew_members').select('id, first_name, last_name, trade, employee_id').eq('is_active', true),
    ])
    setAssignments(a.data || [])
    setProjects(p.data || [])
    setProperties(props.data || [])
    setCrew(c.data || [])
    setLoading(false)
  }

  async function handleSwap(assignment, newCrewId, reason, notes) {
    // Complete old assignment
    await supabase.from('assignments').update({
      status: 'completed',
      end_month: new Date().toISOString().slice(0, 10),
      swap_reason: reason,
      swap_notes: notes
    }).eq('id', assignment.assignment_id)

    // Create new assignment
    await supabase.from('assignments').insert({
      bedroom_id: assignment.bedroom_id,
      crew_member_id: newCrewId,
      project_id: assignment.project_id,
      assigned_by: user.id,
      status: 'active',
      start_month: new Date().toISOString().slice(0, 10)
    })

    setSwapTarget(null)
    loadAll()
  }

  async function handleRemove(assignment, reason, notes) {
    await supabase.from('assignments').update({
      status: 'completed',
      end_month: new Date().toISOString().slice(0, 10),
      swap_reason: reason,
      swap_notes: notes
    }).eq('id', assignment.assignment_id)
    loadAll()
  }

  const filtered = filterProject ? assignments.filter(a => a.project_id === filterProject) : assignments

  // Group by property
  const byProperty = filtered.reduce((acc, a) => {
    const key = a.property_id
    if (!acc[key]) acc[key] = { address: a.property_address, city: a.property_city, assignments: [] }
    acc[key].assignments.push(a)
    return acc
  }, {})

  const tradeColor = {
    electrician: '#3B82F6', pipefitter: '#8B5CF6', ironworker: '#EF4444',
    operator: '#F59E0B', laborer: '#6B7A99', superintendent: '#1B2A4A',
    foreman: '#0F1E38', welder: '#E8883A', other: '#6B7A99'
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Assignments</h1>
          <p style={styles.sub}>{assignments.length} active beds occupied</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <select style={styles.filter} value={filterProject} onChange={e => setFilterProject(e.target.value)}>
            <option value="">All Projects</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.project_code} — {p.name}</option>)}
          </select>
          <button style={styles.addBtn} onClick={() => setShowAssign(true)}>+ Assign Bed</button>
        </div>
      </div>

      {loading ? <div style={styles.empty}>Loading assignments...</div> :
        Object.keys(byProperty).length === 0 ? <div style={styles.empty}>No active assignments. Assign your first crew member above.</div> :
        Object.values(byProperty).map((prop, pi) => (
          <div key={pi} style={styles.propGroup}>
            <div style={styles.propHeader}>
              <div style={styles.propIcon}>🏠</div>
              <div>
                <div style={styles.propAddress}>{prop.address}</div>
                <div style={styles.propCity}>{prop.city}</div>
              </div>
              <div style={styles.propBedCount}>{prop.assignments.length} occupied</div>
            </div>
            <div style={styles.bedGrid}>
              {prop.assignments.map(a => (
                <div key={a.assignment_id} style={styles.bedCard}>
                  <div style={styles.bedHeader}>
                    <div style={styles.roomNum}>Room {a.room_number}</div>
                    <div style={{ ...styles.tradeBadge, background: (tradeColor[a.trade] || '#6B7A99') + '20', color: tradeColor[a.trade] || '#6B7A99' }}>
                      {a.trade}
                    </div>
                  </div>
                  <div style={styles.crewName}>{a.first_name} {a.last_name}</div>
                  <div style={styles.crewProject}>{a.project_code}</div>
                  <div style={styles.crewRate}>${a.monthly_client_rate?.toLocaleString()}/mo</div>
                  <div style={styles.bedActions}>
                    <button style={styles.swapBtn} onClick={() => setSwapTarget(a)}>⇄ Swap</button>
                    <button style={styles.removeBtn} onClick={() => {
                      if (window.confirm('Remove this crew member from this bed?')) handleRemove(a, 'rotation', '')
                    }}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      }

      {showAssign && (
        <AssignModal
          projects={projects}
          properties={properties}
          crew={crew}
          userId={user.id}
          onClose={() => setShowAssign(false)}
          onSave={() => { setShowAssign(false); loadAll() }}
        />
      )}

      {swapTarget && (
        <SwapModal
          assignment={swapTarget}
          crew={crew}
          onClose={() => setSwapTarget(null)}
          onSwap={handleSwap}
        />
      )}
    </div>
  )
}

function AssignModal({ projects, properties, crew, userId, onClose, onSave }) {
  const [projectId, setProjectId] = useState('')
  const [propertyId, setPropertyId] = useState('')
  const [bedrooms, setBedrooms] = useState([])
  const [bedroomId, setBedroomId] = useState('')
  const [crewId, setCrewId] = useState('')
  const [saving, setSaving] = useState(false)

  async function loadBedrooms(propId) {
    setPropertyId(propId)
    const { data } = await supabase.from('bedrooms').select('*').eq('property_id', propId).eq('status', 'available')
    setBedrooms(data || [])
    setBedroomId('')
  }

  async function handleSave() {
    setSaving(true)
    const startMonth = new Date()
    startMonth.setDate(1)
    await supabase.from('assignments').insert({
      bedroom_id: bedroomId,
      crew_member_id: crewId,
      project_id: projectId,
      assigned_by: userId,
      status: 'active',
      start_month: startMonth.toISOString().slice(0, 10)
    })
    setSaving(false)
    onSave()
  }

  return (
    <div style={modal.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={modal.box}>
        <div style={modal.header}>
          <div style={modal.title}>Assign Bed</div>
          <button style={modal.close} onClick={onClose}>✕</button>
        </div>
        <div style={modal.body}>
          <Field label="Project">
            <select style={modal.input} value={projectId} onChange={e => setProjectId(e.target.value)}>
              <option value="">Select project...</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.project_code} — {p.name}</option>)}
            </select>
          </Field>
          <Field label="Property">
            <select style={modal.input} value={propertyId} onChange={e => loadBedrooms(e.target.value)}>
              <option value="">Select property...</option>
              {properties.map(p => <option key={p.id} value={p.id}>{p.address}, {p.city}</option>)}
            </select>
          </Field>
          <Field label="Available Bedroom">
            <select style={modal.input} value={bedroomId} onChange={e => setBedroomId(e.target.value)}>
              <option value="">Select room...</option>
              {bedrooms.map(b => <option key={b.id} value={b.id}>Room {b.room_number} — Floor {b.floor}</option>)}
            </select>
          </Field>
          <Field label="Crew Member">
            <select style={modal.input} value={crewId} onChange={e => setCrewId(e.target.value)}>
              <option value="">Select crew member...</option>
              {crew.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name} — {c.trade}</option>)}
            </select>
          </Field>
        </div>
        <div style={modal.footer}>
          <button style={modal.cancel} onClick={onClose}>Cancel</button>
          <button style={modal.save} onClick={handleSave} disabled={saving || !bedroomId || !crewId || !projectId}>
            {saving ? 'Assigning...' : 'Assign Bed'}
          </button>
        </div>
      </div>
    </div>
  )
}

function SwapModal({ assignment, crew, onClose, onSwap }) {
  const [newCrewId, setNewCrewId] = useState('')
  const [reason, setReason] = useState('rotation')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const REASONS = ['rotation', 'termination', 'injury', 'project_reassignment', 'voluntary_exit', 'other']

  async function handleSwap() {
    setSaving(true)
    await onSwap(assignment, newCrewId, reason, notes)
    setSaving(false)
  }

  return (
    <div style={modal.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={modal.box}>
        <div style={modal.header}>
          <div style={modal.title}>Swap Crew Member</div>
          <button style={modal.close} onClick={onClose}>✕</button>
        </div>
        <div style={modal.body}>
          <div style={{ background: '#F7F8FA', borderRadius: 10, padding: 16, marginBottom: 20, fontSize: 14 }}>
            <div style={{ fontWeight: 700, color: '#1B2A4A', marginBottom: 4 }}>Current: {assignment.first_name} {assignment.last_name}</div>
            <div style={{ color: '#6B7A99' }}>Room {assignment.room_number} · {assignment.property_address}</div>
          </div>
          <Field label="Replace With">
            <select style={modal.input} value={newCrewId} onChange={e => setNewCrewId(e.target.value)}>
              <option value="">Select crew member...</option>
              {crew.filter(c => c.id !== assignment.crew_member_id).map(c => (
                <option key={c.id} value={c.id}>{c.first_name} {c.last_name} — {c.trade}</option>
              ))}
            </select>
          </Field>
          <Field label="Reason for Swap">
            <select style={modal.input} value={reason} onChange={e => setReason(e.target.value)}>
              {REASONS.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
            </select>
          </Field>
          <Field label="Notes (Optional)">
            <textarea style={{ ...modal.input, height: 80, resize: 'vertical' }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any additional context..."/>
          </Field>
        </div>
        <div style={modal.footer}>
          <button style={modal.cancel} onClick={onClose}>Cancel</button>
          <button style={modal.save} onClick={handleSwap} disabled={saving || !newCrewId}>
            {saving ? 'Swapping...' : '⇄ Execute Swap'}
          </button>
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
  filter: { padding: '10px 16px', borderRadius: 8, border: '2px solid #E8ECF2', fontSize: 14, fontFamily: "'Source Sans 3', sans-serif", color: '#1B2A4A', outline: 'none', minWidth: 200 },
  addBtn: { background: '#E8883A', color: 'white', border: 'none', padding: '12px 24px', borderRadius: 8, fontFamily: "'Oswald', sans-serif", fontSize: 16, fontWeight: 700, cursor: 'pointer' },
  empty: { textAlign: 'center', padding: '60px 20px', color: '#6B7A99', fontSize: 15 },
  propGroup: { background: 'white', borderRadius: 16, border: '2px solid #E8ECF2', marginBottom: 20, overflow: 'hidden' },
  propHeader: { display: 'flex', alignItems: 'center', gap: 14, padding: '18px 24px', borderBottom: '1px solid #E8ECF2', background: '#FAFBFD' },
  propIcon: { fontSize: 24 },
  propAddress: { fontFamily: "'Oswald', sans-serif", fontSize: 17, fontWeight: 700, color: '#1B2A4A' },
  propCity: { fontSize: 13, color: '#6B7A99', marginTop: 2 },
  propBedCount: { marginLeft: 'auto', fontSize: 13, fontWeight: 700, color: '#E8883A', background: '#FFF4EE', padding: '4px 12px', borderRadius: 6 },
  bedGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, padding: 20 },
  bedCard: { background: '#F7F8FA', borderRadius: 12, padding: 18, border: '1px solid #E8ECF2' },
  bedHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  roomNum: { fontFamily: "'Oswald', sans-serif", fontSize: 13, fontWeight: 700, color: '#6B7A99', textTransform: 'uppercase', letterSpacing: 0.5 },
  tradeBadge: { fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase' },
  crewName: { fontFamily: "'Oswald', sans-serif", fontSize: 18, fontWeight: 700, color: '#1B2A4A', marginBottom: 4 },
  crewProject: { fontSize: 12, color: '#E8883A', fontWeight: 700, marginBottom: 4 },
  crewRate: { fontSize: 13, color: '#6B7A99', marginBottom: 14 },
  bedActions: { display: 'flex', gap: 8 },
  swapBtn: { flex: 1, padding: '7px 0', borderRadius: 6, background: '#1B2A4A', color: 'white', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer' },
  removeBtn: { flex: 1, padding: '7px 0', borderRadius: 6, background: 'none', color: '#EF4444', border: '1px solid #EF4444', fontSize: 12, fontWeight: 600, cursor: 'pointer' }
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

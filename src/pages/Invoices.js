import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Invoices() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [lineItems, setLineItems] = useState([])

  useEffect(() => { loadInvoices() }, [])

  async function loadInvoices() {
    const { data } = await supabase
      .from('invoices')
      .select('*, projects(name, project_code), organizations(name)')
      .order('created_at', { ascending: false })
    setInvoices(data || [])
    setLoading(false)
  }

  async function viewInvoice(inv) {
    setSelected(inv)
    const { data } = await supabase
      .from('invoice_line_items')
      .select('*, crew_members(first_name, last_name), properties(address), bedrooms(room_number)')
      .eq('invoice_id', inv.id)
    setLineItems(data || [])
  }

  const statusColor = { draft: '#6B7A99', sent: '#3B82F6', paid: '#27AE60', overdue: '#EF4444', void: '#6B7A99' }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Invoices</h1>
          <p style={styles.sub}>{invoices.length} total invoices</p>
        </div>
      </div>

      {loading ? <div style={styles.empty}>Loading...</div> :
        invoices.length === 0 ? <div style={styles.empty}>No invoices yet. Invoices are generated automatically at month end.</div> :
        <div style={styles.table}>
          <div style={styles.thead}>
            <div style={styles.th}>Invoice #</div>
            <div style={styles.th}>Project</div>
            <div style={styles.th}>Company</div>
            <div style={styles.th}>Billing Month</div>
            <div style={styles.th}>Total</div>
            <div style={styles.th}>Due Date</div>
            <div style={styles.th}>Status</div>
            <div style={styles.th}></div>
          </div>
          {invoices.map(inv => (
            <div key={inv.id} style={styles.row}>
              <div style={{ ...styles.td, fontFamily: "'Oswald', sans-serif", fontWeight: 700, color: '#E8883A' }}>{inv.invoice_number}</div>
              <div style={styles.td}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1B2A4A' }}>{inv.projects?.name}</div>
                <div style={{ fontSize: 11, color: '#E8883A', fontWeight: 700 }}>{inv.projects?.project_code}</div>
              </div>
              <div style={{ ...styles.td, fontSize: 14, color: '#6B7A99' }}>{inv.organizations?.name}</div>
              <div style={{ ...styles.td, fontSize: 14, color: '#6B7A99' }}>{new Date(inv.billing_month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
              <div style={{ ...styles.td, fontFamily: "'Oswald', sans-serif", fontSize: 18, fontWeight: 700, color: '#1B2A4A' }}>${inv.total?.toLocaleString()}</div>
              <div style={{ ...styles.td, fontSize: 14, color: '#6B7A99' }}>{inv.due_date || '—'}</div>
              <div style={styles.td}>
                <span style={{ ...styles.badge, background: statusColor[inv.status] + '20', color: statusColor[inv.status] }}>{inv.status}</span>
              </div>
              <div style={styles.td}>
                <button style={styles.viewBtn} onClick={() => viewInvoice(inv)}>View →</button>
              </div>
            </div>
          ))}
        </div>
      }

      {selected && (
        <div style={modal.overlay} onClick={e => e.target === e.currentTarget && setSelected(null)}>
          <div style={modal.box}>
            <div style={modal.header}>
              <div>
                <div style={modal.title}>{selected.invoice_number}</div>
                <div style={{ fontSize: 13, color: '#6B7A99', marginTop: 2 }}>{selected.projects?.name} · {selected.organizations?.name}</div>
              </div>
              <button style={modal.close} onClick={() => setSelected(null)}>✕</button>
            </div>
            <div style={modal.body}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
                {[
                  { label: 'Billing Month', value: new Date(selected.billing_month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) },
                  { label: 'Due Date', value: selected.due_date || 'Net-30' },
                  { label: 'Status', value: selected.status?.toUpperCase() },
                ].map(item => (
                  <div key={item.label} style={{ background: '#F7F8FA', borderRadius: 10, padding: 16 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#6B7A99', marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#1B2A4A' }}>{item.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ borderRadius: 10, border: '1px solid #E8ECF2', overflow: 'hidden', marginBottom: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '10px 16px', background: '#F7F8FA', borderBottom: '1px solid #E8ECF2' }}>
                  {['Description', 'Property', 'Room', 'Amount'].map(h => (
                    <div key={h} style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#6B7A99' }}>{h}</div>
                  ))}
                </div>
                {lineItems.length === 0 ? <div style={{ padding: '20px 16px', color: '#6B7A99', fontSize: 14 }}>No line items.</div> :
                  lineItems.map(li => (
                    <div key={li.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '12px 16px', borderBottom: '1px solid #F7F8FA', fontSize: 14 }}>
                      <div style={{ fontWeight: 600, color: '#1B2A4A' }}>{li.crew_members?.first_name} {li.crew_members?.last_name}</div>
                      <div style={{ color: '#6B7A99' }}>{li.properties?.address}</div>
                      <div style={{ color: '#6B7A99' }}>Room {li.bedrooms?.room_number}</div>
                      <div style={{ fontWeight: 700, color: '#1B2A4A' }}>${li.amount?.toLocaleString()}</div>
                    </div>
                  ))
                }
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, color: '#6B7A99', marginBottom: 4 }}>Total Due</div>
                  <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 32, fontWeight: 700, color: '#1B2A4A' }}>${selected.total?.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  page: { flex: 1, padding: 32, background: '#F7F8FA', minHeight: '100vh' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  title: { fontFamily: "'Oswald', sans-serif", fontSize: 28, fontWeight: 700, color: '#1B2A4A', margin: 0 },
  sub: { fontSize: 14, color: '#6B7A99', margin: '4px 0 0' },
  empty: { textAlign: 'center', padding: '60px', color: '#6B7A99', fontSize: 15 },
  table: { background: 'white', borderRadius: 16, border: '2px solid #E8ECF2', overflow: 'hidden' },
  thead: { display: 'grid', gridTemplateColumns: '1fr 2fr 1.5fr 1fr 1fr 1fr 0.8fr 0.5fr', padding: '12px 20px', background: '#F7F8FA', borderBottom: '1px solid #E8ECF2' },
  th: { fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#6B7A99' },
  row: { display: 'grid', gridTemplateColumns: '1fr 2fr 1.5fr 1fr 1fr 1fr 0.8fr 0.5fr', padding: '16px 20px', borderBottom: '1px solid #F7F8FA', alignItems: 'center' },
  td: { display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  badge: { fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4, textTransform: 'uppercase', display: 'inline-block' },
  viewBtn: { background: 'none', border: 'none', color: '#E8883A', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }
}

const modal = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 },
  box: { background: 'white', borderRadius: 20, width: '100%', maxWidth: 700, maxHeight: '90vh', overflow: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '24px 28px', borderBottom: '1px solid #E8ECF2' },
  title: { fontFamily: "'Oswald', sans-serif", fontSize: 22, fontWeight: 700, color: '#1B2A4A' },
  close: { background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#6B7A99' },
  body: { padding: 28 }
}

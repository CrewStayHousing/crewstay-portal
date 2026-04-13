import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const HOTEL_RATE = 169 // GSA per diem Savannah-area extended stay

export default function Reports() {
  const [tab, setTab] = useState('pm')
  const [projects, setProjects] = useState([])
  const [invoices, setInvoices] = useState([])
  const [assignments, setAssignments] = useState([])
  const [properties, setProperties] = useState([])
  const [remittances, setRemittances] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    const [
      { data: proj },
      { data: inv },
      { data: asgn },
      { data: props },
      { data: remit },
    ] = await Promise.all([
      supabase.from('projects').select('*, organizations(name)').order('name'),
      supabase.from('invoices').select('*, projects(name, project_code), organizations(name)').order('billing_month', { ascending: false }),
      supabase.from('assignments').select('*, crew_members(first_name, last_name, trade, organization_id, organizations(name)), bedrooms(room_number, property_id, properties(address, city, bedrooms, monthly_client_rate, monthly_landlord_rate)), projects(name, project_code)').eq('status', 'active'),
      supabase.from('properties').select('*'),
      supabase.from('landlord_remittances').select('*, properties(address, city, bedrooms)').order('remittance_month', { ascending: false }),
    ])

    const projList = proj || []
    setProjects(projList)
    setInvoices(inv || [])
    setAssignments(asgn || [])
    setProperties(props || [])
    setRemittances(remit || [])
    setSelectedProject(projList[0]?.id || null)
    setLoading(false)
  }

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: '#6B7A99', fontFamily: "'Oswald', sans-serif", fontSize: 18 }}>Loading reports...</div>

  // ── Derived data ──────────────────────────────────────────────────────────
  const totalBeds = properties.reduce((s, p) => s + p.bedrooms, 0)
  const totalMonthlyBilling = properties.reduce((s, p) => s + Number(p.monthly_client_rate), 0)
  const totalMonthlyRemittance = properties.reduce((s, p) => s + Number(p.monthly_landlord_rate), 0)
  const totalSpread = totalMonthlyBilling - totalMonthlyRemittance
  const hotelBaseline = totalBeds * HOTEL_RATE * 30
  const monthlySavings = hotelBaseline - totalMonthlyBilling
  const savingsPct = Math.round((monthlySavings / hotelBaseline) * 100)

  const paidInvoices = invoices.filter(i => i.status === 'paid')
  const outstandingInvoices = invoices.filter(i => ['sent', 'overdue'].includes(i.status))
  const totalCollected = paidInvoices.reduce((s, i) => s + Number(i.total), 0)
  const totalOutstanding = outstandingInvoices.reduce((s, i) => s + Number(i.total), 0)

  const projectAssignments = assignments.filter(a => a.project_id === selectedProject)
  const selProject = projects.find(p => p.id === selectedProject)

  // Beds contracted for selected project
  const projectPropertyIds = [...new Set(projectAssignments.map(a => a.bedrooms?.property_id).filter(Boolean))]
  const projectProperties = properties.filter(p => projectPropertyIds.includes(p.id))
  const contractedBeds = projectProperties.reduce((s, p) => s + p.bedrooms, 0)
  const occupiedBeds = projectAssignments.length
  const projectMonthlyBilling = projectProperties.reduce((s, p) => s + Number(p.monthly_client_rate), 0)
  const projectHotelBaseline = occupiedBeds * HOTEL_RATE * 30
  const projectSavings = projectHotelBaseline - projectMonthlyBilling
  const projectSavingsPct = projectHotelBaseline > 0 ? Math.round((projectSavings / projectHotelBaseline) * 100) : 0

  const TABS = [
    { id: 'pm', label: 'PM Cost Report', icon: '📋' },
    { id: 'ar', label: 'AR Invoice Summary', icon: '🧾' },
    { id: 'exec', label: 'Executive Brief', icon: '📊' },
  ]

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <div>
          <h1 style={S.title}>Reports</h1>
          <p style={S.sub}>Portfolio performance · {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      {/* Tab Bar */}
      <div style={S.tabBar}>
        {TABS.map(t => (
          <button key={t.id} style={{ ...S.tab, ...(tab === t.id ? S.tabActive : {}) }} onClick={() => setTab(t.id)}>
            <span style={{ marginRight: 6 }}>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* ── PM COST REPORT ───────────────────────────────────────────────── */}
      {tab === 'pm' && (
        <div>
          {/* Project Selector */}
          <div style={S.section}>
            <div style={S.sectionLabel}>Select Project</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {projects.map(p => (
                <button key={p.id} style={{ ...S.projBtn, ...(selectedProject === p.id ? S.projBtnActive : {}) }} onClick={() => setSelectedProject(p.id)}>
                  <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.75 }}>{p.project_code}</div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{p.name}</div>
                  <div style={{ fontSize: 11, opacity: 0.75, marginTop: 2 }}>{p.organizations?.name}</div>
                </button>
              ))}
            </div>
          </div>

          {selProject && (
            <>
              {/* Project KPIs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
                {[
                  { label: 'Contracted Beds', value: contractedBeds, color: '#1B2A4A' },
                  { label: 'Occupied Beds', value: `${occupiedBeds} / ${contractedBeds}`, color: '#E8883A' },
                  { label: 'Monthly Cost', value: `$${projectMonthlyBilling.toLocaleString()}`, color: '#1B2A4A' },
                  { label: 'vs Hotel Baseline', value: projectSavings > 0 ? `$${projectSavings.toLocaleString()} saved` : '—', color: '#27AE60' },
                ].map(k => (
                  <div key={k.label} style={S.kpi}>
                    <div style={S.kpiLabel}>{k.label}</div>
                    <div style={{ ...S.kpiVal, color: k.color }}>{k.value}</div>
                  </div>
                ))}
              </div>

              {/* Hotel Savings Banner */}
              {projectSavings > 0 && (
                <div style={S.savingsBanner}>
                  <div>
                    <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 15, fontWeight: 700, color: '#0F4A2C', marginBottom: 4 }}>
                      COST AVOIDANCE vs. HOTEL — {selProject?.name}
                    </div>
                    <div style={{ fontSize: 13, color: '#1A7A4A' }}>
                      GSA extended-stay baseline @ ${HOTEL_RATE}/night · {occupiedBeds} crew · 30-day month
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 32, fontWeight: 700, color: '#27AE60' }}>${projectSavings.toLocaleString()}</div>
                    <div style={{ fontSize: 12, color: '#1A7A4A', fontWeight: 700 }}>{projectSavingsPct}% below hotel rate</div>
                  </div>
                </div>
              )}

              {/* Crew Roster Table */}
              <div style={S.tableCard}>
                <div style={S.tableHeader}>
                  <div style={S.tableTitle}>Crew Roster — {selProject?.name}</div>
                  <div style={{ fontSize: 13, color: '#6B7A99' }}>{projectAssignments.length} assigned</div>
                </div>
                <div style={S.thead}>
                  {['Crew Member', 'Trade', 'Property', 'Room', 'Assigned'].map(h => (
                    <div key={h} style={S.th}>{h}</div>
                  ))}
                </div>
                {projectAssignments.length === 0
                  ? <div style={{ padding: '24px 20px', color: '#6B7A99', fontSize: 14 }}>No active assignments for this project.</div>
                  : projectAssignments.map(a => (
                    <div key={a.id} style={S.tr}>
                      <div style={{ fontWeight: 700, color: '#1B2A4A', fontSize: 14 }}>
                        {a.crew_members?.first_name} {a.crew_members?.last_name}
                      </div>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 700, background: '#E8ECF2', color: '#1B2A4A', padding: '2px 7px', borderRadius: 4, textTransform: 'uppercase' }}>
                          {a.crew_members?.trade}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: '#6B7A99' }}>{a.bedrooms?.properties?.address}</div>
                      <div style={{ fontSize: 13, color: '#6B7A99' }}>Room {a.bedrooms?.room_number}</div>
                      <div style={{ fontSize: 12, color: '#9CA3AF' }}>{a.start_month ? new Date(a.start_month).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</div>
                    </div>
                  ))
                }
              </div>

              {/* Property Cost Breakdown */}
              <div style={S.tableCard}>
                <div style={S.tableHeader}>
                  <div style={S.tableTitle}>Property Cost Breakdown</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '10px 20px', background: '#F7F8FA', borderBottom: '1px solid #E8ECF2' }}>
                  {['Property', 'Beds', 'Monthly Cost', 'Cost/Bed/Night'].map(h => (
                    <div key={h} style={S.th}>{h}</div>
                  ))}
                </div>
                {projectProperties.map(p => (
                  <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '14px 20px', borderBottom: '1px solid #F7F8FA', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#1B2A4A', fontSize: 14 }}>{p.address}</div>
                      <div style={{ fontSize: 12, color: '#6B7A99' }}>{p.city}, GA</div>
                    </div>
                    <div style={{ fontWeight: 700, color: '#1B2A4A' }}>{p.bedrooms}</div>
                    <div style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, color: '#1B2A4A' }}>${Number(p.monthly_client_rate).toLocaleString()}</div>
                    <div style={{ color: '#6B7A99', fontWeight: 600 }}>${(Number(p.monthly_client_rate) / p.bedrooms / 30).toFixed(2)}/night</div>
                  </div>
                ))}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '14px 20px', background: '#F7F8FA', borderTop: '2px solid #E8ECF2' }}>
                  <div style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, color: '#1B2A4A' }}>TOTAL</div>
                  <div style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, color: '#1B2A4A' }}>{contractedBeds}</div>
                  <div style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, color: '#1B2A4A' }}>${projectMonthlyBilling.toLocaleString()}</div>
                  <div style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, color: '#6B7A99' }}>${(projectMonthlyBilling / contractedBeds / 30).toFixed(2)}/night avg</div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── AR INVOICE SUMMARY ───────────────────────────────────────────── */}
      {tab === 'ar' && (
        <div>
          {/* AR KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Total Invoiced (All Time)', value: `$${(totalCollected + totalOutstanding).toLocaleString()}`, color: '#1B2A4A' },
              { label: 'Collected', value: `$${totalCollected.toLocaleString()}`, color: '#27AE60' },
              { label: 'Outstanding', value: `$${totalOutstanding.toLocaleString()}`, color: outstandingInvoices.some(i => i.status === 'overdue') ? '#EF4444' : '#E8883A' },
              { label: 'Overdue', value: invoices.filter(i => i.status === 'overdue').length + ' invoice(s)', color: '#EF4444' },
            ].map(k => (
              <div key={k.label} style={S.kpi}>
                <div style={S.kpiLabel}>{k.label}</div>
                <div style={{ ...S.kpiVal, color: k.color }}>{k.value}</div>
              </div>
            ))}
          </div>

          {/* Invoice Table */}
          <div style={S.tableCard}>
            <div style={S.tableHeader}>
              <div style={S.tableTitle}>Invoice Register</div>
              <div style={{ fontSize: 13, color: '#6B7A99' }}>{invoices.length} invoices</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr 1.5fr 1fr 1fr 1fr 0.8fr', padding: '10px 20px', background: '#F7F8FA', borderBottom: '1px solid #E8ECF2' }}>
              {['Invoice #', 'Project', 'Company', 'Billing Month', 'Total', 'Due Date', 'Status'].map(h => (
                <div key={h} style={S.th}>{h}</div>
              ))}
            </div>
            {invoices.map(inv => (
              <div key={inv.id} style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr 1.5fr 1fr 1fr 1fr 0.8fr', padding: '14px 20px', borderBottom: '1px solid #F7F8FA', alignItems: 'center' }}>
                <div style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, color: '#E8883A', fontSize: 13 }}>{inv.invoice_number}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1B2A4A' }}>{inv.projects?.name}</div>
                  <div style={{ fontSize: 11, color: '#E8883A', fontWeight: 700 }}>{inv.projects?.project_code}</div>
                </div>
                <div style={{ fontSize: 13, color: '#6B7A99' }}>{inv.organizations?.name}</div>
                <div style={{ fontSize: 13, color: '#6B7A99' }}>{new Date(inv.billing_month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
                <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 16, fontWeight: 700, color: '#1B2A4A' }}>${Number(inv.total).toLocaleString()}</div>
                <div style={{ fontSize: 12, color: '#6B7A99' }}>{inv.due_date}</div>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4, textTransform: 'uppercase', background: STATUS_BG[inv.status], color: STATUS_COLOR[inv.status] }}>
                    {inv.status}
                  </span>
                </div>
              </div>
            ))}
            {/* Totals Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr 1.5fr 1fr 1fr 1fr 0.8fr', padding: '16px 20px', background: '#F7F8FA', borderTop: '2px solid #E8ECF2' }}>
              <div style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, color: '#1B2A4A', gridColumn: '1/5' }}>TOTAL BILLED</div>
              <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 18, fontWeight: 700, color: '#1B2A4A' }}>${invoices.reduce((s, i) => s + Number(i.total), 0).toLocaleString()}</div>
            </div>
          </div>

          {/* Landlord Remittance Summary */}
          <div style={S.tableCard}>
            <div style={S.tableHeader}>
              <div style={S.tableTitle}>Landlord Remittance Register</div>
              <div style={{ fontSize: 13, color: '#6B7A99' }}>{remittances.length} remittances</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 0.8fr', padding: '10px 20px', background: '#F7F8FA', borderBottom: '1px solid #E8ECF2' }}>
              {['Property', 'Month', 'Beds', 'Amount', 'Status'].map(h => (
                <div key={h} style={S.th}>{h}</div>
              ))}
            </div>
            {remittances.map(r => (
              <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 0.8fr', padding: '14px 20px', borderBottom: '1px solid #F7F8FA', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1B2A4A' }}>{r.properties?.address}</div>
                  <div style={{ fontSize: 11, color: '#6B7A99' }}>{r.properties?.city}, GA</div>
                </div>
                <div style={{ fontSize: 13, color: '#6B7A99' }}>{new Date(r.remittance_month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
                <div style={{ fontWeight: 600, color: '#1B2A4A' }}>{r.total_beds_available}</div>
                <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 16, fontWeight: 700, color: '#1B2A4A' }}>${Number(r.total_amount).toLocaleString()}</div>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4, textTransform: 'uppercase', background: r.status === 'paid' ? '#E8F7EF' : '#FFF7ED', color: r.status === 'paid' ? '#27AE60' : '#E8883A' }}>
                    {r.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── EXECUTIVE BRIEF ──────────────────────────────────────────────── */}
      {tab === 'exec' && (
        <div>
          {/* Executive KPI Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
            <div style={{ ...S.execKpi, gridColumn: '1/2' }}>
              <div style={S.execKpiLabel}>ACTIVE PORTFOLIO</div>
              <div style={S.execKpiVal}>{properties.length} Properties</div>
              <div style={S.execKpiSub}>{totalBeds} total beds · {projects.length} active projects</div>
            </div>
            <div style={{ ...S.execKpi, gridColumn: '2/3' }}>
              <div style={S.execKpiLabel}>MONTHLY REVENUE</div>
              <div style={{ ...S.execKpiVal, color: '#27AE60' }}>${totalMonthlyBilling.toLocaleString()}</div>
              <div style={S.execKpiSub}>EPC billing · ${totalSpread.toLocaleString()} net spread</div>
            </div>
            <div style={{ ...S.execKpi, gridColumn: '3/4' }}>
              <div style={S.execKpiLabel}>ANNUALIZED SPREAD</div>
              <div style={{ ...S.execKpiVal, color: '#27AE60' }}>${(totalSpread * 12).toLocaleString()}</div>
              <div style={S.execKpiSub}>At current portfolio · ${(totalSpread / totalBeds).toFixed(0)}/bed/mo</div>
            </div>
          </div>

          {/* Cost Avoidance Banner */}
          <div style={{ ...S.savingsBanner, marginBottom: 24 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 16, fontWeight: 700, color: '#0F4A2C', marginBottom: 6 }}>
                PORTFOLIO COST AVOIDANCE vs. EXTENDED STAY HOTEL
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                {[
                  { label: 'Worker-Nights/Month', val: `${totalBeds * 30}` },
                  { label: 'Hotel Baseline', val: `$${hotelBaseline.toLocaleString()}` },
                  { label: 'CrewStay Actual', val: `$${totalMonthlyBilling.toLocaleString()}` },
                  { label: 'Monthly Savings', val: `$${monthlySavings.toLocaleString()}` },
                ].map(item => (
                  <div key={item.label}>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: '#1A7A4A', marginBottom: 2 }}>{item.label}</div>
                    <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 20, fontWeight: 700, color: '#0F4A2C' }}>{item.val}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ textAlign: 'right', paddingLeft: 24, borderLeft: '2px solid #A7E3C5' }}>
              <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 48, fontWeight: 700, color: '#27AE60', lineHeight: 1 }}>{savingsPct}%</div>
              <div style={{ fontSize: 12, color: '#1A7A4A', fontWeight: 700, marginTop: 4 }}>BELOW HOTEL RATE</div>
              <div style={{ fontSize: 11, color: '#1A7A4A', marginTop: 2 }}>GSA per diem ${HOTEL_RATE}/night</div>
            </div>
          </div>

          {/* Project Portfolio Cards */}
          <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 14, fontWeight: 700, color: '#1B2A4A', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>Active Project Portfolio</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
            {projects.map(proj => {
              const projInvoices = invoices.filter(i => i.project_id === proj.id)
              const projPaid = projInvoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.total), 0)
              const projOutstanding = projInvoices.filter(i => ['sent', 'overdue'].includes(i.status)).reduce((s, i) => s + Number(i.total), 0)
              const hasOverdue = projInvoices.some(i => i.status === 'overdue')
              const projAssignments = assignments.filter(a => a.project_id === proj.id)

              return (
                <div key={proj.id} style={{ background: 'white', borderRadius: 16, padding: 22, border: `2px solid ${hasOverdue ? '#FEE2E2' : '#E8ECF2'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, background: '#1B2A4A', color: 'white', padding: '3px 8px', borderRadius: 4 }}>{proj.project_code}</span>
                    {hasOverdue && <span style={{ fontSize: 11, fontWeight: 700, background: '#FEE2E2', color: '#EF4444', padding: '3px 8px', borderRadius: 4 }}>OVERDUE</span>}
                  </div>
                  <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 16, fontWeight: 700, color: '#1B2A4A', marginBottom: 4 }}>{proj.name}</div>
                  <div style={{ fontSize: 12, color: '#6B7A99', marginBottom: 16 }}>{proj.organizations?.name}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {[
                      { label: 'Crew Assigned', val: projAssignments.length },
                      { label: 'Invoices', val: projInvoices.length },
                      { label: 'Collected', val: `$${projPaid.toLocaleString()}`, color: '#27AE60' },
                      { label: 'Outstanding', val: `$${projOutstanding.toLocaleString()}`, color: projOutstanding > 0 ? '#E8883A' : '#6B7A99' },
                    ].map(item => (
                      <div key={item.label} style={{ background: '#F7F8FA', borderRadius: 8, padding: '10px 12px' }}>
                        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: '#6B7A99', marginBottom: 3 }}>{item.label}</div>
                        <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 16, fontWeight: 700, color: item.color || '#1B2A4A' }}>{item.val}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Receivables vs Remittances */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={S.tableCard}>
              <div style={S.tableHeader}>
                <div style={S.tableTitle}>Receivables Summary</div>
              </div>
              <div style={{ padding: '0 0 4px' }}>
                {[
                  { label: 'Total Billed', val: invoices.reduce((s, i) => s + Number(i.total), 0), color: '#1B2A4A' },
                  { label: 'Collected', val: totalCollected, color: '#27AE60' },
                  { label: 'Outstanding', val: totalOutstanding, color: '#E8883A' },
                  { label: 'Overdue', val: invoices.filter(i => i.status === 'overdue').reduce((s, i) => s + Number(i.total), 0), color: '#EF4444' },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid #F7F8FA' }}>
                    <span style={{ fontSize: 14, color: '#6B7A99', fontWeight: 600 }}>{row.label}</span>
                    <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: 16, fontWeight: 700, color: row.color }}>${row.val.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={S.tableCard}>
              <div style={S.tableHeader}>
                <div style={S.tableTitle}>Remittance Summary</div>
              </div>
              <div style={{ padding: '0 0 4px' }}>
                {[
                  { label: 'Total Remittance Obligations', val: remittances.reduce((s, r) => s + Number(r.total_amount), 0), color: '#1B2A4A' },
                  { label: 'Paid Out', val: remittances.filter(r => r.status === 'paid').reduce((s, r) => s + Number(r.total_amount), 0), color: '#27AE60' },
                  { label: 'Pending', val: remittances.filter(r => r.status === 'pending').reduce((s, r) => s + Number(r.total_amount), 0), color: '#E8883A' },
                  { label: 'Monthly Obligation', val: totalMonthlyRemittance, color: '#1B2A4A' },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid #F7F8FA' }}>
                    <span style={{ fontSize: 14, color: '#6B7A99', fontWeight: 600 }}>{row.label}</span>
                    <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: 16, fontWeight: 700, color: row.color }}>${row.val.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const STATUS_BG = { draft: '#F3F4F6', sent: '#EFF6FF', paid: '#E8F7EF', overdue: '#FEE2E2', void: '#F3F4F6' };
const STATUS_COLOR = { draft: '#6B7280', sent: '#3B82F6', paid: '#27AE60', overdue: '#EF4444', void: '#9CA3AF' };

const S = {
  page: { flex: 1, padding: 32, background: '#F7F8FA', minHeight: '100vh' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  title: { fontFamily: "'Oswald', sans-serif", fontSize: 28, fontWeight: 700, color: '#1B2A4A', margin: 0 },
  sub: { fontSize: 14, color: '#6B7A99', margin: '4px 0 0' },
  tabBar: { display: 'flex', gap: 4, marginBottom: 28, background: 'white', padding: 4, borderRadius: 12, border: '1.5px solid #E8ECF2', width: 'fit-content' },
  tab: { padding: '10px 20px', borderRadius: 8, border: 'none', background: 'transparent', fontSize: 13, fontWeight: 700, color: '#6B7A99', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' },
  tabActive: { background: '#1B2A4A', color: 'white' },
  section: { marginBottom: 24 },
  sectionLabel: { fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#6B7A99', marginBottom: 10 },
  projBtn: { padding: '12px 18px', borderRadius: 10, border: '2px solid #E8ECF2', background: 'white', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', color: '#1B2A4A', transition: 'all 0.15s', minWidth: 200 },
  projBtnActive: { border: '2px solid #1B2A4A', background: '#1B2A4A', color: 'white' },
  kpi: { background: 'white', borderRadius: 12, padding: '16px 20px', border: '1px solid #E8ECF2' },
  kpiLabel: { fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#6B7A99', marginBottom: 6 },
  kpiVal: { fontFamily: "'Oswald', sans-serif", fontSize: 24, fontWeight: 700, color: '#1B2A4A' },
  savingsBanner: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#E8F7EF', border: '1.5px solid #A7E3C5', borderRadius: 14, padding: '20px 24px', marginBottom: 24 },
  tableCard: { background: 'white', borderRadius: 14, border: '1.5px solid #E8ECF2', overflow: 'hidden', marginBottom: 20 },
  tableHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #E8ECF2' },
  tableTitle: { fontFamily: "'Oswald', sans-serif", fontSize: 16, fontWeight: 700, color: '#1B2A4A' },
  thead: { display: 'grid', gridTemplateColumns: '1fr 1fr 2fr 1fr 1.2fr', padding: '10px 20px', background: '#F7F8FA', borderBottom: '1px solid #E8ECF2' },
  th: { fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#6B7A99' },
  tr: { display: 'grid', gridTemplateColumns: '1fr 1fr 2fr 1fr 1.2fr', padding: '12px 20px', borderBottom: '1px solid #F7F8FA', alignItems: 'center' },
  execKpi: { background: 'white', borderRadius: 14, padding: '22px 24px', border: '1.5px solid #E8ECF2' },
  execKpiLabel: { fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, color: '#6B7A99', marginBottom: 8 },
  execKpiVal: { fontFamily: "'Oswald', sans-serif", fontSize: 30, fontWeight: 700, color: '#1B2A4A', marginBottom: 4 },
  execKpiSub: { fontSize: 12, color: '#6B7A99' },
};

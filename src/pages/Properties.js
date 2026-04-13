import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const MARKET_LABELS = {
  savannah: 'Savannah', pooler: 'Pooler', richmond_hill: 'Richmond Hill',
  brunswick: 'Brunswick', rincon: 'Rincon', augusta: 'Augusta', other: 'Other'
}

const MARKET_COLORS = {
  savannah: '#1B2A4A', pooler: '#E8883A', richmond_hill: '#27AE60',
  brunswick: '#8B5CF6', rincon: '#0891B2', augusta: '#DC2626', other: '#6B7A99'
}

export default function Properties() {
  const [properties, setProperties] = useState([])
  const [bedrooms, setBedrooms] = useState({})
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [filterMarket, setFilterMarket] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => { loadProperties() }, [])

  async function loadProperties() {
    const { data: props } = await supabase
      .from('properties')
      .select('*')
      .order('city', { ascending: true })

    const { data: beds } = await supabase
      .from('bedrooms')
      .select('*')

    const bedMap = {}
    ;(beds || []).forEach(b => {
      if (!bedMap[b.property_id]) bedMap[b.property_id] = []
      bedMap[b.property_id].push(b)
    })

    setProperties(props || [])
    setBedrooms(bedMap)
    setLoading(false)
  }

  const markets = [...new Set(properties.map(p => p.market_area))].sort()
  const filtered = properties.filter(p =>
    (filterMarket === 'all' || p.market_area === filterMarket) &&
    (filterStatus === 'all' || p.status === filterStatus)
  )

  const totalBeds = properties.reduce((s, p) => s + p.bedrooms, 0)
  const occupiedBeds = Object.values(bedrooms).flat().filter(b => b.status === 'occupied').length
  const totalMonthlyRevenue = properties.reduce((s, p) => s + Number(p.monthly_client_rate), 0)
  const totalSpread = properties.reduce((s, p) => s + (Number(p.monthly_client_rate) - Number(p.monthly_landlord_rate)), 0)

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <div>
          <h1 style={S.title}>Properties</h1>
          <p style={S.sub}>{properties.length} active properties across {markets.length} markets</p>
        </div>
      </div>

      {/* KPI Strip */}
      <div style={S.kpiRow}>
        {[
          { label: 'Total Properties', value: properties.length, color: '#1B2A4A' },
          { label: 'Total Beds', value: totalBeds, color: '#1B2A4A' },
          { label: 'Occupied Beds', value: `${occupiedBeds} / ${totalBeds}`, color: '#E8883A' },
          { label: 'Monthly EPC Billing', value: `$${totalMonthlyRevenue.toLocaleString()}`, color: '#27AE60' },
          { label: 'Monthly Spread', value: `$${totalSpread.toLocaleString()}`, color: '#27AE60' },
        ].map(k => (
          <div key={k.label} style={S.kpi}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#6B7A99', marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 24, fontWeight: 700, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={S.filters}>
        <select style={S.select} value={filterMarket} onChange={e => setFilterMarket(e.target.value)}>
          <option value="all">All Markets</option>
          {markets.map(m => <option key={m} value={m}>{MARKET_LABELS[m]}</option>)}
        </select>
        <select style={S.select} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="maintenance">Maintenance</option>
        </select>
        <div style={{ marginLeft: 'auto', fontSize: 13, color: '#6B7A99' }}>{filtered.length} properties shown</div>
      </div>

      {/* Property Grid */}
      {loading ? <div style={S.empty}>Loading...</div> : (
        <div style={S.grid}>
          {filtered.map(prop => {
            const beds = bedrooms[prop.id] || []
            const occupied = beds.filter(b => b.status === 'occupied').length
            const spread = Number(prop.monthly_client_rate) - Number(prop.monthly_landlord_rate)
            const spreadPerBed = prop.bedrooms > 0 ? spread / prop.bedrooms : 0
            const occupancyPct = beds.length > 0 ? Math.round((occupied / beds.length) * 100) : 0

            return (
              <div key={prop.id} style={S.card} onClick={() => setSelected(prop)}>
                {/* Card Header */}
                <div style={S.cardTop}>
                  <span style={{ ...S.marketBadge, background: MARKET_COLORS[prop.market_area] + '18', color: MARKET_COLORS[prop.market_area] }}>
                    {MARKET_LABELS[prop.market_area]}
                  </span>
                  <span style={{ ...S.statusBadge, ...(prop.status === 'active' ? S.statusActive : prop.status === 'maintenance' ? S.statusMaint : S.statusInactive) }}>
                    {prop.status}
                  </span>
                </div>

                {/* Address */}
                <div style={S.address}>{prop.address}</div>
                <div style={S.cityLine}>{prop.city}, {prop.state} {prop.zip}</div>

                {/* Bed/Bath + Sqft */}
                <div style={S.specs}>
                  <span style={S.spec}>🛏 {prop.bedrooms} bed</span>
                  <span style={S.spec}>🚿 {prop.bathrooms} bath</span>
                  {prop.sqft && <span style={S.spec}>📐 {prop.sqft?.toLocaleString()} sqft</span>}
                </div>

                {/* Occupancy Bar */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: '#6B7A99', marginBottom: 5 }}>
                    <span>OCCUPANCY</span>
                    <span style={{ color: occupancyPct === 100 ? '#27AE60' : '#E8883A' }}>{occupied}/{beds.length} beds · {occupancyPct}%</span>
                  </div>
                  <div style={{ height: 6, background: '#EEF1F8', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${occupancyPct}%`, background: occupancyPct === 100 ? '#27AE60' : '#E8883A', borderRadius: 3, transition: 'width 0.4s' }} />
                  </div>
                </div>

                {/* Rates */}
                <div style={S.rateRow}>
                  <div style={S.rateBox}>
                    <div style={S.rateLabel}>EPC BILLING</div>
                    <div style={S.rateVal}>${Number(prop.monthly_client_rate).toLocaleString()}/mo</div>
                  </div>
                  <div style={S.rateBox}>
                    <div style={S.rateLabel}>LANDLORD</div>
                    <div style={{ ...S.rateVal, color: '#6B7A99' }}>${Number(prop.monthly_landlord_rate).toLocaleString()}/mo</div>
                  </div>
                  <div style={S.rateBox}>
                    <div style={S.rateLabel}>SPREAD</div>
                    <div style={{ ...S.rateVal, color: '#27AE60' }}>${spreadPerBed.toFixed(0)}/bed</div>
                  </div>
                </div>

                {/* Amenities */}
                <div style={S.amenities}>
                  {prop.has_washer_dryer && <span style={S.amenity}>🧺 W/D</span>}
                  {prop.has_gigabit_wifi && <span style={S.amenity}>📶 Gigabit</span>}
                  {prop.has_tool_storage && <span style={S.amenity}>🔧 Storage</span>}
                  {prop.truck_spots > 0 && <span style={S.amenity}>🚛 {prop.truck_spots} spots</span>}
                  {prop.has_fenced_yard && <span style={S.amenity}>🏡 Fenced</span>}
                  {prop.is_night_shift_ready && <span style={S.amenity}>🌙 Night shift</span>}
                  {prop.has_generator_hookup && <span style={S.amenity}>⚡ Generator</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div style={M.overlay} onClick={e => e.target === e.currentTarget && setSelected(null)}>
          <div style={M.box}>
            <div style={M.header}>
              <div>
                <div style={M.title}>{selected.address}</div>
                <div style={{ fontSize: 13, color: '#6B7A99', marginTop: 2 }}>{selected.city}, {selected.state} {selected.zip}</div>
              </div>
              <button style={M.close} onClick={() => setSelected(null)}>✕</button>
            </div>
            <div style={M.body}>
              {/* Rate Summary */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
                {[
                  { label: 'EPC Monthly Billing', val: `$${Number(selected.monthly_client_rate).toLocaleString()}`, color: '#1B2A4A' },
                  { label: 'Landlord Remittance', val: `$${Number(selected.monthly_landlord_rate).toLocaleString()}`, color: '#6B7A99' },
                  { label: 'Monthly Spread', val: `$${(Number(selected.monthly_client_rate) - Number(selected.monthly_landlord_rate)).toLocaleString()}`, color: '#27AE60' },
                ].map(r => (
                  <div key={r.label} style={{ background: '#F7F8FA', borderRadius: 10, padding: 16 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#6B7A99', marginBottom: 4 }}>{r.label}</div>
                    <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 20, fontWeight: 700, color: r.color }}>{r.val}</div>
                  </div>
                ))}
              </div>

              {/* Bedroom Status */}
              <div style={{ fontWeight: 700, fontSize: 13, color: '#1B2A4A', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Bedroom Status</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8, marginBottom: 24 }}>
                {(bedrooms[selected.id] || []).map(b => (
                  <div key={b.id} style={{
                    border: `2px solid ${b.status === 'occupied' ? '#E8883A' : b.status === 'maintenance' ? '#EF4444' : '#27AE60'}`,
                    borderRadius: 8, padding: '10px 12px', textAlign: 'center'
                  }}>
                    <div style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, color: '#1B2A4A', fontSize: 15 }}>{b.room_number}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginTop: 2, color: b.status === 'occupied' ? '#E8883A' : b.status === 'maintenance' ? '#EF4444' : '#27AE60' }}>{b.status}</div>
                  </div>
                ))}
              </div>

              {/* Amenities Full List */}
              <div style={{ fontWeight: 700, fontSize: 13, color: '#1B2A4A', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Amenities & Features</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { label: 'Washer / Dryer', val: selected.has_washer_dryer },
                  { label: 'Gigabit WiFi', val: selected.has_gigabit_wifi },
                  { label: 'Tool Storage', val: selected.has_tool_storage },
                  { label: 'Fenced Yard', val: selected.has_fenced_yard },
                  { label: 'Generator Hookup', val: selected.has_generator_hookup },
                  { label: 'Night Shift Ready', val: selected.is_night_shift_ready },
                  { label: `Truck Spots (${selected.truck_spots})`, val: selected.truck_spots > 0 },
                ].map(a => (
                  <div key={a.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#F7F8FA', borderRadius: 8 }}>
                    <span style={{ fontSize: 16 }}>{a.val ? '✅' : '❌'}</span>
                    <span style={{ fontSize: 13, color: a.val ? '#1B2A4A' : '#9CA3AF', fontWeight: a.val ? 600 : 400 }}>{a.label}</span>
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

const S = {
  page: { flex: 1, padding: 32, background: '#F7F8FA', minHeight: '100vh' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  title: { fontFamily: "'Oswald', sans-serif", fontSize: 28, fontWeight: 700, color: '#1B2A4A', margin: 0 },
  sub: { fontSize: 14, color: '#6B7A99', margin: '4px 0 0' },
  kpiRow: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 24 },
  kpi: { background: 'white', borderRadius: 12, padding: '16px 20px', border: '1px solid #E8ECF2' },
  filters: { display: 'flex', gap: 12, alignItems: 'center', marginBottom: 24 },
  select: { padding: '8px 14px', borderRadius: 8, border: '1.5px solid #E8ECF2', fontSize: 13, fontWeight: 600, color: '#1B2A4A', background: 'white', cursor: 'pointer', outline: 'none' },
  empty: { textAlign: 'center', padding: 60, color: '#6B7A99' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 },
  card: { background: 'white', borderRadius: 16, padding: 22, border: '1.5px solid #E8ECF2', cursor: 'pointer', transition: 'box-shadow 0.2s', ':hover': { boxShadow: '0 4px 20px rgba(0,0,0,0.08)' } },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  marketBadge: { fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  statusBadge: { fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4, textTransform: 'uppercase' },
  statusActive: { background: '#E8F7EF', color: '#27AE60' },
  statusMaint: { background: '#FEF2F2', color: '#EF4444' },
  statusInactive: { background: '#F3F4F6', color: '#6B7280' },
  address: { fontFamily: "'Oswald', sans-serif", fontSize: 17, fontWeight: 700, color: '#1B2A4A', marginBottom: 2 },
  cityLine: { fontSize: 13, color: '#6B7A99', marginBottom: 14 },
  specs: { display: 'flex', gap: 12, marginBottom: 14 },
  spec: { fontSize: 12, color: '#6B7A99', fontWeight: 600 },
  rateRow: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14, padding: '12px 0', borderTop: '1px solid #F0F2F5', borderBottom: '1px solid #F0F2F5' },
  rateBox: { textAlign: 'center' },
  rateLabel: { fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: '#9CA3AF', marginBottom: 3 },
  rateVal: { fontFamily: "'Oswald', sans-serif", fontSize: 14, fontWeight: 700, color: '#1B2A4A' },
  amenities: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  amenity: { fontSize: 11, fontWeight: 600, color: '#1B2A4A', background: '#F7F8FA', padding: '3px 8px', borderRadius: 4, border: '1px solid #E8ECF2' },
}

const M = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 },
  box: { background: 'white', borderRadius: 20, width: '100%', maxWidth: 680, maxHeight: '90vh', overflow: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '24px 28px', borderBottom: '1px solid #E8ECF2' },
  title: { fontFamily: "'Oswald', sans-serif", fontSize: 20, fontWeight: 700, color: '#1B2A4A' },
  close: { background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#6B7A99' },
  body: { padding: 28 },
}

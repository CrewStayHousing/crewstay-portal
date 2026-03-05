import { useState } from "react";
const COLORS = { navy: "#1B2A4A", navyDark: "#111D33", orange: "#E8883A", orangeDark: "#C96E20", white: "#FFFFFF", offWhite: "#F4F6F9", gray: "#8C96A8", grayBorder: "#D0D8E4", green: "#2ECC71", red: "#E74C3C", yellow: "#F39C12" };
const Badge = ({ color, children }) => { const colors = { green: { bg: "#D4EDDA", text: "#155724" }, red: { bg: "#F8D7DA", text: "#721C24" }, yellow: { bg: "#FFF3CD", text: "#856404" }, blue: { bg: "#D1ECF1", text: "#0C5460" }, gray: { bg: "#E2E8F0", text: "#4A5568" } }; const c = colors[color] || colors.gray; return <span style={{ background: c.bg, color: c.text, padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>{children}</span>; };
const StatCard = ({ label, value, sub, accent }) => <div style={{ background: COLORS.white, borderRadius: 12, padding: "20px 24px", border: `1px solid ${COLORS.grayBorder}`, flex: 1, minWidth: 140, borderTop: `3px solid ${accent || COLORS.orange}`, boxShadow: "0 2px 8px rgba(27,42,74,0.06)" }}><div style={{ color: COLORS.gray, fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>{label}</div><div style={{ color: COLORS.navy, fontSize: 28, fontWeight: 800 }}>{value}</div>{sub && <div style={{ color: COLORS.gray, fontSize: 12, marginTop: 4 }}>{sub}</div>}</div>;
const properties = [{ id: 1, address: "123 Victory Dr", city: "Savannah", beds: 4, landlordRate: 6400, occupiedBeds: 3, ytdPaid: 38400, amenities: ["Washer/Dryer", "High-Speed WiFi", "Tool Storage"] }, { id: 2, address: "456 Skidaway Rd", city: "Savannah", beds: 3, landlordRate: 4800, occupiedBeds: 2, ytdPaid: 28800, amenities: ["Washer/Dryer", "WiFi", "Covered Parking"] }, { id: 3, address: "100 Pooler Pkwy", city: "Pooler", beds: 4, landlordRate: 6400, occupiedBeds: 4, ytdPaid: 44800, amenities: ["Washer/Dryer", "WiFi", "Tool Storage"] }, { id: 4, address: "200 Pine Barren Rd", city: "Pooler", beds: 3, landlordRate: 4800, occupiedBeds: 1, ytdPaid: 14400, amenities: ["Washer/Dryer", "WiFi", "Fenced Yard"] }];
const remittances = [{ id: 1, period: "March 2026", property: "123 Victory Dr", bedsOccupied: 3, amount: 4800, status: "paid", paidDate: "Mar 30, 2026" }, { id: 2, period: "March 2026", property: "456 Skidaway Rd", bedsOccupied: 2, amount: 3200, status: "paid", paidDate: "Mar 30, 2026" }, { id: 3, period: "March 2026", property: "100 Pooler Pkwy", bedsOccupied: 4, amount: 6400, status: "paid", paidDate: "Mar 30, 2026" }, { id: 4, period: "March 2026", property: "200 Pine Barren Rd", bedsOccupied: 1, amount: 1600, status: "paid", paidDate: "Mar 30, 2026" }, { id: 5, period: "April 2026", property: "123 Victory Dr", bedsOccupied: 3, amount: 4800, status: "pending", paidDate: "Due Apr 30" }, { id: 6, period: "April 2026", property: "456 Skidaway Rd", bedsOccupied: 2, amount: 3200, status: "pending", paidDate: "Due Apr 30" }, { id: 7, period: "April 2026", property: "100 Pooler Pkwy", bedsOccupied: 4, amount: 6400, status: "pending", paidDate: "Due Apr 30" }, { id: 8, period: "April 2026", property: "200 Pine Barren Rd", bedsOccupied: 1, amount: 1600, status: "pending", paidDate: "Due Apr 30" }];
const maintenance = [{ id: 1, property: "123 Victory Dr", issue: "HVAC filter replacement", severity: "Low", status: "Scheduled", opened: "Mar 28", note: "CrewStay coordinating with vendor" }, { id: 2, property: "100 Pooler Pkwy", issue: "Fence gate latch broken", severity: "Medium", status: "In Progress", opened: "Mar 25", note: "Vendor dispatched Mar 26" }, { id: 3, property: "200 Pine Barren Rd", issue: "Water heater pilot light", severity: "High", status: "Resolved", opened: "Mar 20", note: "Resolved Mar 22 by H&C Plumbing" }];
export default function LandlordPortal() {
  const [tab, setTab] = useState("overview");
  const [sel, setSel] = useState(properties[0]);
  const totalBeds = properties.reduce((a, p) => a + p.beds, 0);
  const occBeds = properties.reduce((a, p) => a + p.occupiedBeds, 0);
  const monthly = properties.reduce((a, p) => a + (p.landlordRate / p.beds * p.occupiedBeds), 0);
  const ytd = properties.reduce((a, p) => a + p.ytdPaid, 0);
  const tabs = [{ key: "overview", label: "Overview" }, { key: "properties", label: "My Properties" }, { key: "remittance", label: "Remittance" }, { key: "maintenance", label: "Maintenance" }];
  return (
    <div style={{ fontFamily: "system-ui", minHeight: "100vh", background: COLORS.offWhite }}>
      <div style={{ background: COLORS.navyDark, padding: "0 28px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56, position: "sticky", top: 0, zIndex: 500 }}>
        <span style={{ color: COLORS.white, fontWeight: 900, fontSize: 17 }}>CREW<span style={{ color: COLORS.orange }}>STAY</span> <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>HOUSING</span></span>
        <div style={{ display: "flex", gap: 4 }}>{tabs.map(t => <button key={t.key} onClick={() => setTab(t.key)} style={{ background: tab === t.key ? COLORS.orange : "transparent", color: tab === t.key ? COLORS.white : "rgba(255,255,255,0.6)", border: "none", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontWeight: 700, fontSize: 12 }}>{t.label}</button>)}</div>
        <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>Landlord Portal</span>
      </div>
      <div style={{ padding: "28px 32px" }}>
        {tab === "overview" && <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.navy, marginBottom: 6 }}>Landlord Dashboard</div>
          <div style={{ color: COLORS.gray, fontSize: 13, marginBottom: 24 }}>Georgia Corridor — April 2026</div>
          <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
            <StatCard label="Properties" value={properties.length} sub="Active master leases" />
            <StatCard label="Occupancy" value={`${Math.round(occBeds/totalBeds*100)}%`} sub={`${occBeds}/${totalBeds} beds filled`} accent={COLORS.green} />
            <StatCard label="Monthly Remittance" value={`$${Math.round(monthly).toLocaleString()}`} sub="Occupied beds only" accent={COLORS.orange} />
            <StatCard label="YTD Paid" value={`$${ytd.toLocaleString()}`} sub="Net-30 · No disputes" accent={COLORS.navy} />
          </div>
          <div style={{ background: "#EEF4FF", border: "1px solid #C7D9FF", borderRadius: 10, padding: "12px 18px", marginBottom: 24, fontSize: 13, color: COLORS.navy }}>ℹ️ <strong>Remittance note:</strong> You are paid only for <strong>occupied beds</strong>. Vacancy between crew rotations is not billed per your master lease.</div>
          <div style={{ background: COLORS.white, borderRadius: 12, border: `1px solid ${COLORS.grayBorder}`, overflow: "hidden" }}>
            <div style={{ background: COLORS.navy, padding: "13px 20px", color: COLORS.white, fontWeight: 800, fontSize: 14 }}>🏠 Property Portfolio</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead><tr style={{ background: COLORS.offWhite }}>{["Property","Beds","Occupied","Remittance","Status"].map(h => <th key={h} style={{ padding: "9px 14px", textAlign: "left", color: COLORS.gray, fontWeight: 700, fontSize: 11, textTransform: "uppercase" }}>{h}</th>)}</tr></thead>
              <tbody>{properties.map((p, i) => <tr key={p.id} style={{ borderTop: `1px solid ${COLORS.grayBorder}`, background: i%2===0 ? COLORS.white : COLORS.offWhite }}>
                <td style={{ padding: "11px 14px" }}><div style={{ fontWeight: 700, color: COLORS.navy }}>{p.address}</div><div style={{ color: COLORS.gray, fontSize: 11 }}>{p.city}, GA</div></td>
                <td style={{ padding: "11px 14px", fontWeight: 700 }}>{p.beds}</td>
                <td style={{ padding: "11px 14px" }}>{p.occupiedBeds}/{p.beds}</td>
                <td style={{ padding: "11px 14px", fontWeight: 800, color: COLORS.green }}>${Math.round(p.landlordRate/p.beds*p.occupiedBeds).toLocaleString()}</td>
                <td style={{ padding: "11px 14px" }}><Badge color={p.occupiedBeds===p.beds?"green":p.occupiedBeds>0?"yellow":"gray"}>{p.occupiedBeds===p.beds?"Full":p.occupiedBeds>0?"Partial":"Vacant"}</Badge></td>
              </tr>)}</tbody>
            </table>
          </div>
        </div>}
        {tab === "properties" && <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.navy, marginBottom: 20 }}>My Properties</div>
          <div style={{ display: "flex", gap: 18 }}>
            <div style={{ width: 260 }}>{properties.map(p => <div key={p.id} onClick={() => setSel(p)} style={{ background: COLORS.white, borderRadius: 12, padding: "14px 16px", marginBottom: 10, border: `2px solid ${sel?.id===p.id?COLORS.orange:COLORS.grayBorder}`, cursor: "pointer" }}>
              <div style={{ fontWeight: 800, color: COLORS.navy }}>{p.address}</div>
              <div style={{ color: COLORS.gray, fontSize: 11 }}>{p.city}, GA</div>
              <div style={{ fontWeight: 800, color: COLORS.green, fontSize: 13, marginTop: 6 }}>${Math.round(p.landlordRate/p.beds*p.occupiedBeds).toLocaleString()}/mo</div>
            </div>)}</div>
            {sel && <div style={{ flex: 1, background: COLORS.white, borderRadius: 12, border: `1px solid ${COLORS.grayBorder}`, overflow: "hidden" }}>
              <div style={{ background: COLORS.navy, padding: "13px 18px", color: COLORS.white, fontWeight: 800 }}>{sel.address}, {sel.city}</div>
              <div style={{ padding: 18 }}>
                <div style={{ fontWeight: 700, color: COLORS.navy, marginBottom: 10 }}>Bed Status</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>{Array.from({length: sel.beds}).map((_, i) => <div key={i} style={{ background: i<sel.occupiedBeds?"#FDE8D4":COLORS.offWhite, border: `2px solid ${i<sel.occupiedBeds?COLORS.orange:COLORS.grayBorder}`, borderRadius: 10, padding: "10px 14px", textAlign: "center" }}><div style={{ fontSize: 18 }}>{i<sel.occupiedBeds?"🛏":"⬜"}</div><div style={{ fontWeight: 700, color: COLORS.navy, fontSize: 11 }}>BR-{i+1}</div><div style={{ fontSize: 10, color: i<sel.occupiedBeds?COLORS.orange:COLORS.gray }}>{i<sel.occupiedBeds?"Occupied":"Available"}</div></div>)}</div>
                <div style={{ fontSize: 12, color: COLORS.gray, fontStyle: "italic", marginBottom: 14 }}>Crew identities managed by CrewStay — occupancy visibility only.</div>
                <div style={{ background: COLORS.offWhite, borderRadius: 10, padding: 14 }}>
                  <div style={{ fontWeight: 700, color: COLORS.navy, marginBottom: 8 }}>💰 Remittance</div>
                  <div style={{ display: "flex", gap: 20 }}>{[["Base Rate",`$${sel.landlordRate.toLocaleString()}/mo`],["Occupied",`${sel.occupiedBeds}/${sel.beds}`],["This Month",`$${Math.round(sel.landlordRate/sel.beds*sel.occupiedBeds).toLocaleString()}`],["YTD",`$${sel.ytdPaid.toLocaleString()}`]].map(([l,v]) => <div key={l}><div style={{ color: COLORS.gray, fontSize: 11 }}>{l}</div><div style={{ fontWeight: 800, color: COLORS.navy }}>{v}</div></div>)}</div>
                </div>
              </div>
            </div>}
          </div>
        </div>}
        {tab === "remittance" && <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.navy, marginBottom: 6 }}>Remittance History</div>
          <div style={{ color: COLORS.gray, fontSize: 13, marginBottom: 24 }}>Net-30 · Bed-level proration</div>
          <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
            <StatCard label="March Paid" value={`$${remittances.filter(r=>r.status==="paid").reduce((a,r)=>a+r.amount,0).toLocaleString()}`} sub="Paid Mar 30" accent={COLORS.green} />
            <StatCard label="April Pending" value={`$${remittances.filter(r=>r.status==="pending").reduce((a,r)=>a+r.amount,0).toLocaleString()}`} sub="Due Apr 30" accent={COLORS.yellow} />
            <StatCard label="YTD Total" value={`$${ytd.toLocaleString()}`} accent={COLORS.navy} />
            <StatCard label="Method" value="ACH" sub="Auto-deposit" accent={COLORS.orange} />
          </div>
          <div style={{ background: COLORS.white, borderRadius: 12, border: `1px solid ${COLORS.grayBorder}`, overflow: "hidden" }}>
            <div style={{ background: COLORS.navy, padding: "13px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: COLORS.white, fontWeight: 800 }}>💰 Remittance Ledger</span>
              <button style={{ background: COLORS.orange, color: COLORS.white, border: "none", borderRadius: 6, padding: "5px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Export CSV</button>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead><tr style={{ background: COLORS.offWhite }}>{["Period","Property","Beds","Amount","Status","Date"].map(h => <th key={h} style={{ padding: "9px 14px", textAlign: "left", color: COLORS.gray, fontWeight: 700, fontSize: 11, textTransform: "uppercase" }}>{h}</th>)}</tr></thead>
              <tbody>{remittances.map((r,i) => <tr key={r.id} style={{ borderTop: `1px solid ${COLORS.grayBorder}`, background: i%2===0?COLORS.white:COLORS.offWhite }}>
                <td style={{ padding: "11px 14px", fontWeight: 700, color: COLORS.navy }}>{r.period}</td>
                <td style={{ padding: "11px 14px", color: COLORS.gray }}>{r.property}</td>
                <td style={{ padding: "11px 14px" }}>{r.bedsOccupied}</td>
                <td style={{ padding: "11px 14px", fontWeight: 800, color: COLORS.green }}>${r.amount.toLocaleString()}</td>
                <td style={{ padding: "11px 14px" }}><Badge color={r.status==="paid"?"green":"yellow"}>{r.status}</Badge></td>
                <td style={{ padding: "11px 14px", color: COLORS.gray }}>{r.paidDate}</td>
              </tr>)}</tbody>
            </table>
            <div style={{ padding: "12px 18px", background: COLORS.offWhite, fontSize: 12, color: COLORS.gray }}>Remittance calculated on occupied beds only. Net-30 from CrewStay collection date.</div>
          </div>
        </div>}
        {tab === "maintenance" && <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.navy, marginBottom: 6 }}>Maintenance & Habitability</div>
          <div style={{ color: COLORS.gray, fontSize: 13, marginBottom: 24 }}>You are responsible for habitability at all times — occupied or vacant</div>
          <div style={{ background: "#FFF8E1", border: "1px solid #FFE082", borderRadius: 10, padding: "12px 18px", marginBottom: 24, fontSize: 13, color: COLORS.navy }}>⚠️ <strong>Habitability Obligation:</strong> Major repairs require your approval within 48 hours. Unresolved high-severity issues may trigger billing and remittance pauses.</div>
          <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
            <StatCard label="Open" value={maintenance.filter(m=>m.status!=="Resolved").length} accent={COLORS.red} />
            <StatCard label="In Progress" value={maintenance.filter(m=>m.status==="In Progress").length} accent={COLORS.yellow} />
            <StatCard label="Resolved 30d" value={maintenance.filter(m=>m.status==="Resolved").length} accent={COLORS.green} />
            <StatCard label="Avg Resolution" value="2.1 days" accent={COLORS.navy} />
          </div>
          {maintenance.map(m => <div key={m.id} style={{ background: COLORS.white, borderRadius: 12, border: `1px solid ${COLORS.grayBorder}`, padding: "16px 20px", marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <Badge color={m.severity==="High"?"red":m.severity==="Medium"?"yellow":"gray"}>{m.severity}</Badge>
                <Badge color={m.status==="Resolved"?"green":m.status==="In Progress"?"blue":"yellow"}>{m.status}</Badge>
                <span style={{ fontWeight: 800, color: COLORS.navy }}>{m.issue}</span>
              </div>
              <span style={{ color: COLORS.gray, fontSize: 12 }}>Opened {m.opened}</span>
            </div>
            <div style={{ color: COLORS.gray, fontSize: 12 }}>📍 {m.property} · 📋 {m.note}</div>
          </div>)}
        </div>}
      </div>
    </div>
  );
}
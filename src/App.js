import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import Assignments from './pages/Assignments'
import Crew from './pages/Crew'
import Maintenance from './pages/Maintenance'
import Invoices from './pages/Invoices'
import Landlord from './pages/LandlordPortal';
// Google Fonts
const link = document.createElement('link')
link.href = 'https://fonts.googleapis.com/css2?family=Oswald:wght@300;400;500;600;700&family=Source+Sans+3:wght@300;400;500;600;700&display=swap'
link.rel = 'stylesheet'
document.head.appendChild(link)

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0F1E38', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>🏠</div>
        <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 18, color: 'rgba(255,255,255,0.5)', letterSpacing: 2 }}>LOADING...</div>
      </div>
    </div>
  )
  return user ? children : <Navigate to="/login" replace />
}

function ComingSoon({ title }) {
  return (
    <div style={{ flex: 1, padding: 32, background: '#F7F8FA', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🚧</div>
        <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 28, fontWeight: 700, color: '#1B2A4A', marginBottom: 8 }}>{title}</div>
        <div style={{ fontSize: 16, color: '#6B7A99' }}>Coming soon.</div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/landlord" element={<Landlord />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/projects" element={<Projects />} />
                  <Route path="/properties" element={<ComingSoon title="Properties" />} />
                  <Route path="/crew" element={<Crew />} />
                  <Route path="/assignments" element={<Assignments />} />
                  <Route path="/invoices" element={<Invoices />} />
                  <Route path="/maintenance" element={<Maintenance />} />
                  <Route path="/reports" element={<ComingSoon title="Reports" />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

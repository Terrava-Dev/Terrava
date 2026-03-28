import { Routes, Route, Navigate, useParams } from "react-router-dom"
import { useAuth } from "./context/AuthContext"
import Layout from "./components/Layout"
import PropertyListPage from "./pages/PropertyListPage"
import AddPropertyPage from "./pages/AddPropertyPage"
import LoginPage from "./pages/LoginPage"
import EditPropertyPage from "./pages/EditPropertyPage"
import SignupPage from "./pages/SignupPage"
import MarketingPage from "./pages/MarketingPage"
import MarketingPropertyPage  from "./pages/MarketingPropertyPage"
import LandingPage from "./pages/LandingPage"

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { agent } = useAuth()
  if (!agent) return <Navigate to="/login" replace />
  return <>{children}</>
}

function HomeRoute() {
  const { agent } = useAuth()
  if (agent) return <Navigate to="/properties" replace />
  return <LandingPage />
}

function LegacySharePropertyRedirect() {
  const { propertyId } = useParams()
  return <Navigate to={propertyId ? `/share-property/${propertyId}` : "/share-property"} replace />
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRoute />} />
      <Route path="/login"  element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      <Route path="/properties" element={
        <ProtectedRoute>
          <Layout><PropertyListPage /></Layout>
        </ProtectedRoute>
      }/>
      <Route path="/add-property" element={
        <ProtectedRoute>
          <Layout><AddPropertyPage /></Layout>
        </ProtectedRoute>
      }/>

      <Route path="/edit-property/:id" element={
        <ProtectedRoute>
          <Layout><EditPropertyPage /></Layout>
        </ProtectedRoute>
      }/>

      <Route path="/share-property" element={
        <ProtectedRoute>
          <Layout><MarketingPage /></Layout>
        </ProtectedRoute>
      }/>

      <Route path="/share-property/:propertyId" element={
        <ProtectedRoute>
          <Layout><MarketingPropertyPage /></Layout>
        </ProtectedRoute>
      }/>

      <Route path="/marketing" element={<Navigate to="/share-property" replace />} />
      <Route path="/marketing/:propertyId" element={<LegacySharePropertyRedirect />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App

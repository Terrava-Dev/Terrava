import { Routes, Route, Navigate } from "react-router-dom"
import { useAuth } from "./context/AuthContext"
import Layout from "./components/Layout"
import PropertyListPage from "./pages/PropertyListPage"
import AddPropertyPage from "./pages/AddPropertyPage"
import LoginPage from "./pages/LoginPage"
import EditPropertyPage from "./pages/EditPropertyPage"
import SignupPage from "./pages/SignupPage"

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { agent } = useAuth()
  if (!agent) return <Navigate to="/login" replace />
  return <>{children}</>
}

function App() {
  return (
    <Routes>
      <Route path="/login"  element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      <Route path="/" element={
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

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
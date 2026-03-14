import { Routes, Route } from "react-router-dom"
import PropertyListPage from "./pages/PropertyListPage"
import AddPropertyPage from "./pages/AddPropertyPage"

function App() {
  return (
    <Routes>
      <Route path="/" element={<PropertyListPage />} />
      <Route path="/add-property" element={<AddPropertyPage />} />
    </Routes>
  )
}

export default App
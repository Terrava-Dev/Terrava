import { createContext, useContext, useState } from "react"

export type Agent = {
  agentId:  number
  username: string
  fullName: string
  token:    string
}

type AuthContextType = {
  agent:   Agent | null
  login:   (agent: Agent) => void
  logout:  () => void
}

export const AuthContext = createContext<AuthContextType>({
  agent:  null,
  login:  () => {},
  logout: () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [agent, setAgent] = useState<Agent | null>(() => {
    try {
      const saved = localStorage.getItem("terrava_agent")
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  const login = (a: Agent) => {
    setAgent(a)
    localStorage.setItem("terrava_agent", JSON.stringify(a))
  }

  const logout = () => {
    setAgent(null)
    localStorage.removeItem("terrava_agent")
  }

  return (
    <AuthContext.Provider value={{ agent, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext)
}
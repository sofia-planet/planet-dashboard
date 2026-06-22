import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({
  session: null,
  user: null,
  isAdmin: false,
  loading: true,
  signOut: () => {},
})

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function resolveAdmin(currentSession) {
      if (!currentSession?.user) {
        if (active) setIsAdmin(false)
        return
      }
      // Check the admins table (RLS lets a user read only their own row).
      const { data } = await supabase
        .from('admins')
        .select('user_id')
        .eq('user_id', currentSession.user.id)
        .maybeSingle()
      if (active) setIsAdmin(Boolean(data))
    }

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return
      setSession(data.session)
      await resolveAdmin(data.session)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!active) return
      setSession(newSession)
      await resolveAdmin(newSession)
      setLoading(false)
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
    setSession(null)
    setIsAdmin(false)
  }

  const value = {
    session,
    user: session?.user ?? null,
    isAdmin,
    loading,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}

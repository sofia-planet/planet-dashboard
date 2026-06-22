import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Logo, Card, Spinner, Field, FullPageLoader } from '../components/ui'

export default function AdminLogin() {
  const { session, isAdmin, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (loading) return <FullPageLoader />
  if (session && isAdmin) return <Navigate to="/admin" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    if (error) {
      setBusy(false)
      setError(error.message)
      return
    }
    // Confirm this account is actually flagged as an admin.
    const { data: adminRow } = await supabase
      .from('admins')
      .select('user_id')
      .eq('user_id', data.user.id)
      .maybeSingle()

    setBusy(false)
    if (!adminRow) {
      await supabase.auth.signOut()
      setError('This account is not authorized for the internal dashboard.')
    }
    // On success, AuthContext picks up the session and the guard lets us in.
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Logo subtitle="Internal Dashboard" />

        <Card className="mt-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <p className="text-sm text-espresso/60 text-center">
              Private access for PLANET only.
            </p>
            <Field label="Email">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="you@planetbylaureng.com"
              />
            </Field>
            <Field label="Password">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
              />
            </Field>
            {error && <p className="text-sm text-red-600 text-center">{error}</p>}
            <button type="submit" disabled={busy} className="btn-primary w-full">
              {busy ? <Spinner /> : 'Enter dashboard'}
            </button>
          </form>
        </Card>

        <div className="text-center mt-6">
          <Link to="/" className="btn-ghost text-xs">
            ← Back
          </Link>
        </div>
      </div>
    </div>
  )
}

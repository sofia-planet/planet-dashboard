import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Logo, Card, Spinner, Field, FullPageLoader } from '../components/ui'

export default function PartnerLogin() {
  const { session, isAdmin, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  if (loading) return <FullPageLoader />
  if (session && isAdmin) return <Navigate to="/admin" replace />
  if (session) return <Navigate to="/portal" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSending(true)
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/portal`,
      },
    })
    setSending(false)
    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Logo subtitle="Partner Sign In" />

        <Card className="mt-8">
          {sent ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-4">✦</div>
              <h2 className="font-heading text-2xl text-espresso">Check your inbox</h2>
              <p className="mt-3 text-sm text-espresso/60 leading-relaxed">
                We sent a secure sign-in link to
                <br />
                <span className="text-espresso font-medium">{email}</span>
              </p>
              <p className="mt-4 text-xs text-espresso/40">
                Click the link in that email to enter your portal. You can close this tab.
              </p>
              <button
                onClick={() => {
                  setSent(false)
                  setEmail('')
                }}
                className="btn-ghost mt-6 mx-auto"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <p className="text-sm text-espresso/60 text-center leading-relaxed">
                Enter the email you partnered with. We'll send you a secure link — no
                password needed.
              </p>
              <Field label="Email">
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input"
                />
              </Field>
              {error && <p className="text-sm text-red-600 text-center">{error}</p>}
              <button type="submit" disabled={sending} className="btn-primary w-full">
                {sending ? <Spinner /> : 'Send my sign-in link'}
              </button>
            </form>
          )}
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

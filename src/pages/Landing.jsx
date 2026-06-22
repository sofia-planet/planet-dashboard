import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Logo, FullPageLoader } from '../components/ui'

export default function Landing() {
  const { session, isAdmin, loading } = useAuth()

  if (loading) return <FullPageLoader />
  // If already signed in, send them to the right place.
  if (session && isAdmin) return <Navigate to="/admin" replace />
  if (session) return <Navigate to="/portal" replace />

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        <Logo subtitle="Style Collective" />

        <p className="mt-8 text-espresso/60 leading-relaxed font-light">
          An elevated space for our partners and our collective. Choose how you'd like to
          enter.
        </p>

        <div className="mt-10 space-y-3">
          <Link to="/login" className="btn-primary w-full">
            Partner Sign In
          </Link>
          <Link to="/admin/login" className="btn-outline w-full">
            Internal Dashboard
          </Link>
        </div>

        <p className="mt-12 text-[10px] uppercase tracking-[0.3em] text-espresso/30">
          PLANET by Lauren G · Elevated · Minimal
        </p>
      </div>
    </div>
  )
}

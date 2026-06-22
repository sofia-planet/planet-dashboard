import { supabase } from './supabase'

// Fetches the logged-in partner's commission summary from our serverless
// function, which talks to GoAffPro with the secret admin token.
export async function fetchMyCommissions() {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.access_token) {
    return { configured: true, found: false, message: 'Not signed in.' }
  }

  const resp = await fetch('/api/commissions', {
    headers: { Authorization: `Bearer ${session.access_token}` },
  })

  if (!resp.ok) {
    let detail = ''
    try {
      detail = (await resp.json())?.error || ''
    } catch {
      /* ignore */
    }
    throw new Error(detail || `Commission lookup failed (${resp.status})`)
  }

  return resp.json()
}

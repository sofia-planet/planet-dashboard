import { Logo, Card } from '../components/ui'

// Shown when Supabase env vars are missing so the app fails gracefully
// with instructions instead of a blank/broken screen.
export default function SetupNotice() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="max-w-lg w-full">
        <Logo subtitle="Almost there" />
        <div className="mt-6 space-y-4 text-sm text-espresso/80 leading-relaxed">
          <p className="text-center">
            The portal needs its Supabase keys before it can run.
          </p>
          <ol className="list-decimal list-inside space-y-2 bg-cream rounded-xl p-4">
            <li>
              Copy <code className="text-gold">.env.example</code> to{' '}
              <code className="text-gold">.env</code>
            </li>
            <li>
              Fill in <code className="text-gold">VITE_SUPABASE_URL</code> and{' '}
              <code className="text-gold">VITE_SUPABASE_ANON_KEY</code> from Supabase →
              Project Settings → API
            </li>
            <li>Restart the dev server (or redeploy on Vercel)</li>
          </ol>
          <p className="text-center text-espresso/50">
            See <code className="text-gold">README.md</code> for full setup steps.
          </p>
        </div>
      </Card>
    </div>
  )
}

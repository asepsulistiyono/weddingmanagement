// LoginModal.tsx
import { useEffect, useState, type FormEvent } from 'react'
import type { SupabaseClient, User } from '@supabase/supabase-js'

type LoginModalProps = {
  supabase: SupabaseClient
  isOpen?: boolean
  onClose?: () => void
}

export default function LoginModal({
  supabase,
  isOpen = true,
  onClose = () => {},
}: LoginModalProps) {
  const [user, setUser] = useState<User | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)

      if (event === 'SIGNED_OUT') {
        setEmail('')
        setPassword('')
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setMessage('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) throw error

      setUser(data.user)
      setPassword('')
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Login gagal. Coba lagi.',
      )
    } finally {
      setBusy(false)
    }
  }

  async function handleLogout() {
    setBusy(true)
    setMessage('')

    try {
      const { error } = await supabase.auth.signOut({ scope: 'local' })

      if (error) throw error

      setUser(null)
      setEmail('')
      setPassword('')
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Logout gagal. Coba lagi.',
      )
    } finally {
      setBusy(false)
    }
  }

  if (!isOpen) return null

  const username = user
    ? user.user_metadata?.username ||
      user.user_metadata?.full_name ||
      user.email ||
      'Pengguna'
    : ''

  return (
    <div className="login-modal-backdrop" onClick={onClose}>
      <section
        className="login-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          className="login-modal-close"
          type="button"
          onClick={onClose}
          aria-label="Tutup"
        >
          ×
        </button>

        {loading ? (
          <p role="status">Memuat sesi...</p>
        ) : user ? (
          <>
            <h2 id="login-modal-title">Akun Anda</h2>
            <p>
              Login sebagai: <strong>{username}</strong>
            </p>

            <button
              className="login-modal-submit"
              type="button"
              onClick={handleLogout}
              disabled={busy}
            >
              {busy ? 'Memproses...' : 'Logout'}
            </button>
          </>
        ) : (
          <>
            <h2 id="login-modal-title">Login</h2>

            <form onSubmit={handleLogin}>
              <label htmlFor="login-modal-email">Email</label>
              <input
                id="login-modal-email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />

              <label htmlFor="login-modal-password">Password</label>
              <input
                id="login-modal-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />

              <button
                className="login-modal-submit"
                type="submit"
                disabled={busy}
              >
                {busy ? 'Memproses...' : 'Login'}
              </button>
            </form>
          </>
        )}

        {message && <p role="alert">{message}</p>}
      </section>

      <style>{`
        .login-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: grid;
          place-items: center;
          padding: 16px;
          background: rgba(0, 0, 0, 0.5);
        }

        .login-modal {
          position: relative;
          width: min(100%, 400px);
          padding: 28px;
          border-radius: 12px;
          background: white;
          color: #111827;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
        }

        .login-modal h2 {
          margin: 0 32px 20px 0;
        }

        .login-modal form {
          display: grid;
          gap: 10px;
        }

        .login-modal input {
          box-sizing: border-box;
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font: inherit;
        }

        .login-modal-submit {
          width: 100%;
          margin-top: 10px;
          padding: 10px 12px;
          border: 0;
          border-radius: 6px;
          background: #2563eb;
          color: white;
          font: inherit;
          cursor: pointer;
        }

        .login-modal-submit:disabled {
          cursor: wait;
          opacity: 0.6;
        }

        .login-modal-close {
          position: absolute;
          top: 12px;
          right: 14px;
          border: 0;
          background: transparent;
          font-size: 24px;
          cursor: pointer;
        }
      `}</style>
    </div>
  )
}

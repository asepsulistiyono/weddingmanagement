import React, { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  ShieldAlert,
  ShieldCheck,
  User,
  X,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext.tsx'

export interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void

  // Ubah nilainya setiap kali logout berhasil.
  resetKey?: number
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  resetKey = 0,
}) => {
  const { login } = useAuth()

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const resetForm = useCallback(() => {
    setIdentifier('')
    setPassword('')
    setShowPassword(false)
    setLoading(false)
    setErrorMsg(null)
  }, [])

  useEffect(() => {
    resetForm()
  }, [isOpen, resetKey, resetForm])

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (loading) return

    setLoading(true)
    setErrorMsg(null)

    try {
      const result = await login(identifier.trim(), password)

      if (!result.success) {
        setErrorMsg(
          result.error ||
            'Login gagal. Periksa username/email dan kata sandi Anda.',
        )
        return
      }

      resetForm()
      onSuccess()
      onClose()
    } catch {
      setErrorMsg('Terjadi kesalahan saat login. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              handleClose()
            }
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-modal-title"
            className="relative w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl sm:p-6"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={handleClose}
              aria-label="Tutup dialog login"
              className="absolute right-4 top-4 rounded-lg p-1.5 text-stone-500 transition hover:bg-stone-100 hover:text-stone-800"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-5 pt-1 text-center">
              <div
                className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-700"
                aria-hidden="true"
              >
                <ShieldCheck className="h-5 w-5" />
              </div>

              <h2
                id="login-modal-title"
                className="font-serif-wedding text-xl font-bold text-stone-800 sm:text-2xl"
              >
                Panel Masuk Pengelola
              </h2>

              <p className="mt-1 text-xs text-stone-500 sm:text-sm">
                Masukkan username atau email dan kata sandi akun pengelola Anda.
              </p>
            </div>

            {errorMsg && (
              <div
                role="alert"
                className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
              >
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="manager-identifier"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-700"
                >
                  Username atau Email
                </label>

                <div className="relative">
                  <User
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
                  />

                  <input
                    id="manager-identifier"
                    name="username"
                    type="text"
                    inputMode="text"
                    required
                    autoComplete="username"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                    placeholder="Masukkan username atau email"
                    className="w-full rounded-xl border border-stone-200 bg-stone-50 py-2.5 pl-10 pr-3.5 text-sm text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="manager-password"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-700"
                >
                  Kata sandi
                </label>

                <div className="relative">
                  <Lock
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
                  />

                  <input
                    id="manager-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Masukkan kata sandi"
                    className="w-full rounded-xl border border-stone-200 bg-stone-50 py-2.5 pl-10 pr-11 text-sm text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={
                      showPassword
                        ? 'Sembunyikan kata sandi'
                        : 'Tampilkan kata sandi'
                    }
                    aria-pressed={showPassword}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 transition hover:text-amber-700"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 px-4 py-3 text-sm font-semibold tracking-wide text-white shadow-md transition hover:bg-stone-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span>
                  {loading ? 'Memverifikasi…' : 'Masuk ke Dashboard'}
                </span>
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default LoginModal

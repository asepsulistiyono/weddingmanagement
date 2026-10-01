import { useState } from 'react'
import { supabase } from './supabaseClient'

export default function Login() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  async function handleLogin(event) {
    event.preventDefault()
    setMessage('')

    const clean = identifier.trim().replace(/^@+/, '').toLowerCase()
    const emailCandidate = clean.includes('@')
      ? clean
      : clean === 'asepsulistiyono1' || clean === 'owner'
      ? 'asepsulistiyono1@gmail.com'
      : `${clean}@wedding.local`

    const { error } = await supabase.auth.signInWithPassword({
      email: emailCandidate,
      password,
    })

    setMessage(error ? error.message : 'Login berhasil.')
  }

  return (
    <form onSubmit={handleLogin}>
      <label>
        Username atau Email
        <input
          type="text"
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          placeholder="Masukkan username atau email"
          required
        />
      </label>

      <label>
        Password
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </label>

      <button type="submit">Login</button>
      {message && <p>{message}</p>}
    </form>
  )
}
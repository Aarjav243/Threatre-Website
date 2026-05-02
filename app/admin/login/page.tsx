'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLogin() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (password === 'admin123') {
      localStorage.setItem('rk_admin_auth', 'true')
      router.push('/admin')
    } else {
      setError('Incorrect password')
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-[#c41e3a] flex items-center justify-center font-bold text-2xl mx-auto mb-4">
            RK
          </div>
          <h1 className="text-xl font-bold text-white">Admin Panel</h1>
          <p className="text-gray-400 text-sm mt-1">Radhakrishna Theatre · Ichalkaranji</p>
        </div>

        <form onSubmit={handleLogin} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 space-y-4">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter admin password"
              autoFocus
              className="w-full bg-[#0a0a0a] border border-[#3a3a3a] rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:border-[#c41e3a] focus:outline-none"
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-[#c41e3a] hover:bg-[#9b1530] text-white py-3 rounded-lg font-semibold transition-colors"
          >
            Login to Admin Panel
          </button>
        </form>

        <div className="text-center mt-4">
          <a href="/" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
            ← Back to customer website
          </a>
        </div>
      </div>
    </div>
  )
}

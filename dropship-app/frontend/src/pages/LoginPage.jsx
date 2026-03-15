import React, { useState } from 'react'
import { apiJson, setToken } from '../api'

export default function LoginPage({ onLogin, goRegister }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    const { ok, data } = await apiJson('/auth/login', { method: 'POST', body: { email, password } })
    if (ok) {
      setToken(data.token)
      onLogin(data.user)
    } else {
      setError(data.error || 'שגיאה בכניסה')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🛍</div>
          <h1 className="text-3xl font-bold text-primary-800">DropShip IL</h1>
          <p className="text-gray-500 mt-1">פלטפורמת דרופ שיפינג מקצועית</p>
        </div>

        <div className="card shadow-xl">
          <h2 className="text-xl font-bold text-gray-900 mb-6">כניסה לחשבון</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">אימייל</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="input-field" placeholder="you@example.com" dir="ltr" required autoFocus />
            </div>
            <div>
              <label className="label">סיסמה</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="input-field" placeholder="••••••••" dir="ltr" required />
            </div>
            {error && (
              <div className="bg-danger-50 border border-danger-200 text-danger-700 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 text-base">
              {loading ? 'מתחבר...' : 'כניסה'}
            </button>
          </form>

          <div className="mt-4 text-center text-sm text-gray-500">
            אין לך חשבון?{' '}
            <button onClick={goRegister} className="text-primary-600 font-semibold hover:underline">
              הרשם עכשיו
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

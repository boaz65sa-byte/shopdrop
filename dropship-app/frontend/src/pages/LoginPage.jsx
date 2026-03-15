import React, { useState } from 'react'
import { apiJson, setToken } from '../api'

export default function LoginPage({ onLogin, goRegister }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const { ok, data } = await apiJson('/auth/login', { method: 'POST', body: { email, password } })
      if (ok) {
        setToken(data.token)
        onLogin(data.user)
      } else {
        setError(data.error || 'שגיאה בכניסה')
      }
    } catch {
      setError('לא ניתן להתחבר לשרת – ודא שהשרת פועל')
    } finally {
      setLoading(false)
    }
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
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  className="input-field pr-10" placeholder="••••••••" dir="ltr" required />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
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

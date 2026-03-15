import React, { useState } from 'react'
import { apiJson, setToken } from '../api'

export default function RegisterPage({ onLogin, goLogin }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', businessName: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    const { ok, data } = await apiJson('/auth/register', { method: 'POST', body: form })
    if (ok) {
      setToken(data.token)
      onLogin(data.user)
    } else {
      setError(data.error || 'שגיאה בהרשמה')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🛍</div>
          <h1 className="text-3xl font-bold text-primary-800">DropShip IL</h1>
          <p className="text-gray-500 mt-1">הצטרף לפלטפורמת המוכרים</p>
        </div>

        <div className="card shadow-xl">
          <h2 className="text-xl font-bold text-gray-900 mb-6">הרשמה</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="label">שם מלא *</label>
              <input value={form.name} onChange={e => set('name', e.target.value)}
                className="input-field" placeholder="ישראל ישראלי" required />
            </div>
            <div>
              <label className="label">אימייל *</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                className="input-field" placeholder="you@example.com" dir="ltr" required />
            </div>
            <div>
              <label className="label">סיסמה * (לפחות 6 תווים)</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)}
                  className="input-field pr-10" dir="ltr" required />
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
            <div>
              <label className="label">טלפון</label>
              <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
                className="input-field" placeholder="050-0000000" dir="ltr" />
            </div>
            <div>
              <label className="label">שם עסק (אופציונלי)</label>
              <input value={form.businessName} onChange={e => set('businessName', e.target.value)}
                className="input-field" placeholder="החנות שלי" />
            </div>

            {error && (
              <div className="bg-danger-50 border border-danger-200 text-danger-700 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <div className="bg-primary-50 border border-primary-200 rounded-xl p-3 text-xs text-primary-800">
              ℹ️ לאחר ההרשמה חשבונך ימתין לאישור. תקבל גישה מלאה לאחר אישור מנהל.
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 text-base">
              {loading ? 'נרשם...' : 'הרשמה'}
            </button>
          </form>

          <div className="mt-4 text-center text-sm text-gray-500">
            כבר יש לך חשבון?{' '}
            <button onClick={goLogin} className="text-primary-600 font-semibold hover:underline">
              כניסה
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

import React, { useState } from 'react'
import { apiJson, setToken } from '../api'

export default function RegisterPage({ onLogin, goLogin }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', businessName: '' })
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
              <input type="password" value={form.password} onChange={e => set('password', e.target.value)}
                className="input-field" dir="ltr" required />
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

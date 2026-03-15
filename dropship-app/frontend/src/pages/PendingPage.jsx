import React from 'react'
import { setToken } from '../api'

export default function PendingPage({ user, onLogout }) {
  const handleLogout = () => {
    setToken(null)
    onLogout()
  }

  if (user?.status === 'rejected') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="card max-w-md w-full text-center">
          <div className="text-5xl mb-4">❌</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">הבקשה נדחתה</h2>
          <p className="text-gray-500 text-sm mb-6">
            לצערנו בקשת ההצטרפות שלך לא אושרה. לפרטים נוספים פנה לתמיכה.
          </p>
          <button onClick={handleLogout} className="btn-secondary mx-auto">
            יציאה
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 flex items-center justify-center p-4">
      <div className="card max-w-md w-full text-center shadow-xl">
        <div className="text-6xl mb-4">⏳</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">ממתין לאישור</h2>
        <p className="text-gray-600 mt-2 mb-1">שלום <strong>{user?.name}</strong>,</p>
        <p className="text-gray-500 text-sm mb-6">
          חשבונך נוצר בהצלחה ומחכה לאישור מנהל.
          תקבל גישה מלאה לאפליקציה מיד לאחר האישור.
        </p>

        <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 text-sm text-primary-800 mb-6 text-right">
          <div className="font-semibold mb-2">מה קורה עכשיו?</div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-success-500">✓</span>
              <span>חשבון נוצר בהצלחה</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-warning-500">⏳</span>
              <span>ממתין לאישור מנהל</span>
            </div>
            <div className="flex items-center gap-2 opacity-40">
              <span>○</span>
              <span>גישה מלאה לאפליקציה</span>
            </div>
          </div>
        </div>

        <button onClick={handleLogout} className="btn-secondary mx-auto text-sm">
          🚪 יציאה
        </button>
      </div>
    </div>
  )
}

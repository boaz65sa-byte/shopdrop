import React, { useState } from 'react'

export default function Settings({ showToast }) {
  const [markup, setMarkup] = useState(50)
  const [currency, setCurrency] = useState('ILS')
  const [usdRate, setUsdRate] = useState(3.75)
  const [shippingBuffer, setShippingBuffer] = useState(2)
  const [autoPublish, setAutoPublish] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    // In a real app this would persist to backend
    setSaved(true)
    showToast('ההגדרות נשמרו בהצלחה', 'success')
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">הגדרות</h1>
        <p className="text-gray-500 text-sm mt-1">הגדרות כלליות של המערכת</p>
      </div>

      {/* Pricing settings */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-900 border-b border-gray-100 pb-3">הגדרות מחירים</h2>

        <div>
          <label className="label">אחוז רווח ברירת מחדל: {markup}%</label>
          <input
            type="range"
            min={10}
            max={300}
            value={markup}
            onChange={e => setMarkup(parseInt(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>10%</span>
            <span className="font-medium text-gray-600">{markup}%</span>
            <span>300%</span>
          </div>
        </div>

        <div>
          <label className="label">שקלול שינוי $→₪</label>
          <input
            type="number"
            value={usdRate}
            onChange={e => setUsdRate(parseFloat(e.target.value))}
            step="0.05"
            min="1"
            className="input-field w-40"
            dir="ltr"
          />
          <p className="text-xs text-gray-400 mt-1">שער הדולר לשקל לחישוב מחיר מכירה</p>
        </div>

        <div>
          <label className="label">תוספת עלות משלוח קבועה ($)</label>
          <input
            type="number"
            value={shippingBuffer}
            onChange={e => setShippingBuffer(parseFloat(e.target.value))}
            step="0.5"
            min="0"
            className="input-field w-40"
            dir="ltr"
          />
          <p className="text-xs text-gray-400 mt-1">סכום שנוסף לעלות הספק לפני חישוב הרווח</p>
        </div>

        <div>
          <label className="label">מטבע תצוגה</label>
          <select value={currency} onChange={e => setCurrency(e.target.value)} className="input-field w-40">
            <option value="ILS">₪ שקל (ILS)</option>
            <option value="USD">$ דולר (USD)</option>
            <option value="EUR">€ אירו (EUR)</option>
          </select>
        </div>
      </div>

      {/* Automation */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-900 border-b border-gray-100 pb-3">אוטומציה</h2>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-gray-900">פרסום אוטומטי</div>
            <div className="text-xs text-gray-500 mt-0.5">פרסם מוצרים חדשים אוטומטית לכל החנויות</div>
          </div>
          <button
            onClick={() => setAutoPublish(!autoPublish)}
            className={`relative w-11 h-6 rounded-full transition-colors ${autoPublish ? 'bg-primary-600' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${autoPublish ? 'right-1' : 'translate-x-1 right-auto left-1'}`} />
          </button>
        </div>
      </div>

      {/* About */}
      <div className="card space-y-3">
        <h2 className="font-semibold text-gray-900 border-b border-gray-100 pb-3">אודות</h2>
        <div className="text-sm text-gray-600 space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-500">גרסה</span>
            <span>1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Backend</span>
            <span dir="ltr">Node.js + Express</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Frontend</span>
            <span dir="ltr">React + Vite + Tailwind</span>
          </div>
        </div>
      </div>

      <button onClick={handleSave} className="btn-primary px-8">
        {saved ? '✓ נשמר!' : 'שמור הגדרות'}
      </button>
    </div>
  )
}

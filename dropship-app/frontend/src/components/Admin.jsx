import React, { useState, useEffect } from 'react'

const API_BASE = '/api'
const TOKEN_KEY = 'dropship_admin_token'

/* ─── Login Screen ─── */
function LoginScreen({ onLogin }) {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await fetch(`${API_BASE}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })
      const data = await res.json()
      if (res.ok) {
        localStorage.setItem(TOKEN_KEY, data.token)
        onLogin(data.token)
      } else {
        setError(data.error || 'שגיאה')
      }
    } catch {
      setError('שגיאת חיבור לשרת')
    } finally { setLoading(false) }
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="card w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">🔐</div>
          <h2 className="text-xl font-bold text-gray-900">כניסת אדמין</h2>
          <p className="text-sm text-gray-500 mt-1">הכנס סיסמת אדמין להמשך</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="label">סיסמה</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="input-field"
              placeholder="ברירת מחדל: admin123"
              dir="ltr"
              autoFocus
            />
          </div>
          {error && <div className="text-sm text-danger-600 bg-danger-50 px-3 py-2 rounded-lg">{error}</div>}
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
            {loading ? 'מתחבר...' : 'כניסה'}
          </button>
        </form>
        <div className="mt-4 bg-primary-50 border border-primary-200 rounded-lg p-3 text-xs text-primary-800">
          💡 סיסמת ברירת מחדל: <strong>admin123</strong> — אחרי הכניסה תוכל לשנותה בלשונית "🔒 אבטחה"
        </div>
      </div>
    </div>
  )
}

/* ─── Field with show/hide ─── */
function SecretField({ label, value, onChange, placeholder, hint }) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex gap-2">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="input-field flex-1 font-mono text-xs"
          dir="ltr"
        />
        <button type="button" onClick={() => setShow(!show)} className="btn-secondary px-3 text-sm shrink-0">
          {show ? '🙈' : '👁'}
        </button>
      </div>
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  )
}

/* ─── Tab: API Keys ─── */
function ApiKeysTab({ config, onChange, onSave, saving }) {
  const Section = ({ title, icon, children }) => (
    <div className="border border-gray-200 rounded-xl overflow-hidden mb-4">
      <div className="bg-gray-50 px-4 py-3 flex items-center gap-2 border-b border-gray-200">
        <span className="text-xl">{icon}</span>
        <span className="font-semibold text-gray-800">{title}</span>
      </div>
      <div className="p-4 space-y-3">{children}</div>
    </div>
  )

  const set = (platform, key, val) => onChange({ ...config, [platform]: { ...config[platform], [key]: val } })

  return (
    <div className="space-y-2">
      <div className="text-sm text-gray-500 mb-4">
        הגדר API keys כאן – הם נשמרים בקובץ מקומי בשרת ומשפיעים מיידית ללא הפעלה מחדש.
      </div>

      <Section title="eBay Developer" icon="🛒">
        <div>
          <label className="label">Client ID (App ID)</label>
          <input value={config.ebay?.clientId || ''} onChange={e => set('ebay','clientId',e.target.value)} className="input-field" dir="ltr" placeholder="xxxxxxxx-xxxx-xxxx-xxxx" />
        </div>
        <SecretField label="Client Secret" value={config.ebay?.clientSecret || ''} onChange={v => set('ebay','clientSecret',v)} placeholder="xxxxxxxxxxxxxxxxxxxxxxxx" />
        <div>
          <label className="label">סביבה</label>
          <select value={config.ebay?.env || 'sandbox'} onChange={e => set('ebay','env',e.target.value)} className="input-field w-48">
            <option value="sandbox">Sandbox (בדיקות)</option>
            <option value="production">Production (אמיתי)</option>
          </select>
        </div>
        <div>
          <label className="label">Redirect URI</label>
          <input value={config.ebay?.redirectUri || ''} onChange={e => set('ebay','redirectUri',e.target.value)} className="input-field font-mono text-xs" dir="ltr" />
        </div>
      </Section>

      <Section title="Shopify Partners" icon="🏪">
        <div>
          <label className="label">API Key</label>
          <input value={config.shopify?.apiKey || ''} onChange={e => set('shopify','apiKey',e.target.value)} className="input-field font-mono text-xs" dir="ltr" placeholder="xxxxxxxxxxxxxxxxxxxxxxxx" />
        </div>
        <SecretField label="API Secret" value={config.shopify?.apiSecret || ''} onChange={v => set('shopify','apiSecret',v)} placeholder="shpss_xxxxxxxxxxxxxxxx" />
        <div>
          <label className="label">Redirect URI</label>
          <input value={config.shopify?.redirectUri || ''} onChange={e => set('shopify','redirectUri',e.target.value)} className="input-field font-mono text-xs" dir="ltr" />
        </div>
      </Section>

      <Section title="Amazon SP-API" icon="📦">
        <div>
          <label className="label">LWA Client ID</label>
          <input value={config.amazon?.clientId || ''} onChange={e => set('amazon','clientId',e.target.value)} className="input-field font-mono text-xs" dir="ltr" placeholder="amzn1.application-oa2-client.xxxx" />
        </div>
        <SecretField label="LWA Client Secret" value={config.amazon?.clientSecret || ''} onChange={v => set('amazon','clientSecret',v)} placeholder="xxxxxxxxxxxxxxxxxxxxxxxx" />
        <div>
          <label className="label">Marketplace ID</label>
          <select value={config.amazon?.marketplace || 'A1F83G8C2ARO7P'} onChange={e => set('amazon','marketplace',e.target.value)} className="input-field">
            <option value="A1F83G8C2ARO7P">UK (A1F83G8C2ARO7P)</option>
            <option value="ATVPDKIKX0DER">US (ATVPDKIKX0DER)</option>
            <option value="A1PA6795UKMFR9">DE (A1PA6795UKMFR9)</option>
            <option value="A13V1IB3VIYZZH">FR (A13V1IB3VIYZZH)</option>
          </select>
        </div>
      </Section>

      <Section title="Etsy Developers" icon="🎨">
        <div>
          <label className="label">Keystring (API Key)</label>
          <input value={config.etsy?.clientId || ''} onChange={e => set('etsy','clientId',e.target.value)} className="input-field font-mono text-xs" dir="ltr" placeholder="xxxxxxxxxxxxxxxxxxxxxxxx" />
          <p className="text-xs text-gray-400 mt-1">הגדר Callback URL: {config.etsy?.redirectUri}</p>
        </div>
      </Section>

      <button onClick={onSave} disabled={saving} className="btn-primary w-full justify-center mt-4">
        {saving ? 'שומר...' : '💾 שמור כל המפתחות'}
      </button>
    </div>
  )
}

/* ─── Tab: AutoDS ─── */
function AutodsTab({ config, onChange, onSave, saving, showToast }) {
  const [autoDsStatus, setAutoDsStatus] = useState(null)
  const [connecting, setConnecting] = useState(false)

  useEffect(() => {
    fetch(`${API_BASE}/autods/status`).then(r => r.json()).then(setAutoDsStatus).catch(() => {})
  }, [])

  const set = (key, val) => onChange({ ...config, autods: { ...config.autods, [key]: val } })

  const handleConnect = async () => {
    setConnecting(true)
    try {
      const res = await fetch(`${API_BASE}/autods/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: config.autods?.email, apiToken: config.autods?.apiToken })
      })
      const data = await res.json()
      if (data.success) {
        showToast('חובר ל-AutoDS!', 'success')
        fetch(`${API_BASE}/autods/status`).then(r => r.json()).then(setAutoDsStatus)
      } else {
        showToast(data.error || 'שגיאה', 'error')
      }
    } finally { setConnecting(false) }
  }

  const handleDemo = async () => {
    setConnecting(true)
    try {
      const res = await fetch(`${API_BASE}/autods/connect-demo`, { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        showToast('חובר ל-AutoDS (הדגמה)', 'success')
        fetch(`${API_BASE}/autods/status`).then(r => r.json()).then(setAutoDsStatus)
      }
    } finally { setConnecting(false) }
  }

  const handleDisconnect = async () => {
    await fetch(`${API_BASE}/autods/disconnect`, { method: 'DELETE' })
    showToast('AutoDS נותק', 'success')
    setAutoDsStatus({ connected: false })
  }

  return (
    <div className="space-y-4">
      {/* What is AutoDS */}
      <div className="bg-gradient-to-l from-blue-50 to-indigo-50 border border-indigo-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <span className="text-3xl">🤖</span>
          <div>
            <h3 className="font-bold text-indigo-900">AutoDS – אוטומציה לדרופ שיפינג</h3>
            <p className="text-sm text-indigo-700 mt-1">
              AutoDS היא פלטפורמה ישראלית שמאפשרת ייבוא מוצרים מ-AliExpress, Amazon, Walmart ועוד,
              ניטור מחירים אוטומטי, ומילוי הזמנות אוטומטי.
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {['ייבוא מוצרים אוטומטי','ניטור מחיר/מלאי','מילוי הזמנות אוטומטי','תמחור דינמי'].map(f => (
                <span key={f} className="badge bg-indigo-100 text-indigo-700">{f}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Connection status */}
      {autoDsStatus?.connected && (
        <div className="bg-success-50 border border-success-200 rounded-xl p-4 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-success-500 rounded-full" />
              <span className="font-semibold text-success-800">מחובר ל-AutoDS</span>
              {autoDsStatus.isDemo && <span className="badge bg-warning-100 text-warning-700">הדגמה</span>}
            </div>
            <div className="text-sm text-success-700 mt-1">
              {autoDsStatus.email} · תוכנית: {autoDsStatus.plan} · {autoDsStatus.monitoredProducts} מוצרים מנוטרים
            </div>
          </div>
          <button onClick={handleDisconnect} className="btn-danger text-sm py-1.5 px-3">נתק</button>
        </div>
      )}

      {/* Credentials */}
      <div className="border border-gray-200 rounded-xl p-4 space-y-3">
        <h3 className="font-semibold text-gray-800">פרטי חיבור AutoDS</h3>
        <div>
          <label className="label">אימייל AutoDS</label>
          <input value={config.autods?.email || ''} onChange={e => set('email', e.target.value)} className="input-field" type="email" dir="ltr" placeholder="you@example.com" />
        </div>
        <SecretField
          label="API Token"
          value={config.autods?.apiToken || ''}
          onChange={v => set('apiToken', v)}
          placeholder="autods_api_xxxxxxxxxxxx"
          hint="מצא את ה-API Token ב: AutoDS → Settings → API"
        />
        <div>
          <label className="label">Partner ID (אופציונלי)</label>
          <input value={config.autods?.partnerId || ''} onChange={e => set('partnerId', e.target.value)} className="input-field font-mono text-xs" dir="ltr" placeholder="partner_xxxx" />
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={onSave} disabled={saving} className="btn-secondary flex-1 justify-center">
          {saving ? 'שומר...' : '💾 שמור פרטים'}
        </button>
        <button onClick={handleConnect} disabled={connecting || !config.autods?.apiToken} className="btn-primary flex-1 justify-center">
          {connecting ? 'מתחבר...' : 'חבר ל-AutoDS'}
        </button>
      </div>
      {!autoDsStatus?.connected && (
        <button onClick={handleDemo} disabled={connecting} className="btn-secondary w-full justify-center">
          🧪 חיבור מצב הדגמה
        </button>
      )}

      {/* How to get API token */}
      <details className="border border-gray-200 rounded-xl overflow-hidden">
        <summary className="px-4 py-3 bg-gray-50 cursor-pointer font-medium text-sm text-gray-700 flex justify-between">
          <span>איך מקבלים API Token מ-AutoDS?</span>
          <span className="text-gray-400">▾</span>
        </summary>
        <ol className="px-4 py-3 space-y-1 text-sm text-gray-600 list-decimal list-inside">
          <li>הרשם/כנס לחשבון AutoDS ב-autods.com</li>
          <li>לחץ על שם המשתמש שלך → Settings</li>
          <li>עבור ללשונית "API"</li>
          <li>לחץ "Generate Token"</li>
          <li>העתק את ה-Token והדבק למעלה</li>
        </ol>
      </details>
    </div>
  )
}

/* ─── Tab: General Settings ─── */
function GeneralTab({ config, onChange, onSave, saving }) {
  const set = (key, val) => onChange({ ...config, general: { ...config.general, [key]: val } })

  return (
    <div className="space-y-4">
      <div className="border border-gray-200 rounded-xl p-4 space-y-4">
        <h3 className="font-semibold text-gray-800">הגדרות מחירים</h3>

        <div>
          <label className="label">שקלול $→₪ (שקל לדולר)</label>
          <input
            type="number" step="0.05" min="1"
            value={config.general?.usdToIls || 3.75}
            onChange={e => set('usdToIls', parseFloat(e.target.value))}
            className="input-field w-36" dir="ltr"
          />
          <p className="text-xs text-gray-400 mt-1">שקל נוכחי ≈ 3.70–3.80</p>
        </div>

        <div>
          <label className="label">אחוז רווח ברירת מחדל: {config.general?.defaultMarkup || 50}%</label>
          <input
            type="range" min={10} max={300}
            value={config.general?.defaultMarkup || 50}
            onChange={e => set('defaultMarkup', parseInt(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>10%</span><span className="text-primary-600 font-semibold">{config.general?.defaultMarkup || 50}%</span><span>300%</span>
          </div>
        </div>

        <div>
          <label className="label">תוספת עלות משלוח ($)</label>
          <input
            type="number" step="0.5" min="0"
            value={config.general?.shippingBuffer ?? 2}
            onChange={e => set('shippingBuffer', parseFloat(e.target.value))}
            className="input-field w-36" dir="ltr"
          />
          <p className="text-xs text-gray-400 mt-1">מוסף לעלות הספק לפני חישוב רווח</p>
        </div>
      </div>

      <div className="border border-gray-200 rounded-xl p-4 space-y-3">
        <h3 className="font-semibold text-gray-800">הגדרות מערכת</h3>
        <div>
          <label className="label">Frontend URL</label>
          <input
            value={config.general?.frontendUrl || 'http://localhost:5173'}
            onChange={e => set('frontendUrl', e.target.value)}
            className="input-field font-mono text-xs" dir="ltr"
          />
          <p className="text-xs text-gray-400 mt-1">שנה בעלייה ל-production</p>
        </div>
      </div>

      <button onClick={onSave} disabled={saving} className="btn-primary w-full justify-center">
        {saving ? 'שומר...' : '💾 שמור הגדרות'}
      </button>
    </div>
  )
}

/* ─── Tab: Checklist ─── */
function ChecklistTab({ token }) {
  const [items, setItems] = useState([])

  useEffect(() => {
    fetch(`${API_BASE}/admin/checklist`, { headers: { 'x-admin-token': token } })
      .then(r => r.json()).then(d => setItems(d.items || [])).catch(() => {})
  }, [token])

  const priorityLabel = { high: 'חובה', medium: 'חשוב', low: 'מומלץ' }
  const priorityClass = { high: 'bg-danger-100 text-danger-700', medium: 'bg-warning-100 text-warning-700', low: 'bg-success-100 text-success-700' }

  const done = items.filter(i => i.done).length
  const pct = items.length ? Math.round(done / items.length * 100) : 0

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="card">
        <div className="flex justify-between items-center mb-2">
          <span className="font-semibold text-gray-800">מוכנות למכירה</span>
          <span className="text-2xl font-bold text-primary-700">{pct}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div className="bg-primary-600 h-3 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <div className="text-sm text-gray-500 mt-2">{done}/{items.length} משימות הושלמו</div>
      </div>

      {/* Items */}
      <div className="space-y-2">
        {items.map(item => (
          <div key={item.id} className={`flex items-center gap-3 p-3 rounded-xl border ${item.done ? 'border-success-200 bg-success-50' : 'border-gray-200 bg-white'}`}>
            <span className={`text-xl shrink-0 ${item.done ? 'opacity-100' : 'opacity-30'}`}>
              {item.done ? '✅' : '⬜'}
            </span>
            <div className="flex-1">
              <span className={`text-sm font-medium ${item.done ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                {item.label}
              </span>
            </div>
            <span className={`badge text-xs ${priorityClass[item.priority]}`}>
              {priorityLabel[item.priority]}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Tab: Security ─── */
function SecurityTab({ onSave, saving, showToast }) {
  const [current, setCurrent] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirm, setConfirm] = useState('')

  const handleChange = () => {
    if (!newPass || newPass !== confirm) { showToast('הסיסמאות לא תואמות', 'error'); return }
    if (newPass.length < 6) { showToast('סיסמה חייבת להיות לפחות 6 תווים', 'warning'); return }
    onSave({ adminPassword: newPass })
    setCurrent(''); setNewPass(''); setConfirm('')
  }

  return (
    <div className="space-y-4 max-w-sm">
      <div className="border border-gray-200 rounded-xl p-4 space-y-3">
        <h3 className="font-semibold text-gray-800">שינוי סיסמת אדמין</h3>
        <div>
          <label className="label">סיסמה חדשה</label>
          <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} className="input-field" dir="ltr" />
        </div>
        <div>
          <label className="label">אימות סיסמה</label>
          <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} className="input-field" dir="ltr" />
        </div>
        <button onClick={handleChange} disabled={saving} className="btn-primary w-full justify-center">
          {saving ? 'שומר...' : 'שנה סיסמה'}
        </button>
      </div>
      <div className="bg-warning-50 border border-warning-200 rounded-xl p-3 text-sm text-warning-800">
        ⚠️ שמור את הסיסמה במקום בטוח. לא ניתן לשחזרה אוטומטית.
      </div>
    </div>
  )
}

/* ─── Main Admin Component ─── */
export default function Admin({ showToast }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [activeTab, setActiveTab] = useState('checklist')
  const [config, setConfig] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!token) return
    fetch(`${API_BASE}/admin/config`, { headers: { 'x-admin-token': token } })
      .then(r => { if (r.status === 401) { localStorage.removeItem(TOKEN_KEY); setToken(null); return null; } return r.json(); })
      .then(data => { if (data) setConfig(data) })
      .catch(() => {})
  }, [token])

  const handleSave = async (overrides = null) => {
    setSaving(true)
    try {
      const payload = overrides || config
      const res = await fetch(`${API_BASE}/admin/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (res.ok) showToast(data.message || 'נשמר!', 'success')
      else showToast(data.error || 'שגיאה', 'error')
    } finally { setSaving(false) }
  }

  const handleLogout = () => {
    fetch(`${API_BASE}/admin/logout`, { method: 'POST', headers: { 'x-admin-token': token } })
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
  }

  if (!token) return <LoginScreen onLogin={setToken} />

  const tabs = [
    { id: 'checklist', label: '✅ רשימת משימות' },
    { id: 'apikeys',   label: '🔑 API Keys' },
    { id: 'autods',    label: '🤖 AutoDS' },
    { id: 'general',   label: '⚙️ הגדרות' },
    { id: 'security',  label: '🔒 אבטחה' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">פאנל אדמין</h1>
          <p className="text-gray-500 text-sm mt-1">ניהול API Keys, AutoDS, והגדרות מערכת</p>
        </div>
        <button onClick={handleLogout} className="btn-secondary text-sm py-1.5">
          🚪 יציאה
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-primary-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="fade-in">
        {activeTab === 'checklist' && <ChecklistTab token={token} />}
        {activeTab === 'apikeys'   && <ApiKeysTab config={config} onChange={setConfig} onSave={() => handleSave()} saving={saving} />}
        {activeTab === 'autods'    && <AutodsTab  config={config} onChange={setConfig} onSave={() => handleSave()} saving={saving} showToast={showToast} />}
        {activeTab === 'general'   && <GeneralTab  config={config} onChange={setConfig} onSave={() => handleSave()} saving={saving} />}
        {activeTab === 'security'  && <SecurityTab onSave={handleSave} saving={saving} showToast={showToast} />}
      </div>
    </div>
  )
}

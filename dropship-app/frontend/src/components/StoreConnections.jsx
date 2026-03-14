import React, { useState, useEffect } from 'react'

const API_BASE = '/api'

/* ─── eBay ─── */
function EbayCard({ status, onRefresh, showToast }) {
  const [connecting, setConnecting] = useState(false)

  const handleConnect = async () => {
    setConnecting(true)
    try {
      const res = await fetch(`${API_BASE}/ebay/auth-url`)
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else showToast(data.message || 'לא ניתן לחבר', 'warning')
    } finally { setConnecting(false) }
  }

  const handleDemo = async () => {
    setConnecting(true)
    try {
      const res = await fetch(`${API_BASE}/ebay/connect-demo`, { method: 'POST' })
      const data = await res.json()
      if (data.success) { showToast('חובר לאיביי (הדגמה)', 'success'); onRefresh() }
    } finally { setConnecting(false) }
  }

  const handleDisconnect = async () => {
    if (!confirm('לנתק את eBay?')) return
    await fetch(`${API_BASE}/ebay/disconnect`, { method: 'DELETE' })
    showToast('eBay נותק', 'success'); onRefresh()
  }

  return (
    <StoreCard
      icon="🛒" name="eBay" sub="פלטפורמת מכירות עולמית"
      status={status}
      connecting={connecting}
      onConnect={handleConnect}
      onDemo={handleDemo}
      onDisconnect={handleDisconnect}
      demoNote="נדרש EBAY_CLIENT_ID ב-.env"
      connectedInfo={status?.connected ? [
        { label: 'משתמש', value: status.username },
        { label: 'שם החנות', value: status.storeName },
        { label: 'מוצרים', value: status.productsCount || 0 },
      ] : []}
    />
  )
}

/* ─── Shopify ─── */
function ShopifyCard({ status, onRefresh, showToast }) {
  const [shopDomain, setShopDomain] = useState('')
  const [connecting, setConnecting] = useState(false)

  const handleConnect = async () => {
    if (!shopDomain.trim()) return
    setConnecting(true)
    try {
      const res = await fetch(`${API_BASE}/shopify/auth-url?shop=${encodeURIComponent(shopDomain)}`)
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else showToast(data.message || 'לא ניתן לחבר', 'warning')
    } finally { setConnecting(false) }
  }

  const handleDemo = async () => {
    setConnecting(true)
    try {
      const res = await fetch(`${API_BASE}/shopify/connect-demo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop: shopDomain || 'demo-store.myshopify.com' })
      })
      const data = await res.json()
      if (data.success) { showToast('חובר לשופיפיי (הדגמה)', 'success'); setShopDomain(''); onRefresh() }
    } finally { setConnecting(false) }
  }

  const handleDisconnect = async (shop) => {
    if (!confirm(`לנתק ${shop}?`)) return
    await fetch(`${API_BASE}/shopify/disconnect?shop=${encodeURIComponent(shop)}`, { method: 'DELETE' })
    showToast('Shopify נותק', 'success'); onRefresh()
  }

  return (
    <div className="card">
      <CardHeader icon="🏪" name="Shopify" sub="חנות אונליין מקצועית" connected={status?.connected} connectedLabel={status?.stores?.length ? `${status.stores.length} חנויות` : undefined} />

      {status?.stores?.map(s => (
        <div key={s.shop} className="bg-gray-50 rounded-xl p-3 text-sm mb-3">
          <div className="flex justify-between items-center">
            <span className="font-medium">{s.storeName || s.shop}</span>
            <button onClick={() => handleDisconnect(s.shop)} className="text-danger-600 text-xs hover:underline">נתק</button>
          </div>
          <div className="text-xs text-gray-400 mt-0.5" dir="ltr">{s.shop}</div>
        </div>
      ))}

      <div className="space-y-2">
        <label className="label">כתובת החנות</label>
        <input type="text" value={shopDomain} onChange={e => setShopDomain(e.target.value)}
          placeholder="my-store.myshopify.com" className="input-field" dir="ltr" />
        <button onClick={handleConnect} disabled={connecting || !shopDomain.trim()} className="btn-primary w-full justify-center">
          {connecting ? 'מתחבר...' : 'חבר עם OAuth'}
        </button>
        <button onClick={handleDemo} disabled={connecting} className="btn-secondary w-full justify-center">
          חיבור מצב הדגמה
        </button>
        <p className="text-xs text-gray-400 text-center">נדרש SHOPIFY_API_KEY ב-.env</p>
      </div>
    </div>
  )
}

/* ─── Amazon ─── */
function AmazonCard({ status, onRefresh, showToast }) {
  const [connecting, setConnecting] = useState(false)

  const handleConnect = async () => {
    setConnecting(true)
    try {
      const res = await fetch(`${API_BASE}/amazon/auth-url`)
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else showToast(data.message || 'לא ניתן לחבר', 'warning')
    } finally { setConnecting(false) }
  }

  const handleDemo = async () => {
    setConnecting(true)
    try {
      const res = await fetch(`${API_BASE}/amazon/connect-demo`, { method: 'POST' })
      const data = await res.json()
      if (data.success) { showToast('חובר לאמזון (הדגמה)', 'success'); onRefresh() }
    } finally { setConnecting(false) }
  }

  const handleDisconnect = async () => {
    if (!confirm('לנתק את Amazon?')) return
    await fetch(`${API_BASE}/amazon/disconnect`, { method: 'DELETE' })
    showToast('Amazon נותק', 'success'); onRefresh()
  }

  return (
    <StoreCard
      icon="📦" name="Amazon" sub="הפלטפורמה הגדולה בעולם"
      status={status}
      connecting={connecting}
      onConnect={handleConnect}
      onDemo={handleDemo}
      onDisconnect={handleDisconnect}
      demoNote="נדרש AMAZON_CLIENT_ID ב-.env"
      connectedInfo={status?.connected ? [
        { label: 'Seller ID', value: status.sellerId },
        { label: 'שם החנות', value: status.storeName },
        { label: 'Marketplace', value: status.marketplaceId },
      ] : []}
    />
  )
}

/* ─── Etsy ─── */
function EtsyCard({ status, onRefresh, showToast }) {
  const [connecting, setConnecting] = useState(false)

  const handleConnect = async () => {
    setConnecting(true)
    try {
      const res = await fetch(`${API_BASE}/etsy/auth-url`)
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else showToast(data.message || 'לא ניתן לחבר', 'warning')
    } finally { setConnecting(false) }
  }

  const handleDemo = async () => {
    setConnecting(true)
    try {
      const res = await fetch(`${API_BASE}/etsy/connect-demo`, { method: 'POST' })
      const data = await res.json()
      if (data.success) { showToast('חובר לאטסי (הדגמה)', 'success'); onRefresh() }
    } finally { setConnecting(false) }
  }

  const handleDisconnect = async () => {
    if (!confirm('לנתק את Etsy?')) return
    await fetch(`${API_BASE}/etsy/disconnect`, { method: 'DELETE' })
    showToast('Etsy נותק', 'success'); onRefresh()
  }

  return (
    <StoreCard
      icon="🎨" name="Etsy" sub="שוק למוצרים ייחודיים ומעוצבים"
      status={status}
      connecting={connecting}
      onConnect={handleConnect}
      onDemo={handleDemo}
      onDisconnect={handleDisconnect}
      demoNote="נדרש ETSY_CLIENT_ID ב-.env"
      connectedInfo={status?.connected ? [
        { label: 'שם החנות', value: status.shopName },
        { label: 'User ID', value: status.userId },
      ] : []}
    />
  )
}

/* ─── WooCommerce ─── */
function WooCommerceCard({ status, onRefresh, showToast }) {
  const [siteUrl, setSiteUrl] = useState('')
  const [consumerKey, setConsumerKey] = useState('')
  const [consumerSecret, setConsumerSecret] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const handleConnect = async () => {
    if (!siteUrl || !consumerKey || !consumerSecret) {
      showToast('מלא את כל השדות', 'warning'); return
    }
    setConnecting(true)
    try {
      const res = await fetch(`${API_BASE}/woocommerce/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteUrl, consumerKey, consumerSecret })
      })
      const data = await res.json()
      if (res.ok) {
        showToast(`חובר ל-${data.storeName}`, 'success')
        setSiteUrl(''); setConsumerKey(''); setConsumerSecret(''); setShowForm(false)
        onRefresh()
      } else {
        showToast(data.error || 'שגיאה בחיבור', 'error')
      }
    } finally { setConnecting(false) }
  }

  const handleDemo = async () => {
    setConnecting(true)
    try {
      const res = await fetch(`${API_BASE}/woocommerce/connect-demo`, { method: 'POST' })
      const data = await res.json()
      if (data.success) { showToast('חובר ל-WooCommerce (הדגמה)', 'success'); onRefresh() }
    } finally { setConnecting(false) }
  }

  const handleDisconnect = async (url) => {
    if (!confirm(`לנתק ${url}?`)) return
    await fetch(`${API_BASE}/woocommerce/disconnect?siteUrl=${encodeURIComponent(url)}`, { method: 'DELETE' })
    showToast('WooCommerce נותק', 'success'); onRefresh()
  }

  return (
    <div className="card">
      <CardHeader icon="🔌" name="WooCommerce" sub="חנות WordPress + WooCommerce"
        connected={status?.connected}
        connectedLabel={status?.stores?.length ? `${status.stores.length} חנויות` : undefined} />

      {status?.stores?.map(s => (
        <div key={s.siteUrl} className="bg-gray-50 rounded-xl p-3 text-sm mb-3">
          <div className="flex justify-between items-center">
            <span className="font-medium">{s.storeName}</span>
            <button onClick={() => handleDisconnect(s.siteUrl)} className="text-danger-600 text-xs hover:underline">נתק</button>
          </div>
          <div className="text-xs text-gray-400 mt-0.5" dir="ltr">{s.siteUrl}</div>
          {s.isDemo && <span className="badge bg-warning-100 text-warning-700 mt-1">הדגמה</span>}
        </div>
      ))}

      {!showForm ? (
        <div className="space-y-2">
          <button onClick={() => setShowForm(true)} className="btn-primary w-full justify-center">
            + חבר חנות WooCommerce
          </button>
          <button onClick={handleDemo} disabled={connecting} className="btn-secondary w-full justify-center">
            חיבור מצב הדגמה
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="label">כתובת האתר</label>
            <input value={siteUrl} onChange={e => setSiteUrl(e.target.value)}
              placeholder="https://my-store.com" className="input-field" dir="ltr" />
          </div>
          <div>
            <label className="label">Consumer Key</label>
            <input value={consumerKey} onChange={e => setConsumerKey(e.target.value)}
              placeholder="ck_xxxxxxxxxxxxxxxx" className="input-field font-mono text-xs" dir="ltr" />
          </div>
          <div>
            <label className="label">Consumer Secret</label>
            <input type="password" value={consumerSecret} onChange={e => setConsumerSecret(e.target.value)}
              placeholder="cs_xxxxxxxxxxxxxxxx" className="input-field font-mono text-xs" dir="ltr" />
          </div>
          <p className="text-xs text-gray-400">
            המפתחות נוצרים ב: WooCommerce → הגדרות → מתקדם → REST API
          </p>
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className="btn-secondary flex-1 justify-center">ביטול</button>
            <button onClick={handleConnect} disabled={connecting} className="btn-primary flex-1 justify-center">
              {connecting ? 'מתחבר...' : 'חבר'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Shared sub-components ─── */
function CardHeader({ icon, name, sub, connected, connectedLabel }) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-2xl">{icon}</div>
        <div>
          <h3 className="font-semibold text-gray-900">{name}</h3>
          <p className="text-sm text-gray-500">{sub}</p>
        </div>
      </div>
      <span className={`badge ${connected ? 'bg-success-100 text-success-700' : 'bg-gray-100 text-gray-500'}`}>
        {connected ? `● ${connectedLabel || 'מחובר'}` : '○ לא מחובר'}
      </span>
    </div>
  )
}

function StoreCard({ icon, name, sub, status, connecting, onConnect, onDemo, onDisconnect, demoNote, connectedInfo }) {
  return (
    <div className="card">
      <CardHeader icon={icon} name={name} sub={sub} connected={status?.connected} />

      {status?.connected ? (
        <div className="space-y-3">
          <div className="bg-gray-50 rounded-xl p-3 text-sm space-y-1.5">
            {connectedInfo.map(({ label, value }) => (
              <div key={label} className="flex justify-between">
                <span className="text-gray-500">{label}</span>
                <span className="font-medium truncate max-w-[160px] text-left" dir="ltr">{value}</span>
              </div>
            ))}
            {status.isDemo && (
              <div className="pt-1">
                <span className="badge bg-warning-100 text-warning-700">מצב הדגמה</span>
              </div>
            )}
          </div>
          <button onClick={onDisconnect} className="btn-danger w-full justify-center">נתק חיבור</button>
        </div>
      ) : (
        <div className="space-y-2">
          <button onClick={onConnect} disabled={connecting} className="btn-primary w-full justify-center">
            {connecting ? 'מתחבר...' : 'חבר עם OAuth'}
          </button>
          <button onClick={onDemo} disabled={connecting} className="btn-secondary w-full justify-center">
            חיבור מצב הדגמה
          </button>
          {demoNote && <p className="text-xs text-gray-400 text-center">{demoNote}</p>}
        </div>
      )}
    </div>
  )
}

/* ─── Main Component ─── */
export default function StoreConnections({ storeStatus, refreshStoreStatus, showToast }) {
  const [extraStatus, setExtraStatus] = useState({ amazon: null, etsy: null, woocommerce: null })

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/amazon/status`).then(r => r.json()),
      fetch(`${API_BASE}/etsy/status`).then(r => r.json()),
      fetch(`${API_BASE}/woocommerce/status`).then(r => r.json()),
    ]).then(([amazon, etsy, woocommerce]) => {
      setExtraStatus({ amazon, etsy, woocommerce })
    }).catch(() => {})
  }, [])

  const refreshAll = () => {
    refreshStoreStatus()
    Promise.all([
      fetch(`${API_BASE}/amazon/status`).then(r => r.json()),
      fetch(`${API_BASE}/etsy/status`).then(r => r.json()),
      fetch(`${API_BASE}/woocommerce/status`).then(r => r.json()),
    ]).then(([amazon, etsy, woocommerce]) => setExtraStatus({ amazon, etsy, woocommerce })).catch(() => {})
  }

  const totalConnected =
    (storeStatus?.ebay?.connected ? 1 : 0) +
    (storeStatus?.shopify?.connected ? 1 : 0) +
    (extraStatus.amazon?.connected ? 1 : 0) +
    (extraStatus.etsy?.connected ? 1 : 0) +
    (extraStatus.woocommerce?.connected ? 1 : 0)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">חיבור חנויות</h1>
          <p className="text-gray-500 text-sm mt-1">
            {totalConnected > 0 ? `${totalConnected} חנויות מחוברות` : 'חבר את חנויות המכירה שלך'}
          </p>
        </div>
        {totalConnected > 0 && (
          <div className="flex items-center gap-1.5 bg-success-50 border border-success-200 text-success-700 px-3 py-1.5 rounded-xl text-sm font-medium">
            ● {totalConnected} מחוברות
          </div>
        )}
      </div>

      <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 text-sm text-primary-800">
        <strong>מצב הדגמה:</strong> השתמש בכפתורי ״מצב הדגמה״ לבדיקת המערכת ללא API מפתחות אמיתיים.
      </div>

      {/* Marketplace platforms */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">פלטפורמות Marketplace</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <EbayCard status={storeStatus?.ebay} onRefresh={refreshAll} showToast={showToast} />
          <AmazonCard status={extraStatus.amazon} onRefresh={refreshAll} showToast={showToast} />
          <EtsyCard status={extraStatus.etsy} onRefresh={refreshAll} showToast={showToast} />
        </div>
      </div>

      {/* Own store platforms */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">חנות עצמאית</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ShopifyCard status={storeStatus?.shopify} onRefresh={refreshAll} showToast={showToast} />
          <WooCommerceCard status={extraStatus.woocommerce} onRefresh={refreshAll} showToast={showToast} />
        </div>
      </div>

      {/* Setup instructions */}
      <details className="card cursor-pointer">
        <summary className="font-semibold text-gray-900 list-none flex items-center justify-between">
          <span>📋 הגדרת API מפתחות אמיתיים</span>
          <span className="text-gray-400 text-sm">לחץ להרחבה ▾</span>
        </summary>
        <div className="mt-4 space-y-4 text-sm text-gray-600">
          {[
            {
              name: '🛒 eBay Developer',
              url: 'developer.ebay.com',
              steps: ['צור אפליקציה חדשה', 'העתק Client ID ו-Client Secret', 'הגדר Redirect URI: http://localhost:3001/api/ebay/callback', 'הוסף ל-.env: EBAY_CLIENT_ID, EBAY_CLIENT_SECRET']
            },
            {
              name: '🏪 Shopify Partners',
              url: 'partners.shopify.com',
              steps: ['צור Custom App', 'הגדר Redirect URI: http://localhost:3001/api/shopify/callback', 'הוסף Scopes: read_products, write_products, read_orders', 'הוסף ל-.env: SHOPIFY_API_KEY, SHOPIFY_API_SECRET']
            },
            {
              name: '📦 Amazon SP-API',
              url: 'sellercentral.amazon.com/apps/manage',
              steps: ['רשום Developer Account', 'צור אפליקציה ב-Seller Central', 'קבל LWA Client ID ו-Client Secret', 'הוסף ל-.env: AMAZON_CLIENT_ID, AMAZON_CLIENT_SECRET']
            },
            {
              name: '🎨 Etsy Developers',
              url: 'etsy.com/developers/register',
              steps: ['צור אפליקציה חדשה', 'הגדר Callback URL: http://localhost:3001/api/etsy/callback', 'הוסף Scopes: listings_r, listings_w, transactions_r', 'הוסף ל-.env: ETSY_CLIENT_ID (ה-Keystring)']
            },
            {
              name: '🔌 WooCommerce',
              url: 'your-store.com/wp-admin',
              steps: ['WooCommerce → הגדרות → מתקדם → REST API', 'לחץ "הוסף מפתח"', 'בחר הרשאות Read/Write', 'העתק Consumer Key ו-Consumer Secret לממשק']
            },
          ].map(({ name, url, steps }) => (
            <div key={name}>
              <div className="font-medium text-gray-800 mb-1">{name}</div>
              <ol className="list-decimal list-inside space-y-0.5 text-gray-500 mr-3">
                {steps.map((s, i) => <li key={i}>{s}</li>)}
              </ol>
            </div>
          ))}
        </div>
      </details>
    </div>
  )
}

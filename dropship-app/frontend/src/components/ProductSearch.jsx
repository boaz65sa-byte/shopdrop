import React, { useState, useEffect, useCallback } from 'react'
import { apiJson, api } from '../api'

function AutodsProducts({ showToast }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState(null)
  const [savingIds, setSavingIds] = useState(new Set())

  useEffect(() => {
    Promise.all([
      apiJson('/autods/status'),
      apiJson('/autods/products'),
    ]).then(([s, p]) => {
      setStatus(s.data)
      setProducts(p.data.products || [])
    }).finally(() => setLoading(false))
  }, [])

  const handleDemoConnect = async () => {
    await apiJson('/autods/connect-demo', { method: 'POST' })
    const { data } = await apiJson('/autods/status')
    setStatus(data)
  }

  const handleSave = async (product) => {
    setSavingIds(prev => new Set([...prev, product.id]))
    try {
      const { ok, data } = await apiJson('/products/save', {
        method: 'POST',
        body: { sourceId: product.id, title: product.title, supplierPrice: product.supplierPrice, currency: product.currency, image: product.image, images: product.images, supplier: product.supplier, rating: product.rating, category: product.category, markupPercent: 50 }
      })
      if (!ok) showToast(data.error || 'שגיאה', 'error')
      else showToast('המוצר נשמר!', 'success')
    } finally {
      setSavingIds(prev => { const s = new Set(prev); s.delete(product.id); return s })
    }
  }

  if (loading) return <div className="flex justify-center h-48 items-center"><div className="spinner w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full" /></div>

  if (!status?.connected) return (
    <div className="card text-center py-12">
      <div className="text-4xl mb-3">🤖</div>
      <div className="font-semibold text-gray-800 mb-1">AutoDS לא מחובר</div>
      <div className="text-sm text-gray-500 mb-4">חבר AutoDS כדי לייבא מוצרים עם ניטור אוטומטי</div>
      <button onClick={handleDemoConnect} className="btn-primary mx-auto">חבר מצב הדגמה</button>
    </div>
  )

  return (
    <div>
      <div className="flex items-center gap-3 mb-4 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3">
        <span className="text-2xl">🤖</span>
        <div>
          <span className="font-semibold text-indigo-800">AutoDS מחובר</span>
          {status.isDemo && <span className="badge bg-warning-100 text-warning-700 mr-2">הדגמה</span>}
          <div className="text-xs text-indigo-600">{products.length} מוצרים עם ניטור מחיר/מלאי אוטומטי</div>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map(p => {
          const usdToIls = 3.75; const cost = (p.supplierPrice + 2) * usdToIls; const sell = cost * 1.5; const profit = sell - cost
          return (
            <div key={p.id} className="card p-0 overflow-hidden hover:shadow-md transition-shadow">
              <div className="relative">
                <img src={p.image} alt={p.title} className="w-full h-44 object-cover" />
                <div className="absolute top-2 right-2 flex gap-1">
                  <span className="badge bg-indigo-600/90 text-white text-xs">AutoDS</span>
                  <span className="badge bg-white/90 text-indigo-700 text-xs font-bold">⭐{p.profitScore}</span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-sm font-medium text-gray-900 line-clamp-2 min-h-[2.5rem]">{p.title}</h3>
                <div className="text-xs text-gray-400 mt-1">{p.supplier}</div>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-warning-500 text-xs">★</span>
                  <span className="text-xs font-medium">{p.rating}</span>
                  <span className="text-xs text-gray-400">({p.reviews.toLocaleString()})</span>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 text-xs space-y-1">
                  <div className="flex justify-between text-gray-500"><span>עלות</span><span>${p.supplierPrice}</span></div>
                  <div className="flex justify-between text-gray-700 font-medium"><span>מחיר מכירה</span><span>₪{sell.toFixed(0)}</span></div>
                  <div className="flex justify-between text-success-600 font-bold"><span>רווח</span><span>₪{profit.toFixed(0)}</span></div>
                </div>
                <button onClick={() => handleSave(p)} disabled={savingIds.has(p.id)} className="btn-primary w-full mt-3 justify-center text-sm py-2">
                  {savingIds.has(p.id) ? <span className="spinner w-4 h-4 border-2 border-white/40 border-t-white rounded-full" /> : '+ הוסף למוצרים'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const CATEGORY_LABELS = {
  all: 'הכל',
  electronics: 'אלקטרוניקה',
  home: 'בית',
  bags: 'תיקים',
  accessories: 'אביזרים',
  tools: 'כלים',
  sports: 'ספורט',
  health: 'בריאות',
  kitchen: 'מטבח',
  jewelry: 'תכשיטים',
  clothing: 'ביגוד',
}

function ProductCard({ product, onSave, saving }) {
  const usdToIls = 3.75
  const markup = 50
  const costIls = (product.supplierPrice + 2) * usdToIls
  const sellingPrice = costIls * (1 + markup / 100)
  const profit = sellingPrice - costIls

  return (
    <div className="card p-0 overflow-hidden hover:shadow-md transition-shadow group">
      <div className="relative">
        <img
          src={product.image}
          alt={product.title}
          className="w-full h-44 object-cover"
        />
        <div className="absolute top-2 right-2">
          <span className="badge bg-white/90 text-gray-700 shadow-sm text-xs">
            {CATEGORY_LABELS[product.category] || product.category}
          </span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-sm font-medium text-gray-900 leading-snug line-clamp-2 min-h-[2.5rem]">
          {product.title}
        </h3>
        <div className="text-xs text-gray-400 mt-1">{product.supplier}</div>

        <div className="flex items-center gap-1 mt-2">
          <span className="text-warning-500 text-xs">★</span>
          <span className="text-xs font-medium text-gray-700">{product.rating}</span>
          <span className="text-xs text-gray-400">({product.reviews.toLocaleString()} ביקורות)</span>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>עלות ספק</span>
            <span>${product.supplierPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>מחיר מכירה מוצע</span>
            <span className="font-medium text-gray-800">₪{sellingPrice.toFixed(0)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-success-600 font-medium">רווח משוער</span>
            <span className="text-success-600 font-bold">₪{profit.toFixed(0)}</span>
          </div>
        </div>

        <button
          onClick={() => onSave(product)}
          disabled={saving}
          className="btn-primary w-full mt-3 justify-center text-sm py-2"
        >
          {saving ? (
            <span className="spinner w-4 h-4 border-2 border-white/40 border-t-white rounded-full" />
          ) : '+ הוסף למוצרים שלי'}
        </button>
      </div>
    </div>
  )
}

export default function ProductSearch({ showToast, setCurrentPage }) {
  const [activeSource, setActiveSource] = useState('suppliers')
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [savingIds, setSavingIds] = useState(new Set())

  const search = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (query) params.set('q', query)
      if (category !== 'all') params.set('category', category)
      const { ok, data } = await apiJson(`/products/search?${params}`)
      if (ok) setProducts(data.products || [])
    } catch {
      showToast('שגיאה בטעינת מוצרים', 'error')
    } finally {
      setLoading(false)
    }
  }, [query, category])

  useEffect(() => {
    search()
  }, [category])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') search()
  }

  const handleSave = async (product) => {
    setSavingIds(prev => new Set([...prev, product.id]))
    try {
      const { ok, data } = await apiJson('/products/save', {
        method: 'POST',
        body: { sourceId: product.id, title: product.title, supplierPrice: product.supplierPrice, currency: product.currency, image: product.image, images: product.images, supplier: product.supplier, rating: product.rating, category: product.category, markupPercent: 50 }
      })
      if (!ok) showToast(data.error || 'שגיאה בשמירה', 'error')
      else showToast('המוצר נשמר בהצלחה!', 'success')
    } catch {
      showToast('שגיאה בשמירת המוצר', 'error')
    } finally {
      setSavingIds(prev => { const s = new Set(prev); s.delete(product.id); return s })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">חיפוש מוצרים</h1>
        <p className="text-gray-500 text-sm mt-1">מצא מוצרים רווחיים מספקים ברחבי העולם</p>
      </div>

      {/* Source tabs */}
      <div className="flex gap-3">
        <button onClick={() => setActiveSource('suppliers')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${activeSource === 'suppliers' ? 'bg-primary-600 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
          🌐 ספקים כלליים
        </button>
        <button onClick={() => setActiveSource('autods')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${activeSource === 'autods' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
          🤖 AutoDS
        </button>
      </div>

      {activeSource === 'autods' && <AutodsProducts showToast={showToast} />}
      {activeSource !== 'suppliers' ? null : null}

      {activeSource !== 'suppliers' ? <></> : <>
      {/* Search bar */}
      <div className="card p-4">
        <div className="flex gap-3">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="חפש מוצרים... (עברית או אנגלית)"
            className="input-field flex-1"
          />
          <button onClick={search} className="btn-primary px-6">
            חפש
          </button>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2 mt-3">
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setCategory(key)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                category === key
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      {!loading && (
        <div className="text-sm text-gray-500">
          נמצאו <strong className="text-gray-800">{products.length}</strong> מוצרים
        </div>
      )}

      {/* Products grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="spinner w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onSave={handleSave}
              saving={savingIds.has(product.id)}
            />
          ))}
        </div>
      )}

      {!loading && products.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">🔍</div>
          <div className="font-medium">לא נמצאו מוצרים</div>
          <div className="text-sm mt-1">נסה מונח חיפוש אחר</div>
        </div>
      )}
      </>}
    </div>
  )
}

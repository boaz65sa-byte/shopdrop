import React, { useState, useEffect } from 'react'
import { apiJson } from '../api'

const STATUS_LABELS = {
  draft: { label: 'טיוטה', class: 'bg-gray-100 text-gray-600' },
  active: { label: 'פעיל', class: 'bg-success-100 text-success-700' },
  inactive: { label: 'לא פעיל', class: 'bg-warning-100 text-warning-700' },
}

function EditModal({ product, onClose, onSave }) {
  const [markup, setMarkup] = useState(product.markupPercent || 50)
  const [title, setTitle] = useState(product.title)
  const [description, setDescription] = useState(product.description || '')
  const [saving, setSaving] = useState(false)

  const sellingPrice = (product.costPrice * (1 + markup / 100)).toFixed(2)
  const profit = (sellingPrice - product.costPrice).toFixed(2)

  const handleSave = async () => {
    setSaving(true)
    try {
      const { ok, data } = await apiJson(`/products/${product.id}`, {
        method: 'PUT',
        body: { title, description, markupPercent: parseFloat(markup) }
      })
      if (ok) onSave(data.product)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">עריכת מוצר</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="label">שם המוצר</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="label">תיאור</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="input-field resize-none" />
          </div>
          <div>
            <label className="label">אחוז רווח: {markup}%</label>
            <input type="range" min={10} max={200} value={markup} onChange={e => setMarkup(e.target.value)} className="w-full" />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>עלות: ₪{product.costPrice?.toFixed(2)}</span>
              <span>מחיר מכירה: ₪{sellingPrice}</span>
              <span className="text-success-600 font-medium">רווח: ₪{profit}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">ביטול</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 justify-center">
            {saving ? 'שומר...' : 'שמור שינויים'}
          </button>
        </div>
      </div>
    </div>
  )
}

function PublishModal({ product, storeStatus, onClose, onPublish }) {
  const [selectedStores, setSelectedStores] = useState([])
  const [publishing, setPublishing] = useState(false)

  const toggleStore = (storeId) => {
    setSelectedStores(prev =>
      prev.includes(storeId) ? prev.filter(s => s !== storeId) : [...prev, storeId]
    )
  }

  const handlePublish = async () => {
    if (!selectedStores.length) return
    setPublishing(true)
    try {
      const { ok, data } = await apiJson(`/products/${product.id}/publish`, {
        method: 'POST',
        body: { stores: selectedStores }
      })
      if (ok) onPublish(data.product)
    } finally {
      setPublishing(false)
    }
  }

  const stores = []
  if (storeStatus?.ebay?.connected) stores.push({ id: 'ebay', label: 'eBay', sub: storeStatus.ebay.storeName })
  if (storeStatus?.shopify?.connected) {
    storeStatus.shopify.stores.forEach(s => {
      stores.push({ id: `shopify:${s.shop}`, label: 'Shopify', sub: s.storeName || s.shop })
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">פרסום מוצר</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">בחר חנויות לפרסום:</p>
          {stores.length === 0 ? (
            <div className="text-sm text-gray-500 text-center py-4">אין חנויות מחוברות</div>
          ) : (
            <div className="space-y-2">
              {stores.map(store => (
                <label key={store.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedStores.includes(store.id)}
                    onChange={() => toggleStore(store.id)}
                    className="w-4 h-4 text-primary-600"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{store.label}</div>
                    <div className="text-xs text-gray-500">{store.sub}</div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">ביטול</button>
          <button onClick={handlePublish} disabled={publishing || !selectedStores.length} className="btn-primary flex-1 justify-center">
            {publishing ? 'מפרסם...' : 'פרסם עכשיו'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function MyProducts({ showToast, storeStatus, setCurrentPage }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [editProduct, setEditProduct] = useState(null)
  const [publishProduct, setPublishProduct] = useState(null)

  const loadProducts = async () => {
    try {
      const { ok, data } = await apiJson('/products/saved')
      if (ok) setProducts(data.products || [])
    } catch {
      showToast('שגיאה בטעינת מוצרים', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadProducts() }, [])

  const handleDelete = async (id) => {
    if (!confirm('האם למחוק מוצר זה?')) return
    try {
      const { ok } = await apiJson(`/products/${id}`, { method: 'DELETE' })
      if (ok) {
        setProducts(prev => prev.filter(p => p.id !== id))
        showToast('המוצר נמחק', 'success')
      }
    } catch {
      showToast('שגיאה במחיקה', 'error')
    }
  }

  const handleSaveEdit = (updatedProduct) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p))
    setEditProduct(null)
    showToast('המוצר עודכן בהצלחה', 'success')
  }

  const handlePublished = (updatedProduct) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p))
    setPublishProduct(null)
    showToast('המוצר פורסם בהצלחה!', 'success')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">המוצרים שלי</h1>
          <p className="text-gray-500 text-sm mt-1">{products.length} מוצרים שמורים</p>
        </div>
        <button onClick={() => setCurrentPage('search')} className="btn-primary">
          + הוסף מוצרים
        </button>
      </div>

      {products.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-4xl mb-3">🛍</div>
          <div className="font-semibold text-gray-800">אין מוצרים עדיין</div>
          <div className="text-sm text-gray-500 mt-1">חפש מוצרים מהספקים כדי להתחיל</div>
          <button onClick={() => setCurrentPage('search')} className="btn-primary mt-4 mx-auto">
            חפש מוצרים
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map(product => (
            <div key={product.id} className="card p-0 overflow-hidden">
              <img src={product.image} alt={product.title} className="w-full h-40 object-cover" />
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="text-sm font-medium text-gray-900 leading-snug line-clamp-2 flex-1">
                    {product.title}
                  </h3>
                  <span className={`badge shrink-0 ${STATUS_LABELS[product.status]?.class}`}>
                    {STATUS_LABELS[product.status]?.label}
                  </span>
                </div>
                <div className="text-xs text-gray-400">{product.supplier}</div>

                <div className="mt-3 flex justify-between text-sm">
                  <div>
                    <div className="text-xs text-gray-500">מחיר מכירה</div>
                    <div className="font-bold text-gray-900">₪{product.sellingPrice?.toFixed(2)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">רווח</div>
                    <div className="font-bold text-success-600">₪{(product.sellingPrice - product.costPrice)?.toFixed(2)}</div>
                  </div>
                </div>

                {product.publishedStores?.length > 0 && (
                  <div className="mt-2 text-xs text-gray-400">
                    פורסם ב: {product.publishedStores.join(', ')}
                  </div>
                )}

                <div className="flex gap-2 mt-3">
                  <button onClick={() => setEditProduct(product)} className="btn-secondary flex-1 justify-center text-xs py-1.5">
                    ערוך
                  </button>
                  <button onClick={() => setPublishProduct(product)} className="btn-primary flex-1 justify-center text-xs py-1.5">
                    פרסם
                  </button>
                  <button onClick={() => handleDelete(product.id)} className="btn-danger px-3 py-1.5 text-xs">
                    🗑
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editProduct && (
        <EditModal product={editProduct} onClose={() => setEditProduct(null)} onSave={handleSaveEdit} />
      )}
      {publishProduct && (
        <PublishModal
          product={publishProduct}
          storeStatus={storeStatus}
          onClose={() => setPublishProduct(null)}
          onPublish={handlePublished}
        />
      )}
    </div>
  )
}

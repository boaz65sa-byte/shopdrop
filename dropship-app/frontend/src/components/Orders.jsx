import React, { useState, useEffect } from 'react'

const API_BASE = '/api'

const STATUS_CONFIG = {
  pending:    { label: 'ממתין',   class: 'bg-warning-100 text-warning-700',  dot: 'bg-warning-500' },
  processing: { label: 'בטיפול', class: 'bg-primary-100 text-primary-700',  dot: 'bg-primary-500' },
  shipped:    { label: 'נשלח',   class: 'bg-blue-100 text-blue-700',         dot: 'bg-blue-500' },
  completed:  { label: 'הושלם',  class: 'bg-success-100 text-success-700',   dot: 'bg-success-500' },
  cancelled:  { label: 'בוטל',   class: 'bg-danger-100 text-danger-700',     dot: 'bg-danger-500' },
}

function FulfillModal({ order, onClose, onFulfill }) {
  const [tracking, setTracking] = useState('')
  const [carrier, setCarrier] = useState('China Post')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!tracking.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`${API_BASE}/orders/${order.id}/fulfill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackingNumber: tracking, carrier })
      })
      const data = await res.json()
      if (res.ok) onFulfill(data.order)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">עדכון שליחה - {order.orderNumber}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="label">מספר מעקב</label>
            <input value={tracking} onChange={e => setTracking(e.target.value)} className="input-field" placeholder="IL123456789CN" dir="ltr" />
          </div>
          <div>
            <label className="label">חברת שליחות</label>
            <select value={carrier} onChange={e => setCarrier(e.target.value)} className="input-field">
              <option>China Post</option>
              <option>AliExpress Standard</option>
              <option>EMS</option>
              <option>DHL</option>
              <option>FedEx</option>
              <option>Israel Post</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">ביטול</button>
          <button onClick={handleSubmit} disabled={saving || !tracking.trim()} className="btn-primary flex-1 justify-center">
            {saving ? 'שומר...' : 'סמן כנשלח'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Orders({ showToast }) {
  const [orders, setOrders] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [fulfillOrder, setFulfillOrder] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)

  const loadOrders = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const res = await fetch(`${API_BASE}/orders?${params}`)
      const data = await res.json()
      setOrders(data.orders || [])
      setStats(data.stats || null)
    } catch {
      showToast('שגיאה בטעינת הזמנות', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadOrders() }, [statusFilter])

  const updateStatus = async (orderId, newStatus) => {
    setUpdatingId(orderId)
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      const data = await res.json()
      if (res.ok) {
        setOrders(prev => prev.map(o => o.id === orderId ? data.order : o))
        showToast('סטטוס עודכן', 'success')
      }
    } finally {
      setUpdatingId(null)
    }
  }

  const handleFulfilled = (updatedOrder) => {
    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o))
    setFulfillOrder(null)
    showToast('ההזמנה סומנה כנשלחה!', 'success')
  }

  const formatDate = (iso) => {
    const d = new Date(iso)
    const now = new Date()
    const diff = (now - d) / 1000
    if (diff < 3600) return `לפני ${Math.floor(diff / 60)} דקות`
    if (diff < 86400) return `לפני ${Math.floor(diff / 3600)} שעות`
    return d.toLocaleDateString('he-IL')
  }

  const statusTabs = ['all', 'pending', 'processing', 'shipped', 'completed', 'cancelled']
  const statusTabLabels = { all: 'הכל', ...Object.fromEntries(Object.entries(STATUS_CONFIG).map(([k, v]) => [k, v.label])) }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">הזמנות</h1>
        <p className="text-gray-500 text-sm mt-1">ניהול וטיפול בהזמנות</p>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {[
            { label: 'סה"כ', value: stats.total },
            { label: 'ממתינות', value: stats.pending },
            { label: 'בטיפול', value: stats.processing },
            { label: 'נשלחו', value: stats.shipped },
            { label: 'הושלמו', value: stats.completed },
            { label: 'בוטלו', value: stats.cancelled },
          ].map(s => (
            <div key={s.label} className="card py-3 text-center">
              <div className="text-xl font-bold text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Revenue summary */}
      {stats && (
        <div className="grid grid-cols-2 gap-4">
          <div className="card bg-success-50 border-success-200">
            <div className="text-xs text-success-600 font-medium mb-1">הכנסות החודש</div>
            <div className="text-2xl font-bold text-success-700">₪{(stats.monthlyRevenue || 0).toFixed(0)}</div>
          </div>
          <div className="card bg-primary-50 border-primary-200">
            <div className="text-xs text-primary-600 font-medium mb-1">רווח נקי החודש</div>
            <div className="text-2xl font-bold text-primary-700">₪{(stats.monthlyProfit || 0).toFixed(0)}</div>
          </div>
        </div>
      )}

      {/* Status tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {statusTabs.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium shrink-0 transition-colors ${
              statusFilter === s ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {statusTabLabels[s]}
          </button>
        ))}
      </div>

      {/* Orders list */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="spinner w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full" />
        </div>
      ) : orders.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-4xl mb-3">📋</div>
          <div className="font-semibold text-gray-800">אין הזמנות</div>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => (
            <div key={order.id} className="card p-0 overflow-hidden">
              <div className="flex items-center gap-4 p-4">
                <img src={order.productImage} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-gray-900 text-sm">{order.orderNumber}</span>
                    <span className={`badge text-xs ${STATUS_CONFIG[order.status]?.class}`}>
                      {STATUS_CONFIG[order.status]?.label}
                    </span>
                    <span className="text-xs text-gray-400">{order.source === 'ebay' ? '🛒 eBay' : '🏪 Shopify'}</span>
                  </div>
                  <div className="text-sm text-gray-700 font-medium truncate">{order.customer.name}</div>
                  <div className="text-xs text-gray-400 truncate">{order.product} × {order.quantity}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-gray-900">₪{order.price.toFixed(2)}</div>
                  <div className="text-xs text-success-600 font-medium">+₪{order.profit.toFixed(2)}</div>
                  <div className="text-xs text-gray-400">{formatDate(order.createdAt)}</div>
                </div>
              </div>

              {/* Actions */}
              {(order.status === 'pending' || order.status === 'processing') && (
                <div className="px-4 pb-4 flex gap-2">
                  {order.status === 'pending' && (
                    <button
                      onClick={() => updateStatus(order.id, 'processing')}
                      disabled={updatingId === order.id}
                      className="btn-secondary text-xs py-1.5 px-3"
                    >
                      הכנס לטיפול
                    </button>
                  )}
                  <button
                    onClick={() => setFulfillOrder(order)}
                    className="btn-primary text-xs py-1.5 px-3"
                  >
                    🚚 סמן כנשלח
                  </button>
                  <button
                    onClick={() => updateStatus(order.id, 'cancelled')}
                    disabled={updatingId === order.id}
                    className="btn-danger text-xs py-1.5 px-3"
                  >
                    בטל
                  </button>
                </div>
              )}

              {order.status === 'shipped' && order.trackingNumber && (
                <div className="px-4 pb-3 flex items-center gap-2">
                  <span className="text-xs text-gray-500">מספר מעקב:</span>
                  <span className="text-xs font-mono font-medium text-primary-700" dir="ltr">{order.trackingNumber}</span>
                  {order.status === 'shipped' && (
                    <button
                      onClick={() => updateStatus(order.id, 'completed')}
                      disabled={updatingId === order.id}
                      className="btn-secondary text-xs py-1 px-3 mr-auto"
                    >
                      סמן כהושלם
                    </button>
                  )}
                </div>
              )}

              {order.notes && (
                <div className="px-4 pb-3 text-xs text-gray-500 bg-gray-50 py-2">
                  📝 {order.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {fulfillOrder && (
        <FulfillModal
          order={fulfillOrder}
          onClose={() => setFulfillOrder(null)}
          onFulfill={handleFulfilled}
        />
      )}
    </div>
  )
}

import React, { useState, useEffect } from 'react'

const API_BASE = '/api'

function StatCard({ label, value, sub, color = 'primary' }) {
  const colors = {
    primary: 'bg-primary-50 text-primary-700',
    success: 'bg-success-50 text-success-700',
    warning: 'bg-warning-50 text-warning-700',
    danger: 'bg-danger-50 text-danger-700',
  }
  return (
    <div className="card">
      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl mb-3 ${colors[color]}`}>
        <span className="text-xl">{sub}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-500 mt-0.5">{label}</div>
    </div>
  )
}

export default function Dashboard({ setCurrentPage, storeStatus }) {
  const [stats, setStats] = useState(null)
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/orders`).then(r => r.json()),
      fetch(`${API_BASE}/products/saved`).then(r => r.json()),
    ]).then(([ordersData, productsData]) => {
      setStats({
        ...ordersData.stats,
        savedProducts: productsData.total || 0,
      })
      setRecentOrders(ordersData.orders?.slice(0, 5) || [])
    }).catch(() => {
      setStats({ total: 0, pending: 0, monthlyRevenue: 0, monthlyProfit: 0, savedProducts: 0 })
    }).finally(() => setLoading(false))
  }, [])

  const statusLabel = {
    pending: { label: 'ממתין', class: 'bg-warning-100 text-warning-700' },
    processing: { label: 'בטיפול', class: 'bg-primary-100 text-primary-700' },
    shipped: { label: 'נשלח', class: 'bg-primary-50 text-primary-600' },
    completed: { label: 'הושלם', class: 'bg-success-100 text-success-700' },
    cancelled: { label: 'בוטל', class: 'bg-danger-100 text-danger-700' },
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">לוח בקרה</h1>
        <p className="text-gray-500 text-sm mt-1">סיכום פעילות החנות שלך</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="הזמנות החודש" value={stats?.total || 0} sub="📦" color="primary" />
        <StatCard label="ממתינות לטיפול" value={stats?.pending || 0} sub="⏳" color="warning" />
        <StatCard label="הכנסות החודש" value={`₪${(stats?.monthlyRevenue || 0).toFixed(0)}`} sub="💰" color="success" />
        <StatCard label="רווח נקי" value={`₪${(stats?.monthlyProfit || 0).toFixed(0)}`} sub="📈" color="success" />
      </div>

      {/* Second row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="מוצרים שמורים" value={stats?.savedProducts || 0} sub="🛍" color="primary" />
        <StatCard label="חנויות מחוברות" value={(storeStatus?.ebay?.connected ? 1 : 0) + (storeStatus?.shopify?.connected ? 1 : 0)} sub="🔗" color="primary" />
        <StatCard label="הזמנות היום" value={stats?.todayOrders || 0} sub="🗓" color="primary" />
        <StatCard label="הזמנות שנשלחו" value={stats?.shipped || 0} sub="🚚" color="primary" />
      </div>

      {/* Store connection warnings */}
      {(!storeStatus?.ebay?.connected && !storeStatus?.shopify?.connected) && (
        <div className="bg-warning-50 border border-warning-200 rounded-xl p-4 flex items-start gap-3">
          <span className="text-warning-600 text-lg shrink-0">⚠</span>
          <div>
            <div className="font-medium text-warning-800">לא מחובר לאף חנות</div>
            <div className="text-sm text-warning-700 mt-0.5">חבר את eBay או Shopify כדי להתחיל למכור</div>
            <button onClick={() => setCurrentPage('stores')} className="mt-2 text-sm font-medium text-warning-700 underline">
              חבר חנות עכשיו ←
            </button>
          </div>
        </div>
      )}

      {/* Recent orders */}
      <div className="card p-0 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">הזמנות אחרונות</h2>
          <button onClick={() => setCurrentPage('orders')} className="text-sm text-primary-600 hover:text-primary-800 font-medium">
            כל ההזמנות ←
          </button>
        </div>
        {recentOrders.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-400 text-sm">אין הזמנות עדיין</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentOrders.map(order => (
              <div key={order.id} className="flex items-center gap-4 px-6 py-3">
                <img src={order.productImage} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{order.customer.name}</div>
                  <div className="text-xs text-gray-500 truncate">{order.product}</div>
                </div>
                <div className="text-sm font-semibold text-gray-900">₪{order.price.toFixed(2)}</div>
                <span className={`badge ${statusLabel[order.status]?.class}`}>
                  {statusLabel[order.status]?.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button onClick={() => setCurrentPage('search')} className="card hover:shadow-md transition-shadow text-right">
          <div className="text-2xl mb-2">🔍</div>
          <div className="font-semibold text-gray-900">חפש מוצרים</div>
          <div className="text-sm text-gray-500 mt-1">מצא מוצרים רווחיים מספקים</div>
        </button>
        <button onClick={() => setCurrentPage('products')} className="card hover:shadow-md transition-shadow text-right">
          <div className="text-2xl mb-2">🛍</div>
          <div className="font-semibold text-gray-900">נהל מוצרים</div>
          <div className="text-sm text-gray-500 mt-1">ערוך מחירים ופרסם לחנויות</div>
        </button>
        <button onClick={() => setCurrentPage('orders')} className="card hover:shadow-md transition-shadow text-right">
          <div className="text-2xl mb-2">📦</div>
          <div className="font-semibold text-gray-900">עדכן הזמנות</div>
          <div className="text-sm text-gray-500 mt-1">טפל בהזמנות ממתינות</div>
        </button>
      </div>
    </div>
  )
}

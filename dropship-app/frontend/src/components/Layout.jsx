import React, { useState } from 'react'

const navItems = [
  { id: 'dashboard', label: 'לוח בקרה',     icon: '◉' },
  { id: 'search',    label: 'חיפוש מוצרים', icon: '⌕' },
  { id: 'products',  label: 'המוצרים שלי',  icon: '▦' },
  { id: 'orders',    label: 'הזמנות',        icon: '📋' },
  { id: 'stores',    label: 'חיבור חנויות', icon: '🔗' },
  { id: 'settings',  label: 'הגדרות',        icon: '⚙' },
  { id: 'admin',     label: 'אדמין',         icon: '🔐' },
]

export default function Layout({ children, currentPage, setCurrentPage, storeStatus }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const connectedCount = (storeStatus?.ebay?.connected ? 1 : 0) + (storeStatus?.shopify?.connected ? 1 : 0)

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-60' : 'w-16'} bg-white border-l border-gray-200 flex flex-col transition-all duration-200 shrink-0 shadow-sm`}>
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
          {sidebarOpen && (
            <div>
              <h1 className="text-lg font-bold text-primary-700">DropShip IL</h1>
              <p className="text-xs text-gray-400">מערכת ניהול דרופ שיפינג</p>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all duration-150 ${
                currentPage === item.id
                  ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="text-base shrink-0">{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Store Status */}
        {sidebarOpen && (
          <div className="p-4 border-t border-gray-100">
            <div className="text-xs font-medium text-gray-500 mb-2">חנויות מחוברות</div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2 h-2 rounded-full ${storeStatus?.ebay?.connected ? 'bg-success-500' : 'bg-gray-300'}`} />
              <span className="text-xs text-gray-600">eBay</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${storeStatus?.shopify?.connected ? 'bg-success-500' : 'bg-gray-300'}`} />
              <span className="text-xs text-gray-600">Shopify ({storeStatus?.shopify?.stores?.length || 0})</span>
            </div>
          </div>
        )}
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 fade-in">
          {children}
        </div>
      </main>
    </div>
  )
}

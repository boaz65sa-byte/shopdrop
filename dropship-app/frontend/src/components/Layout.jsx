import React, { useState } from 'react'

const sellerNavItems = [
  { id: 'dashboard', label: 'לוח בקרה',     icon: '◉' },
  { id: 'search',    label: 'חיפוש מוצרים', icon: '⌕' },
  { id: 'products',  label: 'המוצרים שלי',  icon: '▦' },
  { id: 'orders',    label: 'הזמנות',        icon: '📋' },
  { id: 'stores',    label: 'חיבור חנויות', icon: '🔗' },
  { id: 'settings',  label: 'הגדרות',        icon: '⚙' },
  { id: 'admin',     label: 'אדמין',         icon: '🔐' },
]

const superadminNavItems = [
  { id: 'dashboard',  label: 'לוח בקרה',    icon: '◉' },
  { id: 'superadmin', label: 'ניהול מוכרים', icon: '👑' },
  { id: 'admin',      label: 'הגדרות מערכת', icon: '🔐' },
]

export default function Layout({ children, currentPage, setCurrentPage, storeStatus, currentUser, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const isSuperAdmin = currentUser?.role === 'superadmin'
  const navItems = isSuperAdmin ? superadminNavItems : sellerNavItems

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-60' : 'w-16'} bg-white border-l border-gray-200 flex flex-col transition-all duration-200 shrink-0 shadow-sm`}>
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
          {sidebarOpen && (
            <div>
              <h1 className="text-lg font-bold text-primary-700">DropShip IL</h1>
              <p className="text-xs text-gray-400">{isSuperAdmin ? 'פאנל ניהול' : 'מערכת ניהול דרופ שיפינג'}</p>
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

        {/* Store Status (sellers only) */}
        {sidebarOpen && !isSuperAdmin && (
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

        {/* User info + logout */}
        {sidebarOpen && (
          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm shrink-0">
                {currentUser?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-gray-800 truncate">{currentUser?.name}</div>
                <div className="text-xs text-gray-400 truncate" dir="ltr">{currentUser?.email}</div>
              </div>
            </div>
            <button onClick={onLogout} className="w-full text-xs text-danger-600 hover:text-danger-700 font-medium py-1 rounded-lg hover:bg-danger-50 transition-colors">
              🚪 יציאה
            </button>
          </div>
        )}
        {!sidebarOpen && (
          <div className="p-2 border-t border-gray-100">
            <button onClick={onLogout} className="w-full flex justify-center py-2 text-danger-500 hover:bg-danger-50 rounded-lg transition-colors" title="יציאה">
              🚪
            </button>
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

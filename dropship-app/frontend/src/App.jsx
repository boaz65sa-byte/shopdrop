import React, { useState, useEffect, useCallback } from 'react'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import ProductSearch from './components/ProductSearch'
import MyProducts from './components/MyProducts'
import StoreConnections from './components/StoreConnections'
import Orders from './components/Orders'
import Settings from './components/Settings'

const API_BASE = '/api'

export const AppContext = React.createContext({})

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [toasts, setToasts] = useState([])
  const [storeStatus, setStoreStatus] = useState({
    ebay: { connected: false },
    shopify: { connected: false, stores: [] }
  })

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4000)
  }, [])

  const fetchStoreStatus = useCallback(async () => {
    try {
      const [ebayRes, shopifyRes] = await Promise.all([
        fetch(`${API_BASE}/ebay/status`),
        fetch(`${API_BASE}/shopify/status`)
      ])
      const ebay = await ebayRes.json()
      const shopify = await shopifyRes.json()
      setStoreStatus({ ebay, shopify })
    } catch (err) {
      // Backend not running yet
    }
  }, [])

  useEffect(() => {
    fetchStoreStatus()

    // Check for OAuth callbacks
    const params = new URLSearchParams(window.location.search)
    const successMap = {
      ebay_connected: 'חובר לאיביי בהצלחה!',
      shopify_connected: 'חובר לשופיפיי בהצלחה!',
      amazon_connected: 'חובר לאמזון בהצלחה!',
      etsy_connected: 'חובר לאטסי בהצלחה!',
    }
    const errorKeys = ['ebay_error', 'shopify_error', 'amazon_error', 'etsy_error']

    let changed = false
    for (const [key, msg] of Object.entries(successMap)) {
      if (params.get(key)) { showToast(msg, 'success'); fetchStoreStatus(); changed = true }
    }
    for (const key of errorKeys) {
      if (params.get(key)) { showToast('שגיאה בחיבור החנות', 'error'); changed = true }
    }
    if (changed) window.history.replaceState({}, '', window.location.pathname)
  }, [])

  const renderPage = () => {
    const props = { setCurrentPage, showToast, storeStatus, refreshStoreStatus: fetchStoreStatus }
    switch (currentPage) {
      case 'dashboard': return <Dashboard {...props} />
      case 'search': return <ProductSearch {...props} />
      case 'products': return <MyProducts {...props} />
      case 'stores': return <StoreConnections {...props} />
      case 'orders': return <Orders {...props} />
      case 'settings': return <Settings {...props} />
      default: return <Dashboard {...props} />
    }
  }

  return (
    <AppContext.Provider value={{ showToast, storeStatus, fetchStoreStatus }}>
      <Layout currentPage={currentPage} setCurrentPage={setCurrentPage} storeStatus={storeStatus}>
        {renderPage()}
      </Layout>

      {/* Toast Container */}
      <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2" style={{ maxWidth: '380px' }}>
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`toast-enter flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${
              toast.type === 'success' ? 'bg-success-600' :
              toast.type === 'error' ? 'bg-danger-600' :
              toast.type === 'warning' ? 'bg-warning-600' :
              'bg-gray-800'
            }`}
          >
            <span className="text-lg">
              {toast.type === 'success' ? '✓' :
               toast.type === 'error' ? '✕' :
               toast.type === 'warning' ? '⚠' : 'ℹ'}
            </span>
            <span>{toast.message}</span>
            <button
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="mr-auto text-white/70 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </AppContext.Provider>
  )
}

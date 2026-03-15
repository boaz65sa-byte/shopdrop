import React, { useState, useEffect, useCallback } from 'react'
import { apiJson, setToken } from './api'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import ProductSearch from './components/ProductSearch'
import MyProducts from './components/MyProducts'
import StoreConnections from './components/StoreConnections'
import Orders from './components/Orders'
import Settings from './components/Settings'
import Admin from './components/Admin'
import SuperAdmin from './components/SuperAdmin'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import PendingPage from './pages/PendingPage'

export const AppContext = React.createContext({})

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [toasts, setToasts] = useState([])
  const [authPage, setAuthPage] = useState('login') // 'login' | 'register'
  const [currentUser, setCurrentUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [storeStatus, setStoreStatus] = useState({
    ebay: { connected: false },
    shopify: { connected: false, stores: [] }
  })

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  // Check token on load
  useEffect(() => {
    const token = localStorage.getItem('dropship_token')
    if (!token) { setAuthLoading(false); return }
    apiJson('/auth/me').then(r => {
      if (r.ok) setCurrentUser(r.data.user)
      else { setToken(null) }
    }).catch(() => setToken(null))
      .finally(() => setAuthLoading(false))
  }, [])

  const handleLogin = (user) => setCurrentUser(user)

  const handleLogout = () => {
    setToken(null)
    setCurrentUser(null)
    setCurrentPage('dashboard')
  }

  const fetchStoreStatus = useCallback(async () => {
    try {
      const [ebayRes, shopifyRes] = await Promise.all([
        fetch('/api/ebay/status'),
        fetch('/api/shopify/status')
      ])
      const ebay = await ebayRes.json()
      const shopify = await shopifyRes.json()
      setStoreStatus({ ebay, shopify })
    } catch {}
  }, [])

  useEffect(() => {
    if (currentUser?.status === 'approved') {
      fetchStoreStatus()
      const params = new URLSearchParams(window.location.search)
      const successMap = { ebay_connected: 'חובר לאיביי!', shopify_connected: 'חובר לשופיפיי!', amazon_connected: 'חובר לאמזון!', etsy_connected: 'חובר לאטסי!' }
      let changed = false
      for (const [key, msg] of Object.entries(successMap)) {
        if (params.get(key)) { showToast(msg, 'success'); fetchStoreStatus(); changed = true }
      }
      for (const key of ['ebay_error', 'shopify_error', 'amazon_error', 'etsy_error']) {
        if (params.get(key)) { showToast('שגיאה בחיבור החנות', 'error'); changed = true }
      }
      if (changed) window.history.replaceState({}, '', window.location.pathname)
    }
  }, [currentUser])

  // Loading spinner
  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="spinner w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full" />
    </div>
  )

  // Not logged in
  if (!currentUser) {
    return authPage === 'login'
      ? <LoginPage onLogin={handleLogin} goRegister={() => setAuthPage('register')} />
      : <RegisterPage onLogin={handleLogin} goLogin={() => setAuthPage('login')} />
  }

  // Pending / rejected
  if (currentUser.status === 'pending' || currentUser.status === 'rejected') {
    return <PendingPage user={currentUser} onLogout={handleLogout} />
  }

  const props = { setCurrentPage, showToast, storeStatus, refreshStoreStatus: fetchStoreStatus, currentUser }

  const renderPage = () => {
    // SuperAdmin sees a special page
    if (currentPage === 'superadmin') return <SuperAdmin {...props} />
    switch (currentPage) {
      case 'dashboard': return <Dashboard {...props} />
      case 'search':    return <ProductSearch {...props} />
      case 'products':  return <MyProducts {...props} />
      case 'stores':    return <StoreConnections {...props} />
      case 'orders':    return <Orders {...props} />
      case 'settings':  return <Settings {...props} />
      case 'admin':     return <Admin {...props} />
      default:          return <Dashboard {...props} />
    }
  }

  return (
    <AppContext.Provider value={{ showToast, storeStatus, fetchStoreStatus, currentUser }}>
      <Layout currentPage={currentPage} setCurrentPage={setCurrentPage}
              storeStatus={storeStatus} currentUser={currentUser} onLogout={handleLogout}>
        {renderPage()}
      </Layout>

      {/* Toasts */}
      <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2" style={{ maxWidth: '380px' }}>
        {toasts.map(toast => (
          <div key={toast.id}
            className={`toast-enter flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${
              toast.type === 'success' ? 'bg-success-600' :
              toast.type === 'error'   ? 'bg-danger-600' :
              toast.type === 'warning' ? 'bg-warning-600' : 'bg-gray-800'
            }`}>
            <span className="text-lg">{toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : toast.type === 'warning' ? '⚠' : 'ℹ'}</span>
            <span className="flex-1">{toast.message}</span>
            <button onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} className="text-white/70 hover:text-white">✕</button>
          </div>
        ))}
      </div>
    </AppContext.Provider>
  )
}

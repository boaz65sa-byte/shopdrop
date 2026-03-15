import React, { useState, useEffect } from 'react'
import { apiJson } from '../api'

const STATUS_USER = {
  pending:  { label: 'ממתין',  class: 'bg-warning-100 text-warning-700' },
  approved: { label: 'מאושר', class: 'bg-success-100 text-success-700' },
  rejected: { label: 'נדחה',  class: 'bg-danger-100 text-danger-700' },
  blocked:  { label: 'חסום',  class: 'bg-gray-200 text-gray-600' },
}

const STATUS_STORE = {
  pending:  { label: 'ממתין',  class: 'bg-warning-100 text-warning-700' },
  approved: { label: 'מאושרת', class: 'bg-success-100 text-success-700' },
  rejected: { label: 'נדחתה', class: 'bg-danger-100 text-danger-700' },
}

const PLATFORM_ICON = { ebay: '🛒', shopify: '🏪', amazon: '📦', etsy: '🎨', woocommerce: '🔌' }

/* ─── Overview Tab ─── */
function OverviewTab() {
  const [data, setData] = useState(null)

  useEffect(() => {
    apiJson('/users/overview').then(r => { if (r.ok) setData(r.data) })
  }, [])

  if (!data) return <div className="flex justify-center h-48 items-center"><div className="spinner w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full" /></div>

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'סה"כ מוכרים', value: data.totalUsers,    icon: '👥', color: 'primary' },
          { label: 'ממתינים לאישור', value: data.pendingUsers, icon: '⏳', color: 'warning' },
          { label: 'מוכרים פעילים', value: data.approvedUsers, icon: '✅', color: 'success' },
          { label: 'חנויות ממתינות', value: data.pendingStores, icon: '🏪', color: 'warning' },
        ].map(s => (
          <div key={s.label} className="card">
            <div className="text-3xl mb-2">{s.icon}</div>
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
            <div className="text-sm text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {data.pendingUsers > 0 && (
        <div className="bg-warning-50 border border-warning-200 rounded-xl p-4 flex items-center gap-3">
          <span className="text-2xl">🔔</span>
          <div>
            <div className="font-semibold text-warning-800">{data.pendingUsers} משתמשים ממתינים לאישור</div>
            <div className="text-sm text-warning-700">עבור ללשונית "משתמשים" לאישור</div>
          </div>
        </div>
      )}

      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 font-semibold text-gray-900">נרשמו לאחרונה</div>
        {data.recentUsers.length === 0 ? (
          <div className="px-5 py-8 text-center text-gray-400 text-sm">אין משתמשים עדיין</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {data.recentUsers.map(u => (
              <div key={u.id} className="flex items-center gap-4 px-5 py-3">
                <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm shrink-0">
                  {u.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900">{u.name}</div>
                  <div className="text-xs text-gray-400 truncate" dir="ltr">{u.email}</div>
                </div>
                <span className={`badge text-xs ${STATUS_USER[u.status]?.class}`}>{STATUS_USER[u.status]?.label}</span>
                <div className="text-xs text-gray-400">{new Date(u.created_at).toLocaleDateString('he-IL')}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Users Tab ─── */
function UsersTab({ showToast }) {
  const [users, setUsers] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)
  const [filter, setFilter] = useState('all')
  const [notes, setNotes] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)

  const load = () => {
    setLoading(true)
    apiJson('/users').then(r => {
      if (r.ok) { setUsers(r.data.users); setStats(r.data.stats) }
    }).finally(() => setLoading(false))
  }

  useEffect(load, [])

  const updateStatus = async (userId, status) => {
    setUpdating(userId)
    const { ok, data } = await apiJson(`/users/${userId}/status`, { method: 'PATCH', body: { status, notes } })
    if (ok) { showToast(data.message, 'success'); load() }
    else showToast(data.error, 'error')
    setUpdating(null); setSelectedUser(null); setNotes('')
  }

  const filtered = filter === 'all' ? users : users.filter(u => u.status === filter)

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="flex gap-3 flex-wrap">
        {[
          { key: 'all', label: 'הכל', count: stats.total },
          { key: 'pending', label: 'ממתינים', count: stats.pending },
          { key: 'approved', label: 'מאושרים', count: stats.approved },
          { key: 'rejected', label: 'נדחו', count: stats.rejected },
          { key: 'blocked', label: 'חסומים', count: stats.blocked },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === f.key ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {f.label} {f.count !== undefined && <span className="opacity-70">({f.count})</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center h-48 items-center"><div className="spinner w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full" /></div>
      ) : (
        <div className="space-y-3">
          {filtered.map(user => (
            <div key={user.id} className="card p-4">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-lg shrink-0">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900">{user.name}</span>
                    <span className={`badge text-xs ${STATUS_USER[user.status]?.class}`}>{STATUS_USER[user.status]?.label}</span>
                    {user.store_count > 0 && <span className="badge bg-primary-100 text-primary-700 text-xs">{user.store_count} חנויות</span>}
                  </div>
                  <div className="text-sm text-gray-500 mt-0.5" dir="ltr">{user.email}</div>
                  {user.phone && <div className="text-xs text-gray-400">{user.phone}</div>}
                  {user.business_name && <div className="text-xs text-gray-500 font-medium">{user.business_name}</div>}
                  <div className="text-xs text-gray-400 mt-1">
                    נרשם: {new Date(user.created_at).toLocaleDateString('he-IL')}
                    {user.last_login && ` · כניסה אחרונה: ${new Date(user.last_login).toLocaleDateString('he-IL')}`}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 shrink-0">
                  {user.status === 'pending' && (
                    <>
                      <button onClick={() => updateStatus(user.id, 'approved')} disabled={updating === user.id}
                        className="btn-primary text-xs py-1.5 px-3">
                        ✓ אשר
                      </button>
                      <button onClick={() => updateStatus(user.id, 'rejected')} disabled={updating === user.id}
                        className="btn-danger text-xs py-1.5 px-3">
                        ✕ דחה
                      </button>
                    </>
                  )}
                  {user.status === 'approved' && (
                    <button onClick={() => updateStatus(user.id, 'blocked')} disabled={updating === user.id}
                      className="btn-secondary text-xs py-1.5 px-3 text-danger-600">
                      חסום
                    </button>
                  )}
                  {(user.status === 'blocked' || user.status === 'rejected') && (
                    <button onClick={() => updateStatus(user.id, 'approved')} disabled={updating === user.id}
                      className="btn-secondary text-xs py-1.5 px-3">
                      הפעל מחדש
                    </button>
                  )}
                </div>
              </div>
              {user.notes && (
                <div className="mt-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                  📝 {user.notes}
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <div className="text-4xl mb-2">👥</div>
              <div>אין משתמשים בקטגוריה זו</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── Stores Tab ─── */
function StoresTab({ showToast }) {
  const [stores, setStores] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [updating, setUpdating] = useState(null)

  const load = () => {
    setLoading(true)
    apiJson('/users/stores').then(r => {
      if (r.ok) { setStores(r.data.stores); setStats(r.data.stats) }
    }).finally(() => setLoading(false))
  }

  useEffect(load, [])

  const updateStore = async (storeId, status) => {
    setUpdating(storeId)
    const { ok, data } = await apiJson(`/users/stores/${storeId}/status`, { method: 'PATCH', body: { status } })
    if (ok) { showToast(data.message, 'success'); load() }
    else showToast(data.error, 'error')
    setUpdating(null)
  }

  const filtered = filter === 'all' ? stores : stores.filter(s => s.status === filter)

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap">
        {[
          { key: 'all', label: 'הכל', count: stats.total },
          { key: 'pending', label: 'ממתינות', count: stats.pending },
          { key: 'approved', label: 'מאושרות', count: stats.approved },
          { key: 'rejected', label: 'נדחו', count: stats.rejected },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === f.key ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {f.label} {f.count !== undefined && <span className="opacity-70">({f.count})</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center h-48 items-center"><div className="spinner w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full" /></div>
      ) : (
        <div className="space-y-3">
          {filtered.map(store => (
            <div key={store.id} className="card p-4">
              <div className="flex items-start gap-4">
                <div className="text-3xl shrink-0">{PLATFORM_ICON[store.platform] || '🏪'}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900">{store.store_name}</span>
                    <span className={`badge text-xs ${STATUS_STORE[store.status]?.class}`}>{STATUS_STORE[store.status]?.label}</span>
                    <span className="badge bg-gray-100 text-gray-600 text-xs capitalize">{store.platform}</span>
                  </div>
                  <div className="text-sm text-gray-600 mt-0.5">
                    👤 {store.user_name} · <span dir="ltr" className="text-gray-400">{store.user_email}</span>
                  </div>
                  {store.store_url && <div className="text-xs text-primary-600 mt-0.5" dir="ltr">{store.store_url}</div>}
                  <div className="text-xs text-gray-400 mt-1">
                    הוגש: {new Date(store.created_at).toLocaleDateString('he-IL')}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {store.status === 'pending' && (
                    <>
                      <button onClick={() => updateStore(store.id, 'approved')} disabled={updating === store.id}
                        className="btn-primary text-xs py-1.5 px-3">✓ אשר</button>
                      <button onClick={() => updateStore(store.id, 'rejected')} disabled={updating === store.id}
                        className="btn-danger text-xs py-1.5 px-3">✕ דחה</button>
                    </>
                  )}
                  {store.status !== 'pending' && (
                    <button onClick={() => updateStore(store.id, 'pending')} disabled={updating === store.id}
                      className="btn-secondary text-xs py-1.5 px-3">החזר לבדיקה</button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <div className="text-4xl mb-2">🏪</div>
              <div>אין חנויות בקטגוריה זו</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── Main SuperAdmin ─── */
export default function SuperAdmin({ showToast }) {
  const [activeTab, setActiveTab] = useState('overview')

  const tabs = [
    { id: 'overview', label: '📊 סקירה כללית' },
    { id: 'users',    label: '👥 משתמשים' },
    { id: 'stores',   label: '🏪 חנויות' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ניהול מוכרים</h1>
        <p className="text-gray-500 text-sm mt-1">אישור משתמשים, חנויות וניהול הפלטפורמה</p>
      </div>

      <div className="flex gap-2 border-b border-gray-200 pb-3">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === t.id ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="fade-in">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'users'    && <UsersTab showToast={showToast} />}
        {activeTab === 'stores'   && <StoresTab showToast={showToast} />}
      </div>
    </div>
  )
}

// In production (Vercel), VITE_API_URL points to Railway backend
// In development, empty → proxied by Vite to localhost:3001
const BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api'

function getToken() {
  return localStorage.getItem('dropship_token')
}

export function setToken(t) {
  if (t) localStorage.setItem('dropship_token', t)
  else localStorage.removeItem('dropship_token')
}

export async function api(path, options = {}) {
  const token = getToken()
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    },
    body: options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined
  })
  return res
}

export async function apiJson(path, options = {}) {
  const res = await api(path, options)
  const data = await res.json()
  return { ok: res.ok, status: res.status, data }
}

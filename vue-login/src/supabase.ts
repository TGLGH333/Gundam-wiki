const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://vjpgugicrwwydvkifiam.supabase.co'
const PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_Lwgm4DrMboFdAkLxd-vuNA_pIwmhLYA'
// 主应用（Next.js）的访问地址，登录成功后跳转回主应用
const MAIN_APP_URL = import.meta.env.VITE_MAIN_APP_URL || 'http://localhost:3000'

const TOKEN_KEY = 'gundam_supabase_token'
const REFRESH_TOKEN_KEY = 'gundam_supabase_refresh_token'

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setStoredToken(token: string, refreshToken?: string) {
  localStorage.setItem(TOKEN_KEY, token)
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

function authHeaders(hasToken = true) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    apikey: PUBLISHABLE_KEY,
  }
  if (hasToken) {
    const token = getStoredToken()
    headers.Authorization = `Bearer ${token || PUBLISHABLE_KEY}`
  }
  return headers
}

export const supabaseAuth = {
  async signUp(email: string, password: string, username: string) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: 'POST',
      headers: authHeaders(false),
      body: JSON.stringify({ email, password, data: { username, display_name: username } }),
    })
    const data = await res.json()
    if (!res.ok) return { error: { message: data.msg || data.error_description || '注册失败' }, data: null }
    return { error: null, data }
  },

  async signIn(email: string, password: string) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: authHeaders(false),
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) return { error: { message: data.msg || data.error_description || '登录失败，请检查邮箱和密码。' }, data: null }
    if (data.access_token) {
      setStoredToken(data.access_token, data.refresh_token)
    }
    return { error: null, data }
  },

  async signOut() {
    const token = getStoredToken()
    if (token) {
      await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
        method: 'POST',
        headers: authHeaders(),
      })
    }
    clearStoredToken()
  },

  async checkUsernameAvailable(username: string) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/is_username_available`, {
      method: 'POST',
      headers: authHeaders(false),
      body: JSON.stringify({ candidate: username }),
    })
    if (!res.ok) return { error: true, data: false }
    const data = await res.json()
    return { error: false, data: data === true }
  },
}

export { SUPABASE_URL, PUBLISHABLE_KEY, MAIN_APP_URL }

const TOKEN_KEY = 'caflow_token'
const USER_KEY = 'caflow_user'

export function setToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token)
  }
}

export function getToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(TOKEN_KEY)
  }
  return null
}

export function clearToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }
}

export function setUser(user: any) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  }
}

export function getUser(): any | null {
  if (typeof window !== 'undefined') {
    const u = localStorage.getItem(USER_KEY)
    return u ? JSON.parse(u) : null
  }
  return null
}

export function isAuthenticated(): boolean {
  return !!getToken()
}

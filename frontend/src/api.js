const base = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')
const sessionKey = 'rul.session'
const legacyTokenKey = 'rul.access-token'
const refreshAheadMs = 5000
export const isDemo = new URLSearchParams(window.location.search).get('demo') === '1'

export class ApiError extends Error {
  constructor(status, message) {
    super(message || {
      0: 'Нет связи с сервером. Проверьте подключение и попробуйте снова.',
      400: 'Проверьте введённые данные.',
      401: 'Проверьте данные для входа или войдите заново.',
      403: 'Недостаточно прав для этого действия.',
      404: 'Запись не найдена.',
      409: 'Такая запись уже существует или действие недоступно.',
      502: 'Сервер аренды недоступен. Попробуйте позже.',
      503: 'Сервер аренды недоступен. Попробуйте позже.',
    }[status] || 'Сервер не смог выполнить запрос. Попробуйте позже.')
    this.status = status
  }
}

function jwtClaims(token) {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(payload))
  } catch {
    return null
  }
}

export const roleNames = { USER: 'Пользователь', MANAGER: 'Менеджер', ADMIN: 'Администратор' }

function sessionFrom({ accessToken, refreshToken }) {
  if (typeof accessToken !== 'string' || !accessToken) return null
  const role = jwtClaims(accessToken)?.role
  return { accessToken, refreshToken: typeof refreshToken === 'string' ? refreshToken : null,
    role: Object.hasOwn(roleNames, role) ? role : 'USER' }
}

function restoreSession() {
  if (isDemo) return null
  try {
    const stored = sessionStorage.getItem(sessionKey)
    return sessionFrom(stored ? JSON.parse(stored) ?? {} : { accessToken: sessionStorage.getItem(legacyTokenKey) })
  } catch {
    return null
  }
}

let authState = { session: restoreSession(), expired: false }
const authListeners = new Set()

export function getAuthState() {
  return authState
}

export function subscribeAuth(listener) {
  authListeners.add(listener)
  return () => authListeners.delete(listener)
}

function persistSession(session) {
  if (session) {
    const { accessToken, refreshToken } = session
    sessionStorage.setItem(sessionKey, JSON.stringify({ accessToken, refreshToken }))
  } else {
    sessionStorage.removeItem(sessionKey)
  }
  sessionStorage.removeItem(legacyTokenKey)
}

function publishSession(session, expired = false) {
  persistSession(session)
  authState = { session, expired }
  authListeners.forEach((listener) => listener())
}

export function saveSession(result) {
  const session = result && sessionFrom(result)
  if (result && !session) throw new ApiError(502)
  publishSession(session)
  return session
}

function needsRefresh(token) {
  const exp = jwtClaims(token)?.exp
  return typeof exp === 'number' && exp * 1000 <= Date.now() + refreshAheadMs
}

function checkSession(session, signal) {
  signal?.throwIfAborted()
  if (authState.session !== session) throw new DOMException('Session changed', 'AbortError')
}

async function renewSession(session) {
  let result
  try {
    result = await sendRequest('/auth/refresh', {
      method: 'POST', body: { refreshToken: session.refreshToken }, cache: 'no-store',
    })
  } catch (failure) {
    checkSession(session)
    if (![400, 401, 403].includes(failure.status)) throw failure
    publishSession(null, true)
    return
  }

  checkSession(session)
  const next = result && sessionFrom(result)
  if (!next?.refreshToken) throw new ApiError(502)
  if (next.role !== session.role) {
    publishSession(next)
  } else {
    persistSession(next)
    session.accessToken = next.accessToken
    session.refreshToken = next.refreshToken
  }
}

async function refreshSession(session, rejectedAccess) {
  checkSession(session)
  if (session.accessToken !== rejectedAccess) return
  if (!session.refreshToken) {
    publishSession(null, true)
    return
  }
  session.refresh ??= renewSession(session).finally(() => { delete session.refresh })
  await session.refresh
}

async function sendRequest(path, { token, body, method = 'GET', signal, cache, responseType = 'json' } = {}) {
  let response
  try {
    response = await fetch(base + path, {
      method,
      signal,
      cache,
      headers: {
        Accept: responseType === 'text' ? 'text/plain' : 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new ApiError(0)
  }
  if (!response.ok) {
    let message = response.status === 403 && path.startsWith('/auth/')
      ? 'Сервер отклонил запрос авторизации.'
      : undefined
    if (response.status === 409) {
      const reason = await response.text()
      message = {
        'Car is not available for rent': 'Автомобиль сейчас недоступен для бронирования.',
        'Rental cannot be cancelled in its current status': 'Аренду в этом статусе нельзя отменить.',
        'Username already exists': 'Имя пользователя, почта или телефон уже используются.',
      }[reason]
    }
    throw new ApiError(response.status, message)
  }
  if (response.status === 204) return null
  try {
    return await (responseType === 'text' ? response.text() : response.json())
  } catch {
    throw new ApiError(502)
  }
}

async function request(path, { session, ...options } = {}) {
  if (!session) return sendRequest(path, options)

  const { signal } = options
  checkSession(session, signal)
  let token = session.accessToken
  const refreshedBeforeRequest = needsRefresh(token)
  if (refreshedBeforeRequest) {
    await refreshSession(session, token)
    checkSession(session, signal)
    token = session.accessToken
  }

  let result
  try {
    result = await sendRequest(path, { ...options, token })
  } catch (failure) {
    checkSession(session, signal)
    const expired = failure.status === 401 ||
      (failure.status === 403 && (path === '/users/me' || needsRefresh(token)))
    if (refreshedBeforeRequest || !expired) throw failure
    await refreshSession(session, token)
    checkSession(session, signal)
    result = await sendRequest(path, { ...options, token: session.accessToken })
  }
  checkSession(session, signal)
  return result
}

export const authApi = {
  login: (body) => request('/auth/login', { method: 'POST', body }),
  register: (body) => request('/auth/register', { method: 'POST', body }),
}

export const fleetApi = {
  list: (session, signal) => request('/cars', { session, signal, cache: 'no-store' }),
  all: (session, signal) => request('/cars/all', { session, signal, cache: 'no-store' }),
  car: (id, session, signal) => request('/cars/' + id, { session, signal, cache: 'no-store' }),
  categories: (signal) => request('/categories', { signal }),
}

export const accountApi = {
  me: (session, signal) => request('/users/me', { session, signal }),
  deleteMe: (session) => request('/users/me', { method: 'DELETE', session, responseType: 'text' }),
  user: (id, session, signal) => request('/users?userId=' + id, { session, signal }),
  deleteUser: (id, session) => request('/users?userId=' + id, { method: 'DELETE', session, responseType: 'text' }),
}

export const rentalApi = {
  create: (body, session) => request('/rentals', { method: 'POST', session, body }),
  mine: (session, signal) => request('/rentals/my', { session, signal }),
  myRental: (id, session, signal) => request('/rentals/my/' + id, { session, signal }),
  cancelMine: (id, session) => request('/rentals/me/cancel/' + id, { method: 'POST', session }),
  byUser: (id, session, signal) => request('/rentals?userId=' + id, { session, signal }),
  byId: (id, session, signal) => request('/rentals/' + id, { session, signal }),
  cancel: (id, session) => request('/rentals/' + id + '/cancel', { method: 'POST', session }),
}

export const paymentApi = {
  create: (rentalId, paymentMethod, session, signal) => request('/payments/rentals/' + rentalId, {
    method: 'POST', session, signal, body: { paymentMethod },
  }),
  mine: (id, session, signal) => request('/payments/' + id, { session, signal }),
}

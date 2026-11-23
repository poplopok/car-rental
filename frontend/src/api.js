const base = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')
const sessionKey = 'rul.access-token'
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

export function readToken() {
  return sessionStorage.getItem(sessionKey)
}

export function saveToken(token) {
  if (token) sessionStorage.setItem(sessionKey, token)
  else sessionStorage.removeItem(sessionKey)
}

export const roleNames = { USER: 'Пользователь', MANAGER: 'Менеджер', ADMIN: 'Администратор' }

export function sessionRole(token) {
  if (!token) return null
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const { role } = JSON.parse(atob(payload))
    return Object.hasOwn(roleNames, role) ? role : 'USER'
  } catch {
    return 'USER'
  }
}

export async function request(path, { token, body, method = 'GET', signal, cache, responseType = 'json' } = {}) {
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

export const authApi = {
  login: (body) => request('/auth/login', { method: 'POST', body }),
  register: (body) => request('/auth/register', { method: 'POST', body }),
}

export const fleetApi = {
  list: (token, signal) => request('/cars', { token, signal, cache: 'no-store' }),
  all: (token, signal) => request('/cars/all', { token, signal, cache: 'no-store' }),
  car: (id, token, signal) => request('/cars/' + id, { token, signal, cache: 'no-store' }),
  categories: (signal) => request('/categories', { signal }),
}

export const accountApi = {
  me: (token, signal) => request('/users/me', { token, signal }),
  deleteMe: (token) => request('/users/me', { method: 'DELETE', token, responseType: 'text' }),
  user: (id, token, signal) => request('/users?userId=' + id, { token, signal }),
  deleteUser: (id, token) => request('/users?userId=' + id, { method: 'DELETE', token, responseType: 'text' }),
}

export const rentalApi = {
  create: (body, token) => request('/rentals', { method: 'POST', token, body }),
  mine: (token, signal) => request('/rentals/my', { token, signal }),
  myRental: (id, token, signal) => request('/rentals/my/' + id, { token, signal }),
  cancelMine: (id, token) => request('/rentals/me/cancel/' + id, { method: 'POST', token }),
  byUser: (id, token, signal) => request('/rentals?userId=' + id, { token, signal }),
  byId: (id, token, signal) => request('/rentals/' + id, { token, signal }),
  cancel: (id, token) => request('/rentals/' + id + '/cancel', { method: 'POST', token }),
}

export const paymentApi = {
  create: (rentalId, paymentMethod, token, signal) => request('/payments/rentals/' + rentalId, {
    method: 'POST', token, signal, body: { paymentMethod },
  }),
  mine: (id, token, signal) => request('/payments/' + id, { token, signal }),
}

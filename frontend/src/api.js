const base = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')
const sessionKey = 'rul.access-token'
export const isDemo = new URLSearchParams(window.location.search).get('demo') === '1'

export class ApiError extends Error {
  constructor(status, message) {
    super(message || {
      0: 'Нет связи с сервером. Проверьте подключение и попробуйте снова.',
      400: 'Проверьте введённые данные.',
      401: 'Проверьте данные для входа или войдите заново.',
      403: 'Для этого действия войдите в аккаунт заново.',
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

export async function request(path, { token, body, method = 'GET', signal, cache } = {}) {
  let response
  try {
    response = await fetch(base + path, {
      method,
      signal,
      cache,
      headers: {
        Accept: 'application/json',
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
    const message = response.status === 403 && path.startsWith('/auth/')
      ? 'Сервер отклонил запрос авторизации.'
      : undefined
    throw new ApiError(response.status, message)
  }
  try {
    return await response.json()
  } catch {
    throw new ApiError(502)
  }
}

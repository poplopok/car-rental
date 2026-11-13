const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) { super(message); this.status = status }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } })
  } catch {
    throw new ApiError(0, "Не удалось подключиться к сервису аренды. Проверьте, что Java-бэкенд запущен, и попробуйте ещё раз.")
  }
  if (!response.ok) {
    const messages: Record<number, string> = { 400: "Проверьте введённые данные и попробуйте ещё раз.", 404: "Пользователь или запись не найдены.", 409: "Действие недоступно для текущего статуса аренды." }
    throw new ApiError(response.status, messages[response.status] || `Ошибка запроса (${response.status}).`)
  }
  if (response.status === 204) return undefined as T
  const contentType = response.headers.get("content-type") || ""
  return (contentType.includes("json") ? response.json() : response.text()) as Promise<T>
}

export type Category = { id: number; name: string; priceMultiplier: number }
export type Car = { id: number; categoryId: number; categoryName: string; brand: string; model: string; year: number; pricePerDay: number; latitude?: number; longitude?: number }
export type Rental = { id: number; car: { id: number; brand: string; model: string; year: number }; status: string; pricePerDay: number; totalPrice: number; startTime: string; plannedEndTime: string; actualEndTime: string | null }
export type Payment = { id: number; rentalId: number; status: string; paymentMethod: string; amount: number; createdAt: string; completedAt: string | null }

export const demoCars = [
  { id: 1, categoryId: 1, categoryName: 'Эконом', brand: 'Kia', model: 'Rio', year: 2021, pricePerDay: 1990, latitude: 55.7589, longitude: 37.5916 },
  { id: 2, categoryId: 2, categoryName: 'Комфорт', brand: 'Volkswagen', model: 'Polo', year: 2022, pricePerDay: 2290, latitude: 55.7463, longitude: 37.6424 },
  { id: 3, categoryId: 1, categoryName: 'Эконом', brand: 'Hyundai', model: 'Solaris', year: 2021, pricePerDay: 2190, latitude: 55.7683, longitude: 37.634 },
  { id: 4, categoryId: 3, categoryName: 'Кроссоверы', brand: 'Geely', model: 'Coolray', year: 2023, pricePerDay: 2990, latitude: 55.7815, longitude: 37.6054 },
  { id: 5, categoryId: 3, categoryName: 'Кроссоверы', brand: 'Haval', model: 'Jolion', year: 2024, pricePerDay: 3290, latitude: 55.7317, longitude: 37.6027 },
  { id: 6, categoryId: 4, categoryName: 'Бизнес', brand: 'Mercedes-Benz', model: 'E-Class', year: 2023, pricePerDay: 4990, latitude: 55.7541, longitude: 37.6722 },
]

const money = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0, maximumFractionDigits: 2 })
export const price = (value) => value == null ? '—' : money.format(Number(value))
export const carName = (car) => [car?.brand, car?.model].filter(Boolean).join(' ') || 'Автомобиль'
const carImages = {
  'kia rio': 'rio',
  'volkswagen polo': 'polo',
  'hyundai solaris': 'solaris',
  'geely coolray': 'coolray',
  'haval jolion': 'jolion',
  'mercedes-benz e-class': 'e-class',
}

export function carImage(car) {
  const name = carImages[carName(car).toLowerCase().replace(/\s+/g, ' ')]
  return name ? import.meta.env.BASE_URL + 'cars/' + name + '.jpg' : null
}

export function coordinates(car) {
  if (car.latitude == null || car.longitude == null) return null
  const lat = Number(car.latitude)
  const lon = Number(car.longitude)
  return Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 85 && Math.abs(lon) <= 180 ? [lat, lon] : null
}

export function localInput(date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}

export function defaultDates() {
  const start = new Date()
  start.setMinutes(0, 0, 0)
  start.setHours(start.getHours() + 1)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return { start: localInput(start), end: localInput(end) }
}

export function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.valueOf()) ? '—' : new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(date)
}

const toRadians = (value) => value * Math.PI / 180

export function distanceKm([latitude, longitude], [otherLat, otherLon]) {
  const halfLat = toRadians(otherLat - latitude) / 2
  const halfLon = toRadians(otherLon - longitude) / 2
  const chord = Math.sin(halfLat) ** 2
    + Math.cos(toRadians(latitude)) * Math.cos(toRadians(otherLat)) * Math.sin(halfLon) ** 2
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(chord)))
}

const kilometers = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 })
const wholeNumber = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 })

export function formatDistance(distance) {
  if (distance < 0.05) return '< 50 м'
  if (distance < 1) return wholeNumber.format(distance * 1000) + ' м'
  return (distance < 10 ? kilometers : wholeNumber).format(distance) + ' км'
}

export function parsePosition(latitude, longitude) {
  const values = [latitude, longitude].map((value) => {
    const normalized = value.trim().replace(',', '.')
    return /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized) ? Number(normalized) : NaN
  })
  return Math.abs(values[0]) <= 90 && Math.abs(values[1]) <= 180 ? values : null
}

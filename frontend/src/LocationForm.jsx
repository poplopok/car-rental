import { useEffect, useRef, useState } from 'react'
import { LocateFixed } from 'lucide-react'
import { parsePosition } from './location'

const locationErrors = {
  1: 'Доступ к геолокации закрыт. Разрешите его в браузере или введите координаты.',
  2: 'Устройство не смогло определить местоположение. Введите координаты вручную.',
  3: 'Геолокация не ответила вовремя. Попробуйте ещё раз или введите координаты.',
}

export default function LocationForm({ position, onSave, onClear }) {
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState('')
  const attempt = useRef(0)

  useEffect(() => () => { attempt.current += 1 }, [])

  function locate() {
    if (!navigator.geolocation) {
      setError('Геолокация недоступна в этом браузере. Введите координаты вручную.')
      return
    }
    const current = ++attempt.current
    setLocating(true)
    setError('')
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (current === attempt.current) onSave([coords.latitude, coords.longitude])
      },
      (failure) => {
        if (current !== attempt.current) return
        setLocating(false)
        setError(locationErrors[failure.code] || locationErrors[2])
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    )
  }

  function submit(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const point = parsePosition(form.get('latitude'), form.get('longitude'))
    if (!point) {
      setError('Укажите широту от −90 до 90 и долготу от −180 до 180.')
      return
    }
    onSave(point)
  }

  return <form className="form" onSubmit={submit}>
    <button className="primary full" type="button" disabled={locating} onClick={locate}>
      <LocateFixed size={18} /> {locating ? 'Определяем местоположение…' : 'Определить местоположение'}
    </button>
    <p className="muted fine-print">Или введите координаты вручную. Расстояние рассчитывается по прямой.</p>
    <div className="form-row">
      <label>Широта<input name="latitude" inputMode="decimal" placeholder="55.7558" defaultValue={position?.[0]} required /></label>
      <label>Долгота<input name="longitude" inputMode="decimal" placeholder="37.6176" defaultValue={position?.[1]} required /></label>
    </div>
    {error && <p className="error" role="alert">{error}</p>}
    <button className="secondary full">Показать ближайшие машины</button>
    {position && <button className="location-clear" type="button" onClick={onClear}>Сбросить местоположение</button>}
  </form>
}

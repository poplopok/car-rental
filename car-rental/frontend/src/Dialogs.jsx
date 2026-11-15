import { useEffect, useRef, useState } from 'react'
import { ArrowRight, CalendarDays, CarFront, X } from 'lucide-react'
import { carImage, carName, formatDate, localInput, price } from './catalog'

export function CarPhoto({ car }) {
  const image = carImage(car)
  return <div className="car-photo">
    {image ? <img src={image} alt="" /> : <CarFront size={39} strokeWidth={1.4} aria-hidden="true" />}
  </div>
}

export function Modal({ title, onClose, busy, children }) {
  const ref = useRef(null)
  useEffect(() => {
    const dialog = ref.current
    dialog.showModal()
    return () => dialog.close()
  }, [])

  return <dialog ref={ref} className="modal" aria-labelledby="dialog-title"
    onCancel={(event) => { event.preventDefault(); if (!busy) onClose() }}
    onClick={(event) => { if (!busy && event.target === event.currentTarget) onClose() }}>
    <div className="dialog-inner">
      <div className="dialog-head">
        <h2 id="dialog-title">{title}</h2>
        <button type="button" className="icon-button" disabled={busy} onClick={onClose} aria-label="Закрыть"><X size={21} /></button>
      </div>
      {children}
    </div>
  </dialog>
}

export function DateFields({ dates, onChange }) {
  return <div className="date-fields">
    <label><CalendarDays size={17} /><span>Начало аренды
      <input required type="datetime-local" min={localInput(new Date())} value={dates.start}
        onChange={(event) => onChange({ ...dates, start: event.target.value })} />
    </span></label>
    <label><CalendarDays size={17} /><span>Конец аренды
      <input required type="datetime-local" min={dates.start || undefined} value={dates.end}
        onChange={(event) => onChange({ ...dates, end: event.target.value })} />
    </span></label>
  </div>
}

export function AuthForm({ mode, onMode, onSubmit, busy, error }) {
  const register = mode === 'register'
  return <>
    <div className="segmented auth-tabs">
      <button type="button" aria-pressed={!register} disabled={busy} onClick={() => onMode('login')}>Вход</button>
      <button type="button" aria-pressed={register} disabled={busy} onClick={() => onMode('register')}>Регистрация</button>
    </div>
    <form className="form" onSubmit={(event) => {
      event.preventDefault()
      const data = Object.fromEntries(new FormData(event.currentTarget))
      for (const field of Object.keys(data)) if (field !== 'password') data[field] = data[field].trim()
      onSubmit(data)
    }}>
      {register && <>
        <div className="form-row">
          <label>Имя<input name="firstName" required autoComplete="given-name" /></label>
          <label>Фамилия<input name="lastName" required autoComplete="family-name" /></label>
        </div>
        <label>Имя пользователя<input name="username" autoComplete="username" required /></label>
        <div className="form-row">
          <label>Телефон<input name="phone" type="tel" autoComplete="tel" required /></label>
          <label>Дата рождения<input name="dateOfBirth" type="date" max={localInput(new Date(Date.now() - 86400000)).slice(0, 10)} required /></label>
        </div>
      </>}
      <label>Почта<input name="email" type="email" required autoComplete={register ? 'email' : 'username'} /></label>
      <label>Пароль<input name="password" type="password" required minLength={register ? 8 : undefined}
        maxLength={register ? 72 : undefined} autoComplete={register ? 'new-password' : 'current-password'} /></label>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="primary full" disabled={busy}>{busy ? 'Подождите…' : register ? 'Создать аккаунт' : 'Войти'} <ArrowRight size={18} /></button>
    </form>
  </>
}

export function DateForm({ dates, onSave }) {
  const [draft, setDraft] = useState(dates)
  const [error, setError] = useState('')
  return <form className="form" onSubmit={(event) => {
    event.preventDefault()
    if (!(draft.end > draft.start)) {
      setError('Конец аренды должен быть позже начала.')
      return
    }
    onSave(draft)
  }}>
    <DateFields dates={draft} onChange={setDraft} />
    {error && <p className="error" role="alert">{error}</p>}
    <button className="primary full">Сохранить даты</button>
  </form>
}

export function BookingForm({ car, dates, onDates, onSubmit, busy, error, needsLogin, demo }) {
  return <form className="form" onSubmit={(event) => {
    event.preventDefault()
    onSubmit()
  }}>
    <div className="booking-car"><CarPhoto car={car} /><div><strong>{carName(car)}</strong><span>{price(car.pricePerDay)} / сутки</span></div></div>
    <fieldset disabled={busy}><DateFields dates={dates} onChange={onDates} /></fieldset>
    <p className="muted fine-print">{demo ? 'Демо-бронь сохранится до обновления страницы.' : 'Итоговая стоимость появится в карточке брони после расчёта сервером.'}</p>
    {error && <p className="error" role="alert">{error}</p>}
    <button className="primary full" disabled={busy}>{busy ? 'Бронируем…' : needsLogin ? 'Войти и продолжить' : 'Подтвердить бронь'} <ArrowRight size={18} /></button>
  </form>
}

export const rentalStatus = {
  PENDING: ['Ожидает', 'pending'],
  ACTIVE: ['Активна', 'active'],
  COMPLETED: ['Завершена', 'completed'],
  CANCELLED: ['Отменена', 'cancelled'],
}

export function TripCard({ rental, onCancel }) {
  const [label, tone] = rentalStatus[rental.status] || [rental.status || '—', 'completed']
  return <article className="trip-card">
    <CarPhoto car={rental.car} />
    <div className="trip-info">
      <div className="trip-title"><h3>{carName(rental.car)}</h3><span className={'status ' + tone}>{label}</span></div>
      <p>{formatDate(rental.startTime)} — {formatDate(rental.plannedEndTime)}</p>
      <strong>{price(rental.totalPrice)}</strong>
    </div>
    {rental.status === 'PENDING' && <button className="secondary" type="button" onClick={() => onCancel(rental)}>Отменить</button>}
  </article>
}

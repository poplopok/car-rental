import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { carName, formatDate, price } from './catalog'
import { Modal, RentalBadge } from './Dialogs'

export const paymentMethods = { CREDIT_CARD: 'Кредитная карта', DEBIT_CARD: 'Дебетовая карта', CASH: 'Наличные' }
const paymentStatus = { PENDING: 'Ожидает оплаты', COMPLETED: 'Оплачен', FAILED: 'Ошибка оплаты', REFUNDED: 'Возвращён' }

function RecordFields({ fields }) {
  return <dl className="record-fields">
    {fields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || '—'}</dd></div>)}
  </dl>
}

export function UserDetails({ user }) {
  return <RecordFields fields={[
    ['ID пользователя', user.id],
    ['Имя и фамилия', [user.firstName, user.lastName].filter(Boolean).join(' ')],
    ['Имя пользователя', user.username],
    ['Почта', user.email],
    ['Телефон', user.phone],
    ['Дата рождения', user.dateOfBirth],
  ]} />
}

export function RentalDetails({ rental }) {
  return <RecordFields fields={[
    ['ID аренды', rental.id],
    ['Автомобиль', carName(rental.car)],
    ['Статус', <RentalBadge status={rental.status} />],
    ['Стоимость', price(rental.totalPrice)],
    ['Начало', formatDate(rental.startTime)],
    ['Плановое окончание', formatDate(rental.plannedEndTime)],
    ['Фактическое окончание', formatDate(rental.actualEndTime)],
    ['Тариф за сутки', price(rental.pricePerDay)],
  ]} />
}

export function PaymentDetails({ payment }) {
  return <RecordFields fields={[
    ['ID платежа', payment.id],
    ['ID аренды', payment.rentalId],
    ['Статус', paymentStatus[payment.status] || payment.status],
    ['Способ оплаты', paymentMethods[payment.paymentMethod] || payment.paymentMethod],
    ['Сумма', price(payment.amount)],
    ['Создан', formatDate(payment.createdAt)],
    ['Завершён', formatDate(payment.completedAt)],
  ]} />
}

export function RecordLookup({ label, load, session, initialId, renderResult }) {
  const [input, setInput] = useState(initialId || '')
  const [query, setQuery] = useState(() => initialId ? { id: String(initialId) } : null)
  const [result, setResult] = useState({})
  useEffect(() => {
    if (!query) return
    const controller = new AbortController()
    const { signal } = controller
    load(query.id, session, signal).then((data) => {
      if (!signal.aborted) setResult({ query, data })
    }).catch((failure) => {
      if (!signal.aborted) setResult({ query, error: failure.message })
    })
    return () => controller.abort()
  }, [query, load, session])

  const loading = query && result.query !== query
  const submit = (event) => {
    event.preventDefault()
    setQuery({ id: input })
  }

  return <>
    <form className="form record-search" onSubmit={submit}>
      <label>{label}<input type="text" inputMode="numeric" pattern="[1-9][0-9]{0,18}" required
        value={input} onChange={(event) => setInput(event.target.value)} /></label>
      <button className="primary"><Search size={16} /> Найти</button>
    </form>
    {loading && <p className="muted record-message" role="status">Загружаем данные…</p>}
    {!loading && result.error && <p className="error" role="alert">{result.error}</p>}
    {!loading && result.data != null && renderResult(result.data, (data) => setResult({ query, data }))}
  </>
}

export function ConfirmAction({ title, description, label, onClose, onConfirm }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function confirm() {
    setBusy(true)
    setError('')
    try {
      await onConfirm()
    } catch (failure) {
      setError(failure.message)
    } finally {
      setBusy(false)
    }
  }
  return <Modal title={title} onClose={onClose} busy={busy}>
    <p className="muted">{description}</p>
    {error && <p className="error record-message" role="alert">{error}</p>}
    <div className="dialog-actions">
      <button className="secondary" type="button" disabled={busy} onClick={onClose}>Назад</button>
      <button className="danger" type="button" disabled={busy} onClick={confirm}>{busy ? 'Выполняем…' : label}</button>
    </div>
  </Modal>
}

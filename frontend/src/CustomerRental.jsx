import { useEffect, useState } from 'react'
import { CreditCard } from 'lucide-react'
import { paymentApi, rentalApi } from './api'
import { canCancelRental, Modal } from './Dialogs'
import { PaymentDetails, paymentMethods, RecordLookup, RentalDetails } from './Records'

export function MyPaymentLookup({ token }) {
  return <section className="staff-panel" aria-label="Найти свой платёж">
    <h2>Найти свой платёж</h2>
    <RecordLookup label="ID платежа" load={paymentApi.mine} token={token}
      renderResult={(payment) => <div className="staff-record"><PaymentDetails payment={payment} /></div>} />
  </section>
}

export default function CustomerRental({ rentalId, token, onClose, onCancel }) {
  const [rental, setRental] = useState(null)
  const [payment, setPayment] = useState(null)
  const [method, setMethod] = useState('DEBIT_CARD')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller
    rentalApi.myRental(rentalId, token, signal).then((result) => {
      if (!signal.aborted) setRental(result)
    }).catch((failure) => {
      if (!signal.aborted) setError(failure.message)
    }).finally(() => {
      if (!signal.aborted) setLoading(false)
    })
    return () => controller.abort()
  }, [rentalId, token])

  async function createPayment(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      setPayment(await paymentApi.create(rentalId, method, token))
    } catch (failure) {
      setError(failure.message)
    } finally {
      setBusy(false)
    }
  }

  return <Modal title={'Аренда № ' + rentalId} onClose={onClose} busy={busy} className="record-modal">
    {loading && <p className="muted" role="status">Загружаем аренду…</p>}
    {error && <p className="error" role="alert">{error}</p>}
    {rental && <>
      <RentalDetails rental={rental} />
      {payment ? <section className="rental-payment">
        <h3>Платёж № {payment.id}</h3>
        <PaymentDetails payment={payment} />
      </section> : (rental.status === 'PENDING' || rental.status === 'ACTIVE') && <form className="form rental-payment" onSubmit={createPayment}>
        <h3>Оплата аренды</h3>
        <label>Способ оплаты
          <select value={method} onChange={(event) => setMethod(event.target.value)} disabled={busy}>
            {Object.entries(paymentMethods).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <button className="primary" disabled={busy}><CreditCard size={16} /> {busy ? 'Создаём…' : 'Создать платёж'}</button>
        <p className="fine-print muted">Платёж будет создан в статусе «Ожидает оплаты».</p>
      </form>}
      {canCancelRental(rental.status) && <div className="record-actions">
        <button className="secondary" type="button" disabled={busy} onClick={() => onCancel(rental)}>Отменить аренду</button>
      </div>}
    </>}
  </Modal>
}

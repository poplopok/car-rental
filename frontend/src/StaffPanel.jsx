import { useState } from 'react'
import { ArrowRight, ClipboardList, ShieldCheck, UserRound } from 'lucide-react'
import { accountApi, rentalApi, roleNames } from './api'
import { canCancelRental } from './Dialogs'
import { carName } from './catalog'
import { ConfirmAction, RecordLookup, RentalDetails, UserDetails } from './Records'

const sections = [
  ['users', 'Пользователи', UserRound],
  ['rentals', 'Аренды', ClipboardList],
]

export default function StaffPanel({ token, role, currentUserId, onRentalChanged }) {
  const [section, setSection] = useState('users')
  const [rentalMode, setRentalMode] = useState('rental')
  const [initialUserId, setInitialUserId] = useState(null)
  const [confirmation, setConfirmation] = useState(null)
  const [notice, setNotice] = useState('')
  const admin = role === 'ADMIN'

  function changeSection(next) {
    setNotice('')
    setInitialUserId(null)
    setSection(next)
  }

  function showUserRentals(id) {
    changeSection('rentals')
    setRentalMode('user')
    setInitialUserId(id)
  }

  function renderRentals(rentals, replaceRental) {
    if (!rentals.length) return <p className="muted record-message">У пользователя пока нет аренд.</p>
    return <div className="staff-results">{rentals.map((rental) => <article className="staff-record" key={rental.id}>
      <h3>{carName(rental.car)} <span>№ {rental.id}</span></h3>
      <RentalDetails rental={rental} />
      {canCancelRental(rental.status) && <div className="record-actions">
        <button className="secondary" type="button" onClick={() => setConfirmation({
          title: 'Отменить аренду?',
          description: 'Аренда № ' + rental.id + ' будет отменена.',
          label: 'Отменить аренду',
          action: async () => {
            const updated = await rentalApi.cancel(rental.id, token)
            replaceRental(updated)
            onRentalChanged()
            setNotice('Аренда отменена.')
          },
        })}>Отменить аренду</button>
      </div>}
    </article>)}</div>
  }

  return <main className="staff-page">
    <header className="staff-header">
      <div className="staff-heading-icon"><ShieldCheck size={27} /></div>
      <div><div className="subtitle">{roleNames[role]}</div>
        <h1>{admin ? 'Панель администратора' : 'Панель менеджера'}</h1></div>
    </header>
    <div className="staff-workspace">
      <nav className="staff-nav" aria-label="Разделы панели">
        {sections.map(([id, label, Icon]) =>
          <button key={id} type="button" aria-current={id === section ? 'page' : undefined} onClick={() => changeSection(id)}>
            <Icon size={18} /> {label}
          </button>)}
      </nav>
      <section className="staff-panel" aria-label={sections.find(([id]) => id === section)[1]}>
        <h2>{sections.find(([id]) => id === section)[1]}</h2>
        {notice && <p className="notice" role="status">{notice}</p>}
        {section === 'users' && <RecordLookup key="users" label="ID пользователя" load={accountApi.user} token={token}
          renderResult={(user, setResult) => <div className="staff-record">
            <UserDetails user={user} />
            <div className="record-actions">
              <button className="secondary" type="button" onClick={() => showUserRentals(user.id)}>Аренды пользователя <ArrowRight size={16} /></button>
              {currentUserId != null && user.id !== currentUserId && <button className="danger" type="button" onClick={() => setConfirmation({
                title: 'Удалить пользователя?',
                description: 'Аккаунт № ' + user.id + ' будет удалён без возможности восстановления.',
                label: 'Удалить пользователя',
                action: async () => {
                  await accountApi.deleteUser(user.id, token)
                  setResult(null)
                  setNotice('Пользователь удалён.')
                },
              })}>Удалить пользователя</button>}
            </div>
          </div>} />}
        {section === 'rentals' && <>
          <div className="segmented staff-segmented">
            <button type="button" aria-pressed={rentalMode === 'rental'} onClick={() => { setNotice(''); setRentalMode('rental') }}>По ID аренды</button>
            <button type="button" aria-pressed={rentalMode === 'user'} onClick={() => { setNotice(''); setRentalMode('user') }}>По ID пользователя</button>
          </div>
          {rentalMode === 'user'
            ? <RecordLookup key={'user-rentals-' + initialUserId} label="ID пользователя" initialId={initialUserId}
              load={rentalApi.byUser} token={token}
              renderResult={(items, setItems) => renderRentals(items, (updated) => setItems(items.map((item) => item.id === updated.id ? updated : item)))} />
            : <RecordLookup key="rental" label="ID аренды" load={rentalApi.byId} token={token}
              renderResult={(rental, setRental) => renderRentals([rental], setRental)} />}
        </>}
      </section>
    </div>
    {confirmation && <ConfirmAction {...confirmation} onClose={() => setConfirmation(null)} onConfirm={async () => {
      await confirmation.action()
      setConfirmation(null)
    }} />}
  </main>
}

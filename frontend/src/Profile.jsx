import { AtSign, CalendarDays, LogOut, Mail, Phone, UserRound } from 'lucide-react'

const birthDate = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })

function formatBirthday(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : birthDate.format(date)
}

export default function Profile({ user, loading, error, onRetry, onLogout }) {
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ')
  const initials = [user?.firstName?.[0], user?.lastName?.[0]].filter(Boolean).join('').toUpperCase()
  const fields = [
    { label: 'Имя и фамилия', icon: UserRound, value: name },
    { label: 'Имя пользователя', icon: AtSign, value: user?.username },
    { label: 'Электронная почта', icon: Mail, value: user?.email },
    { label: 'Телефон', icon: Phone, value: user?.phone },
    { label: 'Дата рождения', icon: CalendarDays, value: formatBirthday(user?.dateOfBirth) },
  ]

  return <main className="profile-page">
    <h1>Мой профиль</h1>
    <section className="profile-panel" aria-label="Данные аккаунта" aria-busy={loading}>
      {user && <>
        <div className="profile-identity">
          <div className="profile-avatar" aria-hidden="true">{initials || <UserRound size={30} />}</div>
          <div><h2>{name || user.username || 'Аккаунт'}</h2><p>{user.email}</p></div>
        </div>
        <dl className="profile-fields">
          {fields.map(({ label, icon: Icon, value }) => <div className="profile-field" key={label}>
            <dt><span aria-hidden="true"><Icon size={19} /></span>{label}</dt>
            <dd>{value || 'Не указано'}</dd>
          </div>)}
        </dl>
      </>}
      {!user && loading && <p className="profile-state" role="status">Загружаем профиль…</p>}
      {error && <div className="profile-state">
        <p className="error" role="alert">{error}</p>
        <button className="secondary" type="button" onClick={onRetry}>Повторить</button>
      </div>}
      <div className="profile-actions">
        <button className="secondary" type="button" onClick={onLogout}><LogOut size={17} /> Выйти из аккаунта</button>
      </div>
    </section>
  </main>
}

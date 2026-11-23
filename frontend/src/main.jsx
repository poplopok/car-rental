import { useCallback, useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  ArrowRight, ArrowUpRight, ChevronRight, CalendarDays, CarFront, ChevronDown, Compass, History, List,
  LocateFixed, LogOut, Map as MapIcon, MapPin, Search, ShieldCheck, UserRound,
} from 'lucide-react'
import { accountApi, authApi, fleetApi, isDemo, readToken, rentalApi, saveToken, sessionRole } from './api'
import { carName, carStatusNames, categoryName, coordinates, defaultDates, demoCars, isBookable, localInput, price } from './catalog'
import CarMap from './CarMap'
import CustomerRental, { MyPaymentLookup } from './CustomerRental'
import LocationForm from './LocationForm'
import Profile from './Profile'
import { ConfirmAction } from './Records'
import StaffPanel from './StaffPanel'
import { distanceKm, formatDistance } from './location'
import { AuthForm, BookingForm, CarDetails, CarPhoto, DateForm, Modal, TripCard } from './Dialogs'
import './style.css'

const shortDate = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' })
const formatShort = (value) => value ? shortDate.format(new Date(value)).replace('.', '') : '—'
const isSessionError = (error) => error.status === 401 || error.status === 403
const demoLink = '?demo=1'
const liveLink = window.location.pathname
const emptyList = []
const demoUser = { firstName: 'Демо', lastName: 'Пользователь' }
const demoCatalog = { cars: demoCars }
const loadingCatalog = { loading: true }

function StateCard({ icon: Icon = CarFront, title, detail, children }) {
  return <div className="state-card">
    <div className="state-icon"><Icon size={23} /></div>
    <h3>{title}</h3>
    {detail && <p>{detail}</p>}
    {children}
  </div>
}

function CarCard({ car, distance, active, showStatus, onDetails }) {
  const status = carStatusNames[car.status] || car.status
  return <article className={'car-card' + (active ? ' selected' : '')}>
    <button className="car-card-main" type="button" onClick={onDetails} aria-haspopup="dialog">
      <CarPhoto car={car} />
      <span className="car-copy">
        <strong>{carName(car)}</strong>
        <small>{[categoryName(car.categoryName), car.year, distance == null ? null : formatDistance(distance)].filter(Boolean).join(' · ')}</small>
        {status && (showStatus || !isBookable(car)) && <small className={isBookable(car) ? undefined : 'car-availability'}>{status}</small>}
        <span className="daily"><b>{price(car.pricePerDay)}</b><span> / сутки</span></span>
      </span>
      <span className="car-arrow icon-button" aria-hidden="true"><ChevronRight size={19} /></span>
    </button>
  </article>
}

function App() {
  const [catalogResult, setCatalogResult] = useState(null)
  const [catalogAttempt, setCatalogAttempt] = useState(0)
  const [fleetCategories, setFleetCategories] = useState([])
  const [category, setCategory] = useState('')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('default')
  const [position, setPosition] = useState(null)
  const [selectedId, selectCar] = useState(null)
  const [mapFocusId, setMapFocusId] = useState(null)
  const [token, setToken] = useState(() => isDemo ? null : readToken())
  const role = sessionRole(token)
  const isAdmin = role === 'ADMIN'
  const isStaff = role === 'MANAGER' || isAdmin
  const [page, setPage] = useState(() => isStaff ? 'staff' : 'catalog')
  const [mapVisible, setMapVisible] = useState(false)
  const [dates, setDates] = useState(defaultDates)
  const [user, setUser] = useState(() => isDemo ? demoUser : null)
  const [profileState, setProfileState] = useState({})
  const [profileAttempt, setProfileAttempt] = useState(0)
  const [trips, setTrips] = useState({})
  const [demoTrips, setDemoTrips] = useState([])
  const [modal, setModal] = useState(null)
  const [authMode, setAuthMode] = useState('login')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const modalCarId = modal?.type === 'car' ? modal.car.id : null
  const refreshCatalog = useCallback(() => setCatalogAttempt((current) => current + 1), [])

  const hasCurrentCatalog = catalogResult?.token === token && catalogResult?.attempt === catalogAttempt
  const catalog = isDemo ? demoCatalog : (hasCurrentCatalog ? catalogResult : loadingCatalog)
  const cars = catalog.cars || emptyList
  const categories = useMemo(() => {
    const entries = new Map(fleetCategories.map(({ id, name }) => [String(id), categoryName(name)]))
    for (const car of cars) if (car.categoryName) entries.set(String(car.categoryId ?? car.categoryName), categoryName(car.categoryName))
    return [...entries]
  }, [cars, fleetCategories])
  const distances = useMemo(() => {
    const byCar = new Map()
    if (position) {
      for (const car of cars) {
        const point = coordinates(car)
        if (point) byCar.set(car.id, distanceKm(position, point))
      }
    }
    return byCar
  }, [cars, position])
  const visible = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('ru')
    const matching = cars.filter((car) => (!category || category === String(car.categoryId ?? car.categoryName))
      && (!query || carName(car).toLocaleLowerCase('ru').includes(query)))
    if (sort === 'near') matching.sort((a, b) => (distances.get(a.id) ?? Infinity) - (distances.get(b.id) ?? Infinity))
    if (sort === 'low') matching.sort((a, b) => a.pricePerDay - b.pricePerDay)
    if (sort === 'high') matching.sort((a, b) => b.pricePerDay - a.pricePerDay)
    return matching
  }, [cars, category, search, sort, distances])
  const selected = visible.find((car) => car.id === selectedId) || visible[0]
  const tripList = isDemo ? demoTrips : (trips.items || emptyList)

  const clearSession = useCallback(() => {
    saveToken(null)
    setToken(null)
    setUser(null)
    setProfileState({})
    setTrips({})
    setModal(null)
    setPage('catalog')
  }, [])

  useEffect(() => {
    if (isDemo) return
    const controller = new AbortController()
    const { signal } = controller
    const scope = { token, attempt: catalogAttempt }

    async function loadCatalog() {
      try {
        const list = isAdmin ? fleetApi.all : fleetApi.list
        const cars = await list(token, signal)
        if (!signal.aborted) setCatalogResult({ ...scope, cars })
      } catch (failure) {
        if (!signal.aborted) setCatalogResult({ ...scope, error: failure.message })
      }
    }

    loadCatalog()
    return () => controller.abort()
  }, [token, isAdmin, catalogAttempt])

  useEffect(() => {
    if (isDemo) return
    const controller = new AbortController()
    fleetApi.categories(controller.signal).then((items) => {
      if (!controller.signal.aborted) setFleetCategories(items)
    }).catch(() => {}) // The catalog includes names for every car even when categories cannot load.
    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (isDemo || modalCarId == null) return
    const controller = new AbortController()
    fleetApi.car(modalCarId, token, controller.signal).then((car) => {
      if (controller.signal.aborted) return
      setModal((current) => current?.type === 'car' && current.car.id === modalCarId ? { ...current, car } : current)
    }).catch(() => {}) // Keep the catalog details if the refresh fails.
    return () => controller.abort()
  }, [modalCarId, token])

  const loadProfile = useCallback(async (signal) => {
    if (!token) return
    setProfileState({ loading: true })
    try {
      const profile = await accountApi.me(token, signal)
      if (signal?.aborted) return
      setUser(profile)
      setProfileState({})
    } catch (failure) {
      if (failure.name === 'AbortError' || signal?.aborted) return
      if (isSessionError(failure) || failure.status === 404) clearSession()
      else setProfileState({ error: failure.message })
    }
  }, [token, clearSession])

  useEffect(() => {
    const controller = new AbortController()
    loadProfile(controller.signal)
    return () => controller.abort()
  }, [loadProfile, profileAttempt])

  const loadTrips = useCallback(async (signal) => {
    if (isDemo || !token) return
    setTrips({ loading: true })
    try {
      const items = await rentalApi.mine(token, signal)
      if (signal?.aborted) return
      setTrips({ items: [...items].sort((a, b) => b.id - a.id) })
    } catch (failure) {
      if (signal?.aborted || failure.name === 'AbortError') return
      if (failure.status === 404) setTrips({ items: [] })
      else if (isSessionError(failure)) clearSession()
      else setTrips({ error: failure.message })
    }
  }, [token, clearSession])

  useEffect(() => {
    if (page !== 'trips') return
    const controller = new AbortController()
    loadTrips(controller.signal)
    return () => controller.abort()
  }, [page, loadTrips])

  function showModal(next) {
    setError('')
    if (next?.type === 'auth') setAuthMode('login')
    setModal(next)
  }

  function updatePosition(point) {
    setPosition(point)
    setSort(point ? 'near' : 'default')
    selectCar(null)
    setMapFocusId(null)
    setMapVisible(false)
    showModal(null)
  }

  function goTo(next) {
    setPage(next)
    setNotice('')
  }

  const openDetails = useCallback((car) => {
    selectCar(car.id)
    setError('')
    setModal({ type: 'car', car })
  }, [])

  function showCarOnMap(car) {
    selectCar(car.id)
    setMapFocusId(car.id)
    setMapVisible(true)
    showModal(null)
  }

  function openBooking(car) {
    selectCar(car.id)
    showModal({ type: 'book', car })
  }

  async function authenticate(data) {
    setBusy(true)
    setError('')
    try {
      const result = await authApi[authMode](data)
      saveToken(result.accessToken)
      setToken(result.accessToken)
      setUser(result.user)
      const nextRole = sessionRole(result.accessToken)
      const resume = nextRole === 'ADMIN' ? null : modal.resume
      if (!resume && (nextRole === 'MANAGER' || nextRole === 'ADMIN')) goTo('staff')
      showModal(resume || null)
    } catch (failure) {
      setError(failure.status === 409 ? 'Имя пользователя, почта или телефон уже используются.' : failure.message)
    } finally {
      setBusy(false)
    }
  }

  async function book() {
    if (!(dates.end > dates.start)) return setError('Конец аренды должен быть позже начала.')
    if (dates.start < localInput(new Date())) return setError('Выберите время начала в будущем.')
    if (!isDemo && (!token || !user)) {
      showModal({ type: 'auth', resume: modal })
      return
    }

    setBusy(true)
    setError('')
    const { car } = modal
    try {
      const body = { carId: car.id, startTime: dates.start, plannedEndTime: dates.end }
      if (isDemo) {
        const days = Math.max(1, Math.ceil((Date.parse(dates.end) - Date.parse(dates.start)) / 86400000))
        setDemoTrips((items) => [{ ...body, id: Date.now(), car, status: 'PENDING', totalPrice: car.pricePerDay * days }, ...items])
      } else {
        await rentalApi.create({ ...body, userId: user.id }, token)
        refreshCatalog()
      }
      showModal(null)
      goTo('trips')
      setNotice(isDemo ? 'Демо-бронь создана.' : 'Бронь создана.')
    } catch (failure) {
      if (isSessionError(failure)) {
        clearSession()
        showModal({ type: 'auth', resume: modal })
      }
      setError(failure.message)
    } finally {
      setBusy(false)
    }
  }

  async function cancel() {
    setBusy(true)
    setError('')
    const { rental } = modal
    try {
      if (isDemo) {
        setDemoTrips((items) => items.map((item) => item.id === rental.id ? { ...item, status: 'CANCELLED' } : item))
      } else {
        const updated = await rentalApi.cancelMine(rental.id, token)
        setTrips((current) => ({ items: (current.items || []).map((item) => item.id === rental.id ? updated : item) }))
        refreshCatalog()
      }
      showModal(null)
      setNotice('Бронь отменена.')
    } catch (failure) {
      if (isSessionError(failure)) {
        clearSession()
        showModal({ type: 'auth' })
      }
      setError(failure.message)
    } finally {
      setBusy(false)
    }
  }

  return <div className="app">
    <header className={'topbar' + (isStaff ? ' staff-topbar' : '')}>
      <button className="brand" type="button" aria-label="Верста, автопарк" onClick={() => goTo('catalog')}>
        <img className="brand-icon" src={import.meta.env.BASE_URL + 'versta-mark.svg'} alt="" width="40" height="40" />
        <span className="wordmark">ВЕРСТА</span>
      </button>
      <nav className="nav" aria-label="Разделы">
        <button type="button" aria-current={page === 'catalog' ? 'page' : undefined} onClick={() => goTo('catalog')}><MapIcon size={18} /> <span>Автопарк</span></button>
        {!isAdmin && <button type="button" aria-current={page === 'trips' || page === 'payments' ? 'page' : undefined}
          onClick={() => goTo('trips')}><History size={18} /> <span>Мои поездки</span></button>}
        {isStaff && <button type="button" aria-current={page === 'staff' ? 'page' : undefined} onClick={() => goTo('staff')}><ShieldCheck size={18} /> <span>Панель</span></button>}
      </nav>
      {isDemo
        ? <a className="account" href={liveLink}><span className="demo-dot" /><span>Демо-режим</span></a>
        : isAdmin ? <button className="account" type="button" onClick={clearSession}>
          <span className="account-icon"><LogOut size={16} /></span><span>Выйти</span>
        </button> : <button className="account" type="button" aria-current={page === 'profile' ? 'page' : undefined}
          onClick={() => token ? goTo('profile') : showModal({ type: 'auth' })}>
          <span className="account-icon"><UserRound size={16} /></span><span>{token ? 'Мой профиль' : 'Войти'}</span>
        </button>}
    </header>

    {page === 'catalog' ? <main className={'workspace' + (mapVisible ? ' mobile-map' : '')}>
      <div className="fleet-header">
        <div>
          {!isAdmin && <div className="subtitle"><MapPin size={15} /> Посуточная аренда</div>}
          <h1>{isAdmin ? 'Весь автопарк' : 'Выберите автомобиль'}</h1>
        </div>
        <div className="fleet-actions">
          {!isAdmin && <button className="date-trigger" type="button" onClick={() => showModal({ type: 'dates' })}>
            <span className="date-icon"><CalendarDays size={19} /></span>
            <span><small>Даты поездки</small><strong>{formatShort(dates.start)} — {formatShort(dates.end)}</strong></span>
            <ChevronDown className="date-chevron" size={15} />
          </button>}
          <button className="location-trigger secondary" type="button" onClick={() => showModal({ type: 'location' })}>
            <LocateFixed size={18} /> {position ? 'Моё место' : 'Рядом со мной'}
          </button>
        </div>
      </div>
      <div className="mobile-switch" aria-label="Вид автопарка">
        <button type="button" aria-pressed={!mapVisible} onClick={() => setMapVisible(false)}><List size={17} /> Список</button>
        <button type="button" aria-pressed={mapVisible} onClick={() => setMapVisible(true)}><MapIcon size={17} /> Карта</button>
      </div>
      <aside className="catalog" aria-label="Автопарк">
        <div className="catalog-head">
          <label className="search"><Search size={18} /><input type="search" placeholder="Марка или модель" aria-label="Марка или модель" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
          <div className="chips" aria-label="Классы автомобилей">
            <button type="button" aria-pressed={category === ''} onClick={() => setCategory('')}>Все</button>
            {categories.map(([id, label]) => <button key={id} type="button" aria-pressed={category === id} onClick={() => setCategory(id)}>{label}</button>)}
          </div>
        </div>
        <div className="catalog-list">
          <div className="results-head">
            <h2>{catalog.cars ? 'Автомобили · ' + visible.length : 'Автомобили'}</h2>
            <label className="sort">
              <select aria-label="Сортировка" value={sort} onChange={(event) => setSort(event.target.value)}>
                <option value="default">По умолчанию</option>
                {position && <option value="near">Сначала ближайшие</option>}
                <option value="low">Сначала дешевле</option>
                <option value="high">Сначала дороже</option>
              </select>
              <ChevronDown size={14} />
            </label>
          </div>
          {catalog.loading && <StateCard title="Загружаем автопарк" />}
          {catalog.error && <StateCard icon={Compass} title="Автопарк недоступен" detail={catalog.error}>
            <button className="secondary" type="button" onClick={refreshCatalog}>Повторить</button>
            <a href={demoLink}>Открыть демо <ArrowUpRight size={15} /></a>
          </StateCard>}
          {catalog.cars && !visible.length && <StateCard title={cars.length ? 'Машины не найдены' : 'Автопарк пока пуст'} detail={cars.length ? 'Измените поиск или класс авто.' : 'Машины появятся здесь после добавления в автопарк.'}>
            {cars.length
              ? <button className="secondary" type="button" onClick={() => { setSearch(''); setCategory('') }}>Сбросить фильтры</button>
              : <a href={demoLink}>Открыть демо <ArrowUpRight size={15} /></a>}
          </StateCard>}
          {visible.map((car) => <CarCard key={car.id} car={car} distance={distances.get(car.id)} active={car.id === selected?.id} showStatus={isAdmin}
            onDetails={() => openDetails(car)} />)}
        </div>
      </aside>
      <CarMap cars={visible} selected={selected} focusId={mapFocusId} position={position} distance={distances.get(selected?.id)}
        onFocus={setMapFocusId} onDetails={openDetails} onLocate={() => showModal({ type: 'location' })} />
    </main> : page === 'staff' && isStaff ? <StaffPanel key={token} token={token} role={role}
      currentUserId={user?.id} onRentalChanged={refreshCatalog} />
      : page === 'profile' && token ? <Profile user={user} role={role} loading={profileState.loading}
        error={profileState.error} onRetry={() => setProfileAttempt((current) => current + 1)}
        onLogout={() => { clearSession(); goTo('catalog') }} onDelete={() => showModal({ type: 'delete-account' })} />
      : page === 'profile' ? <main className="profile-page">
        <h1>Мой профиль</h1>
        <StateCard icon={UserRound} title="Войдите в аккаунт">
          <button className="primary" type="button" onClick={() => showModal({ type: 'auth' })}>Войти</button>
        </StateCard>
      </main> : <main className="trips">
      <div className="trips-head"><div><div className="subtitle"><History size={15} /> Личный кабинет</div><h1>Мои поездки</h1></div>
        <button className="primary" type="button" onClick={() => goTo('catalog')}>Выбрать авто <ArrowRight size={18} /></button>
      </div>
      {token && <div className="segmented trips-segmented">
        <button type="button" aria-pressed={page !== 'payments'} onClick={() => goTo('trips')}>Аренды</button>
        <button type="button" aria-pressed={page === 'payments'} onClick={() => goTo('payments')}>Платежи</button>
      </div>}
      {page === 'payments' && token ? <MyPaymentLookup key={token} token={token} /> : <>
      {notice && <p className="notice" role="status">{notice}</p>}
      {!token && !isDemo && <StateCard icon={UserRound} title="Войдите в аккаунт" detail="Здесь будут ваши брони и история аренд.">
        <button className="primary" type="button" onClick={() => showModal({ type: 'auth' })}>Войти</button>
      </StateCard>}
      {trips.loading && <StateCard icon={History} title="Загружаем поездки" />}
      {trips.error && <StateCard icon={History} title="Не удалось загрузить поездки" detail={trips.error}>
        <button className="secondary" type="button" onClick={() => loadTrips()}>Повторить</button>
      </StateCard>}
      {(isDemo || token) && !trips.loading && !trips.error && !tripList.length && <StateCard icon={History} title="Поездок пока нет" detail="Выберите автомобиль и оформите бронь." />}
      {tripList.map((rental) => <TripCard key={rental.id} rental={rental}
        onDetails={isDemo ? undefined : (item) => showModal({ type: 'trip', rental: item })}
        onCancel={(item) => showModal({ type: 'cancel', rental: item })} />)}
      </>}
    </main>}

    {modal?.type === 'location' && <Modal title="Рядом со мной" onClose={() => showModal(null)}>
      <LocationForm position={position} onSave={updatePosition} onClear={() => updatePosition(null)} />
    </Modal>}
    {modal?.type === 'dates' && <Modal title="Даты поездки" onClose={() => showModal(null)}>
      <DateForm dates={dates} onSave={(value) => { setDates(value); showModal(null) }} />
    </Modal>}
    {modal?.type === 'auth' && <Modal title={authMode === 'login' ? 'Войти в аккаунт' : 'Создать аккаунт'} busy={busy} onClose={() => showModal(modal.resume || null)}>
      <AuthForm mode={authMode} onMode={(mode) => { setAuthMode(mode); setError('') }} onSubmit={authenticate} busy={busy} error={error} />
    </Modal>}
    {modal?.type === 'car' && <Modal className="car-modal" title={carName(modal.car)} onClose={() => showModal(null)}>
      <CarDetails car={modal.car} distance={distances.get(modal.car.id)} onBook={isAdmin ? undefined : () => openBooking(modal.car)}
        onMap={() => showCarOnMap(modal.car)} onTrips={token && !isAdmin ? () => { showModal(null); goTo('trips') } : undefined} />
    </Modal>}
    {modal?.type === 'book' && <Modal title="Бронирование" busy={busy} onClose={() => showModal(null)}>
      <BookingForm car={modal.car} dates={dates} onDates={setDates} onSubmit={book} busy={busy} error={error} needsLogin={!user && !isDemo} demo={isDemo} />
    </Modal>}
    {modal?.type === 'cancel' && <Modal title="Отменить бронь?" busy={busy} onClose={() => showModal(null)}>
      <p className="muted">{carName(modal.rental.car)}</p>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="dialog-actions">
        <button className="secondary" type="button" disabled={busy} onClick={() => showModal(null)}>Оставить</button>
        <button className="danger" type="button" disabled={busy} onClick={cancel}>{busy ? 'Отменяем…' : 'Отменить бронь'}</button>
      </div>
    </Modal>}
    {modal?.type === 'trip' && token && <CustomerRental key={modal.rental.id} rentalId={modal.rental.id} token={token}
      onClose={() => showModal(null)} onCancel={(rental) => showModal({ type: 'cancel', rental })} />}
    {modal?.type === 'delete-account' && token && <ConfirmAction title="Удалить аккаунт?"
      description="Ваш аккаунт будет удалён без возможности восстановления." label="Удалить аккаунт"
      onClose={() => showModal(null)} onConfirm={async () => {
        await accountApi.deleteMe(token)
        clearSession()
        goTo('catalog')
      }} />}
  </div>
}

createRoot(document.getElementById('root')).render(<App />)

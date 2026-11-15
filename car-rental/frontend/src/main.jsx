import { useCallback, useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  ArrowRight, ArrowUpRight, CalendarDays, CarFront, ChevronDown, Compass, History, List,
  LocateFixed, LogOut, Map as MapIcon, MapPin, Search, Disc3, UserRound,
} from 'lucide-react'
import { isDemo, readToken, request, saveToken } from './api'
import { carName, coordinates, defaultDates, demoCars, localInput, price } from './catalog'
import CarMap from './CarMap'
import LocationForm from './LocationForm'
import { distanceKm, formatDistance } from './location'
import { AuthForm, BookingForm, CarPhoto, DateForm, Modal, TripCard } from './Dialogs'
import './style.css'

const shortDate = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' })
const formatShort = (value) => value ? shortDate.format(new Date(value)).replace('.', '') : '—'
const isSessionError = (error) => error.status === 401 || error.status === 403
const demoLink = '?demo=1'
const liveLink = window.location.pathname
const emptyList = []
const demoUser = { firstName: 'Демо', lastName: 'Пользователь' }

function StateCard({ icon: Icon = CarFront, title, detail, children }) {
  return <div className="state-card">
    <div className="state-icon"><Icon size={23} /></div>
    <h3>{title}</h3>
    {detail && <p>{detail}</p>}
    {children}
  </div>
}

function CarCard({ car, distance, active, onSelect, onBook }) {
  return <article className={'car-card' + (active ? ' selected' : '')}>
    <button className="car-card-main" type="button" onClick={onSelect} aria-pressed={active}>
      <CarPhoto car={car} />
      <span className="car-copy">
        <strong>{carName(car)}</strong>
        <small>{[car.categoryName, car.year, distance == null ? null : formatDistance(distance)].filter(Boolean).join(' · ')}</small>
        <span className="daily"><b>{price(car.pricePerDay)}</b><span> / сутки</span></span>
      </span>
    </button>
    <button className="car-arrow icon-button" type="button" onClick={onBook} aria-label={'Арендовать ' + carName(car)}>
      <ArrowUpRight size={19} />
    </button>
  </article>
}

function App() {
  const [catalog, setCatalog] = useState(() => isDemo ? { cars: demoCars } : { loading: true })
  const [category, setCategory] = useState('')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('default')
  const [position, setPosition] = useState(null)
  const [selectedId, selectCar] = useState(null)
  const [page, setPage] = useState('catalog')
  const [mapVisible, setMapVisible] = useState(false)
  const [dates, setDates] = useState(defaultDates)
  const [token, setToken] = useState(() => isDemo ? null : readToken())
  const [user, setUser] = useState(() => isDemo ? demoUser : null)
  const [trips, setTrips] = useState({})
  const [demoTrips, setDemoTrips] = useState([])
  const [modal, setModal] = useState(null)
  const [authMode, setAuthMode] = useState('login')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const cars = catalog.cars || emptyList
  const categories = useMemo(() => {
    const entries = new Map()
    for (const car of cars) if (car.categoryName) entries.set(String(car.categoryId ?? car.categoryName), car.categoryName)
    return [...entries]
  }, [cars])
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
    setTrips({})
  }, [])

  const loadCatalog = useCallback(async (signal) => {
    if (isDemo) return
    setCatalog({ loading: true })
    try {
      setCatalog({ cars: await request('/cars', { signal }) })
    } catch (failure) {
      if (failure.name !== 'AbortError') setCatalog({ error: failure.message })
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    loadCatalog(controller.signal)
    return () => controller.abort()
  }, [loadCatalog])

  useEffect(() => {
    if (!token) return
    const controller = new AbortController()
    request('/users/me', { token, signal: controller.signal })
      .then(setUser)
      .catch((failure) => {
        if (isSessionError(failure) || failure.status === 404) clearSession()
        else if (failure.name !== 'AbortError') setNotice(failure.message)
      })
    return () => controller.abort()
  }, [token, clearSession])

  const loadTrips = useCallback(async (signal) => {
    if (isDemo || !token) return
    setTrips({ loading: true })
    try {
      const items = await request('/users/me/rentals', { token, signal })
      setTrips({ items: [...items].sort((a, b) => b.id - a.id) })
    } catch (failure) {
      if (failure.status === 404) setTrips({ items: [] })
      else if (isSessionError(failure)) clearSession()
      else if (failure.name !== 'AbortError') setTrips({ error: failure.message })
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
    setMapVisible(false)
    showModal(null)
  }

  function goTo(next) {
    setPage(next)
    setNotice('')
  }

  function openBooking(car) {
    selectCar(car.id)
    showModal({ type: 'book', car })
  }

  async function authenticate(data) {
    setBusy(true)
    setError('')
    try {
      const result = await request('/auth/' + authMode, { method: 'POST', body: data })
      saveToken(result.accessToken)
      setToken(result.accessToken)
      setUser(result.user)
      showModal(modal.resume || null)
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
        await request('/rentals', { token, body: { ...body, userId: user.id }, method: 'POST' })
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
        const updated = await request('/rentals/' + rental.id + '/cancel', { token, method: 'POST' })
        setTrips((current) => ({ items: current.items.map((item) => item.id === rental.id ? updated : item) }))
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
    <header className="topbar">
      <button className="brand" type="button" aria-label="Руль, автопарк" onClick={() => goTo('catalog')}>
        <span className="brand-icon"><Disc3 size={26} strokeWidth={2.1} /></span>
        <span className="wordmark">руль<span>.</span></span>
      </button>
      <nav className="nav" aria-label="Разделы">
        <button type="button" aria-current={page === 'catalog' ? 'page' : undefined} onClick={() => goTo('catalog')}><MapIcon size={18} /> <span>Автопарк</span></button>
        <button type="button" aria-current={page === 'trips' ? 'page' : undefined} onClick={() => goTo('trips')}><History size={18} /> <span>Мои поездки</span></button>
      </nav>
      {isDemo
        ? <a className="account" href={liveLink}><span className="demo-dot" /><span>Демо-режим</span></a>
        : <button className="account" type="button" onClick={() => showModal({ type: user ? 'profile' : 'auth' })}><UserRound size={18} /> <span>{user?.firstName || 'Войти'}</span></button>}
    </header>

    {page === 'catalog' ? <main className={'workspace' + (mapVisible ? ' mobile-map' : '')}>
      <aside className="catalog" aria-label="Автопарк">
        <div className="catalog-head">
          <div className="subtitle"><MapPin size={14} /> Посуточная аренда</div>
          <div className="catalog-title">
            <h1>Автопарк</h1>
            <button className="location-trigger secondary" type="button" onClick={() => showModal({ type: 'location' })}>
              <LocateFixed size={16} /> {position ? 'Моё место' : 'Рядом со мной'}
            </button>
          </div>
          <button className="date-trigger" type="button" onClick={() => showModal({ type: 'dates' })}>
            <span className="date-icon"><CalendarDays size={20} /></span>
            <span><small>Даты поездки</small><strong>{formatShort(dates.start)} — {formatShort(dates.end)}</strong></span>
            <ChevronDown className="date-chevron" size={17} />
          </button>
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
            <button className="secondary" type="button" onClick={() => loadCatalog()}>Повторить</button>
            <a href={demoLink}>Открыть демо <ArrowUpRight size={15} /></a>
          </StateCard>}
          {catalog.cars && !visible.length && <StateCard title={cars.length ? 'Машины не найдены' : 'Автопарк пока пуст'} detail={cars.length ? 'Измените поиск или класс авто.' : 'Машины появятся здесь после добавления в автопарк.'}>
            {cars.length
              ? <button className="secondary" type="button" onClick={() => { setSearch(''); setCategory('') }}>Сбросить фильтры</button>
              : <a href={demoLink}>Открыть демо <ArrowUpRight size={15} /></a>}
          </StateCard>}
          {visible.map((car) => <CarCard key={car.id} car={car} distance={distances.get(car.id)} active={car.id === selected?.id}
            onSelect={() => { selectCar(car.id); if (coordinates(car)) setMapVisible(true) }} onBook={() => openBooking(car)} />)}
        </div>
      </aside>
      <CarMap cars={visible} selected={selected} position={position} distance={distances.get(selected?.id)}
        onSelect={selectCar} onBook={() => openBooking(selected)} onLocate={() => showModal({ type: 'location' })} demo={isDemo} />
      <button className="mobile-toggle secondary" type="button" onClick={() => setMapVisible((current) => !current)}>
        {mapVisible ? <><List size={18} /> Список</> : <><MapIcon size={18} /> Карта</>}
      </button>
    </main> : <main className="trips">
      <div className="trips-head"><div><div className="subtitle"><History size={15} /> Личный кабинет</div><h1>Мои поездки</h1></div>
        <button className="primary" type="button" onClick={() => goTo('catalog')}>Выбрать авто <ArrowRight size={18} /></button>
      </div>
      {notice && <p className="notice" role="status">{notice}</p>}
      {!token && !isDemo && <StateCard icon={UserRound} title="Войдите в аккаунт" detail="Здесь будут ваши брони и история аренд.">
        <button className="primary" type="button" onClick={() => showModal({ type: 'auth' })}>Войти</button>
      </StateCard>}
      {trips.loading && <StateCard icon={History} title="Загружаем поездки" />}
      {trips.error && <StateCard icon={History} title="Не удалось загрузить поездки" detail={trips.error}>
        <button className="secondary" type="button" onClick={() => loadTrips()}>Повторить</button>
      </StateCard>}
      {(isDemo || token) && !trips.loading && !trips.error && !tripList.length && <StateCard icon={History} title="Поездок пока нет" detail="Выберите автомобиль и оформите бронь." />}
      {tripList.map((rental) => <TripCard key={rental.id} rental={rental} onCancel={(item) => showModal({ type: 'cancel', rental: item })} />)}
    </main>}

    {modal?.type === 'location' && <Modal title="Рядом со мной" onClose={() => showModal(null)}>
      <LocationForm position={position} onSave={updatePosition} onClear={() => updatePosition(null)} />
    </Modal>}
    {modal?.type === 'dates' && <Modal title="Даты поездки" onClose={() => showModal(null)}>
      <DateForm dates={dates} onSave={(value) => { setDates(value); showModal(null) }} />
    </Modal>}
    {modal?.type === 'auth' && <Modal title={authMode === 'login' ? 'Войти в Руль' : 'Создать аккаунт'} busy={busy} onClose={() => showModal(modal.resume || null)}>
      <AuthForm mode={authMode} onMode={(mode) => { setAuthMode(mode); setError('') }} onSubmit={authenticate} busy={busy} error={error} />
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
    {modal?.type === 'profile' && user && <Modal title="Профиль" onClose={() => showModal(null)}>
      <div className="profile"><strong>{user.firstName} {user.lastName}</strong><span>{user.email}</span><span>{user.phone}</span></div>
      <button className="secondary full" type="button" onClick={() => { clearSession(); showModal(null); goTo('catalog') }}><LogOut size={17} /> Выйти из аккаунта</button>
    </Modal>}
  </div>
}

createRoot(document.getElementById('root')).render(<App />)

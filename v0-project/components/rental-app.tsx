"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { api, ApiError, type Car, type Category, type Rental, type Payment } from "@/lib/api"
import { ArrowDownRight, ArrowLeft, ArrowRight, CalendarDays, CarFront, Check, ChevronDown, CircleAlert, Clock3, CreditCard, Fuel, Gauge, KeyRound, Menu, MoveRight, ShieldCheck, SlidersHorizontal, Sparkles, UserRound, WalletCards, X } from "lucide-react"

type View = "cars" | "rentals" | "payments" | "profile" | "register" | "car" | "checkout" | "rental" | "payment"
const money = (n: number) => new Intl.NumberFormat("ru-RU", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(Number(n || 0))
const niceDate = (value?: string | null) => value ? new Date(value).toLocaleString("ru-RU", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"
const labels: Record<string, string> = { PENDING: "Ожидает", ACTIVE: "Активна", COMPLETED: "Завершена", CANCELLED: "Отменена", FAILED: "Ошибка", REFUNDED: "Возвращён", CREDIT_CARD: "Банковская карта", DEBIT_CARD: "Дебетовая карта", PAYPAL: "PayPal", CASH: "Наличные", ECONOMY: "Эконом", COMFORT: "Комфорт", PREMIUM: "Премиум", SUV: "Внедорожник", SEDAN: "Седан", HATCHBACK: "Хэтчбек", VAN: "Минивэн" }
const statusLabel = (s: string) => labels[s] || s?.toLowerCase().replaceAll("_", " ") || "Неизвестно"

export function RentalApp() {
  const [view, setView] = useState<View>("cars")
  const [cars, setCars] = useState<Car[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [category, setCategory] = useState("all")
  const [selectedCar, setSelectedCar] = useState<Car | null>(null)
  const [rentals, setRentals] = useState<Rental[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [user, setUser] = useState<Record<string, any> | null>(null)
  const [userId, setUserId] = useState("")
  const [lookupId, setLookupId] = useState("")
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [menuOpen, setMenuOpen] = useState(false)
  const [dateStart, setDateStart] = useState("")
  const [dateEnd, setDateEnd] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("CREDIT_CARD")

  const loadCatalog = useCallback(async () => {
    setLoading(true); setError("")
    try {
      const [c, cats] = await Promise.all([api<Car[]>("/cars"), api<Category[]>("/categories")])
      setCars(Array.isArray(c) ? c : []); setCategories(Array.isArray(cats) ? cats : [])
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load cars.") }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { void loadCatalog(); const id = sessionStorage.getItem("rental-user-id"); if (id) setUserId(id) }, [loadCatalog])

  const filteredCars = useMemo(() => category === "all" ? cars : cars.filter(car => String(car.categoryId) === category), [cars, category])
  const navigate = (next: View) => { setView(next); setMenuOpen(false); setError(""); setNotice("") }
  const openCar = async (car: Car) => {
    setSelectedCar(car); setView("car"); setError("")
    try { setSelectedCar(await api<Car>(`/cars/${car.id}`)) } catch (e) { setError(e instanceof Error ? e.message : "Could not load car details.") }
  }
  const loadUserData = async (kind: "rentals" | "payments" | "profile") => {
    if (!userId) { navigate("register"); return }
    navigate(kind); setLoading(true)
    try {
      if (kind === "rentals") setRentals(await api<Rental[]>(`/users/${userId}/rentals`) || [])
      if (kind === "payments") setPayments(await api<Payment[]>(`/users/${userId}/payments`) || [])
      if (kind === "profile") setUser(await api<Record<string, any>>(`/users/${userId}`))
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load your information.") }
    finally { setLoading(false) }
  }
  const selectExistingUser = async (form: FormData) => {
    const id = String(form.get("userId") || "").trim()
    if (!/^\d+$/.test(id)) { setError("Введите числовой ID пользователя."); return }
    setBusy(true); setError("")
    try {
      const profile = await api<Record<string, any>>(`/users/${id}`)
      sessionStorage.setItem("rental-user-id", id)
      setUserId(id); setUser(profile); setNotice(`Выбран профиль: ${profile.firstName || "пользователь"} ${profile.lastName || ""}`.trim()); setView("profile")
    } catch (e) { setError(e instanceof Error ? e.message : "Не удалось найти пользователя с таким ID.") }
    finally { setBusy(false) }
  }
  const register = async (form: FormData) => {
    setBusy(true); setError("")
    try {
      const result = await api<Record<string, any>>("/users", { method: "POST", body: JSON.stringify(Object.fromEntries(form)) })
      const id = String(result.id); sessionStorage.setItem("rental-user-id", id); setUserId(id); setUser(result); setNotice("Профиль создан. Приятной поездки!"); setView("profile")
    } catch (e) { setError(e instanceof Error ? e.message : "Не удалось создать профиль.") }
    finally { setBusy(false) }
  }
  const createRental = async () => {
    if (!userId) { setNotice("Выберите профиль пользователя перед бронированием."); setView("register"); return }
    if (!selectedCar || !dateStart || !dateEnd) { setError("Укажите даты начала и окончания аренды."); return }
    setBusy(true); setError("")
    try {
      const rental = await api<Rental>("/rentals", { method: "POST", body: JSON.stringify({ userId: Number(userId), carId: selectedCar.id, startTime: dateStart.length === 16 ? `${dateStart}:00` : dateStart, plannedEndTime: dateEnd.length === 16 ? `${dateEnd}:00` : dateEnd }) })
      setSelectedRental(rental); setView("checkout")
    } catch (e) { setError(e instanceof Error ? e.message : "Не удалось создать бронирование.") }
    finally { setBusy(false) }
  }
  const pay = async () => {
    if (!selectedRental) return
    setBusy(true); setError("")
    try { const p = await api<Payment>(`/payments/rentals/${selectedRental.id}`, { method: "POST", body: JSON.stringify({ paymentMethod }) }); setSelectedPayment(p); setView("payment"); setNotice("Запрос на оплату создан. Статус обновляет сервис аренды.") }
    catch (e) { setError(e instanceof Error ? e.message : "Не удалось создать платёж.") }
    finally { setBusy(false) }
  }
  const cancelRental = async (rental: Rental) => {
    if (!window.confirm("Отменить аренду?")) return
    setBusy(true); setError("")
    try { const updated = await api<Rental>(`/rentals/${rental.id}/cancel`, { method: "POST" }); setRentals(prev => prev.map(r => r.id === updated.id ? updated : r)); setNotice("Статус аренды обновлён.") }
    catch (e) { setError(e instanceof Error ? e.message : "Не удалось отменить аренду.") }
    finally { setBusy(false) }
  }
  const deleteAccount = async () => {
    if (!userId || !window.confirm("Удалить профиль? Это действие нельзя отменить.")) return
    setBusy(true)
    try { await api(`/users/${userId}`, { method: "DELETE" }); sessionStorage.removeItem("rental-user-id"); setUserId(""); setUser(null); setNotice("Профиль пользователя удалён."); setView("cars") }
    catch (e) { setError(e instanceof Error ? e.message : "Не удалось удалить профиль.") }
    finally { setBusy(false) }
  }

  return <div className="app-shell">
    <header className="topbar"><a className="brand" href="#" onClick={e => { e.preventDefault(); navigate("cars") }}><span className="brand-mark"><CarFront /></span><span>roam<span className="brand-dot">.</span></span></a>
      <nav className={`nav-links ${menuOpen ? "nav-open" : ""}`} aria-label="Основная навигация"><button className={view === "cars" || view === "car" ? "nav-active" : ""} onClick={() => navigate("cars")}>Автомобили</button><button className={view === "rentals" ? "nav-active" : ""} onClick={() => void loadUserData("rentals")}>Мои поездки</button><button className={view === "payments" ? "nav-active" : ""} onClick={() => void loadUserData("payments")}>Платежи</button></nav>
      <div className="nav-actions"><button className="profile-pill" onClick={() => userId ? void loadUserData("profile") : navigate("register")}><span className="avatar"><UserRound size={17} /></span><span>{userId ? `Профиль #${userId}` : "Выбрать профиль"}</span><ChevronDown size={15} /></button><button className="mobile-menu" aria-label="Toggle menu" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button></div>
    </header>
    <main>
      {view === "cars" && <><section className="hero"><div className="hero-copy"><div className="eyebrow"><span className="eyebrow-line" /> ВАША ДОРОГА</div><h1>Вперёд<br/><em>к новому.</em></h1><p>Подберите автомобиль для следующей поездки. Простое бронирование, комфортные машины и свобода маршрута.</p><button className="button button-light" onClick={() => document.getElementById("fleet")?.scrollIntoView({ behavior: "smooth" })}>Выбрать автомобиль <ArrowRight size={17} /></button><div className="hero-trust"><ShieldCheck size={17} /> Понятные цены без сюрпризов.</div></div><div className="hero-image"><img src="/car-share-hero.png" alt="Графитовый городской автомобиль на вечерней улице"/><div className="hero-image-shade"/><div className="hero-caption"><span>ЕДЬТЕ СВОИМ МАРШРУТОМ</span><strong>Каждая поездка с чего-то начинается.</strong></div><div className="hero-index">01 <span>/</span> 03</div></div><div className="hero-count"><strong>{cars.length > 0 ? String(cars.length).padStart(2, "0") : "—"}</strong><span>автомобилей</span></div></section>
        <section className="trust-strip"><div><span className="trust-icon"><KeyRound /></span><span><b>Сели и поехали</b><small>Быстрое бронирование</small></span></div><div><span className="trust-icon"><ShieldCheck /></span><span><b>Спокойствие в пути</b><small>Прозрачные цены</small></span></div><div><span className="trust-icon"><Clock3 /></span><span><b>В удобное время</b><small>Гибкие условия аренды</small></span></div><div className="trust-note">Создано для новых маршрутов.</div></section>
        <section className="fleet-section" id="fleet"><div className="section-heading"><div><div className="eyebrow dark-eyebrow">НАШ АВТОПАРК</div><h2>Найдите <em>свою</em> машину.</h2><p>Для городских улиц и дальних поездок.</p></div><div className="category-picker"><SlidersHorizontal size={16}/><label htmlFor="category">Категория</label><select id="category" value={category} onChange={e => setCategory(e.target.value)}><option value="all">Все автомобили</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select><ChevronDown size={15}/></div></div>
          {error && <ErrorState message={error} onRetry={loadCatalog}/>} {loading ? <div className="car-grid">{[1,2,3].map(x => <div className="skeleton-card" key={x}><div/><span/><span/></div>)}</div> : !error && filteredCars.length === 0 ? <div className="empty"><CarFront/><h3>Автомобилей пока нет</h3><p>Выберите другую категорию или загляните позже.</p></div> : <div className="car-grid">{filteredCars.map((car, i) => <article className="car-card" key={car.id}><button className={`car-visual car-visual-${i % 3}`} aria-label={`Посмотреть ${car.brand} ${car.model}`} onClick={() => void openCar(car)}><div className="car-visual-top"><span>{car.categoryName || "Готов к поездке"}</span><span className="round-arrow"><ArrowDownRight size={17}/></span></div><CarIllustration variant={i % 3}/><span className="car-visual-caption">{car.year} <i>·</i> {car.categoryName || "Премиум"}</span></button><div className="car-info"><div><h3>{car.brand} {car.model}</h3><p><span><Gauge/> {car.year}</span><span><Fuel/> Комфортный салон</span></p></div><button className="price-link" onClick={() => void openCar(car)}><strong>{money(car.pricePerDay)}</strong><small>/ день</small></button></div></article>)}</div>}
        </section><section className="bottom-cta"><div className="cta-orbit"><Sparkles/></div><div><div className="eyebrow">ВПЕРЕДИ МНОГО ИНТЕРЕСНОГО</div><h2>Выберите <em>живописный маршрут.</em></h2></div><button className="button button-light" onClick={() => document.getElementById("fleet")?.scrollIntoView({ behavior: "smooth" })}>Смотреть автомобили <MoveRight/></button></section></>}
      {view !== "cars" && <section className="content-page"><button className="back-link" onClick={() => navigate("cars")}><ArrowLeft size={16}/> Назад к автомобилям</button>{error && <ErrorState message={error} onRetry={() => view === "rentals" || view === "payments" || view === "profile" ? void loadUserData(view) : void loadCatalog()} />}{notice && <div className="notice"><Check size={17}/>{notice}</div>}
        {view === "register" && <div className="form-layout"><div className="form-intro"><div className="eyebrow dark-eyebrow">ПРОДОЛЖИТЕ ПУТЕШЕСТВИЕ</div><h1>Пора<br/><em>в путь.</em></h1><p>Выберите существующий профиль по ID или создайте нового пользователя, чтобы бронировать автомобили и управлять поездками.</p><div className="form-aside"><KeyRound/><span><b>Без пароля и регистрации</b><small>Для выбора профиля достаточно его ID.</small></span></div></div><div className="user-choice"><form className="form-card existing-user-card" action={selectExistingUser}><div className="form-title"><span>УЖЕ ЕСТЬ ПРОФИЛЬ?</span><h2>Продолжить как пользователь</h2><p>Введите ID пользователя из вашей базы. Его поездки и платежи будут привязаны к этому профилю.</p></div><label className="user-id-label" htmlFor="existing-user-id">ID пользователя</label><input id="existing-user-id" name="userId" inputMode="numeric" pattern="[0-9]+" required placeholder="Например, 10" value={lookupId} onChange={e => setLookupId(e.target.value)} /><button className="button button-dark full-button" disabled={busy}>{busy ? "Ищем профиль…" : "Выбрать пользователя"}<ArrowRight/></button>{userId && <p className="current-user-note">Сейчас выбран пользователь #{userId}. Укажите другой ID, чтобы переключиться.</p>}</form><form className="form-card" action={register}><div className="form-title"><span>НОВЫЙ ПОЛЬЗОВАТЕЛЬ</span><h2>Создать профиль</h2><p>Заполните данные для нового профиля.</p></div><div className="input-grid"><label>Имя<input required name="firstName" placeholder="Alex"/></label><label>Фамилия<input required name="lastName" placeholder="Morgan"/></label><label>Имя пользователя<input required name="username" placeholder="alexmorgan"/></label><label>Электронная почта<input required type="email" name="email" placeholder="alex@example.com"/></label><label>Телефон<input required type="tel" name="phone" placeholder="+358 40 123 4567"/></label><label>Дата рождения<input required type="date" name="dateOfBirth"/></label></div><button className="button button-dark full-button" disabled={busy}>{busy ? "Создаём профиль…" : "Создать профиль"}<ArrowRight/></button><p className="fine-print">Продолжая, вы принимаете условия аренды и политику конфиденциальности.</p></form></div></div>}
        {view === "car" && selectedCar && <div className="detail-layout"><div className="detail-photo"><div className="detail-photo-top"><span>{selectedCar.categoryName || "КОЛЛЕКЦИЯ ROAM"}</span><span>0{selectedCar.id}</span></div><CarIllustration variant={selectedCar.id % 3}/></div><div className="detail-content"><div className="eyebrow dark-eyebrow">ОБ АВТОМОБИЛЕ</div><h1>{selectedCar.brand}<br/><em>{selectedCar.model}</em></h1><p className="detail-subtitle">Комфорт и свобода для любого маршрута.</p><div className="spec-row"><div><Gauge/><span><small>ГОД ВЫПУСКА</small><b>{selectedCar.year}</b></span></div><div><CarFront/><span><small>КЛАСС</small><b>{selectedCar.categoryName}</b></span></div><div><WalletCards/><span><small>ЦЕНА ЗА ДЕНЬ</small><b>{money(selectedCar.pricePerDay)}</b></span></div></div><div className="booking-card"><h3>Запланируйте поездку</h3><label>Дата и время получения<input type="datetime-local" value={dateStart} onChange={e => setDateStart(e.target.value)}/></label><label>Дата и время возврата<input type="datetime-local" value={dateEnd} onChange={e => setDateEnd(e.target.value)}/></label><button className="button button-dark full-button" onClick={() => void createRental()} disabled={busy}>{busy ? "Бронируем…" : "Продолжить бронирование"}<ArrowRight/></button><small className="booking-note"><ShieldCheck/> Итоговую стоимость рассчитывает сервис аренды.</small></div></div></div>}
        {view === "checkout" && selectedRental && <div className="checkout-wrap"><div className="eyebrow dark-eyebrow">ПОСЛЕДНИЙ ШАГ</div><h1>Подтвердите <em>бронирование.</em></h1><p className="page-lead">Бронирование создано. Выберите способ оплаты, чтобы отправить запрос.</p><div className="checkout-grid"><div className="checkout-summary"><span className="mini-label">ВАША АРЕНДА · #{selectedRental.id}</span><h2>{selectedRental.car.brand} {selectedRental.car.model}</h2><p>{selectedRental.car.year} <i>·</i> {statusLabel(selectedRental.status)}</p><div className="summary-dates"><div><small>ПОЛУЧЕНИЕ</small><b>{niceDate(selectedRental.startTime)}</b></div><div><small>ВОЗВРАТ</small><b>{niceDate(selectedRental.plannedEndTime)}</b></div></div><div className="summary-total"><span>Итого за аренду</span><strong>{money(selectedRental.totalPrice)}</strong></div></div><div className="form-card payment-card"><h2>Способ оплаты</h2><p>Обработка платежа выполняется сервисом аренды.</p><div className="method-options">{[["CREDIT_CARD","Кредитная карта"],["DEBIT_CARD","Дебетовая карта"],["PAYPAL","PayPal"],["CASH","Наличные"]].map(([value,label])=><label key={value} className={paymentMethod === value ? "method-selected" : ""}><input type="radio" name="method" value={value} checked={paymentMethod === value} onChange={() => setPaymentMethod(value)}/><CreditCard size={18}/>{label}{paymentMethod === value && <Check className="method-check"/>}</label>)}</div><button className="button button-dark full-button" disabled={busy} onClick={() => void pay()}>{busy ? "Создаём запрос…" : "Отправить запрос на оплату"}<ArrowRight/></button><small className="booking-note"><ShieldCheck/> Оплата не проводится в браузере.</small></div></div></div>}
        {view === "rentals" && <ListPage title="Мои поездки" eyebrow="АРЕНДА" subtitle="Все ваши поездки в одном месте." loading={loading} empty={!rentals.length} emptyTitle="Поездок пока нет" emptyText="Следующее путешествие уже ждёт вас." onExplore={() => navigate("cars")}><div className="records">{rentals.map(r => <article className="record-card" key={r.id}><div className="record-icon"><CarFront/></div><div className="record-main"><span className="mini-label">АРЕНДА #{r.id}</span><h3>{r.car.brand} {r.car.model} <span>{r.car.year}</span></h3><p>{niceDate(r.startTime)} <ArrowRight/> {niceDate(r.plannedEndTime)}</p></div><div className="record-price"><Status value={r.status}/><strong>{money(r.totalPrice)}</strong></div><div className="record-actions"><button className="text-action" onClick={() => { setSelectedRental(r); navigate("rental") }}>Подробнее <ArrowRight/></button>{r.status === "PENDING" && <button className="text-action cancel-action" onClick={() => void cancelRental(r)} disabled={busy}>Отменить</button>}</div></article>)}</div></ListPage>}
        {view === "payments" && <ListPage title="История платежей" eyebrow="ПЛАТЕЖИ" subtitle="Все платежи за аренду в одном месте." loading={loading} empty={!payments.length} emptyTitle="Платежей пока нет" emptyText="Платежи за поездки будут отображаться здесь." onExplore={() => navigate("cars")}><div className="records">{payments.map(p => <article className="record-card" key={p.id}><div className="record-icon"><CreditCard/></div><div className="record-main"><span className="mini-label">ПЛАТЁЖ #{p.id} · АРЕНДА #{p.rentalId}</span><h3>{statusLabel(p.paymentMethod)}</h3><p>{niceDate(p.createdAt)}</p></div><div className="record-price"><Status value={p.status}/><strong>{money(p.amount)}</strong></div><div className="record-actions"><button className="text-action" onClick={() => { setSelectedPayment(p); navigate("payment") }}>Подробнее <ArrowRight/></button></div></article>)}</div></ListPage>}
        {view === "profile" && <div className="profile-page"><div className="eyebrow dark-eyebrow">ПРОФИЛЬ ROAM · #{userId}</div><h1>Ваш <em>профиль.</em></h1>{loading ? <div className="loading-line">Загружаем профиль…</div> : user && <div className="profile-card"><div className="profile-big-avatar"><UserRound/></div><div><span className="mini-label">ПРОФИЛЬ ПОЛЬЗОВАТЕЛЯ</span><h2>{user.firstName} {user.lastName}</h2><p>@{user.username}</p></div><div className="profile-fields">{[["Электронная почта",user.email],["Телефон",user.phone],["Дата рождения",user.dateOfBirth]].map(([k,v])=><div key={k}><small>{k}</small><b>{v || "—"}</b></div>)}</div><button className="button button-outline" onClick={() => void deleteAccount()} disabled={busy}>Удалить профиль</button></div>}{!user && !loading && <div className="empty"><UserRound/><h3>Профиль не найден</h3><p>Выберите пользователя или создайте новый профиль.</p><button className="button button-dark" onClick={() => navigate("register")}>Выбрать пользователя <ArrowRight/></button></div>}</div>}
        {view === "rental" && selectedRental && <DetailRecord title={`Аренда №${selectedRental.id}`} eyebrow="ДЕТАЛИ ПОЕЗДКИ"><div className="record-detail"><div className="record-icon"><CarFront/></div><h2>{selectedRental.car.brand} {selectedRental.car.model}</h2><Status value={selectedRental.status}/><div className="profile-fields"><div><small>Год выпуска</small><b>{selectedRental.car.year}</b></div><div><small>Получение</small><b>{niceDate(selectedRental.startTime)}</b></div><div><small>Планируемый возврат</small><b>{niceDate(selectedRental.plannedEndTime)}</b></div><div><small>Фактический возврат</small><b>{niceDate(selectedRental.actualEndTime)}</b></div><div><small>Цена за день</small><b>{money(selectedRental.pricePerDay)}</b></div><div><small>Итого</small><b>{money(selectedRental.totalPrice)}</b></div></div>{selectedRental.status === "PENDING" && <button className="button button-outline" onClick={() => void cancelRental(selectedRental)} disabled={busy}>Отменить аренду</button>}</div></DetailRecord>}
        {view === "payment" && selectedPayment && <DetailRecord title={`Платёж №${selectedPayment.id}`} eyebrow="ДЕТАЛИ ПЛАТЕЖА"><div className="record-detail"><div className="record-icon"><CreditCard/></div><h2>{money(selectedPayment.amount)}</h2><Status value={selectedPayment.status}/><div className="profile-fields"><div><small>Аренда</small><b>#{selectedPayment.rentalId}</b></div><div><small>Способ оплаты</small><b>{statusLabel(selectedPayment.paymentMethod)}</b></div><div><small>Создан</small><b>{niceDate(selectedPayment.createdAt)}</b></div><div><small>Завершён</small><b>{niceDate(selectedPayment.completedAt)}</b></div></div><p className="booking-note"><CircleAlert/> Статус платежа обновляется сервисом аренды.</p></div></DetailRecord>}
      </section>}
    </main><footer className="footer"><a className="brand footer-brand" href="#" onClick={e => { e.preventDefault(); navigate("cars") }}><span className="brand-mark"><CarFront/></span><span>roam<span className="brand-dot">.</span></span></a><span>Время отправиться в путь.</span><span>© 2026 roam rental</span></footer>
  </div>
}

function CarIllustration({variant}:{variant:number}) { return <div className={`illustration illustration-${variant}`} aria-hidden="true"><div className="illustration-glow"/><svg viewBox="0 0 560 250" role="presentation"><ellipse cx="285" cy="205" rx="220" ry="18" fill="#12231f" opacity=".13"/><path d="M75 163c7-19 23-31 44-36l69-17 56-49c12-10 26-15 42-15h74c21 0 37 8 52 23l40 42 42 13c21 7 31 21 34 41l4 25H58l4-15c2-6 6-10 13-12Z" fill={variant===1?"#dde4dd":variant===2?"#38433e":"#bd6543"}/><path d="m204 104 48-42c9-8 19-12 32-12h41v54H204Zm92-54h64c16 0 28 6 39 18l34 36H296V50Z" fill="#c7d4d0"/><path d="M248 66 207 103h79V52h-17c-8 0-15 5-21 14Zm56-14v51h85l-31-33c-8-12-17-18-33-18Z" fill="#6c817d"/><path d="M75 163c13-9 26-13 39-13h354c20 0 37 4 52 14l2 26H58l4-15c2-6 6-10 13-12Z" fill={variant===1?"#b6c0b8":variant===2?"#222d29":"#a54e32"}/><path d="M93 151h62v8H85l8-8Zm354 0h54l13 9h-71v-9Z" fill="#e7d5b2"/><circle cx="163" cy="190" r="34" fill="#25312d"/><circle cx="163" cy="190" r="19" fill="#c8cbc1"/><circle cx="163" cy="190" r="8" fill="#78817a"/><circle cx="444" cy="190" r="34" fill="#25312d"/><circle cx="444" cy="190" r="19" fill="#c8cbc1"/><circle cx="444" cy="190" r="8" fill="#78817a"/></svg></div> }
function ErrorState({message,onRetry}:{message:string;onRetry:()=>void}) { return <div className="error-state" role="alert"><CircleAlert/><div><b>Не удалось выполнить запрос</b><p>{message}</p></div><button onClick={onRetry}>Повторить</button></div> }
function Status({value}:{value:string}) { return <span className={`status status-${(value||"").toLowerCase()}`}>{statusLabel(value)}</span> }
function ListPage({title,eyebrow,subtitle,loading,empty,emptyTitle,emptyText,onExplore,children}:{title:string;eyebrow:string;subtitle:string;loading:boolean;empty:boolean;emptyTitle:string;emptyText:string;onExplore:()=>void;children:React.ReactNode}) { return <><div className="list-heading"><div className="eyebrow dark-eyebrow">{eyebrow}</div><h1>{title.split(" ")[0]} <em>{title.split(" ").slice(1).join(" ")}</em></h1><p>{subtitle}</p></div>{loading ? <div className="loading-line">Загружаем данные…</div> : empty ? <div className="empty"><CarFront/><h3>{emptyTitle}</h3><p>{emptyText}</p><button className="button button-dark" onClick={onExplore}>Смотреть автомобили <ArrowRight/></button></div> : children}</> }
function DetailRecord({title,eyebrow,children}:{title:string;eyebrow:string;children:React.ReactNode}) { return <div className="detail-record-page"><div className="eyebrow dark-eyebrow">{eyebrow}</div><h1>{title}</h1>{children}</div> }

import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowUpRight, ChevronRight, LocateFixed, MapPin, Maximize, Minus, Plus } from 'lucide-react'
import { divIcon, DomEvent, layerGroup, map as leafletMap, marker, tileLayer } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { carName, coordinates, price } from './catalog'
import { distanceKm, formatDistance } from './location'
import { CarPhoto } from './Dialogs'
import carMarkerIcon from './map-car.svg'

const mapKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY?.trim()
const widgetKey = import.meta.env.VITE_YANDEX_MAPS_WIDGET_KEY?.trim()
const moscow = [37.62, 55.756]
let mapsLoading

function loadYandexMaps() {
  if (mapsLoading) return mapsLoading

  mapsLoading = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    let timeout
    const fail = () => {
      clearTimeout(timeout)
      script.remove()
      reject(new Error('Яндекс Карты не загрузились'))
    }

    const url = new URL('https://api-maps.yandex.ru/v3/')
    url.search = new URLSearchParams({ apikey: mapKey, lang: 'ru_RU' })
    script.src = url.href
    script.async = true
    script.onerror = fail
    script.onload = async () => {
      try {
        await window.ymaps3.ready
        clearTimeout(timeout)
        resolve(window.ymaps3)
      } catch {
        fail()
      }
    }
    timeout = window.setTimeout(fail, 12000)
    document.head.append(script)
  })
  return mapsLoading
}

function toYandex([latitude, longitude]) {
  return [longitude, Math.max(-85, Math.min(85, latitude))]
}

function fleetLocation(cars, position) {
  const points = cars.map(coordinates).filter(Boolean)
  if (position && (!points.length || points.some((point) => distanceKm(position, point) < 25))) {
    points.push(position)
  }
  if (!points.length) return { center: moscow, zoom: 12 }
  const lng = points.map((point) => toYandex(point)[0])
  const lat = points.map((point) => toYandex(point)[1])
  const west = Math.min(...lng)
  const east = Math.max(...lng)
  const north = Math.max(...lat)
  const south = Math.min(...lat)
  if (west === east && north === south) return { center: [west, north], zoom: 14 }
  return { bounds: [[west, north], [east, south]] }
}

function createCarMarker(car, active, onDetails) {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'map-marker' + (active ? ' active' : '')
  const rate = document.createElement('span')
  rate.textContent = price(car.pricePerDay)
  const icon = document.createElement('img')
  icon.src = carMarkerIcon
  icon.alt = ''
  icon.className = 'map-marker-icon'
  button.append(icon, rate)
  button.title = carName(car) + ', ' + rate.textContent + ' в сутки'
  button.setAttribute('aria-label', button.title)
  button.setAttribute('aria-haspopup', 'dialog')
  button.onclick = () => onDetails(car)
  return button
}

function createUserMarker() {
  const pin = document.createElement('span')
  pin.className = 'user-map-marker'
  pin.title = 'Вы здесь'
  pin.setAttribute('role', 'img')
  pin.setAttribute('aria-label', 'Вы здесь')
  return pin
}

function MapControls({ onZoomIn, onZoomOut, onFit, onLocate }) {
  return <div className="map-controls">
    <div className="zoom">
      <button type="button" aria-label="Приблизить" onClick={onZoomIn}><Plus size={18} /></button>
      <button type="button" aria-label="Отдалить" onClick={onZoomOut}><Minus size={18} /></button>
    </div>
    <button type="button" aria-label="Показать весь автопарк" onClick={onFit}><Maximize size={17} /></button>
    <button type="button" aria-label="Рядом со мной на карте" onClick={onLocate}><LocateFixed size={18} /></button>
  </div>
}

function toLeaflet([longitude, latitude]) {
  return [latitude, longitude]
}

function showFleet(map, cars, position) {
  const location = fleetLocation(cars, position)
  if (location.bounds) {
    map.fitBounds(location.bounds.map(toLeaflet), { padding: [25, 45], maxZoom: 15, animate: false })
  } else {
    map.setView(toLeaflet(location.center), location.zoom, { animate: false })
  }
}

function leafletMarker(point, element, zIndexOffset = 0) {
  return marker(point, {
    icon: divIcon({ html: element, className: 'fleet-marker-anchor', iconSize: [0, 0], iconAnchor: [0, 0] }),
    interactive: false,
    keyboard: false,
    zIndexOffset,
  })
}

function OpenStreetFleetMap({ cars, selected, focused, position, onDetails, onFocus, onLocate }) {
  const container = useRef(null)
  const map = useRef(null)
  const markers = useRef(null)

  useEffect(() => {
    const instance = leafletMap(container.current, {
      zoomControl: false, minZoom: 2, maxZoom: 18, zoomSnap: 0.25, scrollWheelZoom: false,
    })
    instance.attributionControl.setPrefix(false)
    tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      noWrap: true,
    }).addTo(instance)
    markers.current = layerGroup().addTo(instance)
    map.current = instance
    return () => {
      instance.remove()
      map.current = null
      markers.current = null
    }
  }, [])

  const selectedId = selected?.id
  useEffect(() => {
    const group = markers.current
    for (const car of cars) {
      const point = coordinates(car)
      if (!point) continue
      const active = car.id === selectedId
      const button = createCarMarker(car, active, onDetails)
      DomEvent.disableClickPropagation(button)
      leafletMarker(point, button, active ? 1000 : 0).addTo(group)
    }
    if (position) leafletMarker(position, createUserMarker(), 2000).addTo(group)
    return () => group.clearLayers()
  }, [cars, position, selectedId, onDetails])

  const point = focused ? coordinates(selected) : null
  const latitude = point?.[0]
  const longitude = point?.[1]
  useEffect(() => {
    const element = container.current
    const instance = map.current
    function updateView() {
      if (!element.clientWidth || !element.clientHeight) return
      instance.invalidateSize({ pan: false })
      if (latitude != null && longitude != null) {
        instance.setView([latitude, longitude], 15, { animate: false })
      } else {
        showFleet(instance, cars, position)
      }
    }
    updateView()
    const resize = new ResizeObserver(updateView)
    resize.observe(element)
    return () => resize.disconnect()
  }, [cars, position, latitude, longitude])

  return <>
    <div className="map-canvas" ref={container} />
    <MapControls onZoomIn={() => map.current?.zoomIn()} onZoomOut={() => map.current?.zoomOut()} onFit={() => {
      onFocus(null)
      if (map.current) showFleet(map.current, cars, position)
    }} onLocate={onLocate} />
  </>
}

function YandexSdkMap({ cars, selected, focused, position, onDetails, onFocus, onLocate, onFailure }) {
  const container = useRef(null)
  const map = useRef(null)
  const [sdk, setSdk] = useState(null)

  useEffect(() => {
    let active = true
    let instance
    loadYandexMaps().then((api) => {
      if (!active) return
      instance = new api.YMap(container.current, {
        location: { center: moscow, zoom: 12 },
        margin: [48, 60, 48, 60],
        zoomRange: { min: 2, max: 18 },
      })
      instance.addChild(new api.YMapDefaultSchemeLayer())
      instance.addChild(new api.YMapDefaultFeaturesLayer())
      map.current = instance
      setSdk(api)
    }).catch(() => { if (active) onFailure() })

    return () => {
      active = false
      map.current = null
      instance?.destroy()
    }
  }, [onFailure])

  useEffect(() => {
    const instance = map.current
    if (!sdk || !instance) return

    const markers = []
    for (const car of cars) {
      const point = coordinates(car)
      if (!point) continue

      const active = car.id === selected?.id
      const button = createCarMarker(car, active, onDetails)
      const marker = new sdk.YMapMarker({ coordinates: toYandex(point), zIndex: active ? 3 : 1, blockBehaviors: true }, button)
      instance.addChild(marker)
      markers.push(marker)
    }

    if (position) {
      const marker = new sdk.YMapMarker({ coordinates: toYandex(position), zIndex: 4 }, createUserMarker())
      instance.addChild(marker)
      markers.push(marker)
    }

    return () => {
      if (map.current === instance) markers.forEach((marker) => instance.removeChild(marker))
    }
  }, [sdk, cars, position, selected?.id, onDetails])

  const selection = focused ? coordinates(selected) : null
  const selectedLatitude = selection?.[0]
  const selectedLongitude = selection?.[1]
  useEffect(() => {
    if (!sdk || !map.current) return
    if (selectedLatitude != null && selectedLongitude != null) {
      map.current.setLocation({ center: toYandex([selectedLatitude, selectedLongitude]), zoom: 15, duration: 180 })
    } else {
      map.current.setLocation(fleetLocation(cars, position))
    }
  }, [sdk, cars, position, selectedLatitude, selectedLongitude])

  return <>
    <div className="map-canvas" ref={container} />
    {sdk ? <MapControls
      onZoomIn={() => map.current?.setLocation({ zoom: Math.min(18, map.current.zoom + 1), duration: 160 })}
      onZoomOut={() => map.current?.setLocation({ zoom: Math.max(2, map.current.zoom - 1), duration: 160 })}
      onFit={() => {
        onFocus(null)
        map.current?.setLocation(fleetLocation(cars, position))
      }} onLocate={onLocate} /> : <div className="map-loading" role="status">Загружаем Яндекс Карты…</div>}
  </>
}

function widgetQuery(cars, focusedPoint) {
  if (focusedPoint) {
    const point = toYandex(focusedPoint).join(',')
    return new URLSearchParams({ ll: point, z: '15', pt: point })
  }

  const points = [...new Set(cars.map(coordinates).filter(Boolean).map((point) => toYandex(point).join(',')))]
  const location = fleetLocation(cars, null)
  if (location.center) {
    return new URLSearchParams({
      ll: location.center.join(','), z: String(location.zoom),
      ...(points.length ? { pt: points.join('~') } : {}),
    })
  }

  const [[west, north], [east, south]] = location.bounds
  const center = [(west + east) / 2, (north + south) / 2]
  const latSpan = (north - south) / Math.cos(center[1] * Math.PI / 180)
  const span = Math.max(east - west, latSpan)
  const zoom = Math.max(2, Math.min(14, Math.round(Math.log2(270 / span))))
  return new URLSearchParams({ ll: center.join(','), z: String(zoom), pt: points.join('~') })
}

export default function CarMap({ cars, selected, focusId, position, distance, onDetails, onFocus, onLocate }) {
  const [failed, setFailed] = useState(false)
  const [showWidget, setShowWidget] = useState(false)
  const fail = useCallback(() => setFailed(true), [])
  const useSdk = Boolean(mapKey && !failed)
  const point = selected && coordinates(selected)
  const focused = Boolean(point && selected.id === focusId)
  const query = widgetQuery(cars, focused ? point : null)
  const link = 'https://yandex.ru/maps/?' + query
  query.set('lang', 'ru_RU')
  if (widgetKey) query.set('jsApiKey', widgetKey)
  const widget = 'https://yandex.ru/map-widget/v1/?' + query

  return <section className="map-shell" aria-label="Карта автомобилей">
    <header className="map-heading">
      <div className="map-heading-title"><span className="map-heading-icon"><MapPin size={19} /></span><h2>Карта автопарка</h2></div>
      <div className="map-heading-actions">
        {!useSdk && <button className="map-provider" type="button" onClick={() => setShowWidget(!showWidget)}>
          {showWidget ? 'Карта с машинками' : 'Виджет Яндекса'}
        </button>}
        <a href={link} className="map-external" target="_blank" rel="noreferrer" aria-label="Открыть в Яндекс Картах">
          <span>Яндекс Карты</span> <ArrowUpRight size={15} />
        </a>
      </div>
    </header>
    <div className="map-frame">
      {useSdk ? <YandexSdkMap cars={cars} selected={selected} focused={focused} position={position} onDetails={onDetails}
        onFocus={onFocus} onLocate={onLocate} onFailure={fail} />
        : showWidget ? <iframe title="Яндекс Карты" src={widget} loading="lazy" />
          : <OpenStreetFleetMap cars={cars} selected={selected} focused={focused} position={position}
            onDetails={onDetails} onFocus={onFocus} onLocate={onLocate} />}
    </div>
    {failed && !showWidget && <p className="map-notice" role="status">JavaScript API Яндекса не загрузился. Открыта карта OpenStreetMap.</p>}
    {selected && <div className="map-selection">
      <CarPhoto car={selected} />
      <div className="selection-copy">
        <strong>{carName(selected)}</strong>
        <span>{price(selected.pricePerDay)} / сутки{distance == null ? '' : ' · ' + formatDistance(distance)}</span>
      </div>
      {point && <button className="icon-button" type="button" aria-label={focused ? 'Показать все машины' : 'Показать выбранный автомобиль'}
        title={focused ? 'Показать все машины' : 'Показать выбранный автомобиль'} onClick={() => onFocus(focused ? null : selected.id)}>
        {focused ? <Maximize size={18} /> : <MapPin size={18} />}
      </button>}
      <button className="primary" type="button" aria-haspopup="dialog" onClick={() => onDetails(selected)}>Подробнее <ChevronRight size={16} /></button>
    </div>}
  </section>
}

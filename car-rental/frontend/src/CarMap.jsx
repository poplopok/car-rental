import { useEffect, useRef, useState } from 'react'
import { CarFront, LocateFixed, Maximize, Minus, Plus } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { carName, coordinates, price } from './catalog'
import { distanceKm, formatDistance } from './location'

const moscow = [55.756, 37.622]

function fitCars(map, cars, position) {
  const points = cars.map(coordinates).filter(Boolean)
  if (position && (!points.length || points.some((point) => distanceKm(position, point) < 25))) {
    points.push(position)
  }
  if (points.length === 0) map.setView(moscow, 12)
  else if (points.length === 1) map.setView(points[0], 14)
  else map.fitBounds(points, { padding: [85, 90], maxZoom: 14 })
}

export default function CarMap({ cars, selected, position, distance, onSelect, onBook, onLocate, demo }) {
  const container = useRef(null)
  const map = useRef(null)
  const markers = useRef(null)
  const [mapError, setMapError] = useState(false)
  const selectedId = selected?.id

  useEffect(() => {
    const instance = L.map(container.current, {
      zoomControl: false,
      minZoom: 2,
      maxZoom: 19,
      attributionControl: true,
    }).setView(moscow, 12)

    instance.attributionControl.setPrefix(false)
    const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>',
      maxNativeZoom: 19,
    }).addTo(instance)
    tiles.on('tileerror', () => setMapError(true))
    tiles.on('tileload', () => setMapError(false))
    map.current = instance
    markers.current = L.layerGroup().addTo(instance)
    const observer = new ResizeObserver(() => instance.invalidateSize())
    observer.observe(container.current)
    return () => {
      observer.disconnect()
      instance.remove()
      map.current = null
      markers.current = null
    }
  }, [])

  useEffect(() => {
    if (map.current) fitCars(map.current, cars, position)
  }, [cars, position])

  useEffect(() => {
    if (!position || !map.current) return
    const marker = L.circleMarker(position, {
      radius: 8,
      weight: 3,
      color: '#fff',
      fillColor: '#207ad7',
      fillOpacity: 1,
    }).addTo(map.current).bindTooltip('Вы здесь', { direction: 'top', offset: [0, -6] })
    return () => marker.remove()
  }, [position])

  useEffect(() => {
    const group = markers.current
    if (!group) return
    group.clearLayers()
    for (const car of cars) {
      const point = coordinates(car)
      if (!point) continue
      const label = document.createElement('span')
      label.textContent = price(car.pricePerDay)
      const marker = L.marker(point, {
        title: carName(car),
        alt: carName(car),
        zIndexOffset: car.id === selectedId ? 1000 : 0,
        icon: L.divIcon({
          className: 'map-marker' + (car.id === selectedId ? ' active' : ''),
          iconSize: [82, 34],
          iconAnchor: [41, 40],
          html: label,
        }),
      }).addTo(group)
      marker.on('click', () => onSelect(car.id))
    }
  }, [cars, selectedId, onSelect])

  useEffect(() => {
    const point = selected && coordinates(selected)
    if (point && map.current && !map.current.getBounds().pad(-0.2).contains(point)) {
      map.current.panTo(point)
    }
  }, [selected])

  return <section className="map-shell" aria-label="Карта автомобилей">
    <div className="map-canvas" ref={container} />
    <div className="map-status"><i />{demo ? 'Москва · демо' : 'Автопарк на карте'}</div>
    {mapError && <div className="map-notice" role="status">Подложка карты временно недоступна</div>}
    <div className="map-controls">
      <div className="zoom">
        <button type="button" aria-label="Приблизить карту" onClick={() => map.current?.zoomIn()}><Plus size={20} /></button>
        <button type="button" aria-label="Отдалить карту" onClick={() => map.current?.zoomOut()}><Minus size={20} /></button>
      </div>
      <button type="button" aria-label="Показать все машины на карте" title="Показать все машины на карте" onClick={() => map.current && fitCars(map.current, cars, position)}><Maximize size={18} /></button>
      <button type="button" aria-label="Рядом со мной" title="Рядом со мной" onClick={onLocate}><LocateFixed size={19} /></button>
    </div>
    {selected && <div className="map-selection">
      <div className="selection-icon"><CarFront size={22} /></div>
      <div><strong>{carName(selected)}</strong><span>{price(selected.pricePerDay)} / сутки{distance == null ? '' : ' · ' + formatDistance(distance)}</span></div>
      <button className="primary" type="button" onClick={onBook}>Забронировать</button>
    </div>}
  </section>
}

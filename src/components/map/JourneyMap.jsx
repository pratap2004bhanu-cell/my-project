import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const DEFAULT_CENTER = [28.6139, 77.209];

// divIcon HTML is raw markup: anything from the database is escaped first.
const esc = (value) =>
  String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/* A journey pin is a rounded, softly-lit disc carrying the activity
   glyph — a place is not a person, so no avatar initials here. */
function placeIcon({ glyph, selected, tone }) {
  const cls = [
    'kiky-journey-pin',
    selected ? 'kiky-journey-pin-active' : '',
  ].filter(Boolean).join(' ');
  const style = `--kiky-pin-tone:${esc(tone)};`;
  return L.divIcon({
    className: 'kiky-journey-pin-wrap',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    html: `<div class="${cls}" style="${style}"><span>${esc(glyph)}</span></div>`,
  });
}

/* The user's current position: a quiet ring, not a pin. */
function meIcon() {
  return L.divIcon({
    className: 'kiky-journey-me-wrap',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    html: '<div class="kiky-journey-me"></div>',
  });
}

// Fits every visible pin into the viewport, once, on load and when the
// set of places changes. Padding leaves room for the rounded container.
function FitBounds({ points }) {
  const map = useMap();
  const stops = useMemo(() => points.filter((p) => p.latlng), [points]);

  useEffect(() => {
    if (!map || stops.length === 0) return;
    const bounds = L.latLngBounds(stops.map((p) => p.latlng));
    if (stops.length === 1) {
      map.setView(stops[0].latlng, 14);
    } else {
      map.fitBounds(bounds, { padding: [56, 56], maxZoom: 15, animate: false });
    }
  }, [stops, map]);

  return null;
}

/* The memory trail: one soft curve through the places, in the order
   the user actually visited them. Drawn only between places that have
   real coordinates, and faded per-segment so it reads as a memory rather
   than a route to navigate. */
function Trail({ places, selectedKey }) {
  const map = useMap();

  // Only genuinely plottable stops take part in the line, so an unlocated
  // place never produces a segment to nowhere.
  const stops = useMemo(
    () => places.filter((p) => p.latlng),
    [places]
  );

  useEffect(() => {
    if (!map || stops.length < 2) return undefined;
    const layer = L.layerGroup().addTo(map);

    for (let i = 1; i < stops.length; i += 1) {
      const from = stops[i - 1];
      const to = stops[i];

      const active = Boolean(selectedKey) && (to.key === selectedKey || from.key === selectedKey);
      const line = L.polyline([from.latlng, to.latlng], {
        weight: active ? 2.5 : 1.75,
        opacity: active ? 0.8 : 0.32,
        color: active ? '#7CFF6B' : '#8FA0B5',
        lineCap: 'round',
      }).addTo(layer);

      // Draw-on: the segment reveals itself over ~620ms so the trail reads
      // as memory being laid down rather than a route being planned. The
      // dash array is assigned here (not via pathOptions) because the
      // animation owns stroke-dasharray for its duration.
      const el = line.getElement();
      if (el && el.getTotalLength) {
        const len = el.getTotalLength();
        if (len > 0) {
          el.style.transition = 'stroke-dashoffset 620ms cubic-bezier(0.22,0.61,0.36,1)';
          el.style.strokeDasharray = `${len}`;
          el.style.strokeDashoffset = `${len}`;
          requestAnimationFrame(() => { el.style.strokeDashoffset = '0'; });
        }
      }
    }

    return () => map.removeLayer(layer);
  }, [stops, selectedKey, map]);

  return null;
}

const JourneyMap = ({
  places = [],
  memories = [],
  selectedKey,
  onSelectPlace,
  me,
  className = '',
}) => {
  const glyphFor = (place) => {
    // Newest moment at this place sets the glyph: it is what the user
    // would most expect to see pinned there.
    const first = memories.find((m) => place.activities.includes(m.activityId));
    return first?.emoji || '📍';
  };

  return (
    <div className={`kiky-journey-map ${className}`}>
      <MapContainer
        center={me || DEFAULT_CENTER}
        zoom={13}
        className="w-full h-full"
        scrollWheelZoom={false}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="dark-tiles kiky-journey-tiles"
          attribution='&copy; OpenStreetMap'
        />

        <Trail places={places} selectedKey={selectedKey} />
        <FitBounds points={places.filter((p) => p.latlng)} />

        {me && (
          <Marker position={me} icon={meIcon()} interactive={false} />
        )}

        {places
          .filter((p) => p.latlng)
          .map((place) => (
            <Marker
              key={place.key}
              position={place.latlng}
              icon={placeIcon({
                glyph: glyphFor(place),
                selected: place.key === selectedKey,
                tone: place.momentCount > 3 ? '#7CFF6B' : '#00E5FF',
              })}
              eventHandlers={{
                click: () => onSelectPlace?.(place),
              }}
            />
          ))}
      </MapContainer>
    </div>
  );
};

export default JourneyMap;
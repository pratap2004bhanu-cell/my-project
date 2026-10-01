import { forwardRef, useImperativeHandle, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const DEFAULT_CENTER = [28.6139, 77.2090];
const PALETTE = ['#22c55e', '#ec4899', '#3b82f6', '#f59e0b', '#8b5cf6', '#06b6d4'];

// People render as avatars, not map pins: an initials disc on the KIKY
// surface, ringed in their palette colour, with a soft live pulse.
function initialsOf(name) {
  return String(name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

// divIcon html is raw HTML, so user-supplied names must be escaped
// before interpolation. Initials are letters only and always safe.
function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// face: 'person' renders initials (people are avatars);
//       'place' renders the activity glyph (a party is a place, not a person).
function avatarIcon(name, color, active, face, glyph) {
  const useGlyph = face === 'place' && glyph;
  const disc = useGlyph ? glyph : initialsOf(name);
  const pulseClass = active ? ' kiky-avatar-pulse' : '';
  const glyphClass = useGlyph ? ' kiky-avatar-glyph' : '';
  const ringStyle = `border-color:${escapeHtml(color)};box-shadow:0 0 0 3px rgba(5,5,12,0.9),0 6px 18px -6px ${escapeHtml(color)};`;
  const html =
    '<div class="kiky-avatar">' +
    `<span class="kiky-avatar-disc${pulseClass}${glyphClass}" style="${ringStyle}">${escapeHtml(disc)}</span>` +
    `<span class="kiky-avatar-tag">${escapeHtml(name)}</span>` +
    '</div>';
  return L.divIcon({
    className: 'kiky-avatar-wrap',
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -24],
    html,
  });
}

const LiveMap = forwardRef(({ center = DEFAULT_CENTER, friends = [], activities = [], onSelectActivity = () => {} }, ref) => {
  const mapRef = useRef(null);
  useImperativeHandle(ref, () => ({
    flyTo: (coords, zoom) => {
      if (mapRef.current?.flyTo) {
        mapRef.current.flyTo(coords, zoom || 14);
      }
    },
  }));

  const dummies = friends.length > 0 ? friends : [
    { id: 1, name: 'Aarav', position: [28.6150, 77.2100] },
    { id: 2, name: 'Priya', position: [28.6120, 77.2080] },
    { id: 3, name: 'Rahul', position: [28.6110, 77.2110] },
  ];

  const items = friends.length > 0
    ? friends.map((f, i) => ({
        id: f._id || i,
        name: f.name,
        position: f.coords || f.position,
        color: PALETTE[i % PALETTE.length],
      }))
    : dummies.map((f, i) => ({ ...f, color: PALETTE[i % PALETTE.length] }));

  return (
    <MapContainer
      center={center}
      zoom={14}
      className="w-full h-full"
      style={{ background: '#1e293b' }}
      ref={mapRef}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        className="dark-tiles"
      />

      {/* User's location (lime circle) */}
      <Circle
        center={center}
        radius={100}
        pathOptions={{ color: '#84cc16', fillColor: '#84cc16', fillOpacity: 0.2 }}
      />
      <Marker position={center}>
        <Popup>
          <div className="text-center">
            <strong>Your Location</strong>
          </div>
        </Popup>
      </Marker>

      {/* Friends — each person is an avatar, not a pin */}
      {items.map((friend) => (
        <div key={friend.id}>
          <Circle
            center={friend.position}
            radius={50}
            pathOptions={{ color: friend.color, fillColor: friend.color, fillOpacity: 0.2 }}
          />
          <Marker position={friend.position} icon={avatarIcon(friend.name, friend.color, true)}>
            <Popup>
              <div className="text-center">
                <strong>{friend.name}</strong>
              </div>
            </Popup>
          </Marker>
        </div>
      ))}

      {/* Live activities — real nearby, avatar-style markers (Party Map) */}
      {activities.map((activity) => {
        const color = activity.color || '#84cc16';
        const pulse = activity.isActive !== false;
        return (
          <div key={activity.id}>
            {pulse && (
              <Circle
                center={activity.position}
                radius={60}
                pathOptions={{ color, fillColor: color, fillOpacity: 0.18 }}
              />
            )}
            <Marker
              position={activity.position}
              icon={avatarIcon(activity.title, color, pulse, 'place', activity.emoji)}
            >
              <Popup>
                <div className="text-center min-w-[140px]">
                  <div className="text-2xl mb-1">{activity.emoji}</div>
                  <strong>{activity.title}</strong>
                  <p className="text-xs text-dark-400 mt-0.5">{activity.category}</p>
                  <p className="text-xs text-dark-400">
                    {activity.distance} • {activity.participants}/{activity.maxParticipants} joined
                  </p>
                  <button
                    onClick={() => onSelectActivity(activity)}
                    className="btn-primary w-full mt-2 text-xs py-1.5"
                  >
                    View & Join
                  </button>
                </div>
              </Popup>
            </Marker>
          </div>
        );
      })}
    </MapContainer>
  );
});

LiveMap.displayName = 'LiveMap';

export default LiveMap;
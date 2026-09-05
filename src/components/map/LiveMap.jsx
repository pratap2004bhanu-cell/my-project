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

const LiveMap = forwardRef(({ center = DEFAULT_CENTER, friends = [] }, ref) => {
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

      {/* Friends */}
      {items.map((friend) => (
        <div key={friend.id}>
          <Circle
            center={friend.position}
            radius={50}
            pathOptions={{ color: friend.color, fillColor: friend.color, fillOpacity: 0.2 }}
          />
          <Marker position={friend.position}>
            <Popup>
              <div className="text-center">
                <strong>{friend.name}</strong>
              </div>
            </Popup>
          </Marker>
        </div>
      ))}
    </MapContainer>
  );
});

LiveMap.displayName = 'LiveMap';

export default LiveMap;
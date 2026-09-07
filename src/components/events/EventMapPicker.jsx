import { useState, useRef, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, Circle } from 'react-leaflet';
import { FiMapPin, FiCrosshair } from 'react-icons/fi';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { browserPos, reverseGeocode } from '../../utils/location';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const ClickHandler = ({ onPick }) => {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
};

const CenterRef = ({ onCenter }) => {
  const map = useMapEvents({});
  onCenter(map);
  return null;
};

const EventMapPicker = ({ initial = [28.6139, 77.2090], onSelect, radius = 1, onRadius }) => {
  const [position, setPosition] = useState(initial);
  const [picking, setPicking] = useState(false);
  const mapRef = useRef(null);

  const pick = useCallback(async (pos) => {
    setPosition(pos);
    if (onSelect) {
      const label = await reverseGeocode(pos.lat, pos.lng);
      onSelect({ ...pos, address: label || 'Selected location' });
    }
  }, [onSelect]);

  const useMyLocation = async () => {
    setPicking(true);
    const pos = await browserPos();
    if (pos) {
      setPosition({ lat: pos.lat, lng: pos.lng });
      mapRef.current?.flyTo([pos.lat, pos.lng], 15);
      const label = await reverseGeocode(pos.lat, pos.lng);
      onSelect?.({ ...pos, address: label || 'Your current location' });
    }
    setPicking(false);
  };

  const center = useMemo(() => [position.lat, position.lng], [position]);

  return (
    <div>
      <div className="flex items-center justify-between mb-2 gap-2">
        <label className="text-sm font-medium text-gray-700">Venue location</label>
        <button
          type="button"
          onClick={useMyLocation}
          disabled={picking}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors disabled:opacity-60"
        >
          <FiCrosshair className="w-3.5 h-3.5" />
          {picking ? 'Locating...' : 'Use my location'}
        </button>
      </div>
      <div className="h-56 rounded-xl overflow-hidden border border-gray-200 relative z-0">
        <MapContainer
          center={center}
          zoom={13}
          scrollWheelZoom
          className="w-full h-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onPick={pick} />
          <CenterRef onCenter={(map) => { mapRef.current = map; }} />
          <Marker position={center} />
          <Circle
            center={center}
            radius={parseFloat(radius) * 1000}
            pathOptions={{ color: '#84cc16', fillColor: '#84cc16', fillOpacity: 0.12 }}
          />
        </MapContainer>
      </div>
      <div className="flex items-center gap-2 mt-3 text-sm text-gray-600">
        <FiMapPin className="w-4 h-4 text-gray-400" />
        <span className="truncate flex-1">
          {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
        </span>
        <select
          value={radius}
          onChange={(e) => onRadius?.(e.target.value)}
          className="bg-gray-50 border border-gray-200 text-sm rounded-lg px-2 py-1 focus:outline-none"
        >
          {[1, 2, 5, 10, 25].map((r) => (
            <option key={r} value={r}>{r} km range</option>
          ))}
        </select>
      </div>
      <p className="text-xs text-gray-400 mt-2">Tap the map to set the exact venue spot.</p>
    </div>
  );
};

export default EventMapPicker;
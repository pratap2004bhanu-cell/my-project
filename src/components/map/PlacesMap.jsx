import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const PlacesMap = ({ places, userCenter = null }) => {
  const center = userCenter || [28.6139, 77.2090];

  const getCategoryColor = (category) => {
    const colors = {
      cafe: '#f59e0b',
      restaurant: '#ef4444',
      park: '#22c55e',
      gym: '#3b82f6',
      cinema: '#a855f7',
    };
    return colors[category] || '#84cc16';
  };

  const positionFor = (place) => place.coords
    ? place.coords
    : [center[0] + (Math.random() - 0.5) * 0.04, center[1] + (Math.random() - 0.5) * 0.04];

  return (
    <MapContainer
      center={center}
      zoom={13}
      className="w-full h-full"
      style={{ background: '#1e293b' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        className="dark-tiles"
      />
      {places.map((place) => (
        <Marker
          key={place.id}
          position={positionFor(place)}
        >
          <Popup>
            <div className="p-2 min-w-[180px]">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{place.emoji}</span>
                <strong>{place.name}</strong>
              </div>
              <p className="text-sm text-gray-600">{place.address}</p>
              <p className="text-sm">⭐ {place.rating} • {place.distance}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default PlacesMap;
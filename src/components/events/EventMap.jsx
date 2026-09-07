import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { Link } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import { FiMapPin, FiCalendar, FiUsers } from 'react-icons/fi';
import { categoryMeta } from '../../data/eventCategories';

import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const EventMap = ({ events = [], center = [28.6139, 77.2090], zoom = 12, userPosition = null, height = 'h-full' }) => {
  const fallbackFor = (event, i) => {
    if (event.coordinates) return event.coordinates;
    if (!events.some((x) => x.coordinates)) {
      return [center[0] + ((i % 5) - 2) * 0.02, center[1] + ((i % 3) - 1) * 0.02];
    }
    return null;
  };

  return (
    <div className={`${height} w-full`}>
      <MapContainer
        center={center}
        zoom={zoom}
        className="w-full h-full rounded-2xl"
        style={{ background: '#1e293b' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="dark-tiles"
        />
        {userPosition && (
          <>
            <Circle
              center={userPosition}
              radius={150}
              pathOptions={{ color: '#84cc16', fillColor: '#84cc16', fillOpacity: 0.15 }}
            />
            <Marker position={userPosition}>
              <Popup>
                <div className="text-center p-1">
                  <strong>You are here</strong>
                </div>
              </Popup>
            </Marker>
          </>
        )}
        {events.map((event, i) => {
          const pos = event.coordinates || fallbackFor(event, i);
          if (!pos) return null;
          const meta = categoryMeta(event.category);
          return (
            <Marker key={event.id} position={pos}>
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{event.emoji || meta.emoji}</span>
                    <h3 className="font-bold text-gray-900 leading-tight">{event.title}</h3>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p className="flex items-center gap-1">
                      <FiCalendar className="w-3 h-3" />
                      {event.dateLabel}
                    </p>
                    <p className="flex items-center gap-1">
                      <FiMapPin className="w-3 h-3" />
                      {event.distance ? `${event.distance} away · ` : ''}{event.venueName}
                    </p>
                    <p className="flex items-center gap-1">
                      <FiUsers className="w-3 h-3" />
                      {event.goingCount} going · {event.interestedCount} interested
                    </p>
                    <p className="font-medium">{event.priceLabel}</p>
                  </div>
                  <Link
                    to={`/events/${event.id}`}
                    className="mt-3 block w-full text-center bg-lime-500 text-gray-900 py-2 rounded-lg font-bold hover:bg-lime-400 transition-colors"
                  >
                    View Event
                  </Link>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default EventMap;
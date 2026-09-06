import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { Link } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import { FiMapPin, FiUsers, FiCalendar, FiTarget } from 'react-icons/fi';

// Fix for default marker icon
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const ActivityMap = ({ activities, center = [28.6139, 77.2090], zoom = 12, userPosition = null }) => {
  const getActivityColor = (category) => {
    const colors = {
      cricket: '#22c55e',
      coffee: '#f59e0b',
      gaming: '#8b5cf6',
      gym: '#ef4444',
      movies: '#ec4899',
      walking: '#14b8a6',
      running: '#3b82f6',
      food: '#f97316',
      coding: '#06b6d4',
      music: '#a855f7',
      travel: '#0ea5e9',
      art: '#f43f5e',
    };
    return colors[category] || '#84cc16';
  };

  const posFor = (activity, i) =>
    activity.coordinates
      ? activity.coordinates
      : [center[0] + ((i % 5) - 2) * 0.012, center[1] + ((i % 3) - 1) * 0.012];

  return (
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
      {activities.map((activity, i) => (
        <Marker
          key={activity.id}
          position={posFor(activity, i)}
        >
          <Popup>
            <div className="p-2 min-w-[200px]">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{activity.emoji}</span>
                <h3 className="font-bold text-gray-900">{activity.title}</h3>
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <p className="flex items-center gap-1">
                  <FiMapPin className="w-3 h-3" />
                  {activity.distance}
                </p>
                <p className="flex items-center gap-1">
                  <FiCalendar className="w-3 h-3" />
                  {activity.time}
                </p>
                <p className="flex items-center gap-1">
                  <FiUsers className="w-3 h-3" />
                  {activity.participants}/{activity.maxParticipants} joined
                </p>
                <p className="flex items-center gap-1">
                  <FiTarget className="w-3 h-3 text-green-500" />
                  {activity.match}% match
                </p>
              </div>
              <Link
                to={`/activities/${activity.id}`}
                className="mt-3 block w-full text-center bg-green-500 text-white py-2 rounded-lg font-medium hover:bg-green-600 transition-colors"
              >
                View Activity
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default ActivityMap;
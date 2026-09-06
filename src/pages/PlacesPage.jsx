import { useState, useEffect, lazy, Suspense } from 'react';
import { 
  FiMapPin, FiStar, FiClock, FiUsers, FiNavigation,
  FiSearch, FiExternalLink, FiHeart
} from 'react-icons/fi';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const PlacesMap = lazy(() => import('../components/map/PlacesMap'));

const toRad = (deg) => (deg * Math.PI) / 180;

const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const CATEGORY_MAP = {
  cafe: ['coffee'],
  restaurant: ['food'],
  park: ['walking', 'running', 'travel', 'cricket', 'fitness', 'art'],
  gym: ['gym'],
  cinema: ['movies'],
};

const EMOJIS = { cafe: '☕', restaurant: '🍽️', park: '🌳', gym: '🏋️', cinema: '🎬' };

const MapLoading = () => (
  <div className="w-full h-full bg-dark-800 rounded-2xl flex items-center justify-center">
    <div className="w-12 h-12 border-2 border-lime-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

const PlacesPage = () => {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('list');
  const [search, setSearch] = useState('');
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState({});

  const myLocation = user?.location?.coordinates;
  const hasLocation = myLocation && myLocation.length === 2 && !(myLocation[0] === 0 && myLocation[1] === 0);

  const categories = [
    { id: 'all', name: 'All', emoji: '📍' },
    { id: 'cafe', name: 'Cafes', emoji: '☕' },
    { id: 'restaurant', name: 'Restaurants', emoji: '🍽️' },
    { id: 'park', name: 'Parks', emoji: '🌳' },
    { id: 'gym', name: 'Gyms', emoji: '🏋️' },
    { id: 'cinema', name: 'Cinemas', emoji: '🎬' },
  ];

  useEffect(() => {
    api.get('/api/activities')
      .then((res) => {
        const all = res.data.activities || [];
        const groups = {};
        for (const a of all) {
          const address = (a.location?.address || '').trim();
          if (!address || address === 'Location TBA') continue;
          const key = address.toLowerCase();
          const loc = a.location?.coordinates;
          let distance = null;
          if (hasLocation && loc && loc.length === 2 && !(loc[0] === 0 && loc[1] === 0)) {
            distance = haversine(myLocation[1], myLocation[0], loc[1], loc[0]);
          }
          const rating = a.feedback?.length
            ? Math.round((a.feedback.reduce((s, f) => s + (f.rating || 0), 0) / a.feedback.length) * 10) / 10
            : null;
          if (!groups[key]) {
            groups[key] = {
              key,
              address,
              coords: loc && !(loc[0] === 0 && loc[1] === 0) ? [loc[1], loc[0]] : null,
              categories: {},
              count: 0,
              distance: distance,
              ratings: [],
            };
          }
          groups[key].categories[a.category] = (groups[key].categories[a.category] || 0) + 1;
          groups[key].count += 1;
          if (groups[key].distance == null) groups[key].distance = distance;
          if (rating) groups[key].ratings.push(rating);
        }

        const built = Object.values(groups).map((g) => {
          const dominant = Object.entries(g.categories).sort((x, y) => y[1] - x[1])[0]?.[0];
          const type = Object.entries(CATEGORY_MAP).find(([, cats]) => cats.includes(dominant))?.[0] || 'park';
          const avgRating = g.ratings.length
            ? Math.round((g.ratings.reduce((s, r) => s + r, 0) / g.ratings.length) * 10) / 10
            : 4.5;
          return {
            id: g.key,
            name: g.address.split(',').slice(0, 2).join(','),
            category: type,
            emoji: EMOJIS[type],
            rating: avgRating,
            reviews: g.ratings.length,
            distance: g.distance,
            address: g.address,
            activities: g.count,
            coords: g.coords,
            categories: g.categories,
          };
        });

        setPlaces(built.sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999)));
      })
      .catch(() => setPlaces([]))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredPlaces = places.filter((p) => {
    if (selectedCategory !== 'all') {
      const cats = CATEGORY_MAP[selectedCategory] || [];
      if (!cats.some((c) => p.categories[c])) return false;
    }
    if (search && !(p.name + p.address).toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const toggleSave = (id) => setSaved((prev) => ({ ...prev, [id]: !prev[id] }));

  const fmtDistance = (d) => (d == null ? 'Near you' : d < 1 ? `${Math.round(d * 1000)}m` : `${d.toFixed(1)} km`);

  const openDirections = (p) => {
    if (navigator.geolocation) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.address)}`, '_blank');
    } else {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.address)}`, '_blank');
    }
  };

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-white">
            Nearby Places
          </h1>
          <p className="text-dark-400">Spots from {places.length} activity {places.length === 1 ? 'location' : 'locations'}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-2 rounded-lg ${viewMode === 'list' ? 'bg-lime-500 text-dark-900' : 'bg-dark-800/50 text-dark-400'}`}
          >
            List
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`px-3 py-2 rounded-lg ${viewMode === 'map' ? 'bg-lime-500 text-dark-900' : 'bg-dark-800/50 text-dark-400'}`}
          >
            Map
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search places..."
          className="w-full pl-12 pr-4 py-3 bg-dark-800/50 border border-dark-700/50 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-lime-500/50"
        />
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
      </div>

      {/* Categories */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
              selectedCategory === cat.id
                ? 'bg-lime-500 text-dark-900 font-semibold'
                : 'bg-dark-800/50 text-dark-300 hover:bg-dark-700/50 border border-dark-700/50'
            }`}
          >
            <span>{cat.emoji}</span>
            {cat.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card p-8 text-center text-dark-400">Finding places...</div>
      ) : filteredPlaces.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">🗺️</div>
          <h2 className="text-xl font-bold text-white mb-2">No places yet</h2>
          <p className="text-dark-400 mb-6">Places appear here as activities get locations. Create an activity with a location to start exploring.</p>
        </div>
      ) : viewMode === 'map' ? (
        <div className="h-[300px] sm:h-[400px] lg:h-[500px] rounded-2xl overflow-hidden border border-dark-700/50">
          <Suspense fallback={<MapLoading />}>
            <PlacesMap places={filteredPlaces} userCenter={hasLocation ? [myLocation[1], myLocation[0]] : null} />
          </Suspense>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlaces.map((place) => (
            <div key={place.id} className="card-glow overflow-hidden group">
              {/* Image Placeholder */}
              <div className="h-40 bg-gradient-to-br from-lime-500/20 to-electric-500/20 flex items-center justify-center text-5xl relative">
                {place.emoji}
                <button
                  onClick={() => toggleSave(place.id)}
                  className="absolute top-3 right-3 p-2 bg-dark-900/50 rounded-full text-white hover:bg-dark-900 transition-colors"
                >
                  <FiHeart className={`w-4 h-4 ${saved[place.id] ? 'fill-current text-pink-500' : ''}`} />
                </button>
                <span className="absolute bottom-3 left-3 px-2 py-1 bg-dark-900/70 rounded text-xs text-white">
                  {Object.entries(place.categories).sort((x, y) => y[1] - x[1]).slice(0, 2).map(([c, n]) => `${c} (${n})`).join(', ')}
                </span>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-white group-hover:text-lime-400 transition-colors">
                    {place.name}
                  </h3>
                  <div className="flex items-center gap-1 text-sm">
                    <FiStar className="w-4 h-4 text-amber-400 fill-current" />
                    <span className="text-white">{place.rating}</span>
                    <span className="text-dark-400">({place.reviews} rated)</span>
                  </div>
                </div>

                <p className="text-sm text-dark-400 mb-3 flex items-center gap-1">
                  <FiMapPin className="w-3 h-3" />
                  {place.address} • {fmtDistance(place.distance)}
                </p>

                <div className="flex items-center gap-4 text-sm text-dark-400 mb-4">
                  <span className="flex items-center gap-1">
                    <FiUsers className="w-3 h-3" />
                    {place.activities} {place.activities === 1 ? 'activity' : 'activities'}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button onClick={() => openDirections(place)} className="flex-1 btn-primary text-sm flex items-center justify-center gap-1">
                    <FiNavigation className="w-3 h-3" />
                    Directions
                  </button>
                  <button onClick={() => openDirections(place)} className="btn-outline px-3">
                    <FiExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlacesPage;
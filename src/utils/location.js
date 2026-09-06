// Shared location helpers: prefer the user's saved profile coordinates,
// fall back to one-shot browser geolocation.

export const hasRealCoords = (coords) =>
  Array.isArray(coords) && coords.length === 2 && !(coords[0] === 0 && coords[1] === 0);

export const browserPos = () =>
  new Promise((resolve) => {
    if (!('geolocation' in navigator)) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => resolve(null),
      { timeout: 5000 }
    );
  });

// Best guess of the user's location: saved profile coords > browser geolocation
export const getPosition = async (user) => {
  const c = user?.location?.coordinates;
  if (hasRealCoords(c)) return { lat: c[1], lng: c[0] };
  return browserPos();
};

// Best-effort reverse geocoding (OpenStreetMap Nominatim). Returns '' on any failure.
export const reverseGeocode = async (lat, lng) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&accept-language=en&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`
    );
    if (!res.ok) return '';
    const data = await res.json();
    return (
      data.address?.neighbourhood ||
      data.address?.suburb ||
      data.address?.town ||
      data.address?.city ||
      data.address?.state ||
      data.display_name ||
      ''
    );
  } catch {
    return '';
  }
};

// "28.6139° N, 77.2090° E"
export const formatCoords = (lat, lng, decimals = 4) => {
  const ns = lat >= 0 ? 'N' : 'S';
  const ew = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(decimals)}° ${ns}, ${Math.abs(lng).toFixed(decimals)}° ${ew}`;
};
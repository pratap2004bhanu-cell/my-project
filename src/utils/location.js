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
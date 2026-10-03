export function validCoordinate(lat, lng) {
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
}
export function distanceMeters(a, b) {
  const rad = Math.PI / 180;
  const p = Math.sin((b.lat-a.lat)*rad/2)**2 + Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin((b.lng-a.lng)*rad/2)**2;
  return 6371008.8 * 2 * Math.atan2(Math.sqrt(Math.min(1,p)), Math.sqrt(Math.max(0,1-p)));
}
export function formatDistance(m) {
  if (!Number.isFinite(m)) return '—';
  return m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(m >= 100000 ? 0 : 1)} km`;
}

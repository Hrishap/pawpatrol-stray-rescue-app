// Free, keyless reverse geocoding via OpenStreetMap's Nominatim, matching
// the "no account, no card" maps decision (see LeafletMap.tsx). Nominatim's
// usage policy asks for a descriptive User-Agent and reasonable request
// rates — fine for this app's per-report/per-drag usage.
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=16`,
      { headers: { 'User-Agent': 'PawPatrolStrayRescueApp/1.0' } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    return (data.display_name as string | undefined) ?? null;
  } catch {
    return null;
  }
}

// Free, keyless reverse geocoding via OpenStreetMap's Nominatim, matching
// the "no account, no card" maps decision (see LeafletMap.tsx). Nominatim's
// usage policy asks for a descriptive User-Agent and reasonable request
// rates — fine for this app's per-report/per-drag usage.

interface NominatimAddress {
  suburb?: string;
  neighbourhood?: string;
  village?: string;
  town?: string;
  city_district?: string;
  city?: string;
  county?: string;
  state?: string;
  country?: string;
}

async function fetchPlace(lat: number, lng: number, zoom: number) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=${zoom}`,
    { headers: { 'User-Agent': 'PawPatrolStrayRescueApp/1.0' } },
  );
  if (!res.ok) return null;
  return (await res.json()) as { display_name?: string; address?: NominatimAddress };
}

/** Full street-level address, used when confirming a report's location. */
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const data = await fetchPlace(lat, lng, 16);
    return data?.display_name ?? null;
  } catch {
    return null;
  }
}

/**
 * Short "locality, region" label for the map header — e.g. "Koramangala,
 * Karnataka". The header used to be a hardcoded "Kochi, Kerala" left over
 * from the original design, which was wrong for anyone outside Kochi.
 */
export async function reverseGeocodeLocality(lat: number, lng: number): Promise<string | null> {
  try {
    const data = await fetchPlace(lat, lng, 12);
    const a = data?.address;
    if (!a) return null;

    const locality =
      a.suburb ?? a.neighbourhood ?? a.village ?? a.town ?? a.city_district ?? a.city ?? a.county;
    const region = a.state ?? a.country;

    if (locality && region && locality !== region) return `${locality}, ${region}`;
    return locality ?? region ?? null;
  } catch {
    return null;
  }
}

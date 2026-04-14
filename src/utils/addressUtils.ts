export interface AddressSuggestion {
  display_name: string;
  lat: number;
  lon: number;
  address: {
    house_number?: string;
    road?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
    suburb?: string;
  };
}

export async function searchAddress(query: string): Promise<AddressSuggestion[]> {
  if (query.length < 3) return [];
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=us&limit=5&addressdetails=1`,
      { headers: { 'Accept-Language': 'en-US' } }
    );
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function lookupZipCode(zip: string): Promise<{ city: string; state: string } | null> {
  if (zip.length < 5) return null;
  try {
    const res = await fetch(`https://api.zippopotam.us/us/${zip}`);
    if (!res.ok) return null;
    const data = await res.json();
    const place = data.places[0];
    return {
      city: place['place name'],
      state: place.state,
    };
  } catch {
    return null;
  }
}

export function buildAddressString(suggestion: AddressSuggestion): string {
  const a = suggestion.address;
  const parts = [
    a.house_number ? `${a.house_number} ${a.road}` : a.road,
    a.suburb,
    a.city,
    a.state,
    a.postcode,
  ].filter(Boolean);
  return parts.join(', ');
}

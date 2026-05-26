export function parseCoordinatesFromMapsUrl(mapsUrl?: string): { lat: number; lng: number } | null {
  if (!mapsUrl) return null;
  const value = mapsUrl.trim();
  if (!value) return null;

  const rawPairMatch = value.match(/^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/);
  if (rawPairMatch) {
    return { lat: Number(rawPairMatch[1]), lng: Number(rawPairMatch[3]) };
  }

  const atMatch = value.match(/@(-?\d+(\.\d+)?),(-?\d+(\.\d+)?)/);
  if (atMatch) {
    return { lat: Number(atMatch[1]), lng: Number(atMatch[3]) };
  }

  const dMatch = value.match(/!3d(-?\d+(\.\d+)?)!4d(-?\d+(\.\d+)?)/);
  if (dMatch) {
    return { lat: Number(dMatch[1]), lng: Number(dMatch[3]) };
  }

  try {
    const url = new URL(value);
    const q = url.searchParams.get("q") || url.searchParams.get("query");
    if (q) {
      const qMatch = q.match(/(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)/);
      if (qMatch) {
        return { lat: Number(qMatch[1]), lng: Number(qMatch[3]) };
      }
    }
  } catch {
    return null;
  }

  return null;
}

export function getAddressReferenceFromMapsUrl(mapsUrl?: string): string {
  const raw = (mapsUrl || "").trim();
  if (!raw) return "";
  try {
    const url = new URL(raw);
    const query = url.searchParams.get("query") || url.searchParams.get("q");
    if (!query) return "";
    return decodeURIComponent(query).trim();
  } catch {
    return raw;
  }
}

export function getGoogleMapsLink(lat?: number, lng?: number, mapsUrl?: string): string {
  if (typeof lat === "number" && typeof lng === "number") {
    return `https://www.google.com/maps?q=${lat},${lng}`;
  }
  if (mapsUrl?.trim()) return mapsUrl.trim();
  return "";
}

export function getGoogleMapsEmbedSrc(lat?: number, lng?: number, mapsUrl?: string): string | null {
  if (typeof lat === "number" && typeof lng === "number") {
    return `https://www.google.com/maps?q=${lat},${lng}&z=15&output=embed`;
  }

  const parsed = parseCoordinatesFromMapsUrl(mapsUrl);
  if (parsed) {
    return `https://www.google.com/maps?q=${parsed.lat},${parsed.lng}&z=15&output=embed`;
  }

  const link = mapsUrl?.trim();
  if (!link) return null;
  return `https://www.google.com/maps?q=${encodeURIComponent(link)}&output=embed`;
}

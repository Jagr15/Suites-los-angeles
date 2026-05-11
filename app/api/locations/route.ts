import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Cache for the parsed data to avoid re-reading the 35MB file on every request
let locationsCache: any[] | null = null;

function getLocations() {
  if (locationsCache) return locationsCache;

  const filePath = path.join(process.cwd(), 'data', 'mexico-locations.csv');
  const fileContent = fs.readFileSync(filePath, 'utf8');
  
  // Split by lines and remove header
  const lines = fileContent.split('\n');
  const dataLines = lines.slice(1);

  const parsed = dataLines
    .filter(line => line.trim() !== '')
    .map(line => {
      const parts = line.split(',');
      if (parts.length < 7) return null;
      
      const clean = (val: string) => val ? val.replace(/^"|"$/g, '').trim() : '';

      return {
        stateId: clean(parts[0]),
        stateName: clean(parts[1]),
        municipalityId: clean(parts[3]),
        municipalityName: clean(parts[4]),
        localityId: clean(parts[5]),
        localityName: clean(parts[6]),
      };
    })
    .filter(item => item !== null);

  locationsCache = parsed;
  return parsed;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type'); // 'states', 'municipalities', 'localities'
  const stateId = searchParams.get('stateId');
  const municipalityId = searchParams.get('municipalityId');

  try {
    const allData = getLocations();

    if (type === 'states') {
      const statesMap = new Map<string, string>();
      allData.forEach(d => {
        if (!statesMap.has(d.stateId)) {
          statesMap.set(d.stateId, d.stateName);
        }
      });
      const states = Array.from(statesMap.entries())
        .map(([id, name]) => ({ id, name }))
        .sort((a, b) => a.name.localeCompare(b.name));
      return NextResponse.json(states);
    }

    if (type === 'municipalities') {
      if (!stateId) return NextResponse.json({ error: 'stateId is required' }, { status: 400 });
      
      const municipalitiesMap = new Map<string, string>();
      allData.forEach(d => {
        if (d.stateId === stateId && !municipalitiesMap.has(d.municipalityId)) {
          municipalitiesMap.set(d.municipalityId, d.municipalityName);
        }
      });
      const municipalities = Array.from(municipalitiesMap.entries())
        .map(([id, name]) => ({ id, name }))
        .sort((a, b) => a.name.localeCompare(b.name));
      return NextResponse.json(municipalities);
    }

    if (type === 'localities') {
      if (!stateId || !municipalityId) {
        return NextResponse.json({ error: 'stateId and municipalityId are required' }, { status: 400 });
      }
      
      const localities = allData
        .filter(d => d.stateId === stateId && d.municipalityId === municipalityId)
        .map(d => ({ id: d.localityId, name: d.localityName }))
        .sort((a, b) => a.name.localeCompare(b.name));
      return NextResponse.json(localities);
    }

    return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
  } catch (error) {
    console.error('Error processing locations:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

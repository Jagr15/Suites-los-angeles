"use client";

import React, { useEffect, useRef } from "react";
import { MapPinIcon, PlusIcon, HomeIcon, ArrowPathIcon } from "@heroicons/react/24/outline";

interface ClientPoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  visitOrder?: number;
  assignedRouteId?: string;
}

interface StopPoint {
  name: string;
  lat: number;
  lng: number;
}

interface RouteLocationPickerProps {
  lat?: number;
  lng?: number;
  clients?: ClientPoint[];
  allClients?: ClientPoint[];
  stops?: StopPoint[];
  currentRouteId?: string;
  onChange: (lat: number, lng: number) => void;
  onOrderChange?: (orderedIds: string[]) => void;
  onAssignClient?: (clientId: string, assign: boolean) => void;
  onStopsChange?: (stops: StopPoint[]) => void;
  height?: string;
}

export function RouteLocationPicker({
  lat,
  lng,
  clients = [],
  allClients = [],
  stops = [],
  currentRouteId,
  onChange,
  onOrderChange,
  onAssignClient,
  onStopsChange,
  height = "450px",
}: RouteLocationPickerProps) {
  const mapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const startMarkerRef = useRef<any>(null);
  const clientMarkersRef = useRef<any[]>([]);
  const stopMarkersRef = useRef<any[]>([]);
  const polylineRef = useRef<any>(null);
  
  // Modos de interacción
  const [mode, setMode] = React.useState<'none' | 'add_stop' | 'move_start'>('none');
  const [isRouting, setIsRouting] = React.useState(false);

  const propsRef = useRef({ 
    lat, lng, clients, allClients, stops, currentRouteId, 
    onChange, onOrderChange, onAssignClient, onStopsChange, mode 
  });

  useEffect(() => {
    propsRef.current = { 
      lat, lng, clients, allClients, stops, currentRouteId, 
      onChange, onOrderChange, onAssignClient, onStopsChange, mode 
    };
  }, [lat, lng, clients, allClients, stops, currentRouteId, onChange, onOrderChange, onAssignClient, onStopsChange, mode]);

  // Inicialización Única
  useEffect(() => {
    if (typeof window === "undefined" || !window.L || !containerRef.current || mapRef.current) return;

    const L = window.L;
    const initialLat = lat || 19.24;
    const initialLng = lng || -103.73;

    mapRef.current = L.map(containerRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
      attributionControl: false
    }).setView([initialLat, initialLng], 13);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(mapRef.current);

    mapRef.current.on('click', (e: any) => {
      const { lat: newLat, lng: newLng } = e.latlng;
      const currentProps = propsRef.current;
      
      if (currentProps.mode === 'add_stop') {
        const fetchAddress = async () => {
          try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${newLat}&lon=${newLng}&format=json`);
            const data = await response.json();
            
            // Construir nombre amigable: Calle + Número (si existe)
            let stopName = "";
            if (data.address) {
              const road = data.address.road || data.address.pedestrian || data.address.path;
              const houseNumber = data.address.house_number;
              if (road) {
                stopName = houseNumber ? `${road} ${houseNumber}` : road;
              } else {
                stopName = data.display_name.split(',')[0];
              }
            } else {
              stopName = `Parada ${currentProps.stops.length + 1}`;
            }

            const newStop = {
              name: stopName,
              lat: newLat,
              lng: newLng
            };
            currentProps.onStopsChange?.([...currentProps.stops, newStop]);
          } catch (error) {
            const newStop = {
              name: `Parada ${currentProps.stops.length + 1}`,
              lat: newLat,
              lng: newLng
            };
            currentProps.onStopsChange?.([...currentProps.stops, newStop]);
          }
          setMode('none');
        };
        fetchAddress();
      } else if (currentProps.mode === 'move_start') {
        currentProps.onChange(newLat, newLng);
        setMode('none');
      }
    });

    (window as any).assignClientToRoute = (id: string, assign: boolean) => {
      propsRef.current.onAssignClient?.(id, assign);
    };
    (window as any).removeStop = (idx: number) => {
      const newStops = [...propsRef.current.stops];
      newStops.splice(idx, 1);
      propsRef.current.onStopsChange?.(newStops);
    };

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        // Limpiar refs para permitir re-creación en la siguiente apertura
        startMarkerRef.current = null;
        clientMarkersRef.current = [];
        stopMarkersRef.current = [];
        polylineRef.current = null;
      }
    };
  }, []);

  // Función para obtener ruta por calles usando OSRM
  const fetchStreetRoute = async (points: [number, number][]) => {
    if (points.length < 2) return null;
    setIsRouting(true);
    try {
      const coords = points.map(p => `${p[1]},${p[0]}`).join(';');
      const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`);
      const data = await response.json();
      if (data.code === 'Ok' && data.routes.length > 0) {
        return data.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]]);
      }
    } catch (error) {
      console.error("OSRM Error:", error);
    } finally {
      setIsRouting(false);
    }
    return points;
  };

  // Actualización de Capas
  useEffect(() => {
    if (!mapRef.current || !window.L) return;
    const L = window.L;
    
    const currentLat = lat || 19.24;
    const currentLng = lng || -103.73;

    // 1. Marcador de Inicio (Bodega)
    if (startMarkerRef.current) {
      startMarkerRef.current.setLatLng([currentLat, currentLng]);
    } else {
      const startIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background: #000; color: #fff; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 50%; border: 3px solid #fff; box-shadow: 0 0 15px rgba(0,0,0,0.4);">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                  </svg>
               </div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });
      startMarkerRef.current = L.marker([currentLat, currentLng], { 
        icon: startIcon,
        zIndexOffset: 2000 
      }).addTo(mapRef.current);
    }

    // 2. Limpiar dinámicos
    clientMarkersRef.current.forEach(m => m.remove());
    clientMarkersRef.current = [];
    stopMarkersRef.current.forEach(m => m.remove());
    stopMarkersRef.current = [];

    // 3. Dibujar Clientes
    const sortedRouteClients = [...clients].sort((a, b) => (a.visitOrder || 0) - (b.visitOrder || 0));
    allClients.forEach((client) => {
      if (!client.lat || !client.lng) return;
      const isAssigned = client.assignedRouteId === currentRouteId;
      const isOther = client.assignedRouteId && !isAssigned;
      
      let html = "";
      if (isAssigned) {
        const idx = sortedRouteClients.findIndex(c => c.id === client.id);
        html = `<div style="display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 50%; background: #006FEE; color: white; border: 2px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.2); font-weight: 800; font-size: 14px;">${idx + 1}</div>`;
      } else {
        html = `<div style="display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 50%; background: ${isOther ? 'rgba(243, 18, 96, 0.4)' : '#a1a1aa'}; color: white; border: 2px solid white;">
                  <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>`;
      }

      const marker = L.marker([client.lat, client.lng], { 
        icon: L.divIcon({ className: 'custom-div-icon', html, iconSize: isAssigned ? [32, 32] : [24, 24], iconAnchor: isAssigned ? [16, 16] : [12, 12] })
      }).addTo(mapRef.current).bindPopup(`
        <div style="padding: 10px; min-width: 160px; font-family: 'Inter', sans-serif;">
          <p style="margin: 0 0 8px 0; font-weight: 800; color: #1f2937;">${client.name}</p>
          <button onclick="window.assignClientToRoute('${client.id}', ${!isAssigned})" style="width: 100%; border: none; padding: 8px; border-radius: 10px; cursor: pointer; font-weight: 700; font-size: 12px; background: ${isAssigned ? '#fee2e2' : '#e0f2fe'}; color: ${isAssigned ? '#ef4444' : '#0ea5e9'}; transition: all 0.2s;">
            ${isAssigned ? 'Quitar de Ruta' : 'Agregar a Ruta'}
          </button>
        </div>
      `);
      clientMarkersRef.current.push(marker);
    });

    // 4. Dibujar Paradas Manuales
    stops.forEach((stop, idx) => {
      const stopIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 50%; background: #17c964; color: white; border: 2px solid white; box-shadow: 0 4px 10px rgba(23,201,100,0.3);">
                <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
               </div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      const marker = L.marker([stop.lat, stop.lng], { icon: stopIcon })
        .addTo(mapRef.current)
        .bindPopup(`<div style="padding: 10px; font-family: 'Inter', sans-serif;"><p style="margin: 0 0 8px 0; font-weight: 800;">${stop.name}</p><button onclick="window.removeStop(${idx})" style="width: 100%; border: none; padding: 8px; border-radius: 10px; background: #fee2e2; color: #ef4444; font-weight: 700; font-size: 12px;">Eliminar</button></div>`);
      stopMarkersRef.current.push(marker);
    });

    // 5. Dibujar Trayecto
    const updatePolyline = async () => {
      if (polylineRef.current) polylineRef.current.remove();
      const waypoints: [number, number][] = [[currentLat, currentLng]];
      sortedRouteClients.forEach(c => waypoints.push([c.lat, c.lng]));
      stops.forEach(s => waypoints.push([s.lat, s.lng]));

      if (waypoints.length > 1) {
        const roadPoints = await fetchStreetRoute(waypoints);
        if (roadPoints && mapRef.current) {
          polylineRef.current = L.polyline(roadPoints, {
            color: '#006FEE', weight: 5, opacity: 0.8, lineJoin: 'round'
          }).addTo(mapRef.current);
        }
      }
    };
    
    updatePolyline();
    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    }, 500);

  }, [lat, lng, clients, allClients, stops, currentRouteId]);

  const optimizeRoute = () => {
    if (!lat || !lng || (clients.length + stops.length) === 0) return;
    const allPoints = [
      ...clients.map(c => ({ type: 'client' as const, id: c.id, lat: c.lat, lng: c.lng, name: c.name })),
      ...stops.map((s, idx) => ({ type: 'stop' as const, id: `stop-${idx}`, lat: s.lat, lng: s.lng, name: s.name }))
    ];
    const unvisited = [...allPoints];
    const ordered: typeof allPoints = [];
    let currentPos = { lat, lng };
    while (unvisited.length > 0) {
      let nearestIndex = 0;
      let minDistance = Infinity;
      unvisited.forEach((p, i) => {
        const d = Math.sqrt(Math.pow(p.lat - currentPos.lat, 2) + Math.pow(p.lng - currentPos.lng, 2));
        if (d < minDistance) { minDistance = d; nearestIndex = i; }
      });
      const nearest = unvisited.splice(nearestIndex, 1)[0];
      ordered.push(nearest);
      currentPos = { lat: nearest.lat, lng: nearest.lng };
    }
    const clientOrder = ordered.filter(p => p.type === 'client').map(p => p.id);
    const newStops = ordered.filter(p => p.type === 'stop').map(p => ({ name: p.name, lat: p.lat, lng: p.lng }));
    if (onOrderChange && clientOrder.length > 0) onOrderChange(clientOrder);
    if (onStopsChange) onStopsChange(newStops);
  };

  return (
    <div className={`flex flex-col gap-3 rounded-2xl p-3 border-2 transition-all ${mode !== 'none' ? 'border-primary bg-primary/5 shadow-2xl scale-[1.01]' : 'border-default-100 bg-white shadow-md'}`}>
      <div className="relative">
        <div ref={containerRef} className="w-full rounded-2xl overflow-hidden shadow-inner bg-slate-100 border border-slate-200" style={{ height }} />
        {isRouting && (
          <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-[1000] flex items-center justify-center">
            <div className="bg-white px-4 py-2 rounded-full shadow-xl flex items-center gap-2 border border-primary/20">
              <div className="size-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-bold text-primary">Trazando ruta...</span>
            </div>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <button
          onClick={(e) => { e.preventDefault(); setMode(mode === 'move_start' ? 'none' : 'move_start'); }}
          className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl transition-all font-bold text-[11px] ${
            mode === 'move_start' ? 'bg-black text-white shadow-lg scale-95' : 'bg-black/5 text-black hover:bg-black hover:text-white'
          }`}
        >
          <HomeIcon className="size-4" />
          MOVER INICIO
        </button>

        <button
          onClick={(e) => { e.preventDefault(); setMode(mode === 'add_stop' ? 'none' : 'add_stop'); }}
          className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl transition-all font-bold text-[11px] ${
            mode === 'add_stop' ? 'bg-success text-white shadow-lg scale-95' : 'bg-success/10 text-success hover:bg-success hover:text-white'
          }`}
        >
          <PlusIcon className="size-4" />
          AGREGAR PARADA
        </button>

        <button
          onClick={(e) => { e.preventDefault(); optimizeRoute(); }}
          className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-primary text-white shadow-lg hover:bg-primary-600 transition-all font-bold text-[11px] disabled:opacity-50"
          disabled={(clients.length + stops.length) <= 1}
        >
          <ArrowPathIcon className="size-4" />
          OPTIMIZAR RUTA
        </button>
      </div>

      {mode !== 'none' && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-[2000]">
          <div className={`px-6 py-3 ${mode === 'move_start' ? 'bg-black' : 'bg-success'} text-white rounded-full text-[10px] font-black shadow-2xl flex items-center gap-3 animate-bounce border-2 border-white`}>
            <MapPinIcon className="size-4" />
            {mode === 'move_start' ? 'HAZ CLIC PARA MOVER EL INICIO' : 'HAZ CLIC PARA AGREGAR LA PARADA'}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";

type GeoLeafletMap = { remove: () => void; invalidateSize?: () => void };
type GeoLeafletCircleOptions = { color: string; fillColor: string; fillOpacity: number; radius: number };
type GeoLeafletPolylineOptions = { color: string; weight: number; opacity?: number; dashArray?: string; lineJoin?: "round" };
type GeoLeafletNamespace = {
  map(container: HTMLDivElement, options?: Record<string, unknown>): { setView(center: [number, number], zoom: number): GeoLeafletMap };
  tileLayer(url: string, options: { attribution: string }): { addTo(map: GeoLeafletMap): void };
  circle(center: [number, number], options: GeoLeafletCircleOptions): { addTo(map: GeoLeafletMap): { bindPopup(label: string): void } };
  polyline(points: [number, number][], options: GeoLeafletPolylineOptions): { addTo(map: GeoLeafletMap): void };
};

export function ClientesGeographicAnalysis() {
    const mapRef = useRef<GeoLeafletMap | null>(null);
    const miniMap1Ref = useRef<GeoLeafletMap | null>(null);
    const miniMap2Ref = useRef<GeoLeafletMap | null>(null);
    
    const containerRef = useRef<HTMLDivElement>(null);
    const miniMap1ContainerRef = useRef<HTMLDivElement>(null);
    const miniMap2ContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (typeof window === "undefined" || !window.L || !containerRef.current) return;

        const L = window.L as unknown as GeoLeafletNamespace;

        const initMap = (container: HTMLDivElement, center: [number, number], zoom: number, isMini: boolean = false) => {
            const myMap = L.map(container, {
                zoomControl: !isMini,
                attributionControl: !isMini,
                dragging: !isMini,
                touchZoom: !isMini,
                doubleClickZoom: !isMini,
                scrollWheelZoom: !isMini,
                boxZoom: !isMini,
                keyboard: !isMini
            }).setView(center, zoom);

            L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                attribution: isMini ? '' : '© OpenStreetMap contributors'
            }).addTo(myMap);
            
            return myMap;
        };

        // Main Map
        if (mapRef.current) mapRef.current.remove();
        mapRef.current = initMap(containerRef.current, [19.24, -103.73], 12);
        const mainMap = mapRef.current;

        const zones = [
            { pos: [19.24, -103.73], color: "#ef4444", radius: 500, label: "Zona Crítica" },
            { pos: [19.26, -103.70], color: "#10b981", radius: 800, label: "Zona Alta Rentabilidad" },
            { pos: [19.22, -103.75], color: "#3b82f6", radius: 600, label: "Ruta 4 - Depuración" }
        ];

        zones.forEach(z => {
            L.circle(z.pos as [number, number], {
                color: z.color,
                fillColor: z.color,
                fillOpacity: 0.4,
                radius: z.radius
            }).addTo(mainMap!).bindPopup(z.label);
        });

        // Mini Map 1
        if (miniMap1ContainerRef.current) {
            if (miniMap1Ref.current) miniMap1Ref.current.remove();
            miniMap1Ref.current = initMap(miniMap1ContainerRef.current, [19.22, -103.75], 14, true);
            const map1 = miniMap1Ref.current;
            L.polyline([[19.21, -103.76], [19.22, -103.75], [19.23, -103.74]], { color: '#ef4444', weight: 4 }).addTo(map1!);
        }

        // Mini Map 2
        if (miniMap2ContainerRef.current) {
            if (miniMap2Ref.current) miniMap2Ref.current.remove();
            miniMap2Ref.current = initMap(miniMap2ContainerRef.current, [19.23, -103.74], 14, true);
            const map2 = miniMap2Ref.current;
            L.polyline([[19.22, -103.75], [19.23, -103.74], [19.24, -103.73]], { color: '#3b82f6', weight: 4 }).addTo(map2!);
        }

    }, []);

    return (
        <div className="space-y-6">
            <div className="flex flex-col">
                <h3 className="text-[11px] font-black text-default-400 uppercase tracking-widest leading-none">
                    ANÁLISIS DE COBERTURA GEOGRÁFICA Y OPORTUNIDAD
                </h3>
                <span className="text-[9px] text-default-400 mt-1 uppercase font-bold italic">
                    (Utilidad vs Costo)
                </span>
            </div>


            <div className="relative h-[420px] overflow-hidden rounded-3xl border border-default-100 bg-neutral-100 shadow-xl lg:h-[500px]">
                <div ref={containerRef} className="w-full h-full z-0" />

                {/* MINI MAPS SECTION at BOTTOM RIGHT */}
                <div className="absolute bottom-4 right-4 z-[1000] hidden gap-4 xl:flex">
                    <div className="flex flex-col gap-2">
                        <div ref={miniMap1ContainerRef} className="size-32 overflow-hidden rounded-2xl border-2 border-rose-500 bg-white shadow-xl" />
                        <div className="max-w-[128px] rounded-xl border border-rose-500 bg-white/90 p-2 shadow-lg backdrop-blur-sm">
                            <p className="text-[7px] font-black uppercase text-rose-500 leading-tight">Ruta 4 - Depuración Sugerida</p>
                            <span className="text-[6px] text-default-400 font-bold uppercase">(2 Clientes Improductivos)</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <div ref={miniMap2ContainerRef} className="size-32 overflow-hidden rounded-2xl border-2 border-rose-500 bg-white shadow-xl" />
                        <div className="max-w-[128px] rounded-xl border border-rose-500 bg-white/90 p-2 shadow-lg backdrop-blur-sm">
                            <p className="text-[7px] font-black uppercase text-rose-500 leading-tight">Ruta 4 - Depuración Sugerida</p>
                            <span className="text-[6px] text-default-400 font-bold uppercase">(2 Clientes Improductivos)</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

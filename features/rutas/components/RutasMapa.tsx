"use client";

import { useEffect, useRef } from "react";
import { Card, CardBody, Button, Chip } from "@heroui/react";
import { 
    MapPinIcon, 
    TruckIcon, 
    ClockIcon, 
    InformationCircleIcon,
    PhoneIcon
} from "@heroicons/react/24/outline";
import { type RutaRow } from "@/shared/mocks";

type Point = {
    id: number;
    name: string;
    type: "client" | "truck" | "warehouse";
    status: "pending" | "completed" | "active";
    time?: string;
    latOffset: number;
    lngOffset: number;
};

const mockPoints: Point[] = [
    { id: 1, name: "Almacén Central", type: "warehouse", status: "active", latOffset: 0.005, lngOffset: -0.01 },
    { id: 2, name: "Abarrotes Morales", type: "client", status: "completed", time: "10:30 AM", latOffset: -0.008, lngOffset: 0.005 },
    { id: 3, name: "Súper Don Pancho", type: "client", status: "pending", time: "12:15 PM", latOffset: 0.012, lngOffset: 0.015 },
    { id: 4, name: "Tienda el Centro", type: "client", status: "pending", time: "01:30 PM", latOffset: -0.015, lngOffset: -0.02 },
    { id: 5, name: "Unidad 001 - Camión", type: "truck", status: "active", latOffset: -0.002, lngOffset: -0.002 },
];

const COORDS: Record<string, [number, number]> = {
    "Manzanillo": [19.05, -104.31],
    "Colima": [19.24, -103.73],
    "Vallarta": [20.62, -105.23],
    "La Paz": [24.14, -110.31],
    "Tepic": [21.50, -104.89],
    "CP Constitucion": [25.03, -111.66],
};

declare global {
    interface Window {
        L: any;
    }
}

export function RutasMapa({ selectedRuta }: { selectedRuta: RutaRow }) {
    const mapRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const cityCoords = COORDS[selectedRuta.destino] || [19.24, -103.73];

    useEffect(() => {
        if (typeof window === "undefined" || !window.L || !containerRef.current) return;

        // Limpiar mapa anterior si existe
        if (mapRef.current) {
            mapRef.current.remove();
        }

        const L = window.L;
        const myMap = L.map(containerRef.current).setView(cityCoords, 14);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '© OpenStreetMap contributors © CARTO'
        }).addTo(myMap);

        // Iconos personalizados
        const icons = {
            warehouse: L.divIcon({
                className: 'custom-div-icon',
                html: `<div class="p-2 rounded-xl bg-black text-white shadow-xl border-2 border-white"><svg class="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg></div>`,
                iconSize: [40, 40],
                iconAnchor: [20, 20]
            }),
            client_pending: L.divIcon({
                className: 'custom-div-icon',
                html: `<div class="p-2 rounded-xl bg-primary text-white shadow-xl border-2 border-white"><svg class="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg></div>`,
                iconSize: [40, 40],
                iconAnchor: [20, 20]
            }),
            client_completed: L.divIcon({
                className: 'custom-div-icon',
                html: `<div class="p-2 rounded-xl bg-success text-white shadow-xl border-2 border-white"><svg class="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>`,
                iconSize: [40, 40],
                iconAnchor: [20, 20]
            }),
            truck: L.divIcon({
                className: 'custom-div-icon',
                html: `<div class="p-2 rounded-xl bg-primary text-white shadow-xl border-2 border-white animate-pulse ring-4 ring-primary/30"><svg class="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 7v-1h-6v11h11v-1h-1l-1-2h4l4 4h2v-8h-2.5l-3.5-3zm2 10c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm10 0c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2z"></path></svg></div>`,
                iconSize: [40, 40],
                iconAnchor: [20, 20]
            }),
        };

        const routeCoords: [number, number][] = [];

        mockPoints.forEach(p => {
            const icon = p.type === 'warehouse' ? icons.warehouse :
                        p.type === 'truck' ? icons.truck :
                        p.status === 'completed' ? icons.client_completed : icons.client_pending;

            const markerPos: [number, number] = [cityCoords[0] + p.latOffset, cityCoords[1] + p.lngOffset];
            routeCoords.push(markerPos);

            L.marker(markerPos, { icon: icon })
                .addTo(myMap)
                .bindPopup(`<b>${p.name}</b><br>${p.type} ${p.time ? `- ${p.time}` : ''}`);
        });

        // Dibujar línea de la ruta
        if (routeCoords.length > 1) {
            L.polyline(routeCoords, {
                color: '#006FEE', // primary color
                weight: 4,
                opacity: 0.6,
                dashArray: '10, 10', // dashed line for "upcoming/planned" look
                lineJoin: 'round'
            }).addTo(myMap);
        }

        mapRef.current = myMap;
    }, [cityCoords]);

    return (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Sidebar con Info */}
            <div className="xl:col-span-1 space-y-4">
                <Card className="border-none shadow-sm bg-content1 p-4">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                                <TruckIcon className="size-6" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-default-400 uppercase tracking-wider">Ruta: {selectedRuta.ruta}</h3>
                                <p className="text-lg font-black text-foreground">{selectedRuta.destino}</p>
                            </div>
                        </div>
                        
                        <div className="p-4 rounded-3xl bg-default-50 flex flex-col gap-3">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-default-500 font-medium">Progreso</span>
                                <span className="font-bold text-primary">60%</span>
                            </div>
                            <div className="h-2 w-full bg-default-200 rounded-full overflow-hidden">
                                <div className="h-full bg-primary w-[60%] transition-all duration-1000" />
                            </div>
                            <div className="flex justify-between text-[10px] text-default-400 font-bold uppercase">
                                <span>3 Completadas</span>
                                <span>2 Pendientes</span>
                            </div>
                        </div>
                    </div>
                </Card>

                <div className="space-y-3 px-2">
                    <h3 className="text-[10px] font-black text-default-400 uppercase tracking-widest leading-none mb-4">Paradas Próximas</h3>
                    <div className="space-y-3">
                        {mockPoints.filter(p => p.type === "client").map((point) => (
                            <Card key={point.id} className="border-none shadow-sm bg-content1 hover:bg-default-50 transition-colors cursor-pointer group">
                                <CardBody className="p-3">
                                    <div className="flex items-start gap-4">
                                        <div className={`p-2 rounded-xl shrink-0 ${
                                            point.status === "completed" ? "bg-success/10 text-success" : "bg-primary/10 text-primary"
                                        }`}>
                                            <MapPinIcon className="size-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center gap-2">
                                                <p className="font-bold text-xs truncate">{point.name}</p>
                                                <span className="text-[9px] font-black text-default-400">{point.time}</span>
                                            </div>
                                            <p className="text-[9px] text-default-400 mt-0.5 group-hover:text-primary transition-colors">Ver ubicación exacta</p>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>

            {/* Mapa Principal */}
            <div className="xl:col-span-3 h-[650px] relative rounded-3xl overflow-hidden border border-default-100 shadow-xl bg-neutral-100">
                <div ref={containerRef} className="w-full h-full z-0" />
            </div>
        </div>
    );
}

function BuildingStorefrontIcon(props: any) {
    return (
        <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21V10.5m0 10.5h9m-9 0H4.5m1.5 0v-10.5L12 3l6 4.5v10.5m-6-10.5v10.5" />
        </svg>
    )
}

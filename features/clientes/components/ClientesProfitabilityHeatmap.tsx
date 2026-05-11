"use client";

import dynamic from "next/dynamic";
import { mockHeatmapData } from "@/shared/mocks/clientesAnalysis";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const heatmapOptions: ApexCharts.ApexOptions = {
    chart: { 
        type: "heatmap", 
        toolbar: { show: false }, 
        zoom: { enabled: false } 
    },
    dataLabels: { enabled: false },
    colors: ["#10b981"], // Default to emerald for positive
    plotOptions: {
        heatmap: {
            radius: 4,
            enableShades: true,
            colorScale: {
                ranges: [
                    { from: 0, to: 30, name: 'Bajo', color: '#fca5a5' }, // Small positive/negative
                    { from: 31, to: 60, name: 'Medio', color: '#fdba74' },
                    { from: 61, to: 100, name: 'Alto', color: '#6ee7b7' }
                ]
            }
        }
    },
    xaxis: {
        categories: ['Reto 1', 'Reto 2', 'Reto 3', 'Reto 4'],
        labels: {
            style: {
                colors: "#888",
                fontSize: "10px",
                fontWeight: "black",
                cssClass: "uppercase tracking-widest font-black"
            }
        }
    },
    yaxis: {
        labels: {
            style: {
                colors: "#888",
                fontSize: "10px",
                fontWeight: "black",
                cssClass: "uppercase tracking-widest font-black"
            }
        }
    },
    grid: { show: false },
    tooltip: { theme: 'dark' }
};

export function ClientesProfitabilityHeatmap() {
    return (
        <div className="flex flex-col h-full bg-content1 rounded-3xl p-6 border-none shadow-sm h-full">
            <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col">
                    <h3 className="text-[11px] font-black text-default-400 uppercase tracking-widest leading-none">
                        HEATMAP DE RENTABILIDAD POR RUTA
                    </h3>
                    <span className="text-[9px] text-default-400 mt-1 uppercase font-bold italic">
                        (Utilidad Neta vs % Costo Venta)
                    </span>
                    <p className="text-[8px] text-default-400 mt-2 font-bold italic uppercase opacity-50">
                        Improductivos; ilustrativ para, por todas mas mayores reals
                    </p>
                </div>
                <span className="text-[8px] font-bold text-default-400">cite: 27</span>
            </div>

            <div className="flex-1 w-full flex items-center justify-center">
                <Chart 
                    options={{
                        ...heatmapOptions,
                    }}
                    series={mockHeatmapData}
                    type="heatmap"
                    height="100%"
                    width="100%"
                />
            </div>

            <div className="mt-4 flex justify-center gap-6">
                <div className="flex items-center gap-2">
                    <div className="size-2 bg-neutral-200 rounded-full" />
                    <span className="text-[9px] font-black text-default-400 uppercase tracking-widest leading-none">Ruta</span>
                </div>
            </div>
        </div>
    );
}

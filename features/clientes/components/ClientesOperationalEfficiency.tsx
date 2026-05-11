"use client";

import dynamic from "next/dynamic";
import { mockHeatmapData } from "@/shared/mocks/clientesAnalysis";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const efficiencyOptions: ApexCharts.ApexOptions = {
    chart: { 
        type: "heatmap", 
        toolbar: { show: false }, 
        zoom: { enabled: false } 
    },
    dataLabels: { enabled: false },
    plotOptions: {
        heatmap: {
            radius: 4,
            useFillColorAsStroke: true,
            colorScale: {
                ranges: [
                    { from: 0, to: 30, name: 'Bajo', color: '#fca5a5' },
                    { from: 31, to: 60, name: 'Medio', color: '#fdba74' },
                    { from: 61, to: 100, name: 'Alto', color: '#10b981' }
                ]
            }
        }
    },
    xaxis: {
        categories: ['Ruta 1', 'Ruta 2', 'Ruta 3', 'Ruta 4'],
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

export function ClientesOperationalEfficiency() {
    return (
        <div className="flex flex-col h-full bg-content1 rounded-3xl p-6 border-none shadow-sm h-full">
            <div className="flex justify-between items-center mb-4">
                <div className="flex flex-col">
                    <h3 className="text-[11px] font-black text-default-400 uppercase tracking-widest leading-none">
                        HEATMAP DE EFICIENCIA OPERATIVA
                    </h3>
                    <span className="text-[9px] text-default-400 mt-1 uppercase font-bold italic">
                        (Tiempo en Tienda vs. Monto Venta vs. Paradas Improductivas)
                    </span>
                </div>
                <span className="text-[8px] font-bold text-default-400">cite: 27</span>
            </div>

            <div className="flex-1 w-full flex items-center justify-center">
                <Chart 
                    options={efficiencyOptions}
                    series={mockHeatmapData}
                    type="heatmap"
                    height="100%"
                    width="100%"
                />
            </div>
        </div>
    );
}

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
            },
            rotate: -35,
            rotateAlways: false,
            trim: true,
            hideOverlappingLabels: true,
        }
    },
    yaxis: {
        labels: {
            style: {
                colors: "#888",
                fontSize: "10px",
                fontWeight: "black",
                cssClass: "uppercase tracking-widest font-black"
            },
            maxWidth: 110,
        }
    },
    grid: { show: false },
    tooltip: { theme: 'dark' }
};

export function ClientesOperationalEfficiency() {
    const chartHeight = Math.max(280, Math.min(420, mockHeatmapData.length * 40 + 48));

    return (
        <div className="flex h-full min-w-0 flex-col overflow-hidden rounded-3xl border-none bg-content1 p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-1">
                    <h3 className="text-[11px] font-black text-default-400 uppercase tracking-widest leading-none">
                        HEATMAP DE EFICIENCIA OPERATIVA
                    </h3>
                    <span className="text-[9px] text-default-400 uppercase font-bold italic">
                        (Tiempo en Tienda vs. Monto Venta vs. Paradas Improductivas)
                    </span>
                </div>
                <span className="text-[8px] font-bold text-default-400">cite: 27</span>
            </div>

            <div className="mt-4 min-h-0 w-full overflow-y-auto overflow-x-hidden rounded-2xl">
                <div className="w-full min-w-0">
                    <Chart 
                        options={{
                            ...efficiencyOptions,
                            chart: {
                                ...efficiencyOptions.chart,
                                parentHeightOffset: 0,
                                redrawOnParentResize: true,
                                redrawOnWindowResize: true,
                            },
                        }}
                        series={mockHeatmapData}
                        type="heatmap"
                        height={chartHeight}
                        width="100%"
                    />
                </div>
            </div>
        </div>
    );
}

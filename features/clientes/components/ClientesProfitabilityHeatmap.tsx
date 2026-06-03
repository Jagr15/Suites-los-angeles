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

export function ClientesProfitabilityHeatmap() {
    const chartHeight = Math.max(320, Math.min(480, mockHeatmapData.length * 44 + 56));

    return (
        <div className="flex h-full min-w-0 flex-col overflow-hidden rounded-3xl border-none bg-content1 p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-1">
                    <h3 className="text-[11px] font-black text-default-400 uppercase tracking-widest leading-none">
                        HEATMAP DE RENTABILIDAD POR RUTA
                    </h3>
                    <span className="text-[9px] text-default-400 uppercase font-bold italic">
                        (Utilidad Neta vs % Costo Venta)
                    </span>
                    <p className="max-w-[42ch] text-[8px] text-default-400 font-bold italic uppercase opacity-50">
                        Improductivos; ilustrativ para, por todas mas mayores reals
                    </p>
                </div>
                <span className="text-[8px] font-bold text-default-400">cite: 27</span>
            </div>

            <div className="mt-4 min-h-0 w-full overflow-y-auto overflow-x-hidden rounded-2xl">
                <div className="w-full min-w-0">
                    <Chart 
                        options={{
                            ...heatmapOptions,
                            chart: {
                                ...heatmapOptions.chart,
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

            <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-default-400">Leyenda</span>
                <div className="flex items-center gap-2 rounded-full bg-danger/10 px-2 py-1">
                    <div className="size-2 rounded-full bg-danger" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-danger">Bajo</span>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-warning/10 px-2 py-1">
                    <div className="size-2 rounded-full bg-warning" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-warning">Medio</span>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-success/10 px-2 py-1">
                    <div className="size-2 rounded-full bg-success" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-success">Alto</span>
                </div>
            </div>
        </div>
    );
}

"use client";

import { Card, CardBody, CardHeader, Divider, Button } from "@heroui/react";
import dynamic from "next/dynamic";
import { useMemo } from "react";
import { ChevronRightIcon, CalendarDaysIcon } from "@heroicons/react/24/outline";

// dynamic import for apexcharts to avoid SSR window is not defined error
const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

export function FinanzasCuentasPorCobrar() {
    const pieSeries = [121, 52, 15]; // Pendientes, Abonados, Vencidos
    const pieOptions: any = {
        chart: {
            type: 'pie',
            foreColor: '#888',
            fontFamily: 'inherit',
            background: 'transparent',
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 800,
            }
        },
        labels: ['Pendientes', 'Abonados', 'Vencidos'],
        colors: ['#006FEE', '#17C964', '#F31260'],
        legend: {
            position: 'bottom',
            fontSize: '14px',
            itemMargin: {
                vertical: 5
            }
        },
        dataLabels: {
            enabled: true,
            dropShadow: {
                enabled: false
            }
        },
        stroke: {
            show: true,
            colors: ['var(--heroui-content1)'],
            width: 2
        },
        tooltip: {
            theme: 'dark'
        }
    };

    // Generar días del calendario de julio (asumiendo 1 = Miércoles)
    const days = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];
    const calendarCells = useMemo(() => {
        const cells = [];
        // padding for Dom, Lun, Mar (3 days)
        for(let i=0; i<3; i++) cells.push({ type: 'empty', num: 28 + i }); 
        for(let i=1; i<=31; i++) cells.push({ type: 'day', num: i });
        // filling end of week (31 days + 3 pad = 34, so 1 more to reach 35 days grid)
        for(let i=1; i<=1; i++) cells.push({ type: 'empty', num: i }); 
        return cells;
    }, []);

    return (
        <div className="flex flex-col xl:flex-row gap-6 animate-in fade-in duration-500 w-full mb-10">
            {/* Left Sidebar */}
            <Card className="w-full xl:w-[320px] shrink-0 border-none shadow-sm bg-content1 h-fit">
                <CardBody className="p-6 flex flex-col gap-6">
                    <div>
                        <h2 className="text-xl font-semibold text-foreground">Creditos totales</h2>
                        <p className="text-4xl font-bold text-success mt-2">$150,675.00</p>
                    </div>

                    <Divider />

                    <div className="flex justify-between items-center text-center">
                        <div className="flex-1">
                            <p className="text-xs text-default-500 uppercase tracking-wider font-medium">Periodo Promedio<br/>de cobro</p>
                            <p className="text-3xl font-bold mt-2 text-foreground">20</p>
                        </div>
                        <div className="w-px h-16 bg-divider"></div>
                        <div className="flex-1">
                            <p className="text-xs text-default-500 uppercase tracking-wider font-medium">Creditos<br/>General</p>
                            <p className="text-3xl font-bold mt-2 text-foreground">5</p>
                        </div>
                    </div>

                    <Divider />

                    <div className="w-full h-[300px] flex items-center justify-center -ml-2">
                        <ReactApexChart options={pieOptions} series={pieSeries} type="pie" width="300" height="300" />
                    </div>

                    <Button 
                        color="primary" 
                        variant="flat" 
                        className="w-full font-medium"
                        endContent={<ChevronRightIcon className="size-4" />}
                    >
                        Ver Creditos
                    </Button>
                </CardBody>
            </Card>

            {/* Right Pane */}
            <div className="flex-1 flex flex-col gap-4">
                <Card className="border-none shadow-sm bg-content1 flex-1">
                    <CardHeader className="flex flex-col items-center justify-center border-b border-divider p-4 bg-default-50/50">
                        <h3 className="text-lg font-bold tracking-widest text-foreground">JUL</h3>
                    </CardHeader>
                    <CardBody className="p-0 flex flex-col h-full">
                        {/* Calendar Header */}
                        <div className="grid grid-cols-7 border-b border-divider bg-default-50/50">
                            {days.map((d, i) => (
                                <div key={i} className="py-3 text-center text-xs font-semibold text-default-500 w-full">
                                    {d}
                                </div>
                            ))}
                        </div>
                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 flex-1 auto-rows-[minmax(120px,1fr)]">
                            {calendarCells.map((cell, idx) => {
                                const isDay1 = cell.type === 'day' && cell.num === 1;
                                return (
                                    <div 
                                        key={idx} 
                                        className={`p-3 border-r border-b border-divider relative transition-colors ${cell.type === 'empty' ? 'text-default-300 bg-content2/10' : 'text-foreground hover:bg-default-100/50'} ${isDay1 ? 'bg-primary/5 hover:bg-primary/10 shadow-inner' : ''}`}
                                    >
                                        <span className={`text-sm font-semibold ${cell.type === 'day' && ![0, 6].includes(idx % 7) ? 'text-foreground/80' : cell.type === 'empty' ? 'text-default-300/30' : 'text-danger-400/80'}`}>
                                            {cell.num}
                                        </span>
                                        
                                        {isDay1 && (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
                                                <span className="text-xl font-bold text-foreground tracking-tight whitespace-nowrap">$5,835.00</span>
                                                <CalendarDaysIcon className="size-5 text-default-400 mt-2 opacity-50" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </CardBody>
                </Card>
                
                {/* Note section */}
                <div className="bg-default-100/50 p-4 rounded-xl border border-default-200/50">
                  <p className="text-sm text-default-500 font-medium">
                    <span className="text-foreground font-semibold">Nota: </span>
                    En este calendario, solo se muestra el total de cobro de créditos por día.
                  </p>
                </div>
            </div>
        </div>
    );
}

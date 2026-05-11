"use client";

import { Card, CardBody, CardHeader, Select, SelectItem, Button } from "@heroui/react";
import dynamic from "next/dynamic";
import { 
    BanknotesIcon, 
    CurrencyDollarIcon, 
    TicketIcon, 
    ArrowTrendingUpIcon,
    ArrowUpIcon,
    ArrowDownIcon
} from "@heroicons/react/24/outline";

// dynamic import for apexcharts to avoid SSR window is not defined error
const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

export function FinanzasVentas() {
  
  // KPI Options
  const barChartOptions: any = {
      chart: { type: 'bar', toolbar: { show: false }, background: 'transparent' },
      colors: ['#006FEE'],
      plotOptions: {
          bar: { borderRadius: 4, distributed: true, dataLabels: { position: 'top' } }
      },
      dataLabels: { enabled: false },
      xaxis: {
          categories: ['Prod A', 'Prod B', 'Prod C', 'Prod D', 'Prod E'],
          labels: { style: { colors: '#888' } }
      },
      yaxis: { labels: { style: { colors: '#888' } } },
      grid: { borderColor: 'var(--heroui-divider)', strokeDashArray: 4 },
      tooltip: { theme: 'dark' },
      legend: { show: false }
  };

  const lineChartOptions: any = {
    chart: { type: 'line', toolbar: { show: false }, background: 'transparent' },
    colors: ['#006FEE'],
    stroke: { curve: 'straight', width: 2 },
    xaxis: {
        categories: ['1', '2', '3', '4', '5', '6', '7', '8'],
        labels: { style: { colors: '#888' } }
    },
    yaxis: { labels: { style: { colors: '#888' } } },
    grid: { borderColor: 'var(--heroui-divider)', strokeDashArray: 4 },
    tooltip: { theme: 'dark' }
  };

  const forecastChartOptions: any = {
    chart: { type: 'line', toolbar: { show: false }, background: 'transparent' },
    colors: ['#17C964'],
    stroke: { curve: 'smooth', width: 2, dashArray: [0, 5] },
    xaxis: {
        categories: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6'],
        labels: { style: { colors: '#888' } }
    },
    yaxis: { labels: { style: { colors: '#888' } } },
    grid: { borderColor: 'var(--heroui-divider)', strokeDashArray: 4 },
    tooltip: { theme: 'dark' }
  };

  const pieChartOptions: any = {
    chart: { type: 'donut', background: 'transparent' },
    colors: ['#006FEE', '#17C964', '#F31260', '#F5A524'],
    labels: ['Cat 1', 'Cat 2', 'Cat 3', 'Cat 4'],
    dataLabels: { enabled: false },
    legend: { show: false },
    stroke: { colors: ['var(--heroui-content1)'] },
    tooltip: { theme: 'dark' },
    plotOptions: { pie: { donut: { size: '65%' } } }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 w-full mb-10">
      
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center bg-content1 p-4 rounded-2xl shadow-sm border border-default-100">
          <Select label="Filtro Fecha" className="max-w-xs" size="sm" variant="faded">
              <SelectItem key="hoy">Hoy</SelectItem>
              <SelectItem key="semana">Esta semana</SelectItem>
              <SelectItem key="mes">Este mes</SelectItem>
          </Select>
          <Select label="Ruta" className="max-w-xs" size="sm" variant="faded">
              <SelectItem key="todas">Todas</SelectItem>
              <SelectItem key="r1">Ruta 1</SelectItem>
          </Select>
          <Select label="Categoría" className="max-w-xs" size="sm" variant="faded">
              <SelectItem key="todas">Todas</SelectItem>
          </Select>
          <Select label="Subcategoría" className="max-w-xs" size="sm" variant="faded">
              <SelectItem key="todas">Todas</SelectItem>
          </Select>
      </div>

      {/* KPIs Principales */}
      <div>
        <h3 className="text-sm font-bold text-default-500 uppercase tracking-wider mb-3">KPIs Principales</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="shadow-sm border border-default-100 bg-content1">
                <CardBody className="flex flex-row items-center gap-4 p-4">
                    <div className="p-3 bg-primary/10 rounded-xl text-primary">
                        <BanknotesIcon className="size-6" />
                    </div>
                    <div className="flex-1">
                        <p className="text-xs text-default-500 font-semibold uppercase">Ventas Totales</p>
                        <p className="text-sm font-medium text-default-400">Venta Diaria Promedio</p>
                    </div>
                    <div className="flex flex-col items-end">
                        <p className="text-xl font-bold">$124K</p>
                        <span className="text-xs text-success flex items-center font-bold">
                           <ArrowUpIcon className="size-3 mr-1"/> 12%
                        </span>
                    </div>
                </CardBody>
            </Card>

            <Card className="shadow-sm border border-default-100 bg-content1">
                <CardBody className="flex flex-row items-center gap-4 p-4">
                    <div className="p-3 bg-success/10 rounded-xl text-success">
                        <CurrencyDollarIcon className="size-6" />
                    </div>
                    <div className="flex-1">
                        <p className="text-xs text-default-500 font-semibold uppercase">Margen Bruto</p>
                        <p className="text-sm font-medium text-default-400">Utilidad Bruta</p>
                    </div>
                    <div className="flex flex-col items-end">
                        <p className="text-xl font-bold">34%</p>
                        <span className="text-xs text-success flex items-center font-bold">
                           <ArrowUpIcon className="size-3 mr-1"/> 4%
                        </span>
                    </div>
                </CardBody>
            </Card>

            <Card className="shadow-sm border border-default-100 bg-content1">
                <CardBody className="flex flex-row items-center gap-4 p-4">
                    <div className="p-3 bg-warning/10 rounded-xl text-warning">
                        <TicketIcon className="size-6" />
                    </div>
                    <div className="flex-1">
                        <p className="text-xs text-default-500 font-semibold uppercase">Ticket Promedio</p>
                    </div>
                    <div className="flex flex-col items-end">
                        <p className="text-xl font-bold">$450</p>
                        <span className="text-xs text-danger flex items-center font-bold">
                           <ArrowDownIcon className="size-3 mr-1"/> 2%
                        </span>
                    </div>
                </CardBody>
            </Card>

            <Card className="shadow-sm border border-default-100 bg-content1">
                <CardBody className="flex flex-row items-center gap-4 p-4">
                    <div className="p-3 bg-secondary/10 rounded-xl text-secondary">
                        <ArrowTrendingUpIcon className="size-6" />
                    </div>
                    <div className="flex-1">
                        <p className="text-xs text-default-500 font-semibold uppercase">Crecimiento Vs. Mes</p>
                    </div>
                    <div className="flex flex-col items-end">
                        <p className="text-xl font-bold">+18%</p>
                        <span className="text-xs text-success flex items-center font-bold">
                           <ArrowUpIcon className="size-3 mr-1"/> 5%
                        </span>
                    </div>
                </CardBody>
            </Card>
        </div>
      </div>

      {/* Top Movimiento */}
      <div>
        <h3 className="text-sm font-bold text-default-500 uppercase tracking-wider mb-3">Top Movimiento</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="shadow-sm border border-default-100 bg-content1">
                <CardHeader className="pb-0 pt-4 px-4">
                    <h4 className="text-sm font-bold uppercase">Top 5 Productos Más Vendidos</h4>
                </CardHeader>
                <CardBody>
                    <div className="h-[200px] w-full">
                        <ReactApexChart options={barChartOptions} series={[{data: [4.2, 3.1, 2.5, 2.2, 1.8]}]} type="bar" height="100%" />
                    </div>
                </CardBody>
            </Card>
            
            <Card className="shadow-sm border border-default-100 bg-content1">
                <CardHeader className="pb-0 pt-4 px-4">
                    <h4 className="text-sm font-bold uppercase">Top 5 Clientes que Más Facturan</h4>
                </CardHeader>
                <CardBody>
                    <div className="h-[200px] w-full">
                        <ReactApexChart options={barChartOptions} series={[{data: [4.5, 3.8, 3.2, 2.0, 1.2]}]} type="bar" height="100%" />
                    </div>
                </CardBody>
            </Card>

            <Card className="shadow-sm border border-default-100 bg-content1">
                <CardHeader className="pb-0 pt-4 px-4">
                    <h4 className="text-sm font-bold uppercase">Ventas por Categoría</h4>
                </CardHeader>
                <CardBody className="flex items-center justify-center">
                    <div className="h-[200px] w-full flex items-center justify-center">
                        <ReactApexChart options={pieChartOptions} series={[44, 55, 13, 33]} type="donut" height="200" />
                    </div>
                </CardBody>
            </Card>
        </div>
      </div>

      {/* Eficiencia y Análisis */}
      <div>
        <h3 className="text-sm font-bold text-default-500 uppercase tracking-wider mb-3">Eficiencia y Análisis</h3>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <Card className="shadow-sm border border-default-100 bg-content1">
                <CardHeader className="pb-0 pt-4 px-4">
                    <h4 className="text-sm font-bold uppercase">Tasa de Devoluciones</h4>
                </CardHeader>
                <CardBody>
                     <div className="h-[180px] w-full">
                        <ReactApexChart options={lineChartOptions} series={[{name: 'Devoluciones', data: [1, 5, 4, 5, 8, 6, 11]}]} type="line" height="100%" />
                    </div>
                </CardBody>
            </Card>

            <Card className="shadow-sm border border-default-100 bg-content1">
                <CardHeader className="pb-0 pt-4 px-4">
                    <h4 className="text-sm font-bold uppercase">Días de Cartera (CxC)</h4>
                </CardHeader>
                <CardBody>
                     <div className="h-[180px] w-full">
                        <ReactApexChart options={lineChartOptions} series={[{name: 'Días', data: [60, 45, 80, 40, 35, 35]}]} type="line" height="100%" />
                    </div>
                </CardBody>
            </Card>
            
            {/* Table placeholder from sketch */}
            <Card className="shadow-sm border border-default-100 bg-content1">
                <CardHeader className="pb-0 pt-4 px-4">
                    <h4 className="text-sm font-bold uppercase">Ventas por Proveedor</h4>
                </CardHeader>
                <CardBody className="pt-2">
                     <div className="w-full h-full flex flex-col gap-2">
                        <div className="flex justify-between bg-default-100 p-2 rounded-md"><span className="text-xs font-semibold">Proveedor 1</span><span className="text-xs font-bold">$12K</span></div>
                        <div className="flex justify-between border-b border-divider p-2"><span className="text-xs">Proveedor 2</span><span className="text-xs font-semibold">$8K</span></div>
                        <div className="flex justify-between border-b border-divider p-2"><span className="text-xs">Proveedor 3</span><span className="text-xs font-semibold">$5K</span></div>
                     </div>
                </CardBody>
            </Card>

            <Card className="shadow-sm border border-default-100 bg-content1">
                <CardHeader className="pb-0 pt-4 px-4">
                    <h4 className="text-sm font-bold uppercase">Ventas por Ruta</h4>
                </CardHeader>
                <CardBody>
                     <div className="h-[180px] w-full">
                        <ReactApexChart options={barChartOptions} series={[{data: [220, 180, 140]}]} type="bar" height="100%" />
                    </div>
                </CardBody>
            </Card>
        </div>
      </div>

      {/* Tendencias y Pronóstico */}
      <div>
        <h3 className="text-sm font-bold text-default-500 uppercase tracking-wider mb-3">Tendencias y Pronóstico</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
             <Card className="shadow-sm border border-default-100 bg-content1">
                <CardHeader className="pb-0 pt-4 px-4">
                    <h4 className="text-sm font-bold uppercase">Ventas Diarias (Histórico)</h4>
                </CardHeader>
                <CardBody>
                     <div className="h-[250px] w-full">
                        <ReactApexChart options={lineChartOptions} series={[{name: 'Ventas', data: [50, 120, 100, 110, 180, 110, 190, 140, 100, 160, 130, 220]}]} type="line" height="100%" />
                    </div>
                </CardBody>
            </Card>

             <Card className="shadow-sm border border-default-100 bg-content1">
                <CardHeader className="pb-0 pt-4 px-4">
                    <h4 className="text-sm font-bold uppercase">Pronóstico de Ventas (Forecast)</h4>
                </CardHeader>
                <CardBody>
                     <div className="h-[250px] w-full">
                        <ReactApexChart options={forecastChartOptions} series={[{name: 'Histórico', type: 'line', data: [200, 500, 600, 1200, 800, null]}, {name: 'Pronóstico', type: 'line', data: [null, null, null, null, 800, 1500]}]} type="line" height="100%" />
                    </div>
                </CardBody>
            </Card>
        </div>
      </div>

    </div>
  );
}

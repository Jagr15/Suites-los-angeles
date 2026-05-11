"use client";

import { Card, CardBody, CardHeader, Divider, Select, SelectItem } from "@heroui/react";
import dynamic from "next/dynamic";

// dynamic import for apexcharts to avoid SSR error
const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

export function FinanzasPresupuestos() {
  
  // -- Options for P&L Waterfall (using standard bar with colored ranges for ease)
  const waterfallOptions: any = {
    chart: { type: 'bar', toolbar: { show: false }, background: 'transparent' },
    plotOptions: { 
      bar: { 
        colors: { ranges: [{ from: -100000, to: -1, color: '#F31260' }, { from: 0, to: 100000, color: '#17C964' }] },
        dataLabels: { position: 'top' }
      } 
    },
    dataLabels: { enabled: true, formatter: (val: number) => Math.abs(val) > 1000 ? `${(val/1000).toFixed(0)}K` : val, style: { fontSize: '9px', colors: ['#fff'] }, offsetY: -15 },
    stroke: { width: 1, colors: ['var(--heroui-content1)'] },
    xaxis: { categories: ['Ventas', 'Costo Vts', 'Margen', 'Gasolina', 'Gastos Op', 'Otros', 'EBITDA'], labels: { style: { colors: '#888', fontSize: '9px' }, rotate: -45 } },
    yaxis: { labels: { style: { colors: '#888', fontSize: '9px' } } },
    grid: { borderColor: 'var(--heroui-divider)', strokeDashArray: 4 },
    tooltip: { theme: 'dark' }
  };
  const waterfallSeries = [{ name: 'Monto', data: [35000, -15000, 20000, -5000, -8000, -2000, 5000] }];

  // -- Options for Balance General (Stacked Bar)
  const balanceOptions: any = {
    chart: { type: 'bar', stacked: true, toolbar: { show: false }, background: 'transparent' },
    colors: ['#006FEE', '#F31260', '#17C964'], 
    plotOptions: { bar: { borderRadius: 2, columnWidth: '50%' } },
    dataLabels: { enabled: false },
    stroke: { width: 1, colors: ['var(--heroui-content1)'] },
    xaxis: { categories: ['Activos', 'Pasivos', 'Capital'], labels: { style: { colors: '#888' } } },
    yaxis: { labels: { style: { colors: '#888', fontSize: '10px' } } },
    grid: { borderColor: 'var(--heroui-divider)', strokeDashArray: 4 },
    legend: { show: true, position: 'top', markers: { radius: 2 }, fontSize: '10px', labels: { colors: '#888' } },
    tooltip: { theme: 'dark' }
  };
  const balanceSeries = [
    { name: 'Activos', data: [1200000, 0, 0] },
    { name: 'Pasivos', data: [0, 800000, 0] },
    { name: 'Capital', data: [0, 0, 400000] }
  ];

  // -- Options for Cash Flow (Mixed: Stacked Column + Line)
  const cashFlowOptions: any = {
    chart: { type: 'line', stacked: true, toolbar: { show: false }, background: 'transparent' },
    colors: ['#17C964', '#F31260', '#F5A524'],
    stroke: { width: [0, 0, 2], curve: 'smooth' },
    plotOptions: { bar: { columnWidth: '60%' } },
    dataLabels: { enabled: false },
    xaxis: { categories: ['Oct', 'Nov', 'Dic', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep'], labels: { style: { colors: '#888', fontSize: '9px' } } },
    yaxis: { labels: { style: { colors: '#888', fontSize: '9px' } } },
    grid: { borderColor: 'var(--heroui-divider)', strokeDashArray: 4 },
    legend: { show: false },
    tooltip: { theme: 'dark' },
    annotations: {
      points: [{ x: 'Ago', y: -10000, marker: { size: 6, fillColor: '#F31260' }, label: { text: "Déficit", style: { background: '#F31260', color: '#fff' } } }]
    }
  };
  const cashFlowSeries = [
    { name: 'Entradas', type: 'column', data: [30000, 32000, 34000, 35000, 40000, 38000, 42000, 36000, 31000, 28000, 25000, 30000] },
    { name: 'Salidas', type: 'column', data: [-20000, -22000, -21000, -23000, -28000, -25000, -30000, -28000, -29000, -32000, -35000, -28000] },
    { name: 'Saldo Final', type: 'line', data: [10000, 10000, 13000, 12000, 12000, 13000, 12000, 8000, 2000, -4000, -10000, 2000] }
  ];

  // -- Options for Gauges (RadialBar)
  const getGaugeOptions = (color: string, label: string): any => ({
    chart: { type: 'radialBar', background: 'transparent' },
    colors: [color],
    plotOptions: {
      radialBar: {
        startAngle: -90,
        endAngle: 90,
        hollow: { size: '60%' },
        dataLabels: {
          name: { show: true, offsetY: -10, color: '#888', fontSize: '10px', formatter: () => label },
          value: { offsetY: -2, fontSize: '14px', color: '#fff', formatter: (val: any) => val + "%" }
        }
      }
    },
    stroke: { lineCap: 'round' }
  });

  // -- Options for Analysis of Variance
  const varianceOptions: any = {
    chart: { type: 'bar', toolbar: { show: false }, background: 'transparent' },
    plotOptions: { bar: { colors: { ranges: [{ from: -100000, to: -1, color: '#F31260' }, { from: 0, to: 100000, color: '#006FEE' }] }, columnWidth: '60%' } },
    dataLabels: { enabled: false },
    xaxis: { categories: ['Mayoreo', 'Rutas', 'Ctas Especiales', 'Marca X', 'Marca Y'], labels: { style: { colors: '#888', fontSize: '9px' } } },
    yaxis: { labels: { style: { colors: '#888', fontSize: '9px' } } },
    grid: { borderColor: 'var(--heroui-divider)', strokeDashArray: 4 },
    tooltip: { theme: 'dark' }
  };
  const varianceSeries = [{ name: 'Varianza', data: [120000, 80000, 50000, -20000, -100000] }];

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-500 w-full mb-10 overflow-x-auto min-w-[1200px]">
      
      {/* Top Filters Bar */}
      <Card className="shadow-sm border border-default-100 bg-content1">
        <CardHeader className="py-2 px-4 flex flex-col items-start gap-2 border-b border-divider">
          <p className="text-xs text-warning uppercase font-bold tracking-widest">Barra de Filtros Globales</p>
          <h2 className="text-lg font-bold uppercase tracking-wider text-foreground">Presupuestos Estratégicos 2026</h2>
        </CardHeader>
        <CardBody className="p-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select label="Tiempo" size="sm" variant="faded" defaultSelectedKeys={["oct"]}>
               <SelectItem key="oct">Mes (Octubre 2026)</SelectItem>
               <SelectItem key="all">Año Completo (2026)</SelectItem>
            </Select>
            <Select label="División (Rutas, Estados)" size="sm" variant="faded" defaultSelectedKeys={["r4"]}>
               <SelectItem key="r4">Jalisco &gt; Municipio &gt; Ruta 4</SelectItem>
            </Select>
            <Select label="Clientes" size="sm" variant="faded" defaultSelectedKeys={["mayoreo"]}>
               <SelectItem key="mayoreo">Mayoreo</SelectItem>
               <SelectItem key="especiales">Cuentas Especiales</SelectItem>
            </Select>
            <Select label="Productos" size="sm" variant="faded" defaultSelectedKeys={["todas"]}>
               <SelectItem key="todas">Todas las Categorías</SelectItem>
               <SelectItem key="marcaX">Marca X</SelectItem>
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Main 4-Column Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        
        {/* COL 1: P&L RESULTADOS */}
        <div className="flex flex-col gap-4">
          <Card className="shadow-sm border border-default-100 bg-content1 h-full">
            <CardHeader className="bg-default-50/50 p-3 border-b border-divider">
              <h3 className="font-bold uppercase text-xs">P&L (Resultados) Proyectado</h3>
            </CardHeader>
            <CardBody className="p-3 flex flex-col gap-4">
              <div className="w-full overflow-x-auto">
                <table className="w-full text-[10px] text-left border-collapse">
                  <thead>
                    <tr className="border-b border-divider/50">
                      <th className="p-1 font-semibold text-default-500">Drill-down</th>
                      <th className="p-1 font-semibold text-default-500 text-right">Presupuesto</th>
                      <th className="p-1 font-semibold text-default-500 text-right">Venta Real</th>
                      <th className="p-1 font-semibold text-default-500 text-right">Var %</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-divider/50"><td className="p-1 font-semibold">Ventas Totales</td><td className="p-1 text-right">2,384,000</td><td className="p-1 text-right">3,200,000</td><td className="p-1 text-right text-success font-bold">45.0%</td></tr>
                    <tr className="border-b border-divider/50"><td className="p-1 font-semibold">Costo Ventas</td><td className="p-1 text-right">(350,000)</td><td className="p-1 text-right text-danger">(129,595)</td><td className="p-1 text-right text-danger font-bold">-14.2%</td></tr>
                    <tr className="border-b border-divider/50"><td className="p-1 font-bold">Margen Bruto</td><td className="p-1 text-right font-bold">99,897</td><td className="p-1 text-right font-bold">35,595</td><td className="p-1 text-right text-success font-bold">24.5%</td></tr>
                    <tr className="border-b border-divider/50"><td className="p-1 font-semibold text-default-500 pl-4">Gasolina</td><td className="p-1 text-right text-default-500">1,560,000</td><td className="p-1 text-right text-danger">1,570,300</td><td className="p-1 text-right text-danger font-bold">-11.2%</td></tr>
                    <tr className="border-b border-divider/50"><td className="p-1 font-bold mt-2">EBITDA</td><td className="p-1 text-right font-bold mt-2">18,984</td><td className="p-1 text-right font-bold mt-2">9,095</td><td className="p-1 text-right text-success font-bold mt-2">26.5%</td></tr>
                  </tbody>
                </table>
              </div>
              <div className="h-[200px] w-full mt-auto">
                 <ReactApexChart options={waterfallOptions} series={waterfallSeries} type="bar" height="100%" />
              </div>
            </CardBody>
          </Card>
        </div>

        {/* COL 2: BALANCE GENERAL PROYECTADO */}
        <div className="flex flex-col gap-4">
          <Card className="shadow-sm border border-default-100 bg-content1 h-full">
            <CardHeader className="bg-default-50/50 p-3 border-b border-divider">
              <h3 className="font-bold uppercase text-xs">Balance General Proyectado</h3>
            </CardHeader>
            <CardBody className="p-3 flex flex-col gap-4">
              <div className="h-[220px] w-full">
                 <ReactApexChart options={balanceOptions} series={balanceSeries} type="bar" height="100%" />
              </div>
              <div className="w-full overflow-x-auto mt-auto">
                <table className="w-full text-[10px] text-left border-collapse">
                  <thead>
                    <tr className="border-b border-divider/50">
                      <th className="p-1 font-semibold text-default-500">Summario</th>
                      <th className="p-1 font-semibold text-default-500 text-right">Valores</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-divider/50"><td className="p-1 font-semibold">Activos (Caja, Inventario)</td><td className="p-1 text-right">553,200</td></tr>
                    <tr className="border-b border-divider/50"><td className="p-1 font-semibold">Pasivos (Proveedores)</td><td className="p-1 text-right">1,135,200</td></tr>
                    <tr className="border-b border-divider/50"><td className="p-1 font-semibold">Capital</td><td className="p-1 text-right">155,000</td></tr>
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* COL 3: FLUJO DE EFECTIVO PROYECTADO */}
        <div className="flex flex-col gap-4 flex-1 xl:col-span-1">
          <Card className="shadow-sm border border-default-100 bg-content1 h-full">
            <CardHeader className="bg-default-50/50 p-3 border-b border-divider flex-col items-start">
              <h3 className="font-bold uppercase text-xs">Flujo de Efectivo Proyectado</h3>
              <p className="text-[10px] text-default-500 font-semibold mt-1">
                 <span className="text-success mr-2">■ Entradas</span>
                 <span className="text-danger mr-2">■ Salidas</span>
                 <span className="text-warning">▬ Saldo Final</span>
              </p>
            </CardHeader>
            <CardBody className="p-3 flex flex-col gap-4">
               <div className="h-[200px] w-full">
                 <ReactApexChart options={cashFlowOptions} series={cashFlowSeries} type="line" height="100%" />
              </div>
               <div className="w-full overflow-x-auto mt-auto">
                <table className="w-full text-[9px] text-left border-collapse">
                  <thead>
                    <tr className="border-b border-divider/50">
                      <th className="p-1 font-semibold text-default-500">Componente</th>
                      <th className="p-1 text-right text-default-500">Octubre</th>
                      <th className="p-1 text-right text-default-500">Noviembre</th>
                      <th className="p-1 text-right text-default-500">Var %</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-divider/50"><td className="p-1 font-semibold">Entradas</td><td className="p-1 text-right text-success">221,200</td><td className="p-1 text-right text-success">301,500</td><td className="p-1 text-right text-success font-bold">2.5%</td></tr>
                    <tr className="border-b border-divider/50"><td className="p-1 font-semibold">Salidas Operativas</td><td className="p-1 text-right text-danger">(15,500)</td><td className="p-1 text-right text-danger">(5,000)</td><td className="p-1 text-right text-danger font-bold">-1.2%</td></tr>
                    <tr className="border-b border-divider/50"><td className="p-1 font-bold">SALDO FINAL</td><td className="p-1 text-right font-bold">206,000</td><td className="p-1 text-right font-bold">296,500</td><td className="p-1 text-right text-success font-bold">5.2%</td></tr>
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* COL 4: VISUALIZACIÓN Y ALERTAS & VARIANZA */}
        <div className="flex flex-col gap-4 flex-1">
          <Card className="shadow-sm border border-warning/50 bg-content1 flex-1 min-h-[160px]">
            <CardHeader className="bg-default-50/50 p-2 border-b border-divider">
              <h3 className="font-bold uppercase text-[10px]">Indicadores Clave vs Meta</h3>
            </CardHeader>
            <CardBody className="p-1 grid grid-cols-2 gap-0 items-center justify-center">
               <div className="h-[80px] -mt-4"><ReactApexChart options={getGaugeOptions('#17C964', 'Meta Ventas')} series={[20]} type="radialBar" height="140" /></div>
               <div className="h-[80px] -mt-4"><ReactApexChart options={getGaugeOptions('#17C964', 'Margen Bruto')} series={[80]} type="radialBar" height="140" /></div>
               <div className="h-[80px] -mt-4"><ReactApexChart options={getGaugeOptions('#17C964', 'EBITDA %')} series={[20]} type="radialBar" height="140" /></div>
               <div className="h-[80px] -mt-4 relative">
                  <ReactApexChart options={getGaugeOptions('#F31260', 'Caja Final')} series={[30]} type="radialBar" height="140" />
                  <span className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[8px] text-default-400">Histórico 2025</span>
               </div>
            </CardBody>
          </Card>

          <Card className="shadow-sm border border-default-100 bg-content1 flex-1">
            <CardHeader className="bg-default-50/50 p-2 border-b border-divider">
              <h3 className="font-bold uppercase text-[10px]">Análisis de Variación (Varianza)</h3>
            </CardHeader>
            <CardBody className="p-2">
               <div className="h-[200px] w-full">
                 <ReactApexChart options={varianceOptions} series={varianceSeries} type="bar" height="100%" />
              </div>
            </CardBody>
          </Card>
        </div>

      </div>
    </div>
  );
}

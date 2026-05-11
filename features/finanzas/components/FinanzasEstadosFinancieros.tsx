"use client";

import { Card, CardBody, CardHeader, Divider } from "@heroui/react";
import dynamic from "next/dynamic";
import { useMemo } from "react";

// dynamic import for apexcharts to avoid SSR window is not defined error
const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

export function FinanzasEstadosFinancieros() {
  
  // ------------- ESTADO DE RESULTADOS -------------
  const desgloseOptions: any = {
    chart: { type: 'bar', stacked: true, toolbar: { show: false }, background: 'transparent' },
    colors: ['#006FEE', '#A1CAED', '#D4E4F7', '#11181C'], // Ventas, Costo, Gastos, Utilidad
    plotOptions: { bar: { borderRadius: 2, dataLabels: { position: 'top' } } },
    dataLabels: { enabled: false },
    stroke: { width: 1, colors: ['var(--heroui-content1)'] },
    xaxis: {
        categories: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6'],
        labels: { style: { colors: '#888' } }
    },
    yaxis: { labels: { style: { colors: '#888' } } },
    grid: { borderColor: 'var(--heroui-divider)', strokeDashArray: 4 },
    legend: { position: 'top', horizontalAlign: 'left', markers: { radius: 2 }, fontSize: '10px' },
    tooltip: { theme: 'dark' }
  };

  const desgloseSeries = [
    { name: 'Ventas', data: [30, 22, 75, 85, 85, 85] },
    { name: 'Costo de Ventas', data: [15, 10, 30, 35, 35, 40] },
    { name: 'Gastos Operativos', data: [10, 8, 20, 25, 20, 25] },
    { name: 'Utilidad Neta', data: [5, 4, 25, 25, 30, 20] }
  ];

  const repartoGastoOptions: any = {
    chart: { type: 'pie', background: 'transparent' },
    colors: ['#006FEE', '#17C964', '#F31260', '#F5A524'],
    labels: ['Nómina', 'Gasolina Rutas', 'Suministros', 'Marketing', 'Otros'],
    legend: { show: false },
    dataLabels: { enabled: true, formatter: function (val: any, opts: any) { return opts.w.globals.labels[opts.seriesIndex] }, style: { fontSize: '10px', colors: ['#fff'] }, dropShadow: { enabled: false } },
    stroke: { show: true, colors: ['var(--heroui-content1)'], width: 1 },
    tooltip: { theme: 'dark' }
  };

  // ------------- FLUJO DE EFECTIVO -------------
  const evolucionCajaOptions: any = {
    chart: { type: 'area', toolbar: { show: false }, background: 'transparent' },
    colors: ['#17C964'],
    stroke: { curve: 'straight', width: 2 },
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05, stops: [0, 90, 100] } },
    xaxis: {
        categories: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6', 'Sem 7', 'Sem 8'],
        labels: { style: { colors: '#888' } }
    },
    yaxis: { labels: { style: { colors: '#888' } } },
    grid: { borderColor: 'var(--heroui-divider)', strokeDashArray: 4 },
    dataLabels: { enabled: false },
    tooltip: { theme: 'dark' }
  };

  const flujoNetoOptions: any = {
     chart: { type: 'bar', toolbar: { show: false }, background: 'transparent' },
     plotOptions: { bar: { colors: { ranges: [{ from: -1000, to: -1, color: '#F31260' }, { from: 0, to: 1000, color: '#17C964' }] }, columnWidth: '80%' } },
     dataLabels: { enabled: false },
     stroke: { width: 1, colors: ['var(--heroui-content1)'] },
     yaxis: { labels: { style: { colors: '#888' } } },
     xaxis: {
         categories: ['Entradas', 'Cobros', 'Salidas', 'Pago', 'Pago', 'Pago', 'Pago'],
         labels: { style: { colors: '#888', fontSize: '9px' } }
     },
     grid: { borderColor: 'var(--heroui-divider)', strokeDashArray: 4 },
     tooltip: { theme: 'dark' }
  };

  // Waterfall logic approx using standard bar with positive/negative values
  const flujoNetoSeries = [{
    name: 'Flujo',
    data: [210, 30, -42, 63, -10, -32, -13, 73] // simplified representation
  }];


  // ------------- BALANCE GENERAL -------------
  const balanceOptions: any = {
    chart: { type: 'bar', stacked: true, toolbar: { show: false }, background: 'transparent' },
    colors: ['#E4E4E7', '#A1CAED', '#006FEE'], 
    plotOptions: { bar: { borderRadius: 0, dataLabels: { position: 'center' } } },
    dataLabels: { enabled: true, formatter: function (val: any) { return "$" + val + "K" }, style: { fontSize: '10px', colors: ['#11181C', '#11181C', '#fff'] } },
    stroke: { width: 1, colors: ['var(--heroui-content1)'] },
    xaxis: {
        categories: ['Activos', 'Pasivos+Capital'],
        labels: { style: { colors: '#888' } }
    },
    yaxis: { labels: { style: { colors: '#888' } } },
    grid: { borderColor: 'var(--heroui-divider)', strokeDashArray: 4 },
    legend: { show: false },
    tooltip: { theme: 'dark' }
  };
  
  // Fake stacked data to resemble the sketch
  const balanceSeries = [
    { name: 'Nivel 3', data: [70, 70] }, // Efectivo / Cuentas por Pagar
    { name: 'Nivel 2', data: [40, 40] }, // Cuentas por Cobrar / Deuda Largo Plazo
    { name: 'Nivel 1', data: [100, 100] } // Inventario / Capital Dueños
  ];

  // Treemap for Composición de activos
  const treemapOptions: any = {
      legend: { show: false },
      chart: { type: 'treemap', toolbar: { show: false }, background: 'transparent' },
      colors: ['#006FEE', '#17C964', '#F5A524'],
      stroke: { show: true, width: 2, colors: ['var(--heroui-content1)'] },
      plotOptions: {
          treemap: {
              enableShades: true,
              shadeIntensity: 0.5,
              reverseNegativeShade: true,
              colorScale: {
                  ranges: [
                      { from: -6, to: 0, color: '#CD363A' },
                      { from: 0.001, to: 6, color: '#006FEE' }
                  ]
              }
          }
      },
      tooltip: { theme: 'dark' },
      dataLabels: { style: { fontSize: '10px' } }
  };

  const treemapSeries = [
    {
      data: [
        { x: 'CxC (Ruta 4)', y: 120 },
        { x: 'Efectivo', y: 80 },
        { x: 'Inventario (Cat A)', y: 90 },
        { x: 'Inventario (Cat B)', y: 40 },
        { x: 'Efectivo (Cat B)', y: 30 },
        { x: 'Otros', y: 15 }
      ]
    }
  ];

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 w-full mb-10">
      
      {/* Container for the 3 main columns */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* COLUMN 1: ESTADO DE RESULTADOS */}
          <div className="flex flex-col gap-4">
              <h2 className="text-lg font-bold uppercase tracking-wider text-foreground">Estado de Resultados</h2>
              
              <Card className="shadow-sm border border-default-100 bg-content1 flex-1 cursor-pointer hover:border-primary/50 transition-colors">
                  <CardHeader className="pb-0 pt-4 px-4 flex-col items-start gap-1">
                      <h4 className="text-sm font-bold uppercase">Desglose de Ventas y Costos</h4>
                      <p className="text-xs text-default-500">Al darle clic se mostrará el detalle (Excel)</p>
                  </CardHeader>
                  <CardBody>
                      <div className="h-[250px] w-full">
                          <ReactApexChart options={desgloseOptions} series={desgloseSeries} type="bar" height="100%" />
                      </div>
                  </CardBody>
              </Card>

              <Card className="shadow-sm border border-default-100 bg-content1 cursor-pointer hover:border-primary/50 transition-colors">
                  <CardHeader className="pb-0 pt-4 px-4">
                      <h4 className="text-sm font-bold uppercase">Reparto del Gasto (Junio)</h4>
                  </CardHeader>
                  <CardBody className="flex items-center justify-center">
                      <div className="h-[200px] w-full">
                          <ReactApexChart options={repartoGastoOptions} series={[35, 25, 15, 15, 10]} type="pie" height="100%" />
                      </div>
                  </CardBody>
              </Card>
          </div>

          {/* COLUMN 2: FLUJO DE EFECTIVO */}
          <div className="flex flex-col gap-4">
              <h2 className="text-lg font-bold uppercase tracking-wider text-foreground">Flujo de Efectivo</h2>
              
              <Card className="shadow-sm border border-default-100 bg-content1 flex-1 cursor-pointer hover:border-primary/50 transition-colors">
                  <CardHeader className="pb-0 pt-4 px-4 flex-col items-start gap-1">
                      <h4 className="text-sm font-bold uppercase">Evolución del Saldo de Caja (Semanal)</h4>
                      <p className="text-xs text-default-500">Evolución del saldo de caja</p>
                  </CardHeader>
                  <CardBody>
                      <div className="h-[230px] w-full">
                          <ReactApexChart options={evolucionCajaOptions} series={[{name: 'Saldo', data: [100, 230, 240, 350, 400, 420, 510, 600]}]} type="area" height="100%" />
                      </div>
                  </CardBody>
              </Card>

              <Card className="shadow-sm border border-default-100 bg-content1 cursor-pointer hover:border-primary/50 transition-colors">
                  <CardHeader className="pb-0 pt-4 px-4">
                      <h4 className="text-sm font-bold uppercase">Flujo Neto de Caja (Junio)</h4>
                  </CardHeader>
                  <CardBody>
                      <div className="h-[200px] w-full">
                          <ReactApexChart options={flujoNetoOptions} series={flujoNetoSeries} type="bar" height="100%" />
                      </div>
                  </CardBody>
              </Card>
          </div>

          {/* COLUMN 3: BALANCE GENERAL */}
          <div className="flex flex-col gap-4">
              <h2 className="text-lg font-bold uppercase tracking-wider text-foreground">Balance General</h2>
              
              <Card className="shadow-sm border border-default-100 bg-content1 flex-1 cursor-pointer hover:border-primary/50 transition-colors">
                  <CardHeader className="pb-0 pt-4 px-4 flex-col items-start gap-1">
                      <h4 className="text-sm font-bold uppercase">Activos vs. Pasivos y Capital</h4>
                      <p className="text-xs text-default-500">Total del cuadrante: $210K</p>
                  </CardHeader>
                  <CardBody>
                      <div className="h-[230px] w-full">
                          <ReactApexChart options={balanceOptions} series={balanceSeries} type="bar" height="100%" />
                      </div>
                  </CardBody>
              </Card>

              <Card className="shadow-sm border border-default-100 bg-content1 cursor-pointer hover:border-primary/50 transition-colors">
                  <CardHeader className="pb-0 pt-4 px-4">
                      <h4 className="text-sm font-bold uppercase">Composición de Activos (Junio)</h4>
                  </CardHeader>
                  <CardBody>
                      <div className="h-[200px] w-full">
                         <ReactApexChart options={treemapOptions} series={treemapSeries} type="treemap" height="100%" />
                      </div>
                  </CardBody>
              </Card>
          </div>

      </div>

    </div>
  );
}

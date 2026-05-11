"use client";

import { Card, CardBody, CardHeader, Divider, Progress, Button } from "@heroui/react";
import dynamic from "next/dynamic";
import { ArrowDownTrayIcon, ShareIcon, BookmarkIcon } from "@heroicons/react/24/outline";

// dynamic import for apexcharts to avoid SSR error
const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

export function FinanzasAnalisisFinanciero() {
  
  // -- Heatmap Options --
  const heatmapOptions: any = {
    chart: { type: 'heatmap', toolbar: { show: false }, background: 'transparent' },
    plotOptions: {
      heatmap: {
        shadeIntensity: 0.5,
        colorScale: {
          ranges: [
            { from: -10, to: -0.1, color: '#F31260', name: 'Negativo' },
            { from: 0, to: 0, color: '#A1CAED', name: 'Neutro' },
            { from: 0.1, to: 10, color: '#17C964', name: 'Positivo' }
          ]
        }
      }
    },
    dataLabels: { enabled: true, style: { fontSize: '10px' } },
    xaxis: { categories: ['Días Inventario', 'ROA', 'Margen Neto', 'Razón Endeudamiento'], labels: { style: { colors: '#888', fontSize: '9px' } } },
    yaxis: { labels: { style: { colors: '#888', fontSize: '10px' } } },
    grid: { padding: { right: 20 } },
    tooltip: { theme: 'dark' },
    legend: { show: false }
  };

  const heatmapSeries = [
    { name: 'Días Inventario', data: [{x: 'Días Inventario', y: 1.34}, {x: 'ROA', y: 2.20}, {x: 'Margen Neto', y: 1.50}, {x: 'Razón Endeudamiento', y: 1.50}] },
    { name: 'Ventas Ruta', data: [{x: 'Días Inventario', y: 3.21}, {x: 'ROA', y: 0.39}, {x: 'Margen Neto', y: 4.90}, {x: 'Razón Endeudamiento', y: -1.30}] },
    { name: 'Margen Neto', data: [{x: 'Días Inventario', y: 4.91}, {x: 'ROA', y: 2.11}, {x: 'Margen Neto', y: 3.66}, {x: 'Razón Endeudamiento', y: 4.90}] },
    { name: 'Margen Bruto', data: [{x: 'Días Inventario', y: 4.91}, {x: 'ROA', y: 4.91}, {x: 'Margen Neto', y: 0.35}, {x: 'Razón Endeudamiento', y: 3.57}] },
    { name: 'Ciclo Operativo', data: [{x: 'Días Inventario', y: 4.91}, {x: 'ROA', y: 0.29}, {x: 'Margen Neto', y: 0.23}, {x: 'Razón Endeudamiento', y: -0.25}] },
  ];

  // -- Scatter Plot Options --
  const scatterOptions: any = {
    chart: { type: 'scatter', zoom: { enabled: false }, toolbar: { show: false }, background: 'transparent' },
    colors: ['#000000', '#A1CAED'],
    xaxis: { tickAmount: 5, labels: { formatter: (val: string) => parseFloat(val).toFixed(0) + '%', style: { colors: '#888' } } },
    yaxis: { tickAmount: 5, labels: { style: { colors: '#888' } } },
    markers: { size: 5 },
    legend: { position: 'top', fontSize: '10px' },
    grid: { borderColor: 'var(--heroui-divider)', strokeDashArray: 4 },
    tooltip: { theme: 'dark' }
  };

  const scatterSeries = [
    { name: 'Escenario Base', data: [[5, 10], [6, 15], [8, 12], [10, 20], [12, 18], [15, 25], [18, 22]] },
    { name: 'Escenario Optimizado', data: [[7, 18], [9, 22], [11, 28], [13, 30], [16, 35], [20, 40], [22, 45]] }
  ];

  // -- Waterfall Bar Options --
  // Simplified using a normal bar with ranges to mimic waterfall styling for ReactApexCharts
  const waterfallOptions: any = {
    chart: { type: 'bar', toolbar: { show: false }, background: 'transparent' },
    plotOptions: { bar: { colors: { ranges: [{ from: -10000, to: -1, color: '#F31260' }, { from: 0, to: 10000, color: '#17C964' }] } } },
    dataLabels: { enabled: false },
    stroke: { width: 1, colors: ['var(--heroui-content1)'] },
    xaxis: { categories: ['Ventas', 'Costos', 'Inventario', 'EBITDA', 'Deuda', 'Otros', 'Total'], labels: { style: { colors: '#888', fontSize: '8px' }, rotate: -45 } },
    yaxis: { labels: { style: { colors: '#888', fontSize: '10px' }, formatter: (val: number) => `$${val/1000}K` } },
    grid: { borderColor: 'var(--heroui-divider)', strokeDashArray: 4 },
    tooltip: { theme: 'dark' }
  };

  const waterfallSeries = [{
    name: 'Impacto',
    data: [5000, -1000, -500, -800, -600, -400, 1700]
  }];

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-500 w-full mb-10 overflow-x-auto">
      
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 min-w-[1200px]">
        
        {/* COL 1: RAZONES FINANCIERAS */}
        <div className="flex flex-col gap-4">
          <Card className="shadow-sm border border-default-100 bg-content1 text-xs">
            <CardHeader className="bg-primary text-white p-2">
              <h3 className="font-bold uppercase">Distribuidora Los Angeles</h3>
            </CardHeader>
            <CardBody className="p-3 flex flex-col gap-4">
              
              {/* LIQUIDEZ */}
              <div>
                <h4 className="font-bold uppercase mb-2 border-b border-divider pb-1">Liquidez</h4>
                <div className="flex justify-between items-center py-1"><span>Razón Circulante</span><div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-danger"></span><span className="font-semibold bg-danger/10 px-1">1.14</span></div></div>
                <div className="flex justify-between items-center py-1"><span>Prueba Ácida</span><div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-danger"></span><span className="font-semibold bg-danger/10 px-1">0.29</span></div></div>
                <div className="flex justify-between items-center py-1"><span>Razón de Efectivo</span><div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-success"></span><span className="font-semibold bg-success/10 px-1">0.14</span></div></div>
                <div className="flex justify-between items-center py-1"><span>Capital de Trabajo</span><span className="font-semibold text-success">$2,000.00</span></div>
              </div>

              {/* EFICIENCIA */}
              <div>
                <h4 className="font-bold uppercase mb-2 border-b border-divider pb-1">Eficiencia (Actividad)</h4>
                <div className="flex justify-between items-center py-1"><span>Rotación de Inventarios</span><span className="font-semibold bg-default-200 px-1">DIV/0!</span></div>
                <div className="flex justify-between items-center py-1"><span>Días de Inventario</span><span className="font-semibold bg-default-200 px-1">DIV/0!</span></div>
                <div className="flex justify-between items-center py-1"><span>Rot. Cuentas por Cobrar</span><span className="font-semibold bg-default-200 px-1">DIV/0!</span></div>
                <div className="flex justify-between items-center py-1"><span>Días Cuentas Cobrar</span><span className="font-semibold bg-default-200 px-1">DIV/0!</span></div>
              </div>

               {/* SOLVENCIA */}
               <div>
                <h4 className="font-bold uppercase mb-2 border-b border-divider pb-1">Solvencia (Endeudamiento)</h4>
                <div className="flex justify-between items-center py-1"><span>Razón de Endeudamiento</span><span className="font-semibold">42.24%</span></div>
                <div className="flex justify-between items-center py-1"><span>Deuda a Capital</span><span className="font-semibold">0.73</span></div>
                <div className="flex justify-between items-center py-1"><span>Multiplicador de Capital</span><span className="font-semibold">1.78</span></div>
                <div className="flex justify-between items-center py-1"><span>Cobertura de Intereses</span><span className="font-semibold">5.00</span></div>
              </div>

              {/* RENTABILIDAD */}
              <div>
                <h4 className="font-bold uppercase mb-2 border-b border-divider pb-1">Rentabilidad</h4>
                <div className="flex justify-between items-center py-1"><span>Margen Bruto</span><span className="font-semibold">22.00%</span></div>
                <div className="flex justify-between items-center py-1"><span>Margen Operativo</span><span className="font-semibold">10.00%</span></div>
                <div className="flex justify-between items-center py-1"><span>Margen Neto</span><span className="font-semibold">4.90%</span></div>
                <div className="flex justify-between items-center py-1"><span>ROA</span><span className="font-semibold">2.11%</span></div>
              </div>

            </CardBody>
          </Card>
        </div>

        {/* COL 2: SUPUESTOS OPERATIVOS MODULARES (Sliders) */}
        <div className="flex flex-col gap-4">
          <Card className="shadow-sm border border-default-100 bg-content1">
            <CardHeader className="bg-default-100 p-2">
              <h3 className="font-bold uppercase text-xs">Supuestos Operativos Modulares</h3>
            </CardHeader>
            <CardBody className="p-4 flex flex-col gap-5">
              <h4 className="font-bold uppercase text-xs">Análisis de Sensibilidad</h4>
              
              <Progress label="Cambio Volumen Ventas (+/- 20%)" size="sm" value={75} valueLabel="+10%" className="max-w-md" classNames={{ label: "text-xs", value: "text-xs font-semibold" }} />
              <Progress label="Cambio Precio Promedio (+/- 10%)" size="sm" value={60} valueLabel="+2%" className="max-w-md" classNames={{ label: "text-xs", value: "text-xs font-semibold" }} />
              <Progress label="Cambio Margen Operativo (+/- 3%)" size="sm" value={80} valueLabel="+1%" className="max-w-md" classNames={{ label: "text-xs", value: "text-xs font-semibold" }} />
              <Progress label="Cambio Costo Adquisición (+/- 5%)" size="sm" value={40} valueLabel="-1%" className="max-w-md" color="danger" classNames={{ label: "text-xs", value: "text-xs font-semibold" }} />
              <Progress label="Cambio Días Inventario (+/- 10 días)" size="sm" value={30} valueLabel="-4 días" className="max-w-md" color="danger" classNames={{ label: "text-xs", value: "text-xs font-semibold" }} />
              <Progress label="Cambio Días CxC (+/- 5 días)" size="sm" value={50} valueLabel="0 días" className="max-w-md" color="warning" classNames={{ label: "text-xs", value: "text-xs font-semibold" }} />
              <Progress label="Cambio Apalancamiento (+/- 10%)" size="sm" value={65} valueLabel="+3%" className="max-w-md" classNames={{ label: "text-xs", value: "text-xs font-semibold" }} />
              
              <Divider />
              <h4 className="font-bold uppercase text-xs">Detector de Sensibilidad Multivariable</h4>
              <Progress label="Cambio Margen EBITDA Target" size="sm" value={70} valueLabel="+0.5%" className="max-w-md" classNames={{ label: "text-xs", value: "text-xs font-semibold" }} />
              <Progress label="Cambio Tasa Interés (+/- 1%)" size="sm" value={20} valueLabel="-0.5%" className="max-w-md" color="danger" classNames={{ label: "text-xs", value: "text-xs font-semibold" }} />

            </CardBody>
          </Card>
        </div>

        {/* COL 3: DETECTOR DE SENSIBILIDAD MULTIVARIABLE (Heatmap & Table) */}
        <div className="flex flex-col gap-4 xl:col-span-1">
          <Card className="shadow-sm border border-default-100 bg-content1 flex-1">
            <CardHeader className="bg-default-100 p-2 border-b border-divider">
              <h3 className="font-bold uppercase text-xs">Detector de Sensibilidad Multivariable</h3>
            </CardHeader>
            <CardBody className="p-2 flex flex-col">
              <div className="h-[280px] w-full">
                <ReactApexChart options={heatmapOptions} series={heatmapSeries} type="heatmap" height="100%" />
              </div>

              <Divider className="my-2"/>

              <h4 className="font-bold uppercase text-xs mb-2">Determinador de Escenarios</h4>
              <div className="w-full overflow-x-auto">
                <table className="w-full text-[9px] text-left border-collapse">
                  <thead>
                    <tr className="bg-default-100">
                      <th className="p-1 border"></th>
                      <th className="p-1 border">Base</th>
                      <th className="p-1 border text-success">Optimista</th>
                      <th className="p-1 border text-danger">Pesimista</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td className="p-1 border font-semibold">ROE</td><td className="p-1 border">22.00%</td><td className="p-1 border text-success">22.00%</td><td className="p-1 border text-danger">10.00%</td></tr>
                    <tr><td className="p-1 border font-semibold">ROA</td><td className="p-1 border">10.00%</td><td className="p-1 border text-success">10.00%</td><td className="p-1 border text-danger">10.00%</td></tr>
                    <tr><td className="p-1 border font-semibold">Margen Neto</td><td className="p-1 border">2.11%</td><td className="p-1 border text-success">3.66%</td><td className="p-1 border text-danger">4.90%</td></tr>
                    <tr><td className="p-1 border font-semibold">Prueba Ácida</td><td className="p-1 border">4.91%</td><td className="p-1 border text-success">3.60%</td><td className="p-1 border text-danger">4.90%</td></tr>
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* COL 4: GRAFICO, IMPACTO DE FLUJO & BOTONES EXPORTACION */}
        <div className="flex flex-col gap-4">
          
          <Card className="shadow-sm border border-default-100 bg-content1">
            <CardHeader className="bg-default-100 p-2">
              <h3 className="font-bold uppercase text-xs">Gráfico de Sensibilidad</h3>
            </CardHeader>
            <CardBody className="p-2">
              <div className="h-[180px] w-full">
                <ReactApexChart options={scatterOptions} series={scatterSeries} type="scatter" height="100%" />
              </div>
            </CardBody>
          </Card>

          <Card className="shadow-sm border border-default-100 bg-content1 flex-1">
            <CardHeader className="bg-default-100 p-2">
              <h3 className="font-bold uppercase text-xs truncate">Impacto en Flujo de Caja</h3>
            </CardHeader>
            <CardBody className="p-2">
              <div className="h-[200px] w-full">
                <ReactApexChart options={waterfallOptions} series={waterfallSeries} type="bar" height="100%" />
              </div>
            </CardBody>
          </Card>

          {/* Botones de acción inferior derecha */}
          <Card className="shadow-sm border border-default-100 bg-content1">
             <CardHeader className="bg-default-100 p-2 border-b border-divider">
              <h3 className="font-bold uppercase text-xs">Área de Colaboración</h3>
            </CardHeader>
            <CardBody className="p-3 flex flex-row flex-wrap gap-2 justify-center">
              <Button size="sm" color="default" variant="solid" className="bg-black text-white" startContent={<BookmarkIcon className="size-4"/>}>
                Guardar
              </Button>
              <Button size="sm" variant="flat" startContent={<ArrowDownTrayIcon className="size-4"/>}>
                Exportar
              </Button>
              <Button size="sm" variant="flat" startContent={<ShareIcon className="size-4"/>}>
                Compartir
              </Button>
            </CardBody>
          </Card>

        </div>

      </div>
    </div>
  );
}

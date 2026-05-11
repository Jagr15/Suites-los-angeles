"use client";

import dynamic from "next/dynamic";
import { Card, CardHeader, CardBody } from "@heroui/react";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const statisticsOptions: ApexCharts.ApexOptions = {
  chart: { type: "area", toolbar: { show: false }, zoom: { enabled: false }, stacked: false },
  colors: ["#17C964", "#006FEE"],
  fill: {
    type: "gradient",
    gradient: { shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0.1 },
  },
  dataLabels: { enabled: false },
  stroke: { curve: "smooth", width: 2 },
  xaxis: {
    categories: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct"],
    labels: { style: { colors: "#888" } },
  },
  yaxis: {
    labels: { style: { colors: "#888" } },
    min: 80,
    max: 200,
    tickAmount: 4,
  },
  grid: { borderColor: "#333", strokeDashArray: 4 },
  tooltip: { theme: "dark" },
  legend: {
    position: "top",
    horizontalAlign: "right",
    labels: { colors: "#888" },
  },
};

const statisticsSeries = [
  { name: "Ventas", data: [90, 105, 120, 115, 130, 145, 140, 160, 175, 190] },
  { name: "Meta", data: [80, 95, 110, 125, 120, 135, 150, 155, 170, 185] },
];

const barOptions: ApexCharts.ApexOptions = {
  chart: { type: "bar", toolbar: { show: false }, stacked: false },
  colors: ["#F5A524"],
  plotOptions: { bar: { borderRadius: 4, columnWidth: "60%" } },
  dataLabels: { enabled: false },
  xaxis: {
    categories: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
    labels: { style: { colors: "#888" } },
  },
  yaxis: { labels: { style: { colors: "#888" } } },
  grid: { borderColor: "#333", strokeDashArray: 4 },
  tooltip: { theme: "dark" },
  legend: { show: false },
};

const barSeries = [{ name: "Ventas", data: [420, 380, 510, 470, 540, 610, 490] }];

export function DashboardCharts() {
  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-foreground">Estadísticas</h2>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardBody className="p-4">
            <p className="mb-2 text-sm font-medium text-default-500">Ventas vs Meta (mensual)</p>
            <div className="h-[320px] w-full">
              <Chart
                options={statisticsOptions}
                series={statisticsSeries}
                type="area"
                height={320}
                width="100%"
              />
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-4">
            <p className="mb-2 text-sm font-medium text-default-500">Ventas por día (esta semana)</p>
            <div className="h-[320px] w-full">
              <Chart options={barOptions} series={barSeries} type="bar" height={320} width="100%" />
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

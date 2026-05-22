"use client";

import { 
    ClientesFilters, 
    ClientesSimulador, 
    ClientesGeographicAnalysis, 
    ClientesProfitabilityHeatmap, 
    ClientesABCProfitability, 
    ClientesOperationalEfficiency 
} from "../components";
import { Card } from "@heroui/react";

export function ClientesPage() {
    return (
        <div className="flex flex-col min-h-screen bg-default-50/30">
            <div className="flex-1 flex flex-col items-center">
                <main className="w-full max-w-[1920px] p-4 md:p-5 space-y-4">
                    {/* Filter Bar */}
                    <ClientesFilters />

                    {/* Simulator Row */}
                    <ClientesSimulador />

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
                        {/* Column 1: Geographic Analysis */}
                        <div className="xl:col-span-5 space-y-4 animate-in slide-in-from-left-4 duration-500">
                           <Card className="border-none shadow-sm bg-content1 p-4 h-full">
                                <ClientesGeographicAnalysis />
                           </Card>
                        </div>

                        {/* Column 2: Profitability Heatmap */}
                        <div className="xl:col-span-3 h-full animate-in fade-in duration-500 delay-150">
                            <ClientesProfitabilityHeatmap />
                        </div>

                        {/* Column 3: ABC Ranking & Operational Efficiency */}
                        <div className="xl:col-span-4 space-y-4 animate-in slide-in-from-right-4 duration-500 delay-300">
                           <Card className="border-none shadow-sm bg-content1 p-4">
                                <ClientesABCProfitability />
                           </Card>
                           <Card className="border-none shadow-sm bg-content1 p-4 h-[340px]">
                                <ClientesOperationalEfficiency />
                           </Card>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

"use client";

import { 
    ClientesSimulador, 
    ClientesGeographicAnalysis, 
    ClientesProfitabilityHeatmap, 
    ClientesABCProfitability, 
    ClientesOperationalEfficiency 
} from "../components";
import { Card } from "@heroui/react";

export function ClientesPage() {
    return (
        <div className="flex min-h-screen flex-col bg-default-50/30 overflow-x-clip">
            <div className="flex-1 flex flex-col items-center">
                <main className="w-full max-w-[1920px] min-w-0 space-y-4 p-4 md:p-5">
                    {/* Simulator Row */}
                    <ClientesSimulador />

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 gap-4 items-start lg:grid-cols-2 xl:grid-cols-12">
                        {/* Column 1: Geographic Analysis */}
                        <div className="xl:col-span-5 space-y-4 animate-in slide-in-from-left-4 duration-500 min-w-0">
                           <Card className="border-none shadow-sm bg-content1 p-4 h-full overflow-hidden">
                                <ClientesGeographicAnalysis />
                           </Card>
                        </div>

                        {/* Column 2: Profitability Heatmap */}
                        <div className="xl:col-span-4 h-full min-w-0 animate-in fade-in duration-500 delay-150">
                            <ClientesProfitabilityHeatmap />
                        </div>

                        {/* Column 3: ABC Ranking & Operational Efficiency */}
                        <div className="xl:col-span-3 space-y-4 min-w-0 animate-in slide-in-from-right-4 duration-500 delay-300">
                           <Card className="border-none shadow-sm bg-content1 p-4 overflow-hidden">
                                <ClientesABCProfitability />
                           </Card>
                           <Card className="border-none shadow-sm bg-content1 p-4 min-h-[420px] lg:min-h-[460px] overflow-hidden">
                                <ClientesOperationalEfficiency />
                           </Card>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

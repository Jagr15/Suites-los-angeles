"use client";

import { Card, CardBody, CardHeader, Divider, Button } from "@heroui/react";
import { useMemo } from "react";
import { ChevronRightIcon, CalendarDaysIcon, DocumentTextIcon } from "@heroicons/react/24/outline";

export function FinanzasCuentasPorPagar() {
  // Calendar data
  const days = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];
  
  // Create 5 weeks (35 days) starting from today
  const calendarCells = useMemo(() => {
    const today = new Date();
    // Setting today to a Sunday to match the 5 weeks view easily, or just generating 35 consecutive days
    const currentDayOfWeek = today.getDay(); // 0 is Sunday
    
    // Find the previous Sunday to start the calendar (or current day if it's Sunday)
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - currentDayOfWeek);
    
    const cells = [];
    for (let i = 0; i < 35; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      let events: { client: string; amount: string; }[] = [];
      const isToday = date.toDateString() === today.toDateString();
      
      // Mock some events based on the sketch
      if (i === 4) { // Thursday
        events = [{ client: "Dimoflo", amount: "$8,288.99" }];
      } else if (i === 8) { // Monday next week
        events = [{ client: "MDMX", amount: "$18,326.05" }];
      } else if (i === 18) { // Thursday week 3
        events = [{ client: "Huggos", amount: "$559.83" }];
      }
      
      cells.push({
        num: date.getDate(),
        isToday,
        isPast: date < new Date(new Date().setHours(0,0,0,0)),
        events,
      });
    }
    return cells;
  }, []);

  const pendientes = [
    { text: "Huggos Revisar compra" },
    { text: "Pamego Revisar pago" },
    { text: "Deposito a MDMX" },
    { text: "Pagos atrasados", isDanger: true }
  ];

  return (
    <div className="flex flex-col xl:flex-row gap-6 animate-in fade-in duration-500 w-full mb-10">
      {/* Left Sidebar */}
      <Card className="w-full xl:w-[320px] shrink-0 border-none shadow-sm bg-content1 h-fit">
        <CardBody className="p-6 flex flex-col gap-6">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Deuda total</h2>
            <p className="text-4xl font-bold text-danger mt-2">$296,705.05</p>
          </div>

          <Divider />

          <div className="flex flex-col items-center text-center">
            <p className="text-sm text-default-500 font-medium">Periodo promedio de pago</p>
            <p className="text-5xl font-bold mt-2 text-foreground">28</p>
          </div>

          <Divider />

          <div>
             <h3 className="text-lg font-semibold text-foreground mb-4">Pendientes</h3>
             <ul className="space-y-4">
               {pendientes.map((p, idx) => (
                 <li key={idx} className="flex items-start gap-3">
                   <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${p.isDanger ? 'bg-danger' : 'bg-primary'}`} />
                   <span className={`text-base font-medium ${p.isDanger ? 'text-danger/90' : 'text-default-700'}`}>{p.text}</span>
                 </li>
               ))}
             </ul>
          </div>

          <div className="mt-4">
            <Button 
                color="default" 
                variant="flat" 
                className="w-full font-medium justify-between px-4 bg-default-100/50 hover:bg-default-200/50"
                startContent={<DocumentTextIcon className="size-5" />}
                endContent={<ChevronRightIcon className="size-4" />}
            >
                Ver Estados de Cuenta
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Right Pane */}
      <div className="flex-1 flex flex-col gap-4">
        <Card className="border-none shadow-sm bg-content1 flex-1">
          <CardHeader className="flex flex-col gap-1 items-center justify-center border-b border-divider p-4 bg-default-50/50">
            <h3 className="text-lg font-bold tracking-widest uppercase">Próximos 35 Días</h3>
            <p className="text-xs text-default-500 text-center max-w-md">En el calendario de pagos se mostrarán 5 semanas próximas, para revisar los pagos programados.</p>
          </CardHeader>
          <CardBody className="p-0">
            {/* Calendar Header */}
            <div className="grid grid-cols-7 border-b border-divider bg-default-50/50">
              {days.map((d, i) => (
                <div key={i} className="py-3 text-center text-xs font-semibold text-default-500 w-full">
                  {d}
                </div>
              ))}
            </div>
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 auto-rows-[minmax(120px,auto)]">
              {calendarCells.map((cell, idx) => {
                return (
                  <div 
                    key={idx} 
                    className={`p-3 border-r border-b border-divider relative transition-colors bg-transparent hover:bg-default-100/50 flex flex-col gap-1 ${cell.isPast ? 'bg-default-50/30 opacity-70' : ''}`}
                  >
                    <span className={`text-sm font-semibold max-w-fit rounded-full px-1.5 py-0.5 ${cell.isToday ? 'bg-primary text-primary-foreground' : cell.isPast ? 'text-default-400' : 'text-foreground/80'}`}>
                      {cell.isToday ? "Hoy" : cell.num}
                    </span>
                    
                    <div className="mt-2 flex flex-col gap-2">
                      {cell.events.map((evt, eIdx) => (
                        <div key={eIdx} className="flex flex-col bg-warning/10 border border-warning/20 rounded-md p-1.5 shadow-sm">
                          <span className="text-xs font-medium text-foreground truncate">{evt.client}</span>
                          <span className="text-sm font-bold text-foreground">{evt.amount}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

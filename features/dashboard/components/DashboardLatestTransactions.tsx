"use client";

import { Card, CardBody, Avatar } from "@heroui/react";

const transactions = [
  { name: "Jose Pérez", amount: "4,500 USD", date: "9/20/2024", src: "https://i.pravatar.cc/150?u=a042581f4e29026704d" },
  { name: "Andrea Sánchez", amount: "4,500 USD", date: "9/20/2024", src: "https://i.pravatar.cc/150?u=a04258114e29026302d" },
  { name: "Rubén García", amount: "1,500 USD", date: "2/20/2024", src: "https://i.pravatar.cc/150?u=a042581f4e29026024d" },
  { name: "Perla Martínez", amount: "200 USD", date: "1/15/2024", src: "https://i.pravatar.cc/150?u=a042581f4e29027024d" },
  { name: "Miguel López", amount: "3,200 USD", date: "1/10/2024", src: "https://i.pravatar.cc/150?u=a042581f4e29027022d" },
];

export function DashboardLatestTransactions() {
  return (
    <Card>
      <CardBody className="p-0">
        <div className="border-b border-default-200 px-5 py-4">
          <h3 className="text-lg font-semibold">Últimas transacciones</h3>
        </div>
        <ul className="divide-y divide-default-200">
          {transactions.map((tx) => (
            <li key={tx.name + tx.date} className="flex items-center gap-4 px-5 py-4">
              <Avatar src={tx.src} name={tx.name} size="sm" className="shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">{tx.name}</p>
                <p className="text-tiny text-default-500">{tx.date}</p>
              </div>
              <p className="shrink-0 font-semibold text-foreground">{tx.amount}</p>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}

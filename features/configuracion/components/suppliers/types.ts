export interface BankAccount {
  bankName: string;
  accountNumber: string;
  clabe: string;
}

export interface Contact {
  name: string;
  phone: string;
  email: string;
}

export interface Supplier {
  id: string;
  businessName: string;
  rfc: string;
  creditDays: number;
  contacts: Contact[];
  bankAccounts: BankAccount[];
}

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: "1",
    businessName: "Lácteos del Valle S.A.",
    rfc: "LAV800101XXX",
    creditDays: 30,
    contacts: [
      {
        name: "Roberto Gómez",
        phone: "555-0001",
        email: "roberto.gomez@lacteos.com",
      }
    ],
    bankAccounts: [
      {
        bankName: "BBVA",
        accountNumber: "1234567890",
        clabe: "012345678901234567",
      }
    ],
  },
  {
    id: "2",
    businessName: "Distribuidora Nacional de Bebidas",
    rfc: "DNB900505XXX",
    creditDays: 15,
    contacts: [
      {
        name: "Alicia Torres",
        phone: "555-0002",
        email: "atorres@distribebidas.mx",
      }
    ],
    bankAccounts: [
      {
        bankName: "Banamex",
        accountNumber: "0987654321",
        clabe: "098765432109876543",
      }
    ],
  },
];

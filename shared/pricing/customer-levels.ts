export type ClientType = "commercial" | "wholesaler" | "retail" | "QA";

export type FixedCustomerLevelCode = "BRONCE" | "PLATA" | "ORO" | "DIAMANTE" | "ULTRA";

export type FixedCustomerLevelConfig = {
  code: FixedCustomerLevelCode;
  name: string;
  monthlyLimit?: number;
};

export const FIXED_CUSTOMER_LEVELS: FixedCustomerLevelConfig[] = [
  { code: "BRONCE", name: "Bronce", monthlyLimit: 1000 },
  { code: "PLATA", name: "Plata", monthlyLimit: 5000 },
  { code: "ORO", name: "Oro", monthlyLimit: 10000 },
  { code: "DIAMANTE", name: "Diamante", monthlyLimit: 20000 },
  { code: "ULTRA", name: "Ultra" },
];

export const FIXED_CUSTOMER_LEVEL_LABELS: Record<FixedCustomerLevelCode, string> = {
  BRONCE: "Bronce",
  PLATA: "Plata",
  ORO: "Oro",
  DIAMANTE: "Diamante",
  ULTRA: "Ultra",
};

export const FIXED_CUSTOMER_LEVEL_ORDER = FIXED_CUSTOMER_LEVELS.map((level) => level.code);

export function normalizeMonthlyLimit(value?: number | null): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  return Math.max(0, value);
}

export function getAllowedCustomerLevelCodes(clientType: ClientType): FixedCustomerLevelCode[] {
  switch (clientType) {
    case "wholesaler":
      return [...FIXED_CUSTOMER_LEVEL_ORDER];
    case "retail":
      return ["BRONCE"];
    case "QA":
    case "commercial":
    default:
      return ["BRONCE", "PLATA", "ORO", "DIAMANTE"];
  }
}

export function getDefaultCustomerLevelCode(clientType: ClientType): FixedCustomerLevelCode {
  return clientType === "retail" ? "BRONCE" : "BRONCE";
}

export function getCustomerLevelForMonthlyAmount(args: {
  clientType: ClientType;
  monthlyAmount: number;
  levels?: Array<{ code: string; monthlyLimit?: number | null; minMonthlyAmount?: number | null }>;
}): FixedCustomerLevelCode {
  const clientType = args.clientType;
  if (clientType === "retail") return "BRONCE";

  const amount = Number.isFinite(args.monthlyAmount) ? Math.max(0, args.monthlyAmount) : 0;
  const monthlyLimitByCode = new Map(
    (args.levels || []).map((level) => [
      String(level.code).trim().toUpperCase(),
      normalizeMonthlyLimit(level.monthlyLimit ?? level.minMonthlyAmount),
    ])
  );

  const bronze = monthlyLimitByCode.get("BRONCE") ?? FIXED_CUSTOMER_LEVELS[0].monthlyLimit ?? 0;
  const silver = monthlyLimitByCode.get("PLATA") ?? FIXED_CUSTOMER_LEVELS[1].monthlyLimit ?? bronze;
  const gold = monthlyLimitByCode.get("ORO") ?? FIXED_CUSTOMER_LEVELS[2].monthlyLimit ?? silver;
  const diamond = monthlyLimitByCode.get("DIAMANTE") ?? FIXED_CUSTOMER_LEVELS[3].monthlyLimit ?? gold;

  if (amount <= bronze) return "BRONCE";
  if (amount <= silver) return "PLATA";
  if (amount <= gold) return "ORO";
  if (amount <= diamond) return "DIAMANTE";
  return clientType === "wholesaler" ? "ULTRA" : "DIAMANTE";
}

export function isFixedCustomerLevelCode(code: string): code is FixedCustomerLevelCode {
  return (FIXED_CUSTOMER_LEVEL_ORDER as string[]).includes(String(code).trim().toUpperCase());
}

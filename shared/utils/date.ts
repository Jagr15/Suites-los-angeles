export function parseLocalDate(dateInput?: string | Date | null): Date | null {
  if (!dateInput) return null;
  if (dateInput instanceof Date) {
    if (Number.isNaN(dateInput.getTime())) return null;
    return new Date(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate());
  }

  const raw = String(dateInput).trim();
  if (!raw) return null;

  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]) - 1;
    const day = Number(isoMatch[3]);
    const d = new Date(year, month, day);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

export function addCreditDaysLocal(dateInput: string | Date, creditDays: number): Date | null {
  const base = parseLocalDate(dateInput);
  if (!base) return null;
  const next = new Date(base);
  next.setDate(next.getDate() + Math.max(0, Math.floor(Number(creditDays) || 0)));
  return next;
}

export function formatShortDate(dateInput: string | Date, options?: { includeYear?: boolean }): string {
  const date = parseLocalDate(dateInput);
  if (!date) return "";
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "long",
    ...(options?.includeYear ? { year: "numeric" } : {}),
  }).format(date);
}

export function paymentStatusLabel(dateInput: string | Date, nowDate?: Date): string {
  const dueDate = parseLocalDate(dateInput);
  const now = parseLocalDate(nowDate || new Date());
  if (!dueDate || !now) return "";
  const diffMs = dueDate.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "vencido";
  if (diffDays === 0) return "vence hoy";
  if (diffDays === 1) return "vence en 1 día";
  return `vence en ${diffDays} días`;
}


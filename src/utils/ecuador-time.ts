import { format, toZonedTime } from "date-fns-tz";

export function getEcuadorDate(date?: Date): Date {
  const now = date || new Date();
  const zonedDate = toZonedTime(now, "America/Guayaquil");
  return zonedDate;
}

export function ecDayBounds(dateYYYYMMDD: string) {
  const startLocal = `${dateYYYYMMDD}T00:00:00.000`;
  const endLocal = `${dateYYYYMMDD}T23:59:59.999`;
  return {
    startEcDay: startLocal,
    endEcDay: endLocal,
  };
}

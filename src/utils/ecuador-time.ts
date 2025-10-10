import { toZonedTime } from "date-fns-tz";

export function getEcuadorDate(date?: Date | string): Date {
  const now = date ? new Date(date) : new Date();
  const zonedDate = toZonedTime(now, "America/Guayaquil");

  return zonedDate;
}

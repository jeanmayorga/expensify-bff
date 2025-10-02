import { format, toZonedTime } from "date-fns-tz";

export function getEcuadorDate(date?: Date): Date {
  const now = date || new Date();
  const zonedDate = toZonedTime(now, "America/Guayaquil");
  return zonedDate;
}

export const constants = {
  SUBSCRIPTION_EXPIRATION_TIME: 1440 as const, // minutes; 1440 equals 1 day
  SUBSCRIPTION_MINUTES_TO_RENEW: 120 as const, // minutes; 120 equals 2 hours
  SUBSCRIPTION_CRON_SCHEDULE: "2 * * * *" as const, // every 2 hours
};

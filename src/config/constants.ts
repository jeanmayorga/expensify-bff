export const constants = {
  SUBSCRIPTION_EXPIRATION_TIME: 45 as const, // minutes; 1440 equals 1 day
  SUBSCRIPTION_MINUTES_TO_RENEW: 15 as const, // minutes
  SUBSCRIPTION_CRON_SCHEDULE: "*/15 * * * *" as const, // every 15 minutes
};

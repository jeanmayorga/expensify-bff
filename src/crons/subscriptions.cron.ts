import { OutlookService } from "@/services/outlook.service";
import { RedisService } from "@/services/redis.service";
import { SubscriptionsService } from "@/services/subscriptions.service";
import { getErrorMessage } from "@/utils/handle-error";
import cron from "node-cron";
import { env } from "@/config/env";
import { constants } from "@/config/constants";

class SubscriptionsCron {
  private redisService = new RedisService();
  private outlookService = new OutlookService();

  async renewSubscription() {
    try {
      console.log("SubscriptionsCron->renewSubscription()");

      const homeAccountId = await this.redisService.get("homeAccountId");
      if (!homeAccountId) throw new Error("No account available.");

      const accessToken = await this.outlookService.getAccessToken(
        homeAccountId
      );
      if (!accessToken) throw new Error("No access token available.");

      const subscriptionsService = new SubscriptionsService(accessToken);
      await subscriptionsService.renewSubscription();
    } catch (error) {
      const message = getErrorMessage(error);
      console.error("SubscriptionsCron->renewSubscription()->", message);
    }
  }
}

export function startSubscriptionsCron() {
  cron.schedule(constants.SUBSCRIPTION_CRON_SCHEDULE, () => {
    const subscriptionsCron = new SubscriptionsCron();
    subscriptionsCron.renewSubscription();
  });
  console.log(
    `🔄 subscription renewal cron started (schedule: ${constants.SUBSCRIPTION_CRON_SCHEDULE})`
  );
}

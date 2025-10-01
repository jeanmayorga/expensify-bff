import { Request, Response, Router } from "express";
import { OutlookService } from "../services/outlook.service";
import { handleError } from "@/utils/handle-error";
import { SubscriptionsService } from "@/services/subscriptions.service";
import { RedisService } from "@/services/redis.service";
import { env } from "@/config/env";

const router = Router();

router.get("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("controller->/GET outlook/login");
    const outlookService = new OutlookService();
    const url = await outlookService.getAuthUrl();
    res.redirect(url);
  } catch (error) {
    handleError({
      error,
      res,
      controller: "outlook",
      message: "Failed to get login URL",
    });
  }
});

router.get("/redirect", async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("controller->/GET outlook/redirect");
    const code = req.query.code as string;
    const outlookService = new OutlookService();
    const acquire = await outlookService.getAcquireTokenByCode(code);

    const accessTokenTmp = acquire.accessToken;
    const homeAccountId = acquire.homeAccountId;
    if (!homeAccountId) throw new Error("No home account ID found.");

    const redisService = new RedisService();
    await redisService.set("homeAccountId", homeAccountId);

    const subscriptionService = new SubscriptionsService(accessTokenTmp);
    const subscriptions = await subscriptionService.getSubscriptions();

    const NOTIFICATION_URL = `${env.DOMAIN}/subscriptions/webhook`;
    const subscription = subscriptions.find(
      (subscription) => subscription.notificationUrl === NOTIFICATION_URL
    );
    const subscriptionId = subscription?.id;
    if (!subscriptionId) {
      console.log(`🔄 subscription not found for ${NOTIFICATION_URL}`);
    }

    await subscriptionService.renewSubscription(subscriptionId);

    res.json({ homeAccountId, accessTokenTmp, subscriptions });
  } catch (error) {
    handleError({
      error,
      res,
      controller: "outlook",
      message: "Failed to get redirect URL",
    });
  }
});

export default router;

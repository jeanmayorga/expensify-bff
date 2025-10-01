import { Request, Response, Router } from "express";
import { OutlookService } from "../services/outlook.service";
import { handleError } from "@/utils/handle-error";
import { SubscriptionsService } from "@/services/subscriptions.service";
import { RedisService } from "@/services/redis.service";

const router = Router();

router.get("/me", async (req: Request, res: Response): Promise<void> => {
  console.log("controller->/GET outlook/me");
  const redisService = new RedisService();
  const token = await redisService.get("accessToken");
  if (!token) throw new Error("No token available.");

  const data = await OutlookService.getGraphMe(token);
  res.json({ data });
});

router.get("/", async (req: Request, res: Response): Promise<void> => {
  console.log("controller->/GET outlook/");
  // const status = OutlookService.getStatus();
  // res.json({ status });
});

router.get("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("controller->/GET outlook/login");
    const url = await OutlookService.getAuthUrl();
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
    const accessToken = await OutlookService.getTokenByCode(code);

    const redisService = new RedisService();
    await redisService.set("accessToken", accessToken);

    const subscriptionService = new SubscriptionsService(accessToken);
    const subscriptions = await subscriptionService.getSubscriptions();

    if (subscriptions.length === 0) {
      await subscriptionService.createSubscription();
      const subscriptions = await subscriptionService.getSubscriptions();
      res.json({ subscriptions });
      return;
    }

    subscriptionService.startRenewSubscription();
    res.json({ subscriptions, accessToken });
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

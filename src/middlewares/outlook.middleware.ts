import { OutlookService } from "@/services/outlook.service";
import { RedisService } from "@/services/redis.service";
import { getErrorMessage } from "@/utils/handle-error";
import { NextFunction, Request, Response } from "express";

export interface OutlookRequest extends Request {
  accessToken?: string;
}

export const outlookMiddleware = async (
  req: OutlookRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log("middleware->outlookMiddleware");

    const redisService = new RedisService();
    const homeAccountId = await redisService.get("homeAccountId");
    if (!homeAccountId) throw new Error("No account available.");

    const outlookService = new OutlookService();
    const accessToken = await outlookService.getAccessToken(homeAccountId);
    if (!accessToken) throw new Error("No access token available.");

    req.accessToken = accessToken;
    next();
  } catch (error: any) {
    const message = getErrorMessage(error);
    console.error("middleware->outlookMiddleware->error->", message);
    res.status(500).json({ error: message });
  }
};

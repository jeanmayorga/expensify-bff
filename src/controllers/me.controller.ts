import { Request, Response, Router } from "express";
import { handleError } from "@/utils/handle-error";
import { MeService } from "@/services/me.service";
import {
  outlookMiddleware,
  OutlookRequest,
} from "@/middlewares/outlook.middleware";

const router = Router();

router.get(
  "/me",
  outlookMiddleware,
  async (req: OutlookRequest, res: Response): Promise<void> => {
    try {
      console.log("controller->/GET me/");
      const accessToken = req.accessToken || "";

      const meService = new MeService(accessToken);
      const me = await meService.getMe();

      res.json({ data: me });
    } catch (error: any) {
      handleError({
        error,
        res,
        controller: "me",
        message: "Failed to get me",
      });
    }
  }
);

export default router;

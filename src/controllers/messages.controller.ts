import { Response, Router } from "express";
import { getErrorMessage } from "@/utils/handle-error";
import { MessagesService } from "@/services/messages.service";
import {
  outlookMiddleware,
  OutlookRequest,
} from "@/middlewares/outlook.middleware";

const router = Router();

router.get(
  "/:id",
  outlookMiddleware,
  async (req: OutlookRequest, res: Response): Promise<void> => {
    try {
      console.log("controller->/GET messages/:id");
      const id = req.params.id as string;
      const accessToken = req.accessToken || "";
      const messageService = new MessagesService(accessToken);
      const message = await messageService.getMessageById(id);
      if (!message) throw new Error("Message not found");

      res.json({ data: message });
    } catch (error) {
      const message = getErrorMessage(error);
      console.error("controller->/GET messages/:id->error", message);
      res.status(500).json({ data: null, error: "Failed to get message" });
    }
  }
);

export default router;

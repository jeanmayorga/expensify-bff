import { Response, Router } from "express";
import { getErrorMessage } from "@/utils/handle-error";
import { MessagesService } from "@/services/messages.service";
import {
  outlookMiddleware,
  OutlookRequest,
} from "@/middlewares/outlook.middleware";
import { OpenAIService } from "@/services/openai.service";
import { TransactionsService } from "@/services/transactions.service";

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

router.post(
  "/process",
  outlookMiddleware,
  async (req: OutlookRequest, res: Response): Promise<void> => {
    try {
      console.log("controller->/POST messages/process/:id");
      const id = req.body.id as string;
      const accessToken = req.accessToken || "";
      const messageService = new MessagesService(accessToken);
      const message = await messageService.getMessageById(id);
      if (!message) throw new Error("Message not found");

      const openaiService = new OpenAIService();
      const transactionGenerated = await openaiService.getTransactionFromEmail(
        message.body
      );
      if (!transactionGenerated) throw new Error("Transaction not found");

      const oldTransaction = await TransactionsService.getByMessageId(id);
      if (!oldTransaction) throw new Error("Transaction not found");

      const newTransaction = await TransactionsService.update(
        oldTransaction.id,
        {
          type: transactionGenerated.type,
          description: transactionGenerated.description,
          amount: transactionGenerated.amount,
          occurred_at: transactionGenerated.occurred_at,
          income_message_id: id,
          bank: transactionGenerated.bank,
        }
      );
      console.log("🤖 updatedTransaction saved ->", newTransaction?.id);

      res.json({ data: newTransaction });
    } catch (error) {
      const message = getErrorMessage(error);
      console.error("controller->/POST messages/process/:id->error", message);
      res.status(500).json({ data: null, error: "Failed to get message" });
    }
  }
);

export default router;

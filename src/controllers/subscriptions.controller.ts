import { Request, Response, Router } from "express";
import { OpenAIService } from "@/services/openai.service";
import { TransactionsService } from "@/services/transactions.service";
import { handleError } from "@/utils/handle-error";
import { SubscriptionsService } from "@/services/subscriptions.service";
import { RedisService } from "@/services/redis.service";
import { MessagesService } from "@/services/messages.service";
import {
  outlookMiddleware,
  OutlookRequest,
} from "@/middlewares/outlook.middleware";
import { OutlookService } from "@/services/outlook.service";

const router = Router();

router.post(
  "/",
  outlookMiddleware,
  async (req: OutlookRequest, res: Response): Promise<void> => {
    try {
      console.log("controller->/POST subscriptions");
      const token = req.accessToken || "";

      const subscriptionService = new SubscriptionsService(token);
      const data = await subscriptionService.createSubscription();

      res.json({ data });
    } catch (error: any) {
      handleError({
        error,
        res,
        controller: "subscriptions",
        message: "Failed to create subscription",
      });
    }
  }
);

router.get(
  "/",
  outlookMiddleware,
  async (req: OutlookRequest, res: Response): Promise<void> => {
    try {
      console.log("controller->/GET subscriptions");
      const token = req.accessToken || "";

      const subscriptionService = new SubscriptionsService(token);
      const data = await subscriptionService.getSubscriptions();
      res.json({ data });
    } catch (error: any) {
      handleError({
        error,
        res,
        controller: "subscriptions",
        message: "Failed to get subscriptions",
      });
    }
  }
);

router.delete(
  "/:id",
  outlookMiddleware,
  async (req: OutlookRequest, res: Response): Promise<void> => {
    try {
      console.log("controller->/DELETE subscriptions");
      const token = req.accessToken || "";
      if (!token) throw new Error("No token available.");

      const subscriptionService = new SubscriptionsService(token);
      await subscriptionService.deleteSubscription(req.params.id as string);

      res.json({ data: true });
    } catch (error: any) {
      handleError({
        error,
        res,
        controller: "subscriptions",
        message: "Failed to delete subscription",
      });
    }
  }
);

router.post("/webhook", async (req: Request, res: Response): Promise<void> => {
  console.log("controller->/POST outlook/webhook");

  const validationToken = req.query?.validationToken as string;
  if (validationToken) {
    console.log(
      "controller->/POST outlook/webhook->validationToken",
      validationToken
    );
    res.status(200).type("text/plain").send(validationToken);
    return;
  }

  try {
    const payload = req.body || {};
    const emails = payload.value || [];

    const redisService = new RedisService();
    const homeAccountId = await redisService.get("homeAccountId");
    if (!homeAccountId) throw new Error("No account available.");

    const outlookService = new OutlookService();
    const token = await outlookService.getAccessToken(homeAccountId);
    if (!token) throw new Error("No token available.");

    console.log("controller->/POST outlook/webhook->emails", emails.length);
    for (const notification of emails) {
      const messageId =
        notification?.resourceData?.id ||
        notification?.resource?.split("/").pop();
      if (!messageId) {
        console.log("🤖 messageId not found ->", notification);
        continue;
      }

      const messageService = new MessagesService(token);
      const message = await messageService.getMessageById(messageId);
      if (!message) {
        console.log("🤖 message not found ->", messageId);
        continue;
      }

      const whitelist = [
        "pauldhmayorgaw@gmail.com",
        "bancaenlinea@produbanco.com",
        "xperta@pichincha.com",
        "notificaciones@infopacificard.com.ec",
        "bancavirtual@bancoguayaquil.com",
        "banco@pichincha.com",
        "servicios@tarjetasbancopichincha.com",
      ];
      if (!whitelist.includes(message.from)) {
        console.log("🤖 email not in whitelist ->", message.from);
        continue;
      }

      if (!message.body) {
        console.log("🤖 message body not found ->", message);
        continue;
      }

      const transaction = await TransactionsService.getByMessageId(messageId);
      if (transaction) {
        console.log("🤖 transaction already exists ->", messageId);
        continue;
      }

      const openaiService = new OpenAIService();
      const transactionGenerated = await openaiService.getTransactionFromEmail(
        message.body
      );
      if (!transactionGenerated) {
        console.log("🤖 transactionGenerated not found ->", messageId);
        continue;
      }

      const newTransaction = await TransactionsService.create({
        type: transactionGenerated.type,
        description: transactionGenerated.description,
        amount: transactionGenerated.amount,
        occurred_at: transactionGenerated.occurred_at,
        income_message_id: messageId,
        bank: transactionGenerated.bank,
      });
      console.log("🤖 newTransaction saved ->", newTransaction?.id);
    }

    res.sendStatus(202);
  } catch (error: any) {
    handleError({
      error,
      res,
      controller: "subscriptions",
      message: "Failed to process email",
    });
  }
});

export default router;

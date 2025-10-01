import { Request, Response, Router } from "express";
import { OutlookService } from "../services/outlook.service";
import { OpenAIService } from "@/services/openai.service";
import { TransactionsService } from "@/services/transactions.service";
import { handleError } from "@/utils/handle-error";
import { SubscriptionsService } from "@/services/subscriptions.service";

const router = Router();

router.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const token = OutlookService.getToken();
    if (!token) throw new Error("No token available.");

    const subscriptionService = new SubscriptionsService(token);
    const subscription = await subscriptionService.createSubscription();
    res.json({ subscription });
  } catch (error: any) {
    handleError({
      error,
      res,
      controller: "subscriptions",
      message: "Failed to create subscription",
    });
  }
});

router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const token = OutlookService.getToken();
    if (!token) throw new Error("No token available.");

    const subscriptionService = new SubscriptionsService(token);
    const subscriptions = await subscriptionService.getSubscriptions();
    res.json({ subscriptions });
  } catch (error: any) {
    handleError({
      error,
      res,
      controller: "subscriptions",
      message: "Failed to get subscriptions",
    });
  }
});

router.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const token = OutlookService.getToken();
    if (!token) throw new Error("No token available.");

    const subscriptionService = new SubscriptionsService(token);
    await subscriptionService.deleteSubscription(req.params.id as string);
    res.sendStatus(200);
  } catch (error: any) {
    handleError({
      error,
      res,
      controller: "subscriptions",
      message: "Failed to delete subscription",
    });
  }
});

router.post("/webhook", async (req: Request, res: Response): Promise<void> => {
  console.log("controller -> outlook/webhook -> /POST");

  const validationToken = req.query?.validationToken as string;
  if (validationToken) {
    console.log(
      "controller -> outlook/webhook -> /POST validationToken ->",
      validationToken
    );
    res.status(200).type("text/plain").send(validationToken);
    return;
  }

  try {
    const payload = req.body || {};
    const emails = payload.value || [];

    console.log(
      "controller -> outlook/webhook -> /POST emails -> ",
      emails.length
    );
    for (const notification of emails) {
      // Get the messageId
      const messageId =
        notification?.resourceData?.id ||
        notification?.resource?.split("/").pop();

      // If the messageId is not found, continue
      if (!messageId) continue;

      // Check if the transaction already exists
      const transaction = await TransactionsService.getByMessageId(messageId);
      if (transaction) {
        console.log("🤖 transaction already exists ->", messageId);
        continue;
      }

      console.log(`📧 email received messageId: ${messageId}`);
      const message = await OutlookService.getMessageById(messageId);

      const whitelist = [
        "pauldhmayorga@gmail.com",
        "bancaenlinea@produbanco.com",
        "xperta@pichincha.com",
        "notificaciones@infopacificard.com.ec",
        "bancavirtual@bancoguayaquil.com",
        "banco@pichincha.com",
      ];
      const sender = message?.from?.emailAddress?.address?.toLowerCase();
      if (!whitelist.includes(sender)) {
        console.log("🤖 email not in whitelist ->", sender);
        continue;
      }

      const receivedAt = message?.receivedDateTime || "";
      const bodyContent = message?.body?.content || message?.bodyPreview || "";

      console.log(`📧 email received from: ${sender}, time: ${receivedAt}`);
      const transactionGenerated = await OpenAIService.getTransactionFromEmail(
        bodyContent
      );
      console.log("🤖 transactionGenerated ->", transactionGenerated?.amount);

      if (transactionGenerated) {
        const newTransaction = await TransactionsService.create({
          type: transactionGenerated?.type,
          description: `${transactionGenerated.bank} - ${transactionGenerated?.description}`,
          amount: transactionGenerated?.amount,
          occurred_at: transactionGenerated?.occurred_at,
          income_message_id: messageId,
          bank: transactionGenerated?.bank || null,
        });
        console.log("🤖 newTransaction saved ->", newTransaction?.id);
      }
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

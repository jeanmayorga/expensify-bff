import express, { Application, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";

import outlookController from "./controllers/outlook.controller";
import transactionsController from "./controllers/transactions.controller";
import subscriptionsController from "./controllers/subscriptions.controller";
import { RedisService } from "./services/redis.service";
import meController from "./controllers/me.controller";
import { startSubscriptionsCron } from "./crons/subscriptions.cron";
import messagesController from "./controllers/messages.controller";

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.use("/", meController);
app.use("/outlook", outlookController);
app.use("/messages", messagesController);
app.use("/subscriptions", subscriptionsController);
app.use("/transactions", transactionsController);

app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "OK", message: "Expensify BFF running!" });
});

app.use("*", (req: Request, res: Response) => {
  res.status(404).json({ error: "Route not found" });
});

app.listen(PORT, () => {
  console.log(`🚀 Expensify BFF running on port ${PORT}`);
  new RedisService();
  startSubscriptionsCron();
});

export default app;

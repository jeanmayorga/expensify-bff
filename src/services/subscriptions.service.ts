import axios, { AxiosInstance } from "axios";
import { env } from "../config/env";
import cron from "node-cron";

const DOMAIN = env.DOMAIN;
const NOTIFICATION_URL = `${DOMAIN}/subscriptions/webhook`;

interface Subscription {
  id: string;
  resource: string;
  expirationDateTime: string;
}

export class SubscriptionsService {
  private subscriptionsApi: AxiosInstance;

  constructor(token: string) {
    this.subscriptionsApi = axios.create({
      baseURL: "https://graph.microsoft.com/v1.0/subscriptions",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async getSubscriptions(): Promise<Subscription[]> {
    const response = await this.subscriptionsApi.get("/");
    return response.data.value;
  }

  async getSubscriptionById(id: string): Promise<Subscription> {
    const response = await this.subscriptionsApi.get(`/${id}`);
    return response.data;
  }

  async getSubscription(): Promise<Subscription | null> {
    const subscriptions = await this.getSubscriptions();
    return subscriptions[0] || null;
  }

  async deleteSubscription(id: string): Promise<void> {
    await this.subscriptionsApi.delete(`/${id}`);
  }

  async deleteAllSubscriptions(): Promise<void> {
    const subscriptions = await this.getSubscriptions();
    for (const subscription of subscriptions) {
      await this.deleteSubscription(subscription.id);
    }
  }

  async createSubscription(): Promise<Subscription> {
    const expirationDateTime = new Date();
    // Expiración inicial: +30 minutos desde ahora
    expirationDateTime.setMinutes(expirationDateTime.getMinutes() + 30);
    const response = await this.subscriptionsApi.post("/", {
      changeType: "created",
      notificationUrl: NOTIFICATION_URL,
      resource: "me/mailFolders('inbox')/messages",
      expirationDateTime: expirationDateTime.toISOString(),
      clientState: "miClaveSegura",
    });
    return response.data;
  }

  async renewSubscription(): Promise<void> {
    try {
      console.log("🔄 Renewing subscription....");
      const subscription = await this.getSubscription();
      if (!subscription) return;
      console.log("🔄 Last subscription ->", subscription?.id);

      const exp = new Date(subscription.expirationDateTime).getTime();
      const now = Date.now();
      const minsLeft = (exp - now) / 60000;

      console.log("🔄 Mins left ->", minsLeft);
      // Renovar si quedan < 5 minutos para evitar expiración
      if (minsLeft < 5) {
        // Nueva expiración: +30 minutos a partir de ahora
        const newExp = new Date(Date.now() + 30 * 60 * 1000).toISOString();
        await this.subscriptionsApi.patch(`/${subscription.id}`, {
          expirationDateTime: newExp,
        });
        console.log("🔄 Subscription renewed until:", newExp);
      }
    } catch (error) {
      console.error("Error renewing subscription:", error);
    }
  }

  startRenewSubscription(): void {
    cron.schedule("*/15 * * * *", () => {
      this.renewSubscription();
    });
    console.log("🔄 Subscription renewal cron started (every 15 minutes)");
  }
}

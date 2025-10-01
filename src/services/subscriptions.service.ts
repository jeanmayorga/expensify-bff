import axios, { AxiosInstance } from "axios";
import { env } from "../config/env";
import cron from "node-cron";
import { getErrorMessage } from "@/utils/handle-error";
import { Subscription } from "@/models/subscriptions.service";

const DOMAIN = env.DOMAIN;
const NOTIFICATION_URL = `${DOMAIN}/subscriptions/webhook`;

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
    try {
      console.log("SubscriptionsService->getSubscriptions()");
      const response = await this.subscriptionsApi.get("/");
      return response.data.value;
    } catch (error: any) {
      const message = getErrorMessage(error);
      console.error("SubscriptionsService->getSubscriptions()->", message);
      return [];
    }
  }

  async getSubscriptionById(id: string): Promise<Subscription | null> {
    try {
      console.log("SubscriptionsService->getSubscriptionById()", id);
      const response = await this.subscriptionsApi.get(`/${id}`);
      return response.data;
    } catch (error: any) {
      const message = getErrorMessage(error);
      console.error("SubscriptionsService->getSubscriptionById()->", message);
      return null;
    }
  }

  async getSubscription(): Promise<Subscription | null> {
    try {
      console.log("SubscriptionsService->getSubscription()");
      const subscriptions = await this.getSubscriptions();
      return subscriptions[0] || null;
    } catch (error: any) {
      const message = getErrorMessage(error);
      console.error("SubscriptionsService->getSubscription()->", message);
      return null;
    }
  }

  async deleteSubscription(id: string): Promise<void> {
    try {
      console.log("SubscriptionsService->deleteSubscription()", id);
      await this.subscriptionsApi.delete(`/${id}`);
    } catch (error: any) {
      const message = getErrorMessage(error);
      console.error("SubscriptionsService->deleteSubscription()->", message);
    }
  }

  async deleteAllSubscriptions(): Promise<void> {
    try {
      console.log("SubscriptionsService->deleteAllSubscriptions()");
      const subscriptions = await this.getSubscriptions();
      for (const subscription of subscriptions) {
        await this.deleteSubscription(subscription.id);
      }
    } catch (error: any) {
      const message = getErrorMessage(error);
      console.error(
        "SubscriptionsService->deleteAllSubscriptions()->",
        message
      );
    }
  }

  async createSubscription(): Promise<Subscription | null> {
    try {
      console.log("SubscriptionsService->createSubscription()");
      const expirationDateTime = new Date();
      expirationDateTime.setMinutes(expirationDateTime.getMinutes() + 30);

      const response = await this.subscriptionsApi.post("/", {
        changeType: "created",
        notificationUrl: NOTIFICATION_URL,
        resource: "me/mailFolders('inbox')/messages",
        expirationDateTime: expirationDateTime.toISOString(),
        clientState: "miClaveSegura",
      });
      return response.data;
    } catch (error: any) {
      const message = getErrorMessage(error);
      console.error("SubscriptionsService->createSubscription()->", message);
      return null;
    }
  }

  async renewSubscription(): Promise<void> {
    try {
      console.log("SubscriptionsService->renewSubscription()");
      const subscription = await this.getSubscription();
      if (!subscription) return;
      console.log("🔄 subscription ->", subscription?.id);

      const exp = new Date(subscription.expirationDateTime).getTime();
      const now = Date.now();
      const minsLeft = (exp - now) / 60000;

      console.log("🔄 subscription mins left ->", minsLeft);
      // Renovar si quedan < 10 minutos para evitar expiración
      if (minsLeft < 10) {
        // Nueva expiración: +30 minutos a partir de ahora
        const newExp = new Date(Date.now() + 30 * 60 * 1000).toISOString();
        await this.subscriptionsApi.patch(`/${subscription.id}`, {
          expirationDateTime: newExp,
        });
        console.log("🔄 subscription renewed until:", newExp);
      }
    } catch (error: any) {
      const message = getErrorMessage(error);
      console.error("SubscriptionsService->renewSubscription()->", message);
    }
  }

  startRenewSubscription(): void {
    cron.schedule("*/15 * * * *", () => {
      this.renewSubscription();
    });
    console.log("🔄 subscription renewal cron started (every 15 minutes)");
  }
}

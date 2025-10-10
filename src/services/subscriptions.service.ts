import axios, { AxiosInstance } from "axios";
import { env } from "../config/env";
import { constants } from "@/config/constants";
import { getErrorMessage } from "@/utils/handle-error";
import { Subscription } from "@/models/subscriptions.model";
import { getEcuadorDate } from "@/utils/ecuador-time";
import { format } from "date-fns-tz";

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
      const mappedSubscriptions = response.data.value
        .map((subscription: Subscription) => {
          const expirationDateTime = new Date(subscription.expirationDateTime);
          const expirationDateTimeEcuador = format(
            getEcuadorDate(expirationDateTime),
            "yyyy-MM-dd HH:mm:ss"
          );
          return {
            ...subscription,
            expirationDateTimeEcuador,
          };
        })
        .sort(
          (a: Subscription, b: Subscription) =>
            new Date(b.expirationDateTime).getTime() -
            new Date(a.expirationDateTime).getTime()
        );
      return mappedSubscriptions;
    } catch (error: any) {
      const message = getErrorMessage(error);
      console.error("SubscriptionsService->getSubscriptions()->", message);
      return [];
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
      expirationDateTime.setMinutes(
        expirationDateTime.getMinutes() + constants.SUBSCRIPTION_EXPIRATION_TIME
      );

      const response = await this.subscriptionsApi.post("/", {
        changeType: "created",
        notificationUrl: NOTIFICATION_URL,
        resource: "me/mailFolders('inbox')/messages",
        expirationDateTime: expirationDateTime.toISOString(),
        clientState: "miClaveSegura",
      });

      const now = Date.now();
      const exp = new Date(response.data.expirationDateTime).getTime();
      const minsLeft = (exp - now) / 60000;
      const hoursLeft = Math.floor(minsLeft / 60);
      console.log("createSubscription ->", {
        now: new Date(now).toISOString(),
        expires: new Date(exp).toISOString(),
        minsLeft: minsLeft.toFixed(0) + " mins left",
        hoursLeft: hoursLeft + " hours left",
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
      const subscriptions = await this.getSubscriptions();
      const NOTIFICATION_URL = `${env.DOMAIN}/subscriptions/webhook`;
      const subscription = subscriptions.find(
        (subscription) => subscription.notificationUrl === NOTIFICATION_URL
      );
      if (!subscription) {
        console.log(
          `🔄 subscription not found for ${NOTIFICATION_URL}, creating new one`
        );
        await this.createSubscription();
        return;
      }
      const subscriptionId = subscription.id;

      console.log(
        "subscription found! -> expirationDateTime:",
        format(
          getEcuadorDate(new Date(subscription.expirationDateTime)),
          "yyyy-MM-dd HH:mm:ss"
        )
      );
      const exp = new Date(subscription.expirationDateTime).getTime();
      const now = Date.now();
      const minsLeft = (exp - now) / 60000;
      const hoursLeft = Math.floor(minsLeft / 60);

      console.log("renewSubscription ->", {
        now: new Date(now).toISOString(),
        expires: new Date(exp).toISOString(),
        minsLeft: minsLeft.toFixed(0) + " mins left",
        hoursLeft: hoursLeft.toFixed(0) + " hours left",
        minutesToRenewConstant: constants.SUBSCRIPTION_MINUTES_TO_RENEW,
        needsRenew: minsLeft <= constants.SUBSCRIPTION_MINUTES_TO_RENEW,
      });

      if (minsLeft <= constants.SUBSCRIPTION_MINUTES_TO_RENEW) {
        const newExp = new Date(
          Date.now() + constants.SUBSCRIPTION_EXPIRATION_TIME * 60 * 1000
        ).toISOString();
        const response = await this.subscriptionsApi.patch(
          `/${subscriptionId}`,
          {
            expirationDateTime: newExp,
          }
        );
        console.log("🔄 subscription renewed until:", newExp, response.data);
      }
    } catch (error: any) {
      const message = getErrorMessage(error);
      console.error("SubscriptionsService->renewSubscription()->", message);
    }
  }
}

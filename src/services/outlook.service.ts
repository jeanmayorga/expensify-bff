import { ConfidentialClientApplication } from "@azure/msal-node";
import { env } from "../config/env";
import axios from "axios";

const DOMAIN = env.DOMAIN;
const REDIRECT_URL = `${DOMAIN}/outlook/redirect`;
const SCOPES = ["Mail.Read", "Mail.ReadWrite"];

export class OutlookService {
  private static outlook = new ConfidentialClientApplication({
    auth: {
      clientId: env.MICROSOFT_CLIENT_ID,
      clientSecret: env.MICROSOFT_CLIENT_SECRET,
      authority: `https://login.microsoftonline.com/${env.MICROSOFT_TENANT_ID}`,
    },
    system: { loggerOptions: { loggerCallback: () => {} } },
  });

  static async getAuthUrl(): Promise<string> {
    console.log("OutlookService->getAuthUrl()");
    const url = await this.outlook.getAuthCodeUrl({
      scopes: SCOPES,
      redirectUri: REDIRECT_URL,
    });
    return url;
  }

  static async getTokenByCode(code: string): Promise<string> {
    console.log("OutlookService->getTokenByCode()");
    const response = await this.outlook.acquireTokenByCode({
      code,
      scopes: SCOPES,
      redirectUri: REDIRECT_URL,
    });
    return response.accessToken;
  }

  static async getGraphMe(
    accessToken: string
  ): Promise<Record<string, unknown>> {
    const response = await axios.get("https://graph.microsoft.com/v1.0/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data;
  }
}

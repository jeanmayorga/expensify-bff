import { ConfidentialClientApplication, AccountInfo } from "@azure/msal-node";
import axios from "axios";
import { env } from "../config/env";

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

  private static cachedAccount: AccountInfo | null = null;
  private static cachedToken: string | null = null;

  static getToken() {
    return this.cachedToken;
  }

  static getStatus() {
    return {
      loggedIn: Boolean(this.cachedAccount),
      account: this.cachedAccount,
    };
  }

  static async getAuthUrl(): Promise<string> {
    const url = await this.outlook.getAuthCodeUrl({
      scopes: SCOPES,
      redirectUri: REDIRECT_URL,
    });
    return url;
  }

  static async getTokenByCode(code: string): Promise<string> {
    const response = await this.outlook.acquireTokenByCode({
      code,
      scopes: SCOPES,
      redirectUri: REDIRECT_URL,
    });
    this.cachedToken = response.accessToken;
    this.cachedAccount = response.account;

    return response.accessToken;
  }

  private static async acquireToken(): Promise<string> {
    if (!this.cachedAccount) {
      throw new Error("No account cached. Login first.");
    }
    const response = await this.outlook.acquireTokenSilent({
      account: this.cachedAccount,
      scopes: SCOPES,
    });
    this.cachedAccount = response.account;
    this.cachedToken = response.accessToken;

    return response.accessToken;
  }

  static async getMessageById(messageId: string): Promise<any> {
    const accessToken = await this.acquireToken();
    if (!accessToken) {
      throw new Error("No access token available. Login first.");
    }

    const response = await axios.get(
      `https://graph.microsoft.com/v1.0/me/messages/${messageId}?$select=subject,from,receivedDateTime,bodyPreview,body`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return response.data;
  }
}

import {
  AccountInfo,
  ConfidentialClientApplication,
  InteractionRequiredAuthError,
  TokenCacheContext,
} from "@azure/msal-node";
import { env } from "../config/env";
import { RedisService } from "./redis.service";

const DOMAIN = env.DOMAIN;
const REDIRECT_URL = `${DOMAIN}/outlook/redirect`;
const SCOPES = [
  "User.Read",
  "Mail.Read",
  "Mail.ReadWrite",
  "offline_access",
  "openid",
  "profile",
];
const MSAL_CACHE_KEY = "msal:token-cache:v1";
export class OutlookService {
  private redis = new RedisService();
  private outlook = new ConfidentialClientApplication({
    auth: {
      clientId: env.MICROSOFT_CLIENT_ID,
      clientSecret: env.MICROSOFT_CLIENT_SECRET,
      authority: `https://login.microsoftonline.com/${env.MICROSOFT_TENANT_ID}`,
    },
    system: { loggerOptions: { loggerCallback: () => {} } },
    cache: {
      cachePlugin: {
        beforeCacheAccess: async (ctx: TokenCacheContext) => {
          const blob = (await this.redis.get(MSAL_CACHE_KEY)) || "";
          ctx.tokenCache.deserialize(blob);
        },
        afterCacheAccess: async (ctx: TokenCacheContext) => {
          if (ctx.cacheHasChanged) {
            await this.redis.set(MSAL_CACHE_KEY, ctx.tokenCache.serialize());
          }
        },
      },
    },
  });

  constructor() {}

  async getAuthUrl(): Promise<string> {
    console.log("OutlookService->getAuthUrl()");
    const url = await this.outlook.getAuthCodeUrl({
      scopes: SCOPES,
      redirectUri: REDIRECT_URL,
    });
    return url;
  }

  async getAcquireTokenByCode(
    code: string
  ): Promise<{ accessToken: string; homeAccountId: string | null }> {
    console.log("OutlookService->getAcquireTokenByCode()");
    const response = await this.outlook.acquireTokenByCode({
      code,
      scopes: SCOPES,
      redirectUri: REDIRECT_URL,
    });
    const accessToken = response.accessToken;
    const account = response.account;
    const homeAccountId = account?.homeAccountId || null;

    return { accessToken, homeAccountId };
  }

  async getAccessToken(homeAccountId: string): Promise<string | null> {
    console.log("OutlookService->getAccessToken()", homeAccountId);
    try {
      const account = await this.outlook
        .getTokenCache()
        .getAccountByHomeId(homeAccountId);
      if (!account) throw new Error("No account found.");

      const result = await this.outlook.acquireTokenSilent({
        account,
        scopes: SCOPES,
        forceRefresh: false,
      });
      if (!result?.accessToken) throw new Error("No access token found.");

      return result.accessToken;
    } catch (err) {
      console.error("OutlookService->getAccessToken()->", err);
      if (err instanceof InteractionRequiredAuthError) {
        throw new Error("Manual interaction required.");
      }
      throw err;
    }
  }
}

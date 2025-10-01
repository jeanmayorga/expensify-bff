import dotenv from "dotenv";

dotenv.config();

export const env = {
  DOMAIN: process.env.DOMAIN || "",
  SUPABASE_URL: process.env.SUPABASE_URL || "",
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || "",
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
  MICROSOFT_CLIENT_ID: process.env.MICROSOFT_CLIENT_ID || "",
  MICROSOFT_CLIENT_SECRET: process.env.MICROSOFT_CLIENT_SECRET || "",
  MICROSOFT_TENANT_ID: process.env.MICROSOFT_TENANT_ID || "",
  REDIS_URL: process.env.REDIS_URL || "",
};

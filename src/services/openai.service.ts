import OpenAI from "openai";
import { env } from "../config/env";
import { getErrorMessage } from "@/utils/handle-error";
import { Transaction } from "@/models/transactions.model";

const TransactionJsonSchema = {
  type: "object",
  properties: {
    type: {
      type: "string",
      enum: ["income", "expense"],
      description:
        "Whether this is an income, expense transaction, if it is a refund, please return income",
    },
    description: {
      type: "string",
      description:
        "A clear description of the transaction (e.g., 'Coffee at Starbucks', 'Salary payment')",
    },
    amount: {
      type: "number",
      description:
        "The monetary amount of the transaction as a positive number",
      minimum: 0,
    },
    occurred_at: {
      type: "string",
      description: `The date and time when the transaction occurred, the date is in ecuador time, please convert it to UTC example: 2025-09-30T16:00:00Z, if not present use date now which is: ${new Date().toISOString()}`,
      pattern: "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}Z$",
    },
    bank: {
      type: "string",
      description:
        "The name of the bank or financial institution: follow the bank instructions",
      enum: [
        "Banco del Pacifico",
        "Banco Pichincha",
        "Banco de Guayaquil",
        "Produbanco",
      ],
    },
  },
  required: ["type", "description", "amount", "occurred_at", "bank"],
  additionalProperties: false,
} as const;
export class OpenAIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });
  }

  private createStructuredResponse(message: string) {
    return this.openai.responses.create({
      model: "gpt-5-nano",
      input: [
        {
          role: "system",
          content:
            "You are a helpful assistant that extracts transaction information from HTML emails. " +
            "Extract the transaction type (income/expense), description, amount, date/time, and bank info. " +
            "For dates, use ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ). " +
            "For amounts, use positive numbers only. " +
            "Be precise and only extract information that is clearly present in the email." +
            "Bank instructions: " +
            "Banco del Pacifico is the *bank name* of the following names: Banco del Pacífico, PacifiCard, Pacifico, infopacificard" +
            "Banco Pichincha is the *bank name* of the following names: Pichincha" +
            "Banco de Guayaquil is the *bank name* of the following names: Banco Guayaquil, Guayaquil, infoguayaquil. " +
            "Produbanco is the *bank name* of the following names: Produbanco. " +
            "If the bank is Produbanco, the *description* needs to get from the patterns like: Establecimiento: <description>",
        },
        { role: "user", content: message },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "transaction",
          schema: TransactionJsonSchema,
          strict: true,
        },
      },
    });
  }

  async getTransactionFromEmail(message: string) {
    try {
      console.log(
        `OpenAIService->getTransactionFromEmail() ${message.length} chars`
      );
      const response = await this.createStructuredResponse(message);
      const outputText = (response as any).output_text as string;
      const parsed = JSON.parse(outputText);
      const transaction = parsed as Transaction;
      return transaction;
    } catch (error) {
      const message = getErrorMessage(error);
      console.error("OpenAIService->getTransactionFromEmail()->error", message);
      return null;
    }
  }
}

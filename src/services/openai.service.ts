import OpenAI from "openai";
import { env } from "../config/env";
import { z } from "zod";
import { getErrorMessage } from "@/utils/handle-error";
// Using explicit JSON Schema to avoid helper compatibility issues

const TransactionSchema = z.object({
  type: z.enum(["income", "expense", "refund"]),
  description: z.string().min(1, "Description cannot be empty"),
  amount: z.number().min(0, "Amount must be positive"),
  occurred_at: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/,
      "Date must be in ISO 8601 format"
    ),
  bank: z.string().nullable().optional(),
});

// JSON Schema for Structured Outputs (all fields required; nullable for optional semantics)
const TransactionJsonSchema = {
  type: "object",
  properties: {
    type: {
      type: "string",
      enum: ["income", "expense", "refund"],
      description:
        "Whether this is an income, expense, refund or transfer transaction",
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
      description:
        "The date and time when the transaction occurred in ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)",
      pattern: "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d{3})?Z?$",
    },
    bank: {
      type: ["string", "null"],
      description: "The name of the bank or financial institution (nullable)",
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
            "Extract the transaction type (income/expense), description, amount, date/time, and optionally card/bank info. " +
            "For dates, use ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ). " +
            "For amounts, use positive numbers only. " +
            "Be precise and only extract information that is clearly present in the email." +
            "Banco del Pacífico is the *bank name* of the following names: PacifiCard, Pacifico, infopacificard" +
            "Banco Pichincha is the *bank name* of the following names: Pichincha",
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
      return TransactionSchema.parse(parsed);
    } catch (error) {
      const message = getErrorMessage(error);
      console.error("OpenAIService->getTransactionFromEmail()->error", message);
      return null;
    }
  }
}

import { supabase } from "./supabase.service";
import {
  GetAllTransactionsOptions,
  Transaction,
  TransactionInsert,
} from "../models/transactions.model";
import { ecDayBounds } from "@/utils/ecuador-time";
export class TransactionsService {
  static async getAll(
    options: GetAllTransactionsOptions
  ): Promise<Transaction[]> {
    const { startEcDay, endEcDay } = ecDayBounds(options.date);

    console.log("TransactionsService->getAll()", {
      ...options,
      startEcDay,
      endEcDay,
    });

    const query = supabase
      .from("transactions")
      .select("*")
      .gte("occurred_at", startEcDay)
      .lte("occurred_at", endEcDay)
      .range(
        (options.page - 1) * options.limit,
        options.page * options.limit - 1
      )
      .order("created_at", { ascending: false });

    if (options.type) {
      if (options.type === "income") {
        query.eq("type", "income");
      }
      if (options.type === "expense") {
        query.eq("type", "expense");
      }
      if (options.type === "refund") {
        query.eq("type", "refund");
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error("TransactionsService->getAll()->error", error.message);
      return [];
    }

    return data || [];
  }

  static async getById(id: number): Promise<Transaction | null> {
    console.log("TransactionsService->getById()", id);
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("TransactionsService->getById()->error", error.message);
      return null;
    }

    return data;
  }

  static async getByMessageId(messageId: string): Promise<Transaction | null> {
    console.log("TransactionsService->getByMessageId()", messageId);
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("income_message_id", messageId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        console.log("TransactionsService->getByMessageId()->notfound");
        return null;
      }
      console.error(`TransactionsService->getByMessageId()->error`, error);
      throw error;
    }

    return data;
  }

  static async create(dto: TransactionInsert): Promise<Transaction | null> {
    console.log("TransactionsService->create()->", dto.income_message_id);
    const { data, error } = await supabase
      .from("transactions")
      .insert(dto)
      .select("*")
      .single();

    if (error) {
      console.error("TransactionsService->create()->error", error.message);
      throw error;
    }

    return data;
  }

  static async delete(id: number): Promise<boolean> {
    console.log("TransactionsService->delete()", id);
    const { error } = await supabase.from("transactions").delete().eq("id", id);

    if (error) {
      console.error("TransactionsService->delete()->error", error.message);
      return false;
    }

    return true;
  }
}

import { supabase } from "./supabase.service";
import { Transaction, TransactionInsert } from "../models/transactions.model";
export class TransactionsService {
  static async getAll(): Promise<Transaction[]> {
    console.log("TransactionsService->getAll()");
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false });

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
      console.error(`TransactionsService->getByMessageId()->error`, error);
      return null;
    }

    return data;
  }

  static async create(dto: TransactionInsert): Promise<Transaction | null> {
    console.log("TransactionsService->create()");
    const { data, error } = await supabase
      .from("transactions")
      .insert(dto)
      .select("*")
      .single();

    if (error) {
      console.error("TransactionsService->create()->error", error.message);
      return null;
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

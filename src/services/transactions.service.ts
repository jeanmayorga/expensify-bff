import { supabase } from "./supabase.service";
import { Transaction, TransactionInsert } from "../models/transactions.model";

export class TransactionsService {
  static async getAll(): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getById(id: number): Promise<Transaction | null> {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", id)
      .single();

    if (error) return null;
    return data;
  }

  static async getByMessageId(messageId: string): Promise<Transaction | null> {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("income_message_id", messageId)
      .single();
    if (error) return null;
    return data;
  }

  static async create(dto: TransactionInsert): Promise<Transaction> {
    const { data, error } = await supabase
      .from("transactions")
      .insert(dto)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async delete(id: number): Promise<boolean> {
    const { error } = await supabase.from("transactions").delete().eq("id", id);

    return !error;
  }
}

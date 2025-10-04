import { supabase } from "./supabase.service";
import {
  GetAllTransactionsOptions,
  Transaction,
  TransactionInsert,
} from "../models/transactions.model";
import {
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  format,
  startOfDay,
  startOfMonth,
} from "date-fns";

export class TransactionsService {
  static async getDaily(options: GetAllTransactionsOptions) {
    const firstTimeOfDay = startOfDay(options.date);
    const lastTimeOfDay = endOfDay(options.date);

    console.log("TransactionsService->getDaily()", {
      ...options,
      firstTimeOfDay,
      lastTimeOfDay,
    });

    const query = supabase
      .from("transactions")
      .select("*")
      .gte("occurred_at", firstTimeOfDay.toISOString())
      .lte("occurred_at", lastTimeOfDay.toISOString())
      .order("occurred_at", { ascending: false });

    if (options.type) {
      if (options.type === "income") {
        query.eq("type", "income");
      }
      if (options.type === "expense") {
        query.eq("type", "expense");
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error("TransactionsService->getDaily()->error", error.message);
      throw error;
    }

    const transactions = data || [];
    let totalExpenses = 0;
    let totalIncomes = 0;
    let totalAmount = 0;

    for (const transaction of transactions) {
      if (transaction.type === "expense") {
        totalExpenses += transaction.amount || 0;
        totalAmount -= transaction.amount || 0;
      }
      if (transaction.type === "income") {
        totalIncomes += transaction.amount || 0;
        totalAmount += transaction.amount || 0;
      }
    }

    return {
      data: transactions,
      totalExpenses,
      totalIncomes,
      totalAmount,
    };
  }

  static async getMonthly(date: Date) {
    const firstDayOfMonth = startOfMonth(date);
    const lastDayOfMonth = endOfMonth(date);

    console.log("TransactionsService->getMonthly()", {
      date,
      firstDayOfMonth,
      lastDayOfMonth,
    });

    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .gte("occurred_at", firstDayOfMonth.toISOString())
      .lte("occurred_at", lastDayOfMonth.toISOString());

    if (error) {
      console.error("TransactionsService->getMonthly()->error", error.message);
      throw error;
    }

    const transactions = data || [];
    const days: Record<string, number> = {};
    let totalExpenses = 0;
    let totalIncomes = 0;
    let totalAmount = 0;

    eachDayOfInterval({
      start: firstDayOfMonth,
      end: lastDayOfMonth,
    }).forEach((day) => {
      const key = format(day, "yyyy-MM-dd");
      days[key] = 0;
    });
    for (const transaction of transactions) {
      const date = format(transaction.occurred_at, "yyyy-MM-dd");
      const amount = transaction.amount || 0;
      days[date] = (days[date] || 0) + amount;

      if (transaction.type === "expense") {
        totalExpenses += transaction.amount || 0;
        totalAmount -= transaction.amount || 0;
      }
      if (transaction.type === "income") {
        totalIncomes += transaction.amount || 0;
        totalAmount += transaction.amount || 0;
      }
    }

    return {
      data: days,
      totalExpenses,
      totalIncomes,
      totalAmount,
    };
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
      throw error;
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

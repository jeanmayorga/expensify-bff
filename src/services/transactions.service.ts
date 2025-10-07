import { supabase } from "./supabase.service";
import { Transaction, TransactionInsert } from "../models/transactions.model";
import { eachDayOfInterval, format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

export class TransactionsService {
  static async getTxsBetweenDates(options: {
    startDate: Date;
    endDate: Date;
    type?: string;
  }) {
    console.log("TransactionsService->getTxsBetweenDates()", options);

    const query = supabase
      .from("transactions")
      .select("*")
      .gte("created_at", options.startDate.toISOString())
      .lte("created_at", options.endDate.toISOString())
      .order("created_at", { ascending: false });

    if (options.type) {
      if (options.type === "incomes") {
        query.eq("type", "income");
      }
      if (options.type === "expenses") {
        query.eq("type", "expense");
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error(
        "TransactionsService->getTxsBetweenDates()->error",
        error.message
      );
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
      startDate: options.startDate,
      endDate: options.endDate,
    };
  }

  static async getSummaryBetweenDates(options: {
    startDate: Date;
    endDate: Date;
  }) {
    console.log("TransactionsService->getSummaryBetweenDates()", options);

    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .gte("created_at", options.startDate.toISOString())
      .lte("created_at", options.endDate.toISOString());

    if (error) {
      console.error(
        "TransactionsService->getSummaryBetweenDates()->error",
        error.message
      );
      throw error;
    }

    const transactions = data || [];
    const days: Record<string, number> = {};
    let totalExpenses = 0;
    let totalIncomes = 0;
    let totalAmount = 0;

    const timeZone = "America/Guayaquil";

    eachDayOfInterval({
      start: toZonedTime(options.startDate, timeZone),
      end: toZonedTime(options.endDate, timeZone),
    }).forEach((day) => {
      const key = format(day, "yyyy-MM-dd");
      days[key] = 0;
    });

    for (const transaction of transactions) {
      const currentDay = format(
        toZonedTime(transaction.created_at, timeZone),
        "yyyy-MM-dd"
      );
      const amount = transaction.amount || 0;
      const currentDayAmount = days[currentDay] || 0;
      days[currentDay] = currentDayAmount + amount;

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

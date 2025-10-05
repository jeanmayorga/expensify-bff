import { supabase } from "./supabase.service";
import { Transaction, TransactionInsert } from "../models/transactions.model";
import { eachDayOfInterval } from "date-fns";

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
      if (options.type === "income") {
        query.eq("type", "income");
      }
      if (options.type === "expense") {
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

    const startUTC = new Date(
      Date.UTC(
        options.startDate.getUTCFullYear(),
        options.startDate.getUTCMonth(),
        options.startDate.getUTCDate()
      )
    );
    const endUTC = new Date(
      Date.UTC(
        options.endDate.getUTCFullYear(),
        options.endDate.getUTCMonth(),
        options.endDate.getUTCDate()
      )
    );
    const referenceForTime = new Date(options.startDate);
    eachDayOfInterval({
      start: startUTC,
      end: endUTC,
    }).forEach((day) => {
      const zonedDay = new Date(day);
      zonedDay.setUTCHours(
        referenceForTime.getUTCHours(),
        referenceForTime.getUTCMinutes(),
        referenceForTime.getUTCSeconds(),
        referenceForTime.getUTCMilliseconds()
      );
      if (zonedDay <= options.endDate) {
        const key = zonedDay.toISOString();
        // const key = zonedDay.toISOString().split("T")[0] || ""; // yyyy-mm-dd
        days[key] = 0;
      }
    });

    for (const transaction of transactions) {
      const start = new Date(options.startDate);
      const created = new Date(transaction.created_at);
      created.setUTCHours(
        start.getUTCHours(),
        start.getUTCMinutes(),
        start.getUTCSeconds(),
        start.getUTCMilliseconds()
      );

      const date = created.toISOString();
      // const date = created.toISOString().split("T")[0] || ""; // yyyy-mm-dd
      const amount = transaction.amount || 0;
      const currentDayAmount = days[date] || 0;
      days[date] = currentDayAmount + amount;

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

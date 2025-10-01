import { Database } from "@/types/database";

export type Transaction = Database["public"]["Tables"]["transactions"]["Row"];

export type TransactionInsert =
  Database["public"]["Tables"]["transactions"]["Insert"];

export type GetAllTransactionsOptions = {
  date: string;
  page: number;
  limit: number;
};

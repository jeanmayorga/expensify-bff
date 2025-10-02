import { Request, Response, Router } from "express";
import { TransactionsService } from "../services/transactions.service";
import { TransactionInsert } from "@/models/transactions.model";
import { getErrorMessage } from "@/utils/handle-error";
import { getEcuadorDate } from "@/utils/ecuador-time";
import { format } from "date-fns-tz";

const router = Router();

router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("controller->/GET transactions");
    const today = format(getEcuadorDate(), "yyyy-MM-dd");
    const date = (req.query.date as string) || today;
    const type = (req.query.type as string) || "all";

    // verify the format of the date
    if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      throw new Error("Invalid date format");
    }

    const transactions = await TransactionsService.getAllByDay({
      date,
      type,
    });

    let totalExpenses = 0;
    let totalIncomes = 0;
    let totalRefunds = 0;

    for (const transaction of transactions) {
      if (transaction.type === "expense") {
        totalExpenses += transaction.amount || 0;
      }
      if (transaction.type === "income") {
        totalIncomes += transaction.amount || 0;
      }
      if (transaction.type === "refund") {
        totalRefunds += transaction.amount || 0;
      }
    }

    res.json({
      data: transactions,
      totalExpenses,
      totalIncomes,
      totalRefunds,
    });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("controller->/GET transactions->error", message);
    res.status(500).json({ data: [], error: message });
  }
});

router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const transaction = await TransactionsService.getById(id);

    if (!transaction) {
      res.status(404).json({ data: null, error: "Transaction not found" });
      return;
    }

    res.json({ data: transaction });
  } catch (error) {
    console.error("controller -> transaction GET/:id", error);
    res.status(500).json({ data: null, error: "Failed to get transaction" });
  }
});

router.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const newTransaction = req.body as TransactionInsert;
    const transaction = await TransactionsService.create(newTransaction);
    res.json({ data: transaction });
  } catch (error) {
    console.error("controller -> transaction POST/", error);
    res.status(500).json({ error: "Failed to create transaction" });
  }
});

router.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const transaction = await TransactionsService.delete(id);
    res.json({ data: transaction });
  } catch (error) {
    console.error("controller -> transaction DELETE/:id", error);
    res.status(500).json({ error: "Failed to delete transaction" });
  }
});

export default router;

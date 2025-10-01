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
    const date =
      (req.query.date as string) || format(getEcuadorDate(), "yyyy-MM-dd");
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 100;

    const transactions = await TransactionsService.getAll({
      date,
      page,
      limit,
    });

    const totalAmount = transactions.reduce(
      (acc, transaction) => acc + (transaction.amount || 0),
      0
    );
    res.json({ total: transactions.length, totalAmount, data: transactions });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("controller->/GET transactions->error", message);
    res.status(500).json({ data: [], error: "Failed to get transactions" });
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

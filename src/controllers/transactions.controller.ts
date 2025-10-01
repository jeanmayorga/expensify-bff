import { Request, Response, Router } from "express";
import { TransactionsService } from "../services/transactions.service";
import { TransactionInsert } from "@/models/transactions.model";

const router = Router();

router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const transactions = await TransactionsService.getAll();
    res.json({ data: transactions });
  } catch (error) {
    console.error("controller -> transactions GET/", error);
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

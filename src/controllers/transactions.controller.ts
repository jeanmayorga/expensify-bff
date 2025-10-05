import { Request, Response, Router } from "express";
import { TransactionsService } from "../services/transactions.service";
import { TransactionInsert } from "@/models/transactions.model";
import { getErrorMessage } from "@/utils/handle-error";
import { getEcuadorDate } from "@/utils/ecuador-time";
import { endOfDay, startOfDay } from "date-fns";

const router = Router();

router.get("/daily", async (req: Request, res: Response): Promise<void> => {
  try {
    const dateString = req.query.date as string;
    const date = dateString ? new Date(dateString) : new Date();
    const type = (req.query.type as string) || "all";

    const dateEcuador = getEcuadorDate(date);
    const startDateEcuador = startOfDay(dateEcuador);
    const endDateEcuador = endOfDay(dateEcuador);

    const startDate = startOfDay(date);
    const endDate = endOfDay(date);

    console.log("controller->/GET transactions/daily", {
      type,
      date,
      startDate,
      endDate,
      dateEcuador,
      startDateEcuador,
      endDateEcuador,
    });

    const daily = await TransactionsService.getTxsBetweenDates({
      startDate,
      endDate,
      type,
    });

    res.json(daily);
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("controller->/GET transactions/daily->error", message);
    res.status(500).json({ data: [], error: message });
  }
});

router.get("/monthly", async (req: Request, res: Response): Promise<void> => {
  try {
    const dateString = req.query.date as string;
    const date = dateString ? new Date(dateString) : new Date();
    console.log("controller->/GET transactions/monthly UTC", { date });

    const monthly = await TransactionsService.getMonthly(date);

    res.json(monthly);
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("controller->/GET transactions/monthly->error", message);
    res.status(500).json({ data: [], error: message });
  }
});

router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const transaction = await TransactionsService.getById(id);

    res.json({ data: transaction });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("controller -> transaction GET/:id", message);
    res.status(500).json({ data: null, error: message });
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

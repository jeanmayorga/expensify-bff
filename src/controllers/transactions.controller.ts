import { Request, Response, Router } from "express";
import { TransactionsService } from "../services/transactions.service";
import { TransactionInsert } from "@/models/transactions.model";
import { getErrorMessage } from "@/utils/handle-error";
import { fromZonedTime } from "date-fns-tz";
import { endOfDay, endOfMonth, startOfDay, startOfMonth } from "date-fns";

const router = Router();

router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const dateString = req.query.date as string;
    const type = req.query.type as string;

    if (!dateString) throw new Error("date are required");

    const timeZone = "America/Guayaquil";
    const startDate = startOfDay(dateString);
    const endDate = endOfDay(dateString);
    const startDateFromZonedTime = fromZonedTime(startDate, timeZone);
    const endDateFromZonedTime = fromZonedTime(endDate, timeZone);

    console.log("controller->/GET transactions/", {
      type,
      dateString,
      startDateFromZonedTime,
      endDateFromZonedTime,
    });

    const data = await TransactionsService.getTxsBetweenDates({
      startDate: startDateFromZonedTime,
      endDate: endDateFromZonedTime,
      type: type || "all",
    });

    res.json(data);
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("controller->/GET transactions/daily->error", message);
    res.status(500).json({ data: [], error: message });
  }
});

router.get("/summary", async (req: Request, res: Response): Promise<void> => {
  try {
    const dateString = req.query.date as string;

    if (!dateString) throw new Error("date are required");

    const timeZone = "America/Guayaquil";
    const startDate = startOfMonth(dateString);
    const endDate = endOfMonth(dateString);
    const startDateFromZonedTime = fromZonedTime(startDate, timeZone);
    const endDateFromZonedTime = fromZonedTime(endDate, timeZone);

    console.log("controller->/GET transactions/summary", {
      startDateFromZonedTime,
      endDateFromZonedTime,
    });

    const data = await TransactionsService.getSummaryBetweenDates({
      startDate: startDateFromZonedTime,
      endDate: endDateFromZonedTime,
    });

    res.json(data);
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

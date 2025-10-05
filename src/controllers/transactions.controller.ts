import { Request, Response, Router } from "express";
import { TransactionsService } from "../services/transactions.service";
import { TransactionInsert } from "@/models/transactions.model";
import { getErrorMessage } from "@/utils/handle-error";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { endOfDay, startOfDay } from "date-fns";

const router = Router();

router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const dateString = req.query.date as string;
    // const startString = req.query.start as string;
    // const endString = req.query.end as string;
    const type = req.query.type as string;

    if (!dateString) {
      throw new Error("date are required");
    }

    const timeZone = "America/Guayaquil";
    const date = fromZonedTime(dateString, timeZone);
    const dateTz = toZonedTime(dateString, timeZone);
    const startDate = startOfDay(date);
    const endDate = endOfDay(date);
    // const startDate = fromZonedTime(startString, timeZone);
    // const endDate = fromZonedTime(endString, timeZone);

    console.log("controller->/GET transactions/", {
      type,
      date,
      dateTz,
      startDate,
      endDate,
    });

    const txs = await TransactionsService.getTxsBetweenDates({
      startDate: startDate,
      endDate: endDate,
      type: type || "all",
    });

    res.json(txs);
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("controller->/GET transactions/daily->error", message);
    res.status(500).json({ data: [], error: message });
  }
});

router.get("/summary", async (req: Request, res: Response): Promise<void> => {
  try {
    const startString = req.query.start as string;
    const endString = req.query.end as string;

    if (!startString || !endString) {
      throw new Error("start and end are required");
    }
    console.log("controller->/GET transactions/summary", {
      startString,
      endString,
    });

    const summary = await TransactionsService.getSummaryBetweenDates({
      startDate: new Date(startString),
      endDate: new Date(endString),
    });

    res.json(summary);
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

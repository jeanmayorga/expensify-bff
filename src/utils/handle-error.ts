import { Response } from "express";

export function handleError(options: {
  error: any;
  res: Response;
  status?: number;
  controller?: string;
  message?: string;
}) {
  const error = options.error;
  const status = options.status || error.response?.status || 500;
  const errorMessage =
    error.response?.data?.error?.message || error.message || "Unknown error";
  const message = options.message || errorMessage;
  const res = options.res;
  const controller = options.controller;

  console.error("controller -> ", controller, errorMessage);

  res.status(status).json({ error: message, status });
}

import { Response } from "express";

export function getErrorMessage(error: any) {
  return (
    error.response?.data?.error?.message ||
    error.response?.data?.error ||
    error.message ||
    "Unknown error"
  );
}

export function handleError(options: {
  error: any;
  res: Response;
  status?: number;
  controller?: string;
  message?: string;
}) {
  const error = options.error;
  const status = options.status || error.response?.status || 500;
  const errorMessage = getErrorMessage(error);
  const message = options.message || errorMessage;
  const res = options.res;
  const controller = options.controller;

  console.error("controller -> ", controller, errorMessage);

  res.status(status).json({ error: message, status });
}

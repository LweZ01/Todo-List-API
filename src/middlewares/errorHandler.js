import { ApiError } from "../utils/ApiError.js";

export function errorHandler(err, req, res, next) {
  console.error(err);

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  res.status(500).json({ message: "Error interno del servidor" });
}

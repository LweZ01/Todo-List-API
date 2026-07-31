import rateLimit from "express-rate-limit";
import { ApiError } from "../utils/ApiError.js";

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  handler: (req, res, next) => {
    next(new ApiError(429, "Demasiados intentos, intenta más tarde"));
  },
});

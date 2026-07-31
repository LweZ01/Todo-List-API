import { Router } from "express";
import AuthController from "../controllers/auth.controller.js";
import AuthService from "../services/auth.service.js";
import UserModel from "../models/user.model.js";
import RefreshTokenModel from "../models/refreshToken.model.js";
import { config } from "../config/env.js";
import { authenticate } from "../middlewares/authenticate.js";
import { validate } from "../middlewares/validate.js";
import { registerSchema, loginSchema } from "../validations/auth.validation.js";
import { authRateLimiter } from "../middlewares/rateLimiter.js";

const authService = new AuthService({
  userModel: UserModel,
  refreshTokenModel: RefreshTokenModel,
  jwtAccessSecret: config.JWT_ACCESS_SECRET,
  jwtRefreshSecret: config.JWT_REFRESH_SECRET,
  refreshTokenTtlMs: config.REFRESH_TOKEN_TTL_MS,
});

const authController = new AuthController({ authService });

const router = Router();

router.post(
  "/register",
  authRateLimiter,
  validate(registerSchema),
  authController.register,
);
router.post(
  "/login",
  authRateLimiter,
  validate(loginSchema),
  authController.login,
);
router.post("/refresh", authController.refresh);
router.post(
  "/logout",
  authenticate(config.JWT_ACCESS_SECRET),
  authController.logout,
);

export default router;

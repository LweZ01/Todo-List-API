import { config } from "../config/env.js";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: config.NODE_ENV === "production",
  sameSite: "strict",
};

export function setRefreshTokenCookie(res, token) {
  res.cookie("refreshToken", token, {
    ...COOKIE_OPTIONS,
    maxAge: config.REFRESH_TOKEN_TTL_MS,
  });
}

export function clearRefreshTokenCookie(res) {
  res.clearCookie("refreshToken", COOKIE_OPTIONS);
}

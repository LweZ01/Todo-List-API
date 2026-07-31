import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";

export function authenticate(jwtAccessSecret) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(new ApiError(401, "Token no proporcionado"));
    }

    const token = authHeader.split(" ")[1];

    try {
      const decoded = jwt.verify(token, jwtAccessSecret, {
        algorithms: ["HS256"],
      });
      req.user = { id: decoded.sub };
      next();
    } catch (error) {
      next(new ApiError(401, "Token inválido o expirado"));
    }
  };
}

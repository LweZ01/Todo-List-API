import crypto from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";

class AuthService {
  constructor({
    userModel,
    refreshTokenModel,
    jwtAccessSecret,
    jwtRefreshSecret,
    refreshTokenTtlMs,
    saltRounds = 12,
  }) {
    this.userModel = userModel;
    this.refreshTokenModel = refreshTokenModel;
    this.jwtAccessSecret = jwtAccessSecret;
    this.jwtRefreshSecret = jwtRefreshSecret;
    this.refreshTokenTtlMs = refreshTokenTtlMs;
    this.saltRounds = saltRounds;
  }
  #generateAccessToken(user) {
    return jwt.sign({ sub: user.id }, this.jwtAccessSecret, {
      expiresIn: "15m",
      algorithm: "HS256",
    });
  }

  #generateRefreshToken() {
    return crypto.randomBytes(64).toString("hex");
  }

  #hashToken(token) {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  async #issueTokens(user) {
    const accessToken = this.#generateAccessToken(user);
    const refreshToken = this.#generateRefreshToken();
    const expiresAt = new Date(Date.now() + this.refreshTokenTtlMs);
    const hashedRefreshToken = this.#hashToken(refreshToken);

    await this.refreshTokenModel.create({
      user_id: user.id,
      token_hash: hashedRefreshToken,
      expires_at: expiresAt,
    });

    return { accessToken, refreshToken };
  }

  async register({ name, email, password }) {
    const existingUser = await this.userModel.findByEmail(email);
    if (existingUser) {
      throw new ApiError(409, "El email ya está en uso");
    }

    const passwordHash = await bcrypt.hash(password, this.saltRounds);

    const user = await this.userModel.create({
      name,
      email,
      password_hash: passwordHash,
    });

    const { accessToken, refreshToken } = await this.#issueTokens(user);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  }

  async login({ email, password }) {
    const user = await this.userModel.findByEmail(email);

    if (!user) {
      throw new ApiError(401, "Credenciales inválidas");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      throw new ApiError(401, "Credenciales inválidas");
    }

    const { accessToken, refreshToken } = await this.#issueTokens(user);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  }

  async refreshAccessToken(refreshToken) {
    if (!refreshToken) {
      throw new ApiError(401, "Refresh token requerido");
    }

    const hashedToken = this.#hashToken(refreshToken);

    const storedToken =
      await this.refreshTokenModel.findByTokenHash(hashedToken);

    if (!storedToken) {
      throw new ApiError(401, "Refresh token inválido");
    }

    if (storedToken.revoked === true) {
      await this.refreshTokenModel.revokeAllForUser(storedToken.user_id);
      throw new ApiError(401, "Refresh token revocado");
    }

    if (new Date(storedToken.expires_at) < new Date()) {
      throw new ApiError(401, "Refresh token expirado");
    }

    const user = await this.userModel.findById(storedToken.user_id);
    if (!user) {
      throw new ApiError(401, "Usuario no encontrado");
    }

    await this.refreshTokenModel.revoke(storedToken.id);

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      await this.#issueTokens(user);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(userId, refreshToken) {
    if (!refreshToken) {
      return;
    }

    const hashedToken = this.#hashToken(refreshToken);
    const storedToken =
      await this.refreshTokenModel.findByTokenHash(hashedToken);

    if (storedToken && storedToken.user_id === userId) {
      await this.refreshTokenModel.revoke(storedToken.id);
    }
  }
}

export default AuthService;

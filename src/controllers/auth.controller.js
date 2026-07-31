import {
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
} from "../utils/cookies.js";

class AuthController {
  constructor({ authService }) {
    this.authService = authService;
  }

  register = async (req, res, next) => {
    try {
      const { name, email, password } = req.body;
      const { accessToken, refreshToken, user } =
        await this.authService.register({
          name,
          email,
          password,
        });

      setRefreshTokenCookie(res, refreshToken);
      res.status(201).json({ accessToken, user });
    } catch (error) {
      next(error);
    }
  };

  login = async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const { accessToken, refreshToken, user } = await this.authService.login({
        email,
        password,
      });

      setRefreshTokenCookie(res, refreshToken);
      res.status(200).json({ accessToken, user });
    } catch (error) {
      next(error);
    }
  };

  refresh = async (req, res, next) => {
    try {
      const { refreshToken } = req.cookies;
      const { accessToken, refreshToken: newRefreshToken } =
        await this.authService.refreshAccessToken(refreshToken);

      setRefreshTokenCookie(res, newRefreshToken);
      res.status(200).json({ accessToken });
    } catch (error) {
      next(error);
    }
  };

  logout = async (req, res, next) => {
    try {
      const { refreshToken } = req.cookies;
      // TODO: requiere middleware de auth para tener req.user.id
      await this.authService.logout(req.user?.id, refreshToken);

      clearRefreshTokenCookie(res);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}

export default AuthController;

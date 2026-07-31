import express from "express";
import { testConnection } from "./config/db.js";
import { config } from "./config/env.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import todoRoutes from "./routes/todo.routes.js";
import helmet from "helmet";

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(helmet());
app.disable("x-powered-by");

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRoutes);
app.use("/todos", todoRoutes);

app.use((req, res) => {
  res.status(404).send("Page Not Found");
});

app.use(errorHandler);
await testConnection();

app.listen(config.PORT, () => {
  console.log(`Server is running on port http://localhost:${config.PORT}`);
});

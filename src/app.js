import express from "express";
import { testConnection } from "./config/db.js";
import { config } from "./config/env.js";

const app = express();
app.use(express.json());
app.disable("x-powered-by");

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use((req, res) => {
  res.status(404).send("Page Not Found");
});

await testConnection();

app.listen(config.PORT, () => {
  console.log(`Server is running on port http://localhost:${config.PORT}`);
});

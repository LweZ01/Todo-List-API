import "dotenv/config";

const REQUIRED_ENVS = [
  "DATABASE_URL",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
];
const PORT = parseInt(process.env.PORT || "3000", 10);

const missingEnvs = REQUIRED_ENVS.filter(
  (key) => !process.env[key] || process.env[key].trim() === "",
);

if (missingEnvs.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingEnvs.join(", ")}`,
  );
}
if (isNaN(PORT)) {
  throw new Error(`Invalid PORT value: "${process.env.PORT}" is not a number`);
}

const rawConfig = {
  PORT,
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
};

function deepFreeze(obj) {
  Object.values(obj).forEach((value) => {
    if (value && typeof value === "object" && !Object.isFrozen(value)) {
      deepFreeze(value);
    }
  });
  return Object.freeze(obj);
}

export const config = deepFreeze(rawConfig);

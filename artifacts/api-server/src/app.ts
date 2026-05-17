import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean)
  : [];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        origin.startsWith("http://localhost") ||
        origin.startsWith("http://127.0.0.1")
      ) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) return callback(null, true);
      if (process.env.NODE_ENV !== "production") return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;

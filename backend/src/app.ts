import cors from "cors";
import express from "express";
import { createPromptRouter } from "./routes/prompts.js";
import type { PromptImprover } from "./types.js";

export function createApp(promptImprover: PromptImprover) {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req, res) => {
    res.status(200).json({ ok: true });
  });

  app.use("/api/prompts", createPromptRouter(promptImprover));

  app.use((_req, res) => {
    res.status(404).json({ error: "Not found." });
  });

  return app;
}

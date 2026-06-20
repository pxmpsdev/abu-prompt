import { Router } from "express";
import { improvePromptRequestSchema } from "../schemas.js";
import type { PromptImprover } from "../types.js";

export function createPromptRouter(promptImprover: PromptImprover): Router {
  const router = Router();

  router.post("/improve", async (req, res) => {
    const parsedBody = improvePromptRequestSchema.safeParse(req.body);

    if (!parsedBody.success) {
      return res.status(400).json({
        error: "Invalid request body.",
        details: parsedBody.error.flatten().fieldErrors
      });
    }

    try {
      const result = await promptImprover.improve(parsedBody.data.prompt);
      return res.status(200).json(result);
    } catch (error) {
      console.error("Prompt improvement failed:", error);
      return res.status(502).json({
        error: "Prompt improvement failed. Make sure the configured AI endpoint is running and reachable."
      });
    }
  });

  return router;
}

import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import type { PromptImprovementResult, PromptImprover } from "./types.js";

const sampleResult: PromptImprovementResult = {
  inputPrompt: "Make a workout plan",
  complaints: [
    "Goal is too broad",
    "Audience is not specified",
    "Fitness level is missing",
    "Schedule is unclear",
    "Equipment constraints are absent",
    "Workout duration is missing",
    "Progression is not defined",
    "Safety constraints are missing",
    "Output format is not specified",
    "Success criteria are vague"
  ],
  bestVariantId: "variant-2",
  variants: [
    {
      id: "variant-1",
      name: "Variant A",
      technique: "Targeted Fix",
      isWinner: false,
      baselineDelta: 0.2,
      rating: "4.0/5.0",
      prompt: "Create a beginner workout plan.",
      score: 80,
      rubric: {
        empathy: { label: "Empathy", score: 72, rating: "3.6/5.0" },
        solutionOrientation: { label: "Solution Orientation", score: 84, rating: "4.2/5.0" },
        conciseness: { label: "Conciseness", score: 80, rating: "4.0/5.0" },
        complaintResolution: { label: "Complaint Resolution", score: 76, rating: "3.8/5.0" }
      },
      strengths: ["Clear goal"],
      weaknesses: ["Needs schedule"],
      matchingWords: ["beginner", "workout"],
      unhelpfulWords: ["make"],
      reason: "Clearer than the input.",
      shareLabel: "SHARE FOR FEEDBACK"
    },
    {
      id: "variant-2",
      name: "Variant B",
      technique: "Technique Injection",
      isWinner: true,
      baselineDelta: 0.7,
      rating: "4.8/5.0",
      prompt: "Create a 4-week beginner workout plan with three sessions per week, warmups, exercises, sets, reps, and progression.",
      score: 95,
      rubric: {
        empathy: { label: "Empathy", score: 90, rating: "4.5/5.0" },
        solutionOrientation: { label: "Solution Orientation", score: 98, rating: "4.9/5.0" },
        conciseness: { label: "Conciseness", score: 92, rating: "4.6/5.0" },
        complaintResolution: { label: "Complaint Resolution", score: 94, rating: "4.7/5.0" }
      },
      strengths: ["Specific", "Actionable"],
      weaknesses: [],
      matchingWords: ["4-week", "sessions", "progression"],
      unhelpfulWords: [],
      reason: "Best context and structure.",
      shareLabel: "SHARE FOR FEEDBACK"
    },
    {
      id: "variant-3",
      name: "Variant C",
      technique: "Self-Reflection Rubric",
      isWinner: false,
      baselineDelta: 0.4,
      rating: "4.2/5.0",
      prompt: "Design a home workout plan for a beginner using bodyweight exercises.",
      score: 84,
      rubric: {
        empathy: { label: "Empathy", score: 82, rating: "4.1/5.0" },
        solutionOrientation: { label: "Solution Orientation", score: 84, rating: "4.2/5.0" },
        conciseness: { label: "Conciseness", score: 86, rating: "4.3/5.0" },
        complaintResolution: { label: "Complaint Resolution", score: 80, rating: "4.0/5.0" }
      },
      strengths: ["Defines setting"],
      weaknesses: ["No duration"],
      matchingWords: ["home", "bodyweight"],
      unhelpfulWords: [],
      reason: "Useful but less complete.",
      shareLabel: "SHARE FOR FEEDBACK"
    }
  ],
  overallAdvice: "Include goal, audience, constraints, output format, and success criteria."
};

function createMockImprover(result: PromptImprovementResult = sampleResult): PromptImprover {
  return {
    async improve(prompt: string) {
      return {
        ...result,
        inputPrompt: prompt
      };
    }
  };
}

describe("abu-prompt API", () => {
  it("returns health status", async () => {
    const app = createApp(createMockImprover());

    await request(app).get("/health").expect(200, { ok: true });
  });

  it("rejects an empty prompt", async () => {
    const app = createApp(createMockImprover());

    const response = await request(app)
      .post("/api/prompts/improve")
      .send({ prompt: "" })
      .expect(400);

    expect(response.body.error).toBe("Invalid request body.");
  });

  it("returns three scored prompt variants", async () => {
    const app = createApp(createMockImprover());

    const response = await request(app)
      .post("/api/prompts/improve")
      .send({ prompt: "Make a workout plan" })
      .expect(200);

    expect(response.body.variants).toHaveLength(3);
    expect(response.body.complaints).toHaveLength(10);
    expect(response.body.variants.map((variant: { name: string }) => variant.name)).toEqual([
      "Variant A",
      "Variant B",
      "Variant C"
    ]);
    expect(response.body.bestVariantId).toBe("variant-2");
    expect(response.body.variants.filter((variant: { isWinner: boolean }) => variant.isWinner)).toHaveLength(1);
    expect(response.body.variants.every((variant: { shareLabel: string }) => variant.shareLabel === "SHARE FOR FEEDBACK")).toBe(
      true
    );
    expect(response.body.variants.every((variant: { score: number }) => variant.score >= 0 && variant.score <= 100)).toBe(
      true
    );
  });

  it("returns 502 when prompt improvement fails", async () => {
    const app = createApp({
      async improve() {
        throw new Error("OpenAI unavailable");
      }
    });

    const response = await request(app)
      .post("/api/prompts/improve")
      .send({ prompt: "Make a workout plan" })
      .expect(502);

    expect(response.body.error).toBe("Prompt improvement failed. Make sure the configured AI endpoint is running and reachable.");
  });
});

import { z } from "zod";

export const improvePromptRequestSchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(5, "Prompt must be at least 5 characters long.")
    .max(8000, "Prompt must be 8000 characters or fewer.")
});

export const promptVariantSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  technique: z.string().min(1),
  isWinner: z.boolean(),
  baselineDelta: z.number(),
  rating: z.string().regex(/^[0-5](\.[0-9])?\/5\.0$/),
  prompt: z.string().min(1),
  score: z.number().int().min(0).max(100),
  rubric: z.object({
    empathy: z.object({
      label: z.literal("Empathy"),
      score: z.number().int().min(0).max(100),
      rating: z.string().regex(/^[0-5](\.[0-9])?\/5\.0$/)
    }),
    solutionOrientation: z.object({
      label: z.literal("Solution Orientation"),
      score: z.number().int().min(0).max(100),
      rating: z.string().regex(/^[0-5](\.[0-9])?\/5\.0$/)
    }),
    conciseness: z.object({
      label: z.literal("Conciseness"),
      score: z.number().int().min(0).max(100),
      rating: z.string().regex(/^[0-5](\.[0-9])?\/5\.0$/)
    }),
    complaintResolution: z.object({
      label: z.literal("Complaint Resolution"),
      score: z.number().int().min(0).max(100),
      rating: z.string().regex(/^[0-5](\.[0-9])?\/5\.0$/)
    })
  }),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  matchingWords: z.array(z.string()),
  unhelpfulWords: z.array(z.string()),
  reason: z.string().min(1),
  shareLabel: z.literal("SHARE FOR FEEDBACK")
});

export const promptImprovementResultSchema = z.object({
  inputPrompt: z.string(),
  complaints: z.array(z.string().min(1)).length(10),
  bestVariantId: z.string().min(1),
  variants: z.array(promptVariantSchema).length(3),
  overallAdvice: z.string().min(1)
});

export type ImprovePromptRequest = z.infer<typeof improvePromptRequestSchema>;

import { promptImprovementResultSchema } from "../schemas.js";
import type { PromptImprovementResult, PromptImprover } from "../types.js";

type AiPromptImproverOptions = {
  apiKey: string;
  baseUrl: string;
  model: string;
};

type ChatMessage = {
  role: "system" | "user";
  content: string;
};

type ChatCompletionChoice = {
  message?: {
    content?: string | null;
  };
  delta?: {
    content?: string | null;
  };
};

export class AiPromptImprover implements PromptImprover {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly timeoutMs = 60_000;

  constructor(options: AiPromptImproverOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.model = options.model;
  }

  async improve(prompt: string): Promise<PromptImprovementResult> {
    const content = await this.createCompletion([
      {
        role: "system",
        content:
          "You are a precision prompt editor. Reply only with valid JSON. Keep the same language as the user's prompt. First identify exactly 10 short complaints or weaknesses in the original prompt. Then create exactly three improved prompt variants that stay close to the original prompt. The output prompt field must be a ready-to-use prompt, not an instruction to improve the prompt. Do not wrap the original in phrases like 'Improve this prompt', 'Revise this prompt', or 'Use a technique for'. Make small, high-value wording changes, replacements, and additions that improve clarity, specificity, visual quality, constraints, and composition while preserving the user's intent and structure. Score each variant from 0 to 100 and provide 5-star ratings. Mark exactly one winner."
      },
      {
        role: "user",
        content: `Improve this prompt as a prompt editor.

Return this exact JSON shape:
{
  "inputPrompt": "the original prompt",
  "complaints": [
    "short complaint 1",
    "short complaint 2",
    "short complaint 3",
    "short complaint 4",
    "short complaint 5",
    "short complaint 6",
    "short complaint 7",
    "short complaint 8",
    "short complaint 9",
    "short complaint 10"
  ],
  "bestVariantId": "variant-1",
  "variants": [
    {
      "id": "variant-1",
      "name": "Variante A",
      "technique": "Targeted Fix",
      "isWinner": true,
      "baselineDelta": 0.2,
      "rating": "4.0/5.0",
      "prompt": "improved prompt",
      "score": 90,
      "rubric": {
        "empathy": {
          "label": "Empathy",
          "score": 80,
          "rating": "4.0/5.0"
        },
        "solutionOrientation": {
          "label": "Solution Orientation",
          "score": 86,
          "rating": "4.3/5.0"
        },
        "conciseness": {
          "label": "Conciseness",
          "score": 78,
          "rating": "3.9/5.0"
        },
        "complaintResolution": {
          "label": "Complaint Resolution",
          "score": 82,
          "rating": "4.1/5.0"
        }
      },
      "strengths": ["short strength"],
      "weaknesses": ["short weakness"],
      "matchingWords": ["good", "relevant", "words"],
      "unhelpfulWords": ["vague", "unhelpful", "words"],
      "reason": "short reason",
      "shareLabel": "SHARE FOR FEEDBACK"
    }
  ],
  "overallAdvice": "short advice"
}

Rules:
- complaints must contain exactly 10 short complaints or weaknesses about the original prompt.
- complaints should be specific and useful, not generic filler.
- variants must contain exactly 3 items.
- ids must be variant-1 through variant-3.
- variant-1 must be named "Variante A" with technique "Targeted Fix": keep the original structure and change only weak or vague words. This should feel like the original prompt, just cleaner.
- variant-2 must be named "Variante B" with technique "Technique Injection": add only compact technique terms that fit the prompt type, for example stronger camera, lighting, composition, style, negative constraints, output format, or quality terms. Do not turn it into a meta-prompt.
- variant-3 must be named "Variante C" with technique "Self-Reflection Rubric": add a short built-in quality check or final constraint, but keep it as a direct prompt. Do not ask the AI to explain the rubric.
- scores and rubric scores must be integers from 0 to 100.
- rating and rubric ratings must use the format "4.0/5.0" with one decimal place.
- baselineDelta is a number compared to the input baseline, for example 0.2 or 0.7.
- exactly one variant must have isWinner true; all others must have isWinner false.
- bestVariantId must be the id of the winner.
- every variant must include shareLabel exactly as "SHARE FOR FEEDBACK".
- bestVariantId must match one variant id.
- prompt must contain only the improved final prompt text.
- prompt must not start with "Improve", "Revise", "Rewrite", "Ueberarbeite", "Verbessere", "Nutze", or similar meta instructions.
- For image prompts, keep the subject, scene, mood, lens/style terms, and negative constraints. Improve by replacing a few words, tightening phrasing, and adding useful visual specificity.
- Keep each prompt close to the original length. Do not write explanations inside the prompt field.
- Do not include markdown fences or text outside JSON.

Prompt:
${prompt}`
      }
    ]);

    const result = promptImprovementResultSchema.parse(parseAiJson(content));

    if (!result.variants.some((variant) => variant.id === result.bestVariantId)) {
      throw new Error("AI response bestVariantId does not match any variant.");
    }

    return result;
  }

  private async createCompletion(messages: ChatMessage[]): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: this.model,
          temperature: 0.3,
          stream: false,
          messages
        }),
        signal: controller.signal
      });

      const body = await response.text();

      if (!response.ok) {
        throw new Error(`AI request failed with status ${response.status}: ${body.slice(0, 500)}`);
      }

      return extractAssistantContent(body);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`AI request timed out after ${this.timeoutMs}ms.`);
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}

function extractAssistantContent(responseBody: string): string {
  const body = responseBody.trim();

  if (!body) {
    throw new Error("AI response did not include content.");
  }

  const jsonContent = extractJsonResponseContent(body);
  if (jsonContent) {
    return jsonContent;
  }

  const streamContent = extractServerSentEventContent(body);
  if (streamContent) {
    return streamContent;
  }

  throw new Error("AI response did not include assistant content.");
}

function extractJsonResponseContent(body: string): string | null {
  try {
    const parsed = JSON.parse(body) as { choices?: ChatCompletionChoice[] };
    return extractChoicesContent(parsed.choices);
  } catch {
    return null;
  }
}

function extractServerSentEventContent(body: string): string | null {
  let content = "";

  for (const line of body.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed.startsWith("data:")) {
      continue;
    }

    const data = trimmed.slice("data:".length).trim();

    if (!data || data === "[DONE]") {
      continue;
    }

    const parsed = JSON.parse(data) as { choices?: ChatCompletionChoice[] };
    content += extractChoicesContent(parsed.choices) ?? "";
  }

  return content || null;
}

function extractChoicesContent(choices: ChatCompletionChoice[] | undefined): string | null {
  if (!choices?.length) {
    return null;
  }

  const content = choices
    .map((choice) => choice.message?.content ?? choice.delta?.content ?? "")
    .join("");

  return content || null;
}

function parseAiJson(content: string): unknown {
  const trimmed = stripMarkdownFence(content.trim());
  const objectStart = trimmed.indexOf("{");
  const objectEnd = trimmed.lastIndexOf("}");
  const candidates = [trimmed];

  if (objectStart >= 0 && objectEnd > objectStart) {
    candidates.push(trimmed.slice(objectStart, objectEnd + 1));
  }

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {
      // Try the next candidate.
    }
  }

  throw new Error("AI response was not valid JSON.");
}

function stripMarkdownFence(value: string): string {
  return value.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/u, "").trim();
}

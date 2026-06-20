import "dotenv/config";

export const config = {
  port: Number(process.env.PORT ?? 3000),
  aiApiKey: process.env.AI_API_KEY ?? "local",
  aiBaseUrl: process.env.AI_BASE_URL ?? "http://localhost:20128/v1",
  aiModel: process.env.AI_MODEL ?? "kr/claude-sonnet-4.5"
};

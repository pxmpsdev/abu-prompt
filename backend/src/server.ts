import { createApp } from "./app.js";
import { config } from "./config.js";
import { AiPromptImprover } from "./services/aiPromptImprover.js";

const app = createApp(
  new AiPromptImprover({
    apiKey: config.aiApiKey,
    baseUrl: config.aiBaseUrl,
    model: config.aiModel
  })
);

app.listen(config.port, () => {
  console.log(`abu-prompt backend listening on port ${config.port}`);
});

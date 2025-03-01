import { createOpenAI } from "@ai-sdk/openai";

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const model = openai("gpt-4o-2024-08-06", {
  structuredOutputs: true,
});

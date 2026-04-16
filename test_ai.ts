import { OpenRouter } from "@openrouter/sdk";
require('dotenv').config({ path: '.env' });
const openrouter = new OpenRouter({ apiKey: process.env.OPENROUTER_API_KEY });
async function test() {
  try {
    const stream = await openrouter.chat.send({
      model: "google/gemma-4-31b-it:free",
      messages: [{ role: "user", content: "Hello" }],
      stream: true
    });
    for await (const chunk of stream) {
      if (chunk.choices[0]?.delta?.content) {
        process.stdout.write(chunk.choices[0].delta.content);
      }
    }
  } catch (e) {
    console.error("ERROR:", e);
  }
}
test();

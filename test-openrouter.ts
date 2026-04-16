import "dotenv/config";
import { OpenRouter } from "@openrouter/sdk";

const openrouter = new OpenRouter({ apiKey: process.env.OPENROUTER_API_KEY });

async function run() {
    try {
        console.log("Sending with chatRequest wrapper...");
        const res = await openrouter.chat.send({
            chatRequest: {
                 model: "google/gemma-2-9b-it:free",
                 messages: [{ role: "user", content: "hi" }]
            }
        });
        console.log(res);
    } catch(e) {
        console.log("Error wrapper:", e);
    }

    try {
        console.log("Sending without wrapper...");
        const res2 = await openrouter.chat.send({
             model: "google/gemma-2-9b-it:free",
             messages: [{ role: "user", content: "hi" }]
        } as any);
        console.log(res2);
    } catch(e) {
        console.log("Error no-wrapper:", e);
    }
}
run();

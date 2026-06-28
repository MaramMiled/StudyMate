import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateReply(messages) {
  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are a helpful study assistant for students.",
      },
      ...messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
    ],
  });

  return completion.choices[0].message.content;
}
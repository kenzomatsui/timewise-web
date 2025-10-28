import { api, StreamOut, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { secret } from "encore.dev/config";
import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import db from "../db";

const openAIKey = secret("OpenAIKey");

interface ChatRequest {
  message: string;
}

interface ChatMessage {
  text: string;
  done: boolean;
}

// AI assistant that provides personalized recommendations and suggestions.
export const chat = api.streamOut<ChatRequest, ChatMessage>(
  { expose: true, path: "/assistant/chat", auth: true },
  async (req, stream) => {
    const auth = getAuthData()!;
    
    const user = await db.queryRow<{ id: number }>`
      SELECT id FROM users WHERE clerk_id = ${auth.userID}
    `;
    
    if (!user) {
      throw APIError.notFound("user not found");
    }
    
    const openai = createOpenAI({ apiKey: openAIKey() });

    const profile = await db.queryRow<any>`
      SELECT * FROM user_profiles WHERE user_id = ${user.id}
    `;

    const tasks = await db.queryAll<any>`
      SELECT * FROM tasks
      WHERE user_id = ${user.id}
      AND completed = false
      ORDER BY
        CASE priority
          WHEN 'high' THEN 1
          WHEN 'medium' THEN 2
          WHEN 'low' THEN 3
        END,
        deadline NULLS LAST
      LIMIT 10
    `;

    const today = new Date().toISOString().split("T")[0];
    const appointments = await db.rawQueryAll<any>(
      `SELECT * FROM appointments WHERE user_id = $1 AND date >= $2 ORDER BY date, start_time LIMIT 5`,
      user.id,
      today
    );

    const context = buildContext(profile, tasks, appointments);

    try {
      const result = await streamText({
        model: openai("gpt-4o-mini"),
        messages: [
          {
            role: "system",
            content: `You are TimeWise AI Assistant, helping users manage their time and tasks effectively. Be concise, practical, and encouraging. Provide actionable suggestions based on their schedule and priorities.

Context about the user:
${context}`,
          },
          {
            role: "user",
            content: req.message,
          },
        ],
        maxTokens: 300,
      });

      for await (const chunk of result.textStream) {
        await stream.send({ text: chunk, done: false });
      }

      await stream.send({ text: "", done: true });
    } catch (error) {
      await stream.send({
        text: "I apologize, but I'm having trouble processing your request right now. Please try again.",
        done: true,
      });
    } finally {
      await stream.close();
    }
  }
);

function buildContext(profile: any, tasks: any[], appointments: any[]): string {
  let context = `Name: ${profile?.name || "User"}
Occupation: ${profile?.occupation || "Not specified"}
Sleep hours: ${profile?.sleep_hours || "Not specified"}
Productive hours: ${profile?.productive_hours?.join(", ") || "Not specified"}
Focus preference: ${profile?.focus_preference || "balance"}
Allocation strategy: ${profile?.allocation_strategy || "fill_first_day"}

`;

  if (tasks.length > 0) {
    context += `\nPending tasks (showing top 10 by priority):\n`;
    tasks.forEach((t) => {
      context += `- ${t.name} (${t.category}, ${t.priority} priority, ${t.estimated_time}min`;
      if (t.deadline) {
        context += `, deadline: ${new Date(t.deadline).toLocaleDateString()}`;
      }
      if (t.allocated_date) {
        context += `, scheduled: ${t.allocated_date} at ${t.allocated_start_time}`;
      }
      context += `)\n`;
    });
  } else {
    context += `\nNo pending tasks.\n`;
  }

  if (appointments.length > 0) {
    context += `\nUpcoming appointments (next 5):\n`;
    appointments.forEach((a) => {
      context += `- ${a.title} on ${a.date} from ${a.start_time} to ${a.end_time} (${a.category})\n`;
    });
  } else {
    context += `\nNo upcoming appointments.\n`;
  }

  return context;
}

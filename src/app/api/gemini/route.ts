import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize SDK (using the 3.1 Pro model securely via server)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { queryResult } = body;

    const model = genAI.getGenerativeModel({ model: "gemini-3.1-pro" });

    // Requesting a structured JSON response for the Kanban insights
    const prompt = `
      You are an AI advisor analyzing executive course data.
      Here is the database query result: ${JSON.stringify(queryResult)}
      
      Generate a categorized JSON array grouping insights into "At Risk," "On Track," and "Completed."
    `;

    const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
            responseMimeType: "application/json"
        }
    });

    const output = result.response.text();
    return NextResponse.json({ success: true, insights: JSON.parse(output) });
  } catch (error) {
    console.error("Gemini API Route Error", error);
    return NextResponse.json({ success: false, error: "AI processing failed." }, { status: 500 });
  }
}

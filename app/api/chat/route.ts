import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GROQ_API_KEY is missing in .env.local' },
        { status: 500 }
      );
    }

    const groq = new Groq({ apiKey });

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an intelligent AI Meeting Assistant. Analyze the provided transcript and answer accurately based on speaker roles.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.2,
    });

    const replyText = completion.choices[0]?.message?.content || 'No response generated.';

    return NextResponse.json({ text: replyText });
  } catch (error: any) {
    console.error('Groq LLM Error:', error);
    return NextResponse.json(
      { error: error.message || 'Groq API Processing Error' },
      { status: 500 }
    );
  }
}
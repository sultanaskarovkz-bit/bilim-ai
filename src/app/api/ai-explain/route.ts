import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { question, userAnswer, correctAnswer, topic, explanation } = await req.json();

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 500,
        messages: [{
          role: "user",
          content: `Ты AI-репетитор по ПДД Казахстана. Ученик ответил НЕПРАВИЛЬНО. Объясни простым языком почему правильный ответ именно такой. Будь дружелюбным, используй примеры из реальной жизни. Отвечай на русском, коротко (3-5 предложений).

Тема: ${topic}
Вопрос: ${question}
Ученик ответил: "${userAnswer}" (неправильно)
Правильный ответ: "${correctAnswer}"
${explanation ? `Краткое пояснение: ${explanation}` : ""}

Объясни подробно и понятно:`
        }]
      })
    });

    const data = await response.json();
    const text = data.content?.[0]?.text || "Не удалось получить объяснение";
    return NextResponse.json({ text });
  } catch (e) {
    return NextResponse.json({ text: "Ошибка AI. Попробуй позже." }, { status: 500 });
  }
}
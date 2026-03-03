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
          content: `Ты AI-репетитор по ПДД Казахстана в мобильном приложении. Ученик ответил НЕПРАВИЛЬНО на вопрос. Объясни простым языком почему правильный ответ именно такой.

ПРАВИЛА:
- Отвечай на русском
- Коротко: 3-4 предложения максимум
- НЕ используй markdown, звездочки, решетки или любое форматирование
- Используй простые примеры из жизни
- Будь дружелюбным но кратким
- Можешь использовать 1 эмодзи в конце

Тема: ${topic}
Вопрос: ${question}
Ученик ответил: "${userAnswer}" (неправильно)
Правильный ответ: "${correctAnswer}"
${explanation ? "Пояснение: " + explanation : ""}`
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
